import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get('email');
  const tempId = url.searchParams.get('temp_id');
  const reason = url.searchParams.get('reason') || 'user_request';

  if (!email) {
    return new Response('Email parameter required', { status: 400 });
  }

  try {
    // Add unsubscribe record
    await supabase.rpc('add_email_unsubscribe', {
      email_address: email,
      unsubscribe_reason: reason,
      submission_temp_id: tempId || null
    });

    // Return unsubscribe confirmation page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed Successfully</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .success { color: #059669; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="success">✓ Unsubscribed Successfully</h1>
          <p>You have been unsubscribed from all Revenue Calculator emails.</p>
          <p>Email: <strong>${email}</strong></p>
          <p>If this was a mistake, you can re-subscribe by using our calculator again.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Thank you for using Revenue Calculator.
          </p>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html',
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribe Error</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .error { color: #dc2626; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1 class="error">Unsubscribe Error</h1>
          <p>Sorry, there was an error processing your unsubscribe request.</p>
          <p>Please try again or contact support.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(errorHtml, {
      status: 500,
      headers: { 
        'Content-Type': 'text/html',
        ...corsHeaders 
      },
    });
  }
};

serve(handler);