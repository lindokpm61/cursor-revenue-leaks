import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    console.log("Testing email functionality...");

    // Check if RESEND_API_KEY is configured
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ 
        error: "RESEND_API_KEY is not configured",
        message: "Please configure the RESEND_API_KEY secret in Supabase"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Schedule a welcome email for the specific user
    const tempId = crypto.randomUUID();
    const scheduledTime = new Date();
    
    const { error: emailError } = await supabase
      .from('email_sequence_queue')
      .insert({
        temp_id: tempId,
        contact_email: 'keithantony6@gmail.com',
        sequence_type: 'welcome',
        scheduled_for: scheduledTime.toISOString(),
        contact_data: {
          userName: 'Keith',
          companyName: 'Your Company',
          userType: 'standard'
        },
        status: 'pending'
      });

    if (emailError) {
      console.error('Error scheduling test email:', emailError);
      throw emailError;
    }

    console.log('Test welcome email scheduled for keithantony6@gmail.com');

    // Trigger email queue processor
    const { data: processorResult, error: processorError } = await supabase.functions.invoke(
      'email-queue-processor',
      { body: {} }
    );

    if (processorError) {
      console.error('Error triggering email processor:', processorError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Test email scheduled and processor triggered",
      tempId,
      processorResult
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("Error in test email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);