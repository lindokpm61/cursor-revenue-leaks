import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailAutomationRequest {
  action: 'schedule_welcome_sequence' | 'schedule_abandonment_recovery' | 'process_engagement' | 'cancel_sequences';
  tempId?: string;
  email?: string;
  leadScore?: number;
  companyName?: string;
  abandonmentStep?: number;
  engagementType?: 'opened' | 'clicked' | 'replied' | 'converted';
  sequenceType?: string;
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

    const request: EmailAutomationRequest = await req.json();
    const { action, tempId, email, leadScore, companyName, abandonmentStep, engagementType, sequenceType } = request;

    console.log(`Processing email automation: ${action} for tempId: ${tempId}`);

    switch (action) {
      case 'schedule_welcome_sequence':
        if (!email || !tempId) {
          return new Response(
            JSON.stringify({ error: 'email and tempId required for welcome sequence' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Schedule welcome email sequence based on lead score
        const welcomeSequenceType = leadScore && leadScore >= 70 ? 'high_value_welcome' : 'standard_welcome';
        
        // Schedule immediate welcome email
        await supabase.from('email_sequence_queue').insert({
          temp_id: tempId,
          contact_email: email,
          sequence_type: welcomeSequenceType,
          scheduled_for: new Date().toISOString(),
          contact_data: {
            company_name: companyName,
            lead_score: leadScore,
            sequence_step: 1
          },
          status: 'pending'
        });

        // Schedule follow-up emails
        const followUpDelays = leadScore && leadScore >= 70 ? [2, 5, 10] : [3, 7, 14]; // Days
        
        for (let i = 0; i < followUpDelays.length; i++) {
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + followUpDelays[i]);
          
          await supabase.from('email_sequence_queue').insert({
            temp_id: tempId,
            contact_email: email,
            sequence_type: `${welcomeSequenceType}_followup_${i + 2}`,
            scheduled_for: followUpDate.toISOString(),
            contact_data: {
              company_name: companyName,
              lead_score: leadScore,
              sequence_step: i + 2
            },
            status: 'pending'
          });
        }

        // Trigger N8N workflow for immediate email sending
        try {
          const n8nWebhook = Deno.env.get('N8N_EMAIL_AUTOMATION_WEBHOOK');
          if (n8nWebhook) {
            await fetch(n8nWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'send_welcome_email',
                email,
                company_name: companyName,
                lead_score: leadScore,
                sequence_type: welcomeSequenceType,
                temp_id: tempId
              })
            });
          }
        } catch (n8nError) {
          console.error('Error triggering N8N workflow:', n8nError);
        }

        break;

      case 'schedule_abandonment_recovery':
        if (!tempId) {
          return new Response(
            JSON.stringify({ error: 'tempId required for abandonment recovery' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get temporary submission data
        const { data: tempSubmission } = await supabase
          .from('temporary_submissions')
          .select('*')
          .eq('temp_id', tempId)
          .single();

        if (!tempSubmission || !tempSubmission.email) {
          return new Response(
            JSON.stringify({ error: 'No email found for abandonment recovery' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Schedule abandonment recovery email based on completion percentage
        const recoveryDelay = tempSubmission.completion_percentage > 50 ? 24 : 48; // Hours
        const recoveryDate = new Date();
        recoveryDate.setHours(recoveryDate.getHours() + recoveryDelay);

        await supabase.from('email_sequence_queue').insert({
          temp_id: tempId,
          contact_email: tempSubmission.email,
          sequence_type: 'abandonment_recovery',
          scheduled_for: recoveryDate.toISOString(),
          contact_data: {
            company_name: tempSubmission.company_name,
            completion_percentage: tempSubmission.completion_percentage,
            current_step: tempSubmission.current_step,
            recovery_potential: tempSubmission.recovery_potential
          },
          status: 'pending'
        });

        break;

      case 'process_engagement':
        if (!tempId || !sequenceType || !engagementType) {
          return new Response(
            JSON.stringify({ error: 'tempId, sequenceType, and engagementType required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update email sequence queue with engagement data
        const engagementField = `${engagementType}_at`;
        await supabase
          .from('email_sequence_queue')
          .update({ [engagementField]: new Date().toISOString() })
          .eq('temp_id', tempId)
          .eq('sequence_type', sequenceType);

        // Update engagement score
        const engagementPoints = {
          opened: 5,
          clicked: 15,
          replied: 30,
          converted: 50
        };

        await supabase.rpc('update_engagement_score', {
          p_temp_id: tempId,
          p_points: engagementPoints[engagementType] || 0
        });

        // Log engagement event
        await supabase.from('email_engagement_events').insert({
          temp_id: tempId,
          event_type: engagementType,
          engagement_score_delta: engagementPoints[engagementType] || 0,
          timestamp: new Date().toISOString()
        });

        break;

      case 'cancel_sequences':
        if (!tempId) {
          return new Response(
            JSON.stringify({ error: 'tempId required to cancel sequences' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Cancel pending email sequences
        await supabase
          .from('email_sequence_queue')
          .update({ status: 'cancelled' })
          .eq('temp_id', tempId)
          .eq('status', 'pending');

        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Log automation event
    await supabase.from('automation_logs').insert({
      workflow_type: 'email_automation',
      data_sent: request,
      status: 'completed',
      results: { action, success: true },
      created_at: new Date().toISOString()
    });

    console.log(`Email automation ${action} completed for tempId: ${tempId}`);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        tempId,
        message: `Email automation ${action} processed successfully`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in email-automation function:', error);
    
    // Log failed automation
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.from('automation_logs').insert({
        workflow_type: 'email_automation',
        data_sent: await req.json().catch(() => ({})),
        status: 'failed',
        error: error.message,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Error logging automation failure:', logError);
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});