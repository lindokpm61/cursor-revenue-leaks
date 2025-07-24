import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmartleadEngagementRequest {
  tempId?: string;
  eventType: string;
  emailId: string;
  campaignId: string;
  timestamp: string;
  email?: string;
  metadata?: any;
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
    // Authenticate Smartlead webhook
    const authHeader = req.headers.get('Authorization');
    const expectedKey = `Bearer ${Deno.env.get('SMARTLEAD_WEBHOOK_API_KEY')}`;
    
    if (authHeader !== expectedKey) {
      console.warn('Unauthorized Smartlead webhook attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { tempId, eventType, emailId, campaignId, timestamp, email, metadata }: SmartleadEngagementRequest = await req.json();
    
    console.log(`Smartlead engagement: ${eventType} for email ${emailId}, campaign ${campaignId}`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Track email engagement events
    await supabaseClient
      .from('email_engagement_events')
      .insert({
        temp_id: tempId,
        event_type: eventType, // sent, opened, clicked, replied, bounced
        email_id: emailId,
        campaign_id: campaignId,
        timestamp: timestamp,
        engagement_score_delta: calculateEngagementScoreDelta(eventType)
      });
    
    // Update lead score based on engagement
    await updateLeadScore(tempId, email, eventType, supabaseClient);
    
    // Update email sequence queue if applicable
    await updateEmailSequenceQueue(tempId, eventType, campaignId, supabaseClient);
    
    // Trigger follow-up actions for high engagement
    if (eventType === 'clicked' || eventType === 'replied') {
      await triggerHighEngagementFollowup(tempId, eventType, timestamp, supabaseClient);
    }
    
    // Log the webhook event
    await supabaseClient
      .from('integration_logs')
      .insert({
        integration_type: 'smartlead_engagement',
        status: 'success',
        response_data: {
          event_type: eventType,
          email_id: emailId,
          campaign_id: campaignId,
          temp_id: tempId,
          timestamp: timestamp
        }
      });
    
    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Email engagement tracking failed:', error);
    
    // Log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('integration_logs')
        .insert({
          integration_type: 'smartlead_engagement',
          status: 'error',
          error_message: error.message,
          response_data: {
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log Smartlead engagement error:', logError);
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

function calculateEngagementScoreDelta(eventType: string): number {
  const scoreMap: Record<string, number> = {
    'sent': 1,
    'delivered': 2,
    'opened': 5,
    'clicked': 15,
    'replied': 25,
    'bounced': -5,
    'unsubscribed': -10
  };
  return scoreMap[eventType] || 0;
}

async function updateLeadScore(tempId: string | undefined, email: string | undefined, eventType: string, supabaseClient: any) {
  const scoreDelta = calculateEngagementScoreDelta(eventType);
  
  try {
    // Update temporary submission if tempId is provided
    if (tempId) {
      const { data: submission } = await supabaseClient
        .from('temporary_submissions')
        .select('email_engagement_score')
        .eq('temp_id', tempId)
        .single();
      
      if (submission) {
        const newScore = (submission.email_engagement_score || 0) + scoreDelta;
        
        await supabaseClient
          .from('temporary_submissions')
          .update({
            email_engagement_score: newScore,
            last_activity_at: new Date().toISOString()
          })
          .eq('temp_id', tempId);
      }
    }
    
    // Also update permanent submissions by email
    if (email) {
      await supabaseClient
        .from('submissions')
        .update({
          lead_score: supabaseClient.rpc('COALESCE', ['lead_score', 0]) + scoreDelta
        })
        .eq('contact_email', email);
    }
    
    console.log(`Lead score updated for ${tempId || email}: +${scoreDelta} (${eventType})`);
  } catch (error) {
    console.error('Failed to update lead score:', error);
  }
}

async function updateEmailSequenceQueue(tempId: string | undefined, eventType: string, campaignId: string, supabaseClient: any) {
  if (!tempId) return;
  
  try {
    const updateData: any = {};
    
    switch (eventType) {
      case 'opened':
        updateData.opened_at = new Date().toISOString();
        break;
      case 'clicked':
        updateData.clicked_at = new Date().toISOString();
        break;
      case 'replied':
        updateData.conversion_completed_at = new Date().toISOString();
        updateData.status = 'converted';
        break;
    }
    
    if (Object.keys(updateData).length > 0) {
      await supabaseClient
        .from('email_sequence_queue')
        .update(updateData)
        .eq('temp_id', tempId);
    }
  } catch (error) {
    console.error('Failed to update email sequence queue:', error);
  }
}

async function triggerHighEngagementFollowup(tempId: string | undefined, eventType: string, timestamp: string, supabaseClient: any) {
  if (!tempId) return;
  
  try {
    const triggerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-n8n-workflow`;
    
    await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        workflowType: 'high-value-alert',
        data: {
          trigger_type: 'high_engagement',
          temp_id: tempId,
          engagement_type: eventType,
          timestamp: timestamp,
          priority: eventType === 'replied' ? 'urgent' : 'high'
        }
      })
    });
    
    console.log(`High engagement followup triggered for tempId: ${tempId}, event: ${eventType}`);
  } catch (error) {
    console.error('Failed to trigger high engagement followup:', error);
  }
}