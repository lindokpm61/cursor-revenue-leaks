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
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const tempId = url.searchParams.get('temp_id');
    const reason = url.searchParams.get('reason') || 'user_request';

    if (!email) {
      return new Response('Email parameter is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log(`Processing unsubscribe for: ${email}`);

    // Add to unsubscribe list using the database function
    const { error } = await supabase
      .rpc('add_email_unsubscribe', {
        email_address: email,
        unsubscribe_reason: reason,
        submission_temp_id: tempId
      });

    if (error) {
      console.error('Error processing unsubscribe:', error);
      throw error;
    }

    // Return a simple HTML page confirming unsubscribe
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Unsubscribed</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center; 
          }
          .success { color: #059669; }
          .container { background: #f9fafb; padding: 40px; border-radius: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✓ Unsubscribed Successfully</h1>
          <p>The email address <strong>${email}</strong> has been removed from our mailing list.</p>
          <p>You will no longer receive emails from Revenue Calculator.</p>
          <p>If you change your mind, you can always sign up again on our website.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error("Error in unsubscribe handler:", error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Error</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center; 
          }
          .error { color: #dc2626; }
          .container { background: #fef2f2; padding: 40px; border-radius: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Error Processing Request</h1>
          <p>We encountered an error while processing your unsubscribe request.</p>
          <p>Please try again later or contact support.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        "Content-Type": "text/html",
        ...corsHeaders
      }
    });
  }
};

serve(handler);