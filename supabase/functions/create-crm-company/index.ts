import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCompanyRequest {
  submissionId: string;
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
    const { submissionId }: CreateCompanyRequest = await req.json();
    
    console.log(`Creating CRM company for submission ${submissionId}`);
    
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

    // Get submission data
    const { data: submissionData, error: submissionError } = await supabaseClient
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
      
    if (submissionError) {
      throw new Error(`Failed to get submission data: ${submissionError.message}`);
    }

    // Check if company already exists for this submission
    if (submissionData.twenty_company_id) {
      console.log('Company already exists for submission:', submissionData.twenty_company_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          companyId: submissionData.twenty_company_id,
          existing: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyName = submissionData.company_name;
    
    // Check if company already exists in Twenty CRM by name
    const existingCompanyResponse = await fetch(`${twentyCrmUrl}/rest/companies?filter[name][eq]=${encodeURIComponent(companyName)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${twentyCrmApiKey}`
      }
    });

    let companyId: string;

    if (existingCompanyResponse.ok) {
      const existingResult = await existingCompanyResponse.json();
      console.log('Existing company search result:', existingResult);
      
      if (existingResult.data?.companies && existingResult.data.companies.length > 0) {
        companyId = existingResult.data.companies[0].id;
        console.log('Found existing Twenty CRM company:', companyId);
      } else {
        // Create new company in Twenty CRM
        const createCompanyMutation = `
          mutation CreateCompany($data: CompanyCreateInput!) {
            createCompany(data: $data) {
              id
              name
              leadScore
              leadCategory
              annualRecurringRevenue {
                amountMicros
                currencyCode
              }
              totalRevenueLeak {
                amountMicros
                currencyCode
              }
              recoveryPotential {
                amountMicros
                currencyCode
              }
              monthlyMrr {
                amountMicros
                currencyCode
              }
              createdAt
            }
          }
        `;

        const variables = {
          data: {
            name: companyName,
            annualRecurringRevenue: submissionData.current_arr ? {
              amountMicros: Math.round(submissionData.current_arr * 1000000).toString(),
              currencyCode: "USD"
            } : undefined,
            monthlyMrr: submissionData.monthly_mrr ? {
              amountMicros: Math.round(submissionData.monthly_mrr * 1000000).toString(),
              currencyCode: "USD"
            } : undefined,
            totalRevenueLeak: submissionData.total_leak ? {
              amountMicros: Math.round(submissionData.total_leak * 1000000).toString(),
              currencyCode: "USD"
            } : undefined,
            recoveryPotential: submissionData.recovery_potential_70 ? {
              amountMicros: Math.round(submissionData.recovery_potential_70 * 1000000).toString(),
              currencyCode: "USD"
            } : undefined,
            leadScore: submissionData.lead_score || null,
            leadCategory: submissionData.lead_score > 80 ? "ENTERPRISE" : submissionData.lead_score > 60 ? "PREMIUM" : "STANDARD",
            calculatorCompletionDate: new Date().toISOString().split('T')[0],
            monthlyLeads: submissionData.monthly_leads || null,
            employees: 10,
            idealCustomerProfile: submissionData.lead_score > 70,
            domainName: {
              primaryLinkUrl: `https://${companyName.toLowerCase().replace(/\s+/g, '-')}.com`
            }
          }
        };
        
        console.log('Creating company with variables:', JSON.stringify(variables, null, 2));
        
        const createResponse = await fetch(`${twentyCrmUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${twentyCrmApiKey}`
          },
          body: JSON.stringify({
            query: createCompanyMutation,
            variables: variables
          })
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Company creation API error:', createResponse.status, errorText);
          throw new Error(`CRM API error (${createResponse.status}): ${errorText}`);
        }

        const result = await createResponse.json();
        console.log('Company creation response:', result);
        
        companyId = result.data?.createCompany?.id;
        
        if (!companyId) {
          console.error('No company ID in response:', result);
          throw new Error('No company ID returned from CRM');
        }
        
        console.log('Twenty CRM company created:', companyId);
      }
    } else {
      throw new Error(`Failed to search for existing company: ${existingCompanyResponse.statusText}`);
    }

    // Update submission with company ID
    const { error: updateError } = await supabaseClient
      .from('submissions')
      .update({
        twenty_company_id: companyId
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Failed to update submission with company ID:', updateError);
      // Don't fail the entire operation if we can't update the submission
    }

    // Log the integration attempt
    await supabaseClient
      .from('integration_logs')
      .insert({
        integration_type: 'twenty_crm_company',
        status: 'success',
        submission_id: submissionId,
        response_data: { companyId },
        error_message: null
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        companyId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Create CRM company failed:', error);
    
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