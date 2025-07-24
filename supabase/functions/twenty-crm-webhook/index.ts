import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwentyCRMWebhookRequest {
  contactId: string;
  tempId?: string;
  action: string;
  contactData: any;
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
    // Authenticate Twenty CRM webhook
    const authHeader = req.headers.get('Authorization');
    const expectedKey = `Bearer ${Deno.env.get('TWENTY_CRM_WEBHOOK_API_KEY')}`;
    
    if (authHeader !== expectedKey) {
      console.warn('Unauthorized Twenty CRM webhook attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { contactId, tempId, action, contactData }: TwentyCRMWebhookRequest = await req.json();
    
    console.log(`Twenty CRM webhook: ${action} for contact ${contactId}, tempId: ${tempId}`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Update temporary submission with CRM contact ID
    if (tempId && contactId) {
      await supabaseClient
        .from('temporary_submissions')
        .update({
          twenty_crm_contact_id: contactId,
          n8n_workflow_status: {
            crm_sync: {
              status: 'synced',
              contact_id: contactId,
              last_updated: new Date().toISOString()
            }
          }
        })
        .eq('temp_id', tempId);
    }
    
    // Handle different CRM actions
    switch (action) {
      case 'contact_created':
        await handleContactCreated(contactId, contactData, supabaseClient);
        break;
        
      case 'contact_updated':
        await handleContactUpdated(contactId, contactData, supabaseClient);
        break;
        
      case 'opportunity_created':
        await handleOpportunityCreated(contactId, contactData, supabaseClient);
        break;
        
      case 'deal_stage_changed':
        await handleDealStageChanged(contactId, contactData, supabaseClient);
        break;
        
      default:
        console.warn(`Unknown Twenty CRM action: ${action}`);
    }
    
    // Log the webhook event
    await supabaseClient
      .from('integration_logs')
      .insert({
        integration_type: 'twenty_crm_webhook',
        status: 'success',
        response_data: {
          action,
          contact_id: contactId,
          temp_id: tempId,
          timestamp: new Date().toISOString()
        }
      });
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Twenty CRM webhook failed:', error);
    
    // Log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('integration_logs')
        .insert({
          integration_type: 'twenty_crm_webhook',
          status: 'error',
          error_message: error.message,
          response_data: {
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log Twenty CRM webhook error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleContactCreated(contactId: string, contactData: any, supabaseClient: any) {
  console.log(`Twenty CRM contact created: ${contactId}`);
  
  // Find matching submission by email
  if (contactData.email) {
    const { data: submissions } = await supabaseClient
      .from('submissions')
      .select('id')
      .eq('contact_email', contactData.email);
    
    if (submissions && submissions.length > 0) {
      await supabaseClient
        .from('submissions')
        .update({
          twenty_contact_id: contactId,
          synced_to_self_hosted: true
        })
        .eq('contact_email', contactData.email);
    }
    
    // Also update temporary submissions
    await supabaseClient
      .from('temporary_submissions')
      .update({
        twenty_crm_contact_id: contactId
      })
      .eq('email', contactData.email);
  }
}

async function handleContactUpdated(contactId: string, contactData: any, supabaseClient: any) {
  console.log(`Twenty CRM contact updated: ${contactId}`);
  
  // Update lead score if provided
  if (contactData.lead_score) {
    await supabaseClient
      .from('submissions')
      .update({
        lead_score: contactData.lead_score
      })
      .eq('twenty_contact_id', contactId);
  }
}

async function handleOpportunityCreated(contactId: string, contactData: any, supabaseClient: any) {
  console.log(`Twenty CRM opportunity created for contact: ${contactId}`);
  
  // Update submissions with opportunity information
  await supabaseClient
    .from('submissions')
    .update({
      lead_score: Math.max(contactData.opportunity_value || 0, 80) // High score for opportunities
    })
    .eq('twenty_contact_id', contactId);
}

async function handleDealStageChanged(contactId: string, contactData: any, supabaseClient: any) {
  console.log(`Twenty CRM deal stage changed for contact: ${contactId} to ${contactData.stage}`);
  
  // Track deal progression
  const stageScoreMap: Record<string, number> = {
    'qualified': 70,
    'proposal': 85,
    'negotiation': 90,
    'closed_won': 100,
    'closed_lost': 0
  };
  
  const newScore = stageScoreMap[contactData.stage] || 50;
  
  await supabaseClient
    .from('submissions')
    .update({
      lead_score: newScore
    })
    .eq('twenty_contact_id', contactId);
}