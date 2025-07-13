import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateOpportunityRequest {
  userId: string;
  submissionId: string;
  actionType: 'download' | 'booking' | 'engagement' | 'conversion';
  actionData?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { userId, submissionId, actionType, actionData }: CreateOpportunityRequest = await req.json();
    
    console.log(`Creating CRM opportunity for user ${userId}, submission ${submissionId}, action ${actionType}`);
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Get Twenty CRM configuration from secrets
    const twentyCrmUrl = Deno.env.get('TWENTY_CRM_BASE_URL');
    const twentyCrmApiKey = Deno.env.get('TWENTY_CRM_API_KEY');
    
    if (!twentyCrmUrl || !twentyCrmApiKey) {
      console.error('Twenty CRM configuration missing');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Twenty CRM not configured' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get person ID for the user
    const { data: personData } = await supabaseClient
      .from('crm_persons')
      .select('crm_person_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!personData?.crm_person_id) {
      throw new Error('No CRM person found for user. Create person first.');
    }

    // Get submission data including company ID
    const { data: submissionData, error: submissionError } = await supabaseClient
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
      
    if (submissionError || !submissionData.twenty_company_id) {
      throw new Error('No CRM company found for submission. Create company first.');
    }

    // Create opportunity in Twenty CRM
    const createOpportunityMutation = `
      mutation CreateOpportunity($data: OpportunityCreateInput!) {
        createOpportunity(data: $data) {
          id
          name
          amount {
            amountMicros
            currencyCode
          }
          stage
          pointOfContactId
          companyId
          createdAt
        }
      }
    `;

    const opportunityName = `${actionType.toUpperCase()}: ${submissionData.company_name}`;
    const amount = actionType === 'conversion' ? submissionData.recovery_potential_70 : submissionData.total_leak;

    const variables = {
      data: {
        name: opportunityName,
        amount: amount ? {
          amountMicros: Math.round(amount * 1000000),
          currencyCode: "USD"
        } : undefined,
        stage: actionType === 'conversion' ? 'PROPOSAL' : 'NEW_LEAD',
        pointOfContactId: personData.crm_person_id,
        companyId: submissionData.twenty_company_id
      }
    };
    
    console.log('Creating opportunity with variables:', JSON.stringify(variables, null, 2));
    
    const createResponse = await fetch(`${twentyCrmUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${twentyCrmApiKey}`
      },
      body: JSON.stringify({
        query: createOpportunityMutation,
        variables: variables
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Opportunity creation API error:', createResponse.status, errorText);
      throw new Error(`CRM API error (${createResponse.status}): ${errorText}`);
    }

    const result = await createResponse.json();
    console.log('Opportunity creation response:', result);
    
    const opportunityId = result.data?.createOpportunity?.id;
    
    if (!opportunityId) {
      console.error('No opportunity ID in response:', result);
      throw new Error('No opportunity ID returned from CRM');
    }
    
    console.log('Twenty CRM opportunity created:', opportunityId);

    // Update submission with opportunity ID if this is the first one
    if (!submissionData.crm_opportunity_id) {
      await supabaseClient
        .from('submissions')
        .update({
          crm_opportunity_id: opportunityId
        })
        .eq('id', submissionId);
    }

    // Log the integration attempt
    await supabaseClient
      .from('integration_logs')
      .insert({
        integration_type: 'twenty_crm_opportunity',
        status: 'success',
        submission_id: submissionId,
        response_data: { opportunityId, actionType, actionData },
        error_message: null
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        opportunityId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Create CRM opportunity failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});