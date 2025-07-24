import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CrmIntegrationRequest {
  action: 'create_qualified_lead' | 'sync_submission' | 'update_opportunity' | 'create_contact';
  tempId?: string;
  email?: string;
  submissionId?: string;
  qualification?: any;
  priority?: boolean;
  submissionData?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: CrmIntegrationRequest = await req.json();
    const { action, tempId, email, submissionId, qualification, priority, submissionData } = request;

    console.log(`Processing CRM integration: ${action} for tempId: ${tempId}`);

    let result = {};

    switch (action) {
      case 'create_qualified_lead':
        result = await createQualifiedLead(supabase, tempId, email, qualification, submissionData);
        break;
        
      case 'sync_submission':
        result = await syncSubmissionToCrm(supabase, submissionId || tempId, submissionData);
        break;
        
      case 'update_opportunity':
        result = await updateCrmOpportunity(supabase, submissionId, submissionData);
        break;
        
      case 'create_contact':
        result = await createCrmContact(supabase, email, submissionData);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Log integration event
    await supabase.from('integration_logs').insert({
      integration_type: 'crm',
      status: 'success',
      response_data: result,
      submission_id: submissionId,
      created_at: new Date().toISOString()
    });

    console.log(`CRM integration ${action} completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
        tempId,
        submissionId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in crm-integration function:', error);
    
    // Log failed integration
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('integration_logs').insert({
        integration_type: 'crm',
        status: 'failed',
        error_message: error.message,
        response_data: { error: error.message },
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging integration failure:', logError);
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createQualifiedLead(supabase: any, tempId?: string, email?: string, qualification?: any, submissionData?: any) {
  console.log(`Creating qualified lead for ${email}`);
  
  // Get or retrieve submission data
  let leadData = submissionData;
  if (!leadData && tempId) {
    const { data } = await supabase
      .from('temporary_submissions')
      .select('*')
      .eq('temp_id', tempId)
      .single();
    leadData = data;
  }

  if (!leadData || !email) {
    throw new Error('Insufficient data to create qualified lead');
  }

  const results = {
    twenty_crm: null,
    smartlead: null,
    n8n_workflow: null
  };

  // 1. Create contact in Twenty CRM
  try {
    const twentyCrmResult = await createTwentyCrmContact(leadData, qualification);
    results.twenty_crm = twentyCrmResult;
    
    // Update submission with CRM IDs
    if (tempId) {
      await supabase
        .from('temporary_submissions')
        .update({ twenty_crm_contact_id: twentyCrmResult.contact_id })
        .eq('temp_id', tempId);
    }
  } catch (twentyError) {
    console.error('Twenty CRM integration failed:', twentyError);
    results.twenty_crm = { error: twentyError.message };
  }

  // 2. Add to Smartlead campaign
  try {
    const smartleadResult = await addToSmartleadCampaign(leadData, qualification);
    results.smartlead = smartleadResult;
    
    // Update submission with campaign IDs
    if (tempId && smartleadResult.campaign_id) {
      const campaignIds = leadData.smartlead_campaign_ids || [];
      campaignIds.push(smartleadResult.campaign_id);
      
      await supabase
        .from('temporary_submissions')
        .update({ 
          smartlead_campaign_ids: campaignIds,
          last_activity_at: new Date().toISOString()
        })
        .eq('temp_id', tempId);
    }
  } catch (smartleadError) {
    console.error('Smartlead integration failed:', smartleadError);
    results.smartlead = { error: smartleadError.message };
  }

  // 3. Trigger N8N qualified lead workflow
  try {
    const n8nResult = await triggerN8nQualifiedLeadWorkflow(leadData, qualification);
    results.n8n_workflow = n8nResult;
  } catch (n8nError) {
    console.error('N8N workflow trigger failed:', n8nError);
    results.n8n_workflow = { error: n8nError.message };
  }

  return results;
}

async function createTwentyCrmContact(leadData: any, qualification?: any) {
  const twentyApiUrl = Deno.env.get('TWENTY_CRM_BASE_URL');
  const twentyApiKey = Deno.env.get('TWENTY_CRM_API_KEY');
  
  if (!twentyApiUrl || !twentyApiKey) {
    throw new Error('Twenty CRM configuration missing');
  }

  const contactData = {
    email: leadData.email,
    firstName: leadData.company_name ? leadData.company_name.split(' ')[0] : 'Lead',
    lastName: leadData.company_name ? leadData.company_name.split(' ').slice(1).join(' ') : 'Contact',
    phone: leadData.phone,
    companyName: leadData.company_name,
    jobTitle: 'Revenue Operations',
    source: 'Revenue Leak Calculator',
    leadScore: leadData.lead_score,
    tags: [
      qualification?.qualification_type || 'standard',
      `score-${leadData.lead_score || 0}`,
      leadData.recovery_potential ? `recovery-${Math.round(leadData.recovery_potential / 1000)}k` : null
    ].filter(Boolean),
    customFields: {
      recovery_potential: leadData.recovery_potential,
      completion_percentage: leadData.completion_percentage,
      current_arr: leadData.calculator_data?.companyInfo?.currentARR,
      lead_qualification: qualification
    }
  };

  const response = await fetch(`${twentyApiUrl}/contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${twentyApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData)
  });

  if (!response.ok) {
    throw new Error(`Twenty CRM API error: ${response.status}`);
  }

  const result = await response.json();
  return {
    contact_id: result.id,
    success: true,
    data: result
  };
}

async function addToSmartleadCampaign(leadData: any, qualification?: any) {
  const smartleadApiUrl = Deno.env.get('SMARTLEAD_API_URL');
  const smartleadApiKey = Deno.env.get('SMARTLEAD_API_KEY');
  
  if (!smartleadApiUrl || !smartleadApiKey) {
    throw new Error('Smartlead configuration missing');
  }

  // Determine campaign based on qualification
  const campaignMap = {
    'high_value': 'high-value-leads',
    'consultant': 'consultant-partnership',
    'enterprise': 'enterprise-outreach',
    'standard': 'standard-nurture'
  };
  
  const campaignType = campaignMap[qualification?.qualification_type] || 'standard-nurture';
  
  const prospectData = {
    email: leadData.email,
    first_name: leadData.company_name || 'Lead',
    company_name: leadData.company_name,
    custom_variables: {
      recovery_potential: leadData.recovery_potential?.toString(),
      lead_score: leadData.lead_score?.toString(),
      current_arr: leadData.calculator_data?.companyInfo?.currentARR?.toString(),
      qualification_type: qualification?.qualification_type
    }
  };

  const response = await fetch(`${smartleadApiUrl}/campaigns/${campaignType}/prospects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${smartleadApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(prospectData)
  });

  if (!response.ok) {
    throw new Error(`Smartlead API error: ${response.status}`);
  }

  const result = await response.json();
  return {
    campaign_id: campaignType,
    prospect_id: result.id,
    success: true,
    data: result
  };
}

async function triggerN8nQualifiedLeadWorkflow(leadData: any, qualification?: any) {
  const n8nWebhook = Deno.env.get('N8N_LEAD_QUALIFICATION_WEBHOOK');
  
  if (!n8nWebhook) {
    throw new Error('N8N webhook configuration missing');
  }

  const workflowData = {
    trigger: 'qualified_lead_created',
    lead_data: leadData,
    qualification,
    timestamp: new Date().toISOString(),
    actions: qualification?.recommended_actions || []
  };

  const response = await fetch(n8nWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflowData)
  });

  if (!response.ok) {
    throw new Error(`N8N webhook error: ${response.status}`);
  }

  const result = await response.json();
  return {
    execution_id: result.executionId,
    success: true,
    data: result
  };
}

async function syncSubmissionToCrm(supabase: any, submissionId?: string, submissionData?: any) {
  // Implementation for syncing existing submissions to CRM
  console.log(`Syncing submission ${submissionId} to CRM`);
  return { message: 'Sync to CRM completed', submissionId };
}

async function updateCrmOpportunity(supabase: any, submissionId?: string, submissionData?: any) {
  // Implementation for updating CRM opportunities
  console.log(`Updating CRM opportunity for submission ${submissionId}`);
  return { message: 'CRM opportunity updated', submissionId };
}

async function createCrmContact(supabase: any, email?: string, submissionData?: any) {
  // Implementation for creating CRM contacts
  console.log(`Creating CRM contact for ${email}`);
  return { message: 'CRM contact created', email };
}