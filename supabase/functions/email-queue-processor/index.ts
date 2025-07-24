import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting email queue processing...");

    // Get pending emails that are due to be sent
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_sequence_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50); // Process 50 emails at a time

    if (fetchError) {
      console.error("Error fetching pending emails:", fetchError);
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("No pending emails to process");
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing ${pendingEmails.length} pending emails`);

    const results = [];
    for (const email of pendingEmails) {
      try {
        // Check if email is unsubscribed
        const { data: isUnsubscribed } = await supabase
          .rpc('is_email_unsubscribed', { email_address: email.contact_email });

        if (isUnsubscribed) {
          await supabase
            .from('email_sequence_queue')
            .update({ 
              status: 'cancelled', 
              unsubscribed_at: new Date().toISOString(),
              error_message: 'Email address is unsubscribed'
            })
            .eq('id', email.id);
          
          results.push({ id: email.id, status: 'cancelled', reason: 'unsubscribed' });
          continue;
        }

        // Generate tracking URLs
        const trackingId = crypto.randomUUID();
        const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('//', '//') || '';
        const trackingPixel = `${baseUrl}/functions/v1/email-tracking?type=open&id=${trackingId}`;
        
        // Build email content based on sequence type
        const emailContent = buildEmailContent(email, trackingPixel, trackingId);

        // Send email using Resend
        const emailResponse = await resend.emails.send({
          from: "Revenue Calculator <onboarding@resend.dev>",
          to: [email.contact_email],
          subject: emailContent.subject,
          html: emailContent.html,
          headers: {
            'X-Tracking-ID': trackingId,
          },
        });

        if (emailResponse.error) {
          throw emailResponse.error;
        }

        // Update email status to sent
        await supabase
          .from('email_sequence_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id);

        results.push({ id: email.id, status: 'sent', messageId: emailResponse.data?.id });

      } catch (emailError) {
        console.error(`Error sending email ${email.id}:`, emailError);
        
        // Update retry count and status
        const newRetryCount = (email.retry_count || 0) + 1;
        const maxRetries = 3;
        
        if (newRetryCount >= maxRetries) {
          await supabase
            .from('email_sequence_queue')
            .update({ 
              status: 'failed', 
              error_message: emailError.message,
              retry_count: newRetryCount
            })
            .eq('id', email.id);
        } else {
          // Schedule retry for later
          const retryDate = new Date();
          retryDate.setMinutes(retryDate.getMinutes() + (newRetryCount * 15)); // Exponential backoff
          
          await supabase
            .from('email_sequence_queue')
            .update({ 
              retry_count: newRetryCount,
              scheduled_for: retryDate.toISOString(),
              error_message: emailError.message
            })
            .eq('id', email.id);
        }

        results.push({ id: email.id, status: 'retry', error: emailError.message });
      }
    }

    console.log(`Processed ${results.length} emails`);

    return new Response(JSON.stringify({ 
      processed: results.length,
      results 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Error in email queue processor:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function buildEmailContent(email: any, trackingPixel: string, trackingId: string) {
  const baseUrl = Deno.env.get("SUPABASE_URL")?.replace('//', '//') || '';
  const unsubscribeUrl = `${baseUrl}/functions/v1/email-unsubscribe?email=${encodeURIComponent(email.contact_email)}&temp_id=${email.temp_id}`;
  
  const contactData = email.contact_data || {};
  const companyName = contactData.companyName || 'your company';
  const userName = contactData.userName || 'there';

  switch (email.sequence_type) {
    case 'welcome':
      return {
        subject: `Welcome ${userName} - Your Revenue Leak Analysis`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to Revenue Calculator</h1>
            <p>Hi ${userName},</p>
            <p>Thank you for using our Revenue Leak Calculator for ${companyName}!</p>
            <p>We're analyzing revenue optimization opportunities specifically for your business model.</p>
            <p>You'll receive your detailed analysis shortly, including:</p>
            <ul>
              <li>Revenue leak identification</li>
              <li>Recovery potential calculations</li>
              <li>Implementation roadmap</li>
            </ul>
            <p>Best regards,<br>The Revenue Optimization Team</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> | 
              You're receiving this because you used our Revenue Calculator
            </p>
            <img src="${trackingPixel}" width="1" height="1" style="display: none;">
          </div>
        `
      };

    case 'abandonment_recovery':
      return {
        subject: `Complete Your Revenue Analysis - ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Don't Miss Your Revenue Opportunity</h1>
            <p>Hi ${userName},</p>
            <p>You started analyzing revenue leaks for ${companyName} but didn't complete the process.</p>
            <p>Your partial analysis shows significant potential - complete it now to see:</p>
            <ul>
              <li>Exact revenue recovery amounts</li>
              <li>Priority action items</li>
              <li>90-day implementation plan</li>
            </ul>
            <a href="${baseUrl}/calculator?temp_id=${email.temp_id}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Complete Your Analysis
            </a>
            <p>This analysis expires in 24 hours.</p>
            <p>Best regards,<br>The Revenue Optimization Team</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
            </p>
            <img src="${trackingPixel}" width="1" height="1" style="display: none;">
          </div>
        `
      };

    case 'results_delivery':
      return {
        subject: `Your Revenue Analysis Results - ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669;">Your Revenue Analysis is Ready</h1>
            <p>Hi ${userName},</p>
            <p>Your comprehensive revenue leak analysis for ${companyName} is complete!</p>
            <p>Key findings include:</p>
            <ul>
              <li>Total revenue leak identified</li>
              <li>Recovery potential breakdown</li>
              <li>Strategic implementation roadmap</li>
            </ul>
            <a href="${baseUrl}/results?temp_id=${email.temp_id}" 
               style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              View Your Results
            </a>
            <p>Questions? Reply to this email or schedule a consultation.</p>
            <p>Best regards,<br>The Revenue Optimization Team</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
            </p>
            <img src="${trackingPixel}" width="1" height="1" style="display: none;">
          </div>
        `
      };

    default:
      return {
        subject: `Update from Revenue Calculator`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hi ${userName},</p>
            <p>Thank you for using Revenue Calculator.</p>
            <p>Best regards,<br>The Revenue Optimization Team</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
            </p>
            <img src="${trackingPixel}" width="1" height="1" style="display: none;">
          </div>
        `
      };
  }
}

serve(handler);