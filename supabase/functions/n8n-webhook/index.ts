import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkflowData {
  workflow_id?: string;
  execution_id?: string;
  submission_id?: string;
  temp_id?: string;
  status?: string;
  data?: any;
  error?: string;
}

interface EmailAutomationData extends WorkflowData {
  email?: string;
  sequence_type?: string;
  step?: number;
  campaign_id?: string;
}

interface CRMIntegrationData extends WorkflowData {
  contact_id?: string;
  opportunity_id?: string;
  lead_score?: number;
  sync_status?: string;
}

interface LeadQualificationData extends WorkflowData {
  lead_score?: number;
  qualification_result?: string;
  next_actions?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const workflowType = pathParts[pathParts.length - 1];
    
    if (!workflowType) {
      return new Response('Workflow type required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const workflowData: WorkflowData = await req.json();
    console.log(`Processing N8N webhook for workflow type: ${workflowType}`, workflowData);

    // Log the webhook call
    await supabase.from('integration_logs').insert({
      integration_type: 'n8n_webhook',
      status: 'received',
      response_data: {
        workflow_type: workflowType,
        execution_id: workflowData.execution_id,
        timestamp: new Date().toISOString()
      }
    });

    // Route to appropriate handler
    switch (workflowType) {
      case 'email-automation':
        await handleEmailAutomation(supabase, workflowData as EmailAutomationData);
        break;
      case 'crm-integration':
        await handleCRMIntegration(supabase, workflowData as CRMIntegrationData);
        break;
      case 'lead-qualification':
        await handleLeadQualification(supabase, workflowData as LeadQualificationData);
        break;
      default:
        console.warn(`Unknown N8N workflow type: ${workflowType}`);
        return new Response(`Unknown workflow type: ${workflowType}`, { 
          status: 400, 
          headers: corsHeaders 
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: new Date().toISOString(),
        workflow_type: workflowType
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('N8N webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleEmailAutomation(supabase: any, data: EmailAutomationData) {
  console.log('Handling email automation webhook:', data);

  if (data.temp_id && data.sequence_type) {
    // Update email sequence queue with execution results
    const updateData: any = {
      n8n_execution_id: data.execution_id,
      status: data.status || 'sent'
    };

    if (data.status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    } else if (data.status === 'opened') {
      updateData.opened_at = new Date().toISOString();
    } else if (data.status === 'clicked') {
      updateData.clicked_at = new Date().toISOString();
    } else if (data.status === 'converted') {
      updateData.conversion_completed_at = new Date().toISOString();
    }

    await supabase
      .from('email_sequence_queue')
      .update(updateData)
      .eq('temp_id', data.temp_id)
      .eq('sequence_type', data.sequence_type);
  }

  if (data.submission_id && data.sequence_type) {
    // Update email sequences table for permanent submissions
    await supabase
      .from('email_sequences')
      .upsert({
        submission_id: data.submission_id,
        sequence_type: data.sequence_type,
        email_step: data.step || 1,
        status: data.status || 'sent',
        smartlead_campaign_id: data.campaign_id,
        sent_at: data.status === 'sent' ? new Date().toISOString() : null,
        opened_at: data.status === 'opened' ? new Date().toISOString() : null,
        clicked_at: data.status === 'clicked' ? new Date().toISOString() : null,
        replied_at: data.status === 'replied' ? new Date().toISOString() : null
      });
  }

  // Log successful processing
  await supabase.from('integration_logs').insert({
    integration_type: 'n8n_email_automation',
    status: 'success',
    submission_id: data.submission_id,
    response_data: {
      execution_id: data.execution_id,
      sequence_type: data.sequence_type,
      status: data.status
    }
  });
}

async function handleCRMIntegration(supabase: any, data: CRMIntegrationData) {
  console.log('Handling CRM integration webhook:', data);

  if (data.submission_id) {
    // Update submission with CRM data
    const updateData: any = {};
    
    if (data.contact_id) {
      updateData.twenty_contact_id = data.contact_id;
    }
    
    if (data.sync_status) {
      updateData.synced_to_self_hosted = data.sync_status === 'success';
    }

    await supabase
      .from('submissions')
      .update(updateData)
      .eq('id', data.submission_id);
  }

  if (data.temp_id) {
    // Update temporary submission with CRM data
    await supabase
      .from('temporary_submissions')
      .update({
        twenty_crm_contact_id: data.contact_id,
        n8n_workflow_status: {
          crm_integration: {
            status: data.sync_status,
            contact_id: data.contact_id,
            opportunity_id: data.opportunity_id,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('temp_id', data.temp_id);
  }

  // Log successful processing
  await supabase.from('integration_logs').insert({
    integration_type: 'n8n_crm_integration',
    status: 'success',
    submission_id: data.submission_id,
    response_data: {
      execution_id: data.execution_id,
      contact_id: data.contact_id,
      opportunity_id: data.opportunity_id
    }
  });
}

async function handleLeadQualification(supabase: any, data: LeadQualificationData) {
  console.log('Handling lead qualification webhook:', data);

  if (data.submission_id && data.lead_score !== undefined) {
    // Update submission with qualified lead score
    await supabase
      .from('submissions')
      .update({
        lead_score: data.lead_score
      })
      .eq('id', data.submission_id);
  }

  if (data.temp_id) {
    // Update temporary submission with qualification results
    await supabase
      .from('temporary_submissions')
      .update({
        lead_score: data.lead_score,
        user_classification: data.qualification_result,
        n8n_workflow_status: {
          lead_qualification: {
            status: 'completed',
            lead_score: data.lead_score,
            qualification_result: data.qualification_result,
            next_actions: data.next_actions,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('temp_id', data.temp_id);
  }

  // Log successful processing
  await supabase.from('integration_logs').insert({
    integration_type: 'n8n_lead_qualification',
    status: 'success',
    submission_id: data.submission_id,
    response_data: {
      execution_id: data.execution_id,
      lead_score: data.lead_score,
      qualification_result: data.qualification_result
    }
  });
}