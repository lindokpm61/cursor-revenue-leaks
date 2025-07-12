import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CRMIntegrationRequest {
  action: 'create_company' | 'create_contact' | 'create_opportunity';
  companyData?: any;
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
    const { action, companyData, contactData, opportunityData, submissionId }: CRMIntegrationRequest = await req.json();
    
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
      case 'create_company':
        result = await createCrmCompany(companyData, twentyCrmUrl, twentyCrmApiKey, supabaseClient, submissionId);
        break;
        
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

async function createCrmCompany(
  companyData: any, 
  crmUrl: string, 
  apiKey: string, 
  supabaseClient: any,
  submissionId?: string
) {
  try {
    console.log('Creating Twenty CRM company:', companyData);
    
    // Check if company already exists by name
    const existingCompanyResponse = await fetch(`${crmUrl}/rest/companies?filter[name][eq]=${encodeURIComponent(companyData.name)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (existingCompanyResponse.ok) {
      const existingResult = await existingCompanyResponse.json();
      if (existingResult.data?.companies && existingResult.data.companies.length > 0) {
        const existingCompanyId = existingResult.data.companies[0].id;
        console.log('Existing Twenty CRM company found:', existingCompanyId);
        
        // Update submission with existing company ID
        if (submissionId && existingCompanyId) {
          await supabaseClient
            .from('submissions')
            .update({
              twenty_company_id: existingCompanyId
            })
            .eq('id', submissionId);
        }
        
        return { success: true, companyId: existingCompanyId, existing: true };
      }
    }
    
    // Create new company
    const companyPayload = {
      name: companyData.name,
      annualRecurringRevenue: companyData.currentArr ? {
        amountMicros: Math.round(companyData.currentArr * 1000000),
        currencyCode: "USD"
      } : undefined,
      monthlyMrr: companyData.monthlyMrr ? {
        amountMicros: Math.round(companyData.monthlyMrr * 1000000),
        currencyCode: "USD"
      } : undefined,
      totalRevenueLeak: companyData.totalLeak ? {
        amountMicros: Math.round(companyData.totalLeak * 1000000),
        currencyCode: "USD"
      } : undefined,
      recoveryPotential: companyData.recoveryPotential70 ? {
        amountMicros: Math.round(companyData.recoveryPotential70 * 1000000),
        currencyCode: "USD"
      } : undefined,
      leadScore: companyData.leadScore || 0,
      leadCategory: companyData.leadCategory || "ENTERPRISE",
      calculatorCompletionDate: new Date().toISOString().split('T')[0],
      monthlyLeads: companyData.monthlyLeads || 0,
      employees: companyData.employees || 10,
      idealCustomerProfile: companyData.leadScore > 70
    };
    
    console.log('Company payload:', JSON.stringify(companyPayload, null, 2));
    
    const response = await fetch(`${crmUrl}/rest/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(companyPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Company creation API error:', errorText);
      throw new Error(`CRM API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const companyId = result.data?.companies?.[0]?.id || result.data?.id || result.id;
    
    if (!companyId) {
      console.error('No company ID in response:', result);
      throw new Error('No company ID returned from CRM');
    }
    
    console.log('Twenty CRM company created:', companyId);
    
    // Update submission with company ID
    if (submissionId) {
      await supabaseClient
        .from('submissions')
        .update({
          twenty_company_id: companyId
        })
        .eq('id', submissionId);
    }
    
    return { success: true, companyId };
    
  } catch (error) {
    console.error('Company creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function createCrmContact(
  contactData: any, 
  crmUrl: string, 
  apiKey: string, 
  supabaseClient: any,
  submissionId?: string
) {
  try {
    console.log('Creating Twenty CRM contact:', contactData);
    
    // First, check if contact already exists by email
    const existingContactResponse = await fetch(`${crmUrl}/rest/people?filter[emails][primaryEmail][eq]=${encodeURIComponent(contactData.email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (existingContactResponse.ok) {
      const existingResult = await existingContactResponse.json();
      if (existingResult.data?.people && existingResult.data.people.length > 0) {
        const existingContactId = existingResult.data.people[0].id;
        console.log('Existing Twenty CRM contact found:', existingContactId);
        
        // Update existing contact with company ID if provided
        if (contactData.companyId && existingContactId) {
          await fetch(`${crmUrl}/rest/people/${existingContactId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              companyId: contactData.companyId
            })
          });
        }
        
        // Update submission with existing CRM contact ID
        if (submissionId && existingContactId) {
          await supabaseClient
            .from('submissions')
            .update({
              twenty_contact_id: existingContactId,
              synced_to_self_hosted: true
            })
            .eq('id', submissionId);
        }
        
        return { success: true, contactId: existingContactId, existing: true };
      }
    }
    
    // If no existing contact found, create new one
    const contactPayload = {
      emails: {
        primaryEmail: contactData.email
      },
      name: {
        firstName: contactData.firstName || contactData.company?.split(' ')[0] || 'Unknown',
        lastName: contactData.lastName || contactData.company?.split(' ').slice(1).join(' ') || 'Contact'
      },
      phones: contactData.phone ? {
        primaryPhoneNumber: contactData.phone
      } : undefined,
      jobTitle: "Decision Maker",
      industry: contactData.industry || "SAAS",
      emailSequenceStatus: "NOT_STARTED",
      followUpPriority: "PRIORITY_1_URGENT",
      companyId: contactData.companyId, // Link to company
      leadScore: contactData.leadScore || 0
    };
    
    console.log('Contact payload:', JSON.stringify(contactPayload, null, 2));
    
    const response = await fetch(`${crmUrl}/rest/people`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(contactPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CRM API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const contactId = result.data?.people?.[0]?.id || result.data?.id || result.id;
    
    if (!contactId) {
      console.error('No contact ID in response:', result);
      throw new Error('No contact ID returned from CRM');
    }
    
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
    
    // Validate required IDs
    if (!opportunityData.contactId) {
      throw new Error('Contact ID is required for opportunity creation');
    }
    
    if (!opportunityData.companyId) {
      throw new Error('Company ID is required for opportunity creation');
    }
    
    // Validate that IDs are proper UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(opportunityData.contactId)) {
      throw new Error(`Invalid contact ID format: ${opportunityData.contactId}`);
    }
    if (!uuidRegex.test(opportunityData.companyId)) {
      throw new Error(`Invalid company ID format: ${opportunityData.companyId}`);
    }
    
    // Twenty CRM uses REST API with specific data structure
    const opportunityPayload = {
      name: opportunityData.name || `${opportunityData.companyName} - Revenue Recovery Opportunity`,
      amount: {
        amountMicros: Math.round((opportunityData.recoveryPotential || 0) * 1000000), // Use recovery potential as amount
        currencyCode: "USD"
      },
      stage: "NEW_LEAD", // Use correct stage value
      leadCategory: opportunityData.leadCategory || "ENTERPRISE",
      pointOfContactId: opportunityData.contactId, // Link to the contact
      companyId: opportunityData.companyId, // Link to the company
      recoveryPotential: opportunityData.recoveryPotential ? {
        amountMicros: Math.round(opportunityData.recoveryPotential * 1000000),
        currencyCode: "USD"
      } : undefined,
      totalRevenueLeak: opportunityData.totalRevenueLeak ? {
        amountMicros: Math.round(opportunityData.totalRevenueLeak * 1000000),
        currencyCode: "USD"
      } : undefined,
      annualRecurringRevenue: opportunityData.annualRecurringRevenue ? {
        amountMicros: Math.round(opportunityData.annualRecurringRevenue * 1000000),
        currencyCode: "USD"
      } : undefined,
      leadScore: opportunityData.leadScore || 0,
      calculatorCompletionDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      leadSource: opportunityData.leadSource || "CALCULATOR"
    };
    
    console.log('Opportunity payload:', JSON.stringify(opportunityPayload, null, 2));
    
    const response = await fetch(`${crmUrl}/rest/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(opportunityPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CRM API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const opportunityId = result.data?.opportunities?.[0]?.id || result.data?.id || result.id;
    
    if (!opportunityId) {
      console.error('No opportunity ID in response:', result);
      throw new Error('No opportunity ID returned from CRM');
    }
    
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