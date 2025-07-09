import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing automation tasks...");

    // 1. Process scheduled email sequences
    const { data: scheduledEmails, error: scheduledError } = await supabase
      .from('email_sequence_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true });

    if (scheduledError) {
      console.error('Error fetching scheduled emails:', scheduledError);
    } else {
      console.log(`Found ${scheduledEmails?.length || 0} scheduled emails to process`);

      for (const scheduledEmail of scheduledEmails || []) {
        try {
          // Check if user has progressed since scheduling
          const { data: currentProgress } = await supabase
            .from('temporary_submissions')
            .select('*')
            .eq('temp_id', scheduledEmail.temp_id)
            .single();

          // Determine if email should be cancelled
          let shouldCancel = false;
          
          if (currentProgress?.converted_to_user_id) {
            shouldCancel = true;
          }
          
          // Check step-based cancellation
          const emailStepMatch = scheduledEmail.sequence_type.match(/abandoned_step_(\d+)/);
          if (emailStepMatch && currentProgress) {
            const abandonedStep = parseInt(emailStepMatch[1]);
            if (currentProgress.current_step > abandonedStep) {
              shouldCancel = true;
            }
          }

          if (shouldCancel) {
            // Cancel the email
            await supabase
              .from('email_sequence_queue')
              .update({ 
                status: 'cancelled',
                sent_at: new Date().toISOString()
              })
              .eq('id', scheduledEmail.id);
            
            console.log(`Cancelled email ${scheduledEmail.id} - user progressed`);
          } else {
            // Trigger N8N workflow for the email
            try {
              const response = await fetch('https://placeholder-n8n.com/webhook/email-automation', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer placeholder-webhook-key'
                },
                body: JSON.stringify({
                  workflow_type: 'email-automation',
                  trigger_data: {
                    sequence_type: scheduledEmail.sequence_type,
                    contact_email: scheduledEmail.contact_email,
                    contact_data: scheduledEmail.contact_data,
                    temp_id: scheduledEmail.temp_id,
                    scheduled_email_id: scheduledEmail.id
                  }
                })
              });

              // Mark as sent
              await supabase
                .from('email_sequence_queue')
                .update({ 
                  status: 'sent',
                  sent_at: new Date().toISOString()
                })
                .eq('id', scheduledEmail.id);

              console.log(`Triggered email ${scheduledEmail.id} for ${scheduledEmail.sequence_type}`);
            } catch (emailError) {
              console.error(`Failed to trigger email ${scheduledEmail.id}:`, emailError);
            }
          }
        } catch (processingError) {
          console.error(`Error processing scheduled email ${scheduledEmail.id}:`, processingError);
        }
      }
    }

    // 2. Process email sequence analytics
    console.log("Processing email sequence analytics...");
    
    const { data: emailAnalytics, error: analyticsError } = await supabase
      .from('email_sequence_analytics')
      .select('*')
      .order('week', { ascending: false })
      .limit(4); // Last 4 weeks

    if (!analyticsError && emailAnalytics && emailAnalytics.length > 0) {
      // Send to N8N for reporting
      try {
        await fetch('https://placeholder-n8n.com/webhook/analytics-reporting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer placeholder-webhook-key'
          },
          body: JSON.stringify({
            workflow_type: 'analytics-reporting',
            trigger_data: {
              report_type: 'email_sequence_performance',
              data: emailAnalytics,
              summary: {
                total_sequences: emailAnalytics.length,
                avg_open_rate: emailAnalytics.reduce((sum, a) => sum + (a.open_rate || 0), 0) / emailAnalytics.length,
                avg_click_rate: emailAnalytics.reduce((sum, a) => sum + (a.click_rate || 0), 0) / emailAnalytics.length
              }
            }
          })
        });
        console.log("Email analytics sent to N8N");
      } catch (analyticsN8NError) {
        console.error("Failed to send analytics to N8N:", analyticsN8NError);
      }
    }

    // 3. Detect consultants from recent submissions
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentSubmissions, error: recentError } = await supabase
      .from('temporary_submissions')
      .select('temp_id, email, company_name')
      .gte('last_activity_at', twentyFourHoursAgo)
      .not('email', 'is', null)
      .is('user_classification', null);

    if (recentError) {
      console.error('Error fetching recent submissions:', recentError);
    } else {
      console.log(`Checking ${recentSubmissions?.length || 0} recent submissions for consultant patterns`);

      for (const submission of recentSubmissions || []) {
        try {
          if (!submission.email) continue;

          const emailDomain = submission.email.split('@')[1];
          
          // Check for multiple companies from same email domain
          const { data: domainSubmissions, error: domainError } = await supabase
            .from('temporary_submissions')
            .select('*')
            .like('email', `%@${emailDomain}`)
            .not('email', 'is', null);

          if (!domainError && domainSubmissions && domainSubmissions.length > 1) {
            // Consultant detected
            console.log(`Consultant detected: ${submission.email} (${domainSubmissions.length} companies)`);

            // Update submission with consultant classification
            await supabase
              .from('temporary_submissions')
              .update({
                user_classification: 'consultant',
                special_handling: true,
                last_updated: new Date().toISOString()
              })
              .eq('temp_id', submission.temp_id);

            // Trigger consultant-specific N8N workflow
            try {
              await fetch('https://placeholder-n8n.com/webhook/consultant-special-handling', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer placeholder-webhook-key'
                },
                body: JSON.stringify({
                  workflow_type: 'consultant-special-handling',
                  trigger_data: {
                    temp_id: submission.temp_id,
                    email: submission.email,
                    companies_count: domainSubmissions.length,
                    companies: domainSubmissions.map(s => s.company_name).filter(Boolean)
                  }
                })
              });

              console.log(`Triggered consultant workflow for ${submission.email}`);
            } catch (consultantWorkflowError) {
              console.error(`Failed to trigger consultant workflow:`, consultantWorkflowError);
            }
          }
        } catch (consultantError) {
          console.error(`Error processing consultant detection for ${submission.temp_id}:`, consultantError);
        }
      }
    }

    // 4. Generate abandonment analytics
    console.log("Analyzing abandonment patterns...");
    
    const { data: abandonmentData, error: abandonmentError } = await supabase
      .from('abandonment_analytics')
      .select('*')
      .order('current_step');

    if (!abandonmentError && abandonmentData && abandonmentData.length > 0) {
      // Send abandonment analysis to N8N
      try {
        const insights = {
          step_analysis: abandonmentData,
          high_abandonment_steps: abandonmentData.filter(s => s.abandonment_rate > 50),
          recovery_opportunity: abandonmentData.reduce((sum, s) => 
            sum + (s.avg_recovery_potential * (s.total_at_step - s.converted_from_step)), 0
          )
        };

        await fetch('https://placeholder-n8n.com/webhook/analytics-reporting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer placeholder-webhook-key'
          },
          body: JSON.stringify({
            workflow_type: 'analytics-reporting',
            trigger_data: {
              report_type: 'abandonment_analysis',
              insights: insights
            }
          })
        });
        console.log("Abandonment analytics sent to N8N");
      } catch (abandonmentN8NError) {
        console.error("Failed to send abandonment analytics to N8N:", abandonmentN8NError);
      }
    }

    // 5. Perform database cleanup
    console.log("Performing database maintenance...");
    
    try {
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('perform_database_cleanup');

      if (cleanupError) {
        console.error('Database cleanup error:', cleanupError);
      } else {
        console.log(`Database cleanup completed. Processed ${cleanupResult} records.`);
      }
    } catch (cleanupErr) {
      console.error('Database cleanup failed:', cleanupErr);
    }

    // 6. Clean up expired temporary submissions
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error: cleanupError } = await supabase
      .from('temporary_submissions')
      .delete()
      .lt('expires_at', sevenDaysAgo)
      .is('converted_to_user_id', null);

    if (cleanupError) {
      console.error('Error cleaning up expired submissions:', cleanupError);
    } else {
      console.log('Cleaned up expired temporary submissions');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Automation tasks completed successfully",
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in automation processor:", error);
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);