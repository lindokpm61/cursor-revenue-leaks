import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'abandonment' | 'results' | 'custom';
  to: string;
  data?: Record<string, any>;
  template?: string;
  subject?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data = {}, template, subject }: EmailRequest = await req.json();

    let emailContent: any = {};

    switch (type) {
      case 'welcome':
        emailContent = {
          from: "Revenue Calculator <onboarding@resend.dev>",
          to: [to],
          subject: subject || "Welcome to Revenue Calculator",
          html: generateWelcomeEmail(data),
        };
        break;

      case 'abandonment':
        emailContent = {
          from: "Revenue Calculator <analysis@resend.dev>",
          to: [to],
          subject: subject || "Complete Your Revenue Analysis",
          html: generateAbandonmentEmail(data),
        };
        break;

      case 'results':
        emailContent = {
          from: "Revenue Calculator <results@resend.dev>",
          to: [to],
          subject: subject || "Your Revenue Analysis Results",
          html: generateResultsEmail(data),
        };
        break;

      case 'custom':
        if (!template || !subject) {
          throw new Error('Custom emails require template and subject');
        }
        emailContent = {
          from: "Revenue Calculator <noreply@resend.dev>",
          to: [to],
          subject,
          html: template,
        };
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send(emailContent);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateWelcomeEmail(data: any): string {
  const { userName = 'there', companyName = 'your company' } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Revenue Calculator</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1e293b; margin-bottom: 16px; }
        .content p { color: #64748b; line-height: 1.6; margin-bottom: 16px; }
        .cta { background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Revenue Calculator</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName}! 👋</h2>
          <p>Welcome to Revenue Calculator! We're excited to help you identify and quantify revenue leaks at ${companyName}.</p>
          
          <p>Here's what you can do now:</p>
          <ul>
            <li>🔍 Run unlimited revenue assessments</li>
            <li>📊 Track your optimization progress</li>
            <li>📈 Access industry benchmarking</li>
            <li>🎯 Get personalized action plans</li>
          </ul>
          
          <p>Ready to discover your hidden revenue potential?</p>
          
          <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/calculator" class="cta">Start Your Analysis</a>
          
          <p>If you have any questions, just reply to this email. We're here to help!</p>
          
          <p>Best regards,<br>The Revenue Calculator Team</p>
        </div>
        <div class="footer">
          <p>You received this email because you signed up for Revenue Calculator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAbandonmentEmail(data: any): string {
  const { userName = 'there', recoveryPotential = 0, currentStep = 1 } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Complete Your Revenue Analysis</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1e293b; margin-bottom: 16px; }
        .content p { color: #64748b; line-height: 1.6; margin-bottom: 16px; }
        .highlight { background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .cta { background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Don't Miss Out on Hidden Revenue</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>You started analyzing your revenue leaks but haven't finished yet. You're ${Math.round((currentStep / 4) * 100)}% complete!</p>
          
          ${recoveryPotential > 0 ? `
          <div class="highlight">
            <strong>💰 Potential Found: $${recoveryPotential.toLocaleString()}</strong><br>
            Based on your partial input, we've already identified significant revenue recovery potential. Complete your analysis to see the full picture!
          </div>
          ` : ''}
          
          <p>Most SaaS companies lose 15-30% of potential revenue through preventable leaks. Don't let yours be one of them.</p>
          
          <p><strong>It only takes 3 more minutes to:</strong></p>
          <ul>
            <li>🎯 Get your complete revenue leak assessment</li>
            <li>📊 See exactly where money is slipping away</li>
            <li>🛠️ Receive a personalized action plan</li>
            <li>📈 Compare against industry benchmarks</li>
          </ul>
          
          <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/calculator" class="cta">Complete My Analysis</a>
          
          <p>This analysis expires in 24 hours, so don't wait!</p>
          
          <p>Questions? Just reply to this email.</p>
          
          <p>Best,<br>The Revenue Calculator Team</p>
        </div>
        <div class="footer">
          <p>You received this because you started a revenue analysis. <a href="#">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateResultsEmail(data: any): string {
  const { userName = 'there', companyName = 'your company', totalLeak = 0, recoveryPotential = 0, resultUrl = '#' } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Revenue Analysis Results</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #10b981, #3b82f6); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 20px; }
        .content h2 { color: #1e293b; margin-bottom: 16px; }
        .content p { color: #64748b; line-height: 1.6; margin-bottom: 16px; }
        .results { background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
        .result-item { display: flex; justify-content: space-between; margin: 10px 0; }
        .cta { background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Revenue Analysis Complete</h1>
        </div>
        <div class="content">
          <h2>Hi ${userName},</h2>
          <p>Here are your revenue analysis results for ${companyName}:</p>
          
          <div class="results">
            <h3>📊 Key Findings:</h3>
            <div class="result-item">
              <span><strong>Revenue Leak Identified:</strong></span>
              <span><strong>$${totalLeak.toLocaleString()}</strong></span>
            </div>
            <div class="result-item">
              <span><strong>Recovery Potential:</strong></span>
              <span><strong>$${recoveryPotential.toLocaleString()}</strong></span>
            </div>
            <div class="result-item">
              <span><strong>Potential ROI:</strong></span>
              <span><strong>${totalLeak > 0 ? Math.round((recoveryPotential / totalLeak) * 100) : 0}%</strong></span>
            </div>
          </div>
          
          <p>Your personalized action plan is ready, including:</p>
          <ul>
            <li>🎯 Priority areas for immediate improvement</li>
            <li>📈 Step-by-step implementation guide</li>
            <li>⏱️ Expected timeline for results</li>
            <li>📊 Industry benchmarking comparison</li>
          </ul>
          
          <a href="${resultUrl}" class="cta">View Full Results & Action Plan</a>
          
          <p>Want to discuss these results? Book a free consultation with our revenue optimization experts.</p>
          
          <p>Best regards,<br>The Revenue Calculator Team</p>
        </div>
        <div class="footer">
          <p>Keep this email for your records. <a href="${resultUrl}">View online</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);