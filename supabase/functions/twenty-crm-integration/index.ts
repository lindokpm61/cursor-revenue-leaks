import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CRMIntegrationRequest {
  action: 'create_contact' | 'create_opportunity';
  contactData?: any;
  opportunityData?: any;
  submissionId?: string;
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
    const { action, contactData, opportunityData, submissionId }: CRMIntegrationRequest = await req.json();
    
    console.log(`Twenty CRM integration: ${action} for submission ${submissionId}`);
    
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
    
    let result;
    
    switch (action) {
      case 'create_contact':
        result = await createCrmContact(contactData, twentyCrmUrl, twentyCrmApiKey, supabaseClient, submissionId);
        break;
        
      case 'create_opportunity':
        result = await createCrmOpportunity(opportunityData, twentyCrmUrl, twentyCrmApiKey, supabaseClient, submissionId);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Log the integration attempt
    await supabaseClient
      .from('integration_logs')
      .insert({
        integration_type: 'twenty_crm',
        status: result.success ? 'success' : 'error',
        submission_id: submissionId,
        response_data: result,
        error_message: result.success ? null : result.error
      });
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Twenty CRM integration failed:', error);
    
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

async function createCrmContact(
  contactData: any, 
  crmUrl: string, 
  apiKey: string, 
  supabaseClient: any,
  submissionId?: string
) {
  try {
    console.log('Creating Twenty CRM contact:', contactData);
    
    // Twenty CRM uses GraphQL API
    const query = `
      mutation CreateContact($data: ContactCreateInput!) {
        createContact(data: $data) {
          id
          email
          firstName
          lastName
          company
        }
      }
    `;
    
    const variables = {
      data: {
        email: contactData.email,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        company: contactData.company
      }
    };
    
    const response = await fetch(`${crmUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CRM API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const contactId = result.data?.createContact?.id;
    
    console.log('Twenty CRM contact created:', contactId);
    
    // Update submission with CRM contact ID
    if (submissionId && contactId) {
      await supabaseClient
        .from('submissions')
        .update({
          twenty_contact_id: contactId,
          synced_to_self_hosted: true
        })
        .eq('id', submissionId);
    }
    
    return { success: true, contactId };
    
  } catch (error) {
    console.error('Contact creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function createCrmOpportunity(
  opportunityData: any, 
  crmUrl: string, 
  apiKey: string, 
  supabaseClient: any,
  submissionId?: string
) {
  try {
    console.log('Creating Twenty CRM opportunity:', opportunityData);
    
    // Twenty CRM uses GraphQL API
    const query = `
      mutation CreateOpportunity($data: OpportunityCreateInput!) {
        createOpportunity(data: $data) {
          id
          name
          amount
          stage
          probability
        }
      }
    `;
    
    const variables = {
      data: {
        name: opportunityData.name,
        amount: opportunityData.amount,
        stage: opportunityData.stage,
        probability: opportunityData.probability
      }
    };
    
    const response = await fetch(`${crmUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CRM API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const opportunityId = result.data?.createOpportunity?.id;
    
    console.log('Twenty CRM opportunity created:', opportunityId);
    
    return { success: true, opportunityId };
    
  } catch (error) {
    console.error('Opportunity creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}