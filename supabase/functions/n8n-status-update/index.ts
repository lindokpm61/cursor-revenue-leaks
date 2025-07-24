import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusUpdateRequest {
  executionId: string;
  workflowType: string;
  status: string;
  tempId?: string;
  results?: any;
}

Deno.serve(async (req) => {
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
    // Authenticate webhook request
    const authHeader = req.headers.get('Authorization');
    const expectedKey = `Bearer ${Deno.env.get('N8N_WEBHOOK_API_KEY')}`;
    
    if (authHeader !== expectedKey) {
      console.warn('Unauthorized N8N status update attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { executionId, workflowType, status, tempId, results }: StatusUpdateRequest = await req.json();
    
    console.log(`N8N status update: ${workflowType} execution ${executionId} -> ${status}`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Update automation status in database
    const { error: updateError } = await supabaseClient
      .from('automation_logs')
      .update({
        status: status,
        results: results,
        updated_at: new Date().toISOString()
      })
      .eq('n8n_execution_id', executionId);
    
    if (updateError) {
      console.error('Failed to update automation log:', updateError);
    }
    
    // Handle specific workflow completions
    switch (workflowType) {
      case 'email-automation':
        await handleEmailAutomationComplete(tempId, results, supabaseClient);
        break;
        
      case 'crm-integration':
        await handleCRMIntegrationComplete(tempId, results, supabaseClient);
        break;
        
      case 'lead-qualification':
        await handleLeadQualificationComplete(tempId, results, supabaseClient);
        break;
        
      case 'high-value-alert':
        await handleHighValueAlertComplete(tempId, results, supabaseClient);
        break;
        
      case 'abandonment-recovery':
        await handleAbandonmentRecoveryComplete(tempId, results, supabaseClient);
        break;
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('N8N status update failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleEmailAutomationComplete(tempId: string | undefined, results: any, supabaseClient: any) {
  if (!tempId) return;
  
  try {
    await supabaseClient
      .from('temporary_submissions')
      .update({
        email_sequences_triggered: results?.sequences_sent || [],
        last_email_sent_at: new Date().toISOString(),
        email_engagement_score: results?.engagement_score || 0,
        n8n_workflow_status: {
          email_automation: {
            status: 'completed',
            sequences_sent: results?.sequences_sent,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('temp_id', tempId);
    
    console.log(`Email automation completed for tempId: ${tempId}`);
  } catch (error) {
    console.error('Failed to handle email automation completion:', error);
  }
}

async function handleCRMIntegrationComplete(tempId: string | undefined, results: any, supabaseClient: any) {
  if (!tempId) return;
  
  try {
    await supabaseClient
      .from('temporary_submissions')
      .update({
        twenty_crm_contact_id: results?.contact_id,
        n8n_workflow_status: {
          crm_integration: {
            status: 'completed',
            contact_id: results?.contact_id,
            opportunity_id: results?.opportunity_id,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('temp_id', tempId);
    
    console.log(`CRM integration completed for tempId: ${tempId}, contact: ${results?.contact_id}`);
  } catch (error) {
    console.error('Failed to handle CRM integration completion:', error);
  }
}

async function handleLeadQualificationComplete(tempId: string | undefined, results: any, supabaseClient: any) {
  if (!tempId) return;
  
  try {
    await supabaseClient
      .from('temporary_submissions')
      .update({
        lead_score: results?.lead_score,
        user_classification: results?.qualification_result,
        n8n_workflow_status: {
          lead_qualification: {
            status: 'completed',
            lead_score: results?.lead_score,
            qualification_result: results?.qualification_result,
            next_actions: results?.next_actions,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('temp_id', tempId);
    
    console.log(`Lead qualification completed for tempId: ${tempId}, score: ${results?.lead_score}`);
  } catch (error) {
    console.error('Failed to handle lead qualification completion:', error);
  }
}

async function handleHighValueAlertComplete(tempId: string | undefined, results: any, supabaseClient: any) {
  if (!tempId) return;
  
  try {
    await supabaseClient
      .from('temporary_submissions')
      .update({
        special_handling: true,
        n8n_workflow_status: {
          high_value_alert: {
            status: 'completed',
            alert_sent: results?.alert_sent,
            assigned_to: results?.assigned_to,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('temp_id', tempId);
    
    console.log(`High value alert completed for tempId: ${tempId}`);
  } catch (error) {
    console.error('Failed to handle high value alert completion:', error);
  }
}

async function handleAbandonmentRecoveryComplete(tempId: string | undefined, results: any, supabaseClient: any) {
  if (!tempId) return;
  
  try {
    await supabaseClient
      .from('temporary_submissions')
      .update({
        n8n_workflow_status: {
          abandonment_recovery: {
            status: 'completed',
            recovery_emails_sent: results?.recovery_emails_sent,
            recovery_strategy: results?.recovery_strategy,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('temp_id', tempId);
    
    console.log(`Abandonment recovery completed for tempId: ${tempId}`);
  } catch (error) {
    console.error('Failed to handle abandonment recovery completion:', error);
  }
}