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
    const eventType = url.searchParams.get('type') || 'unknown';
    const trackingId = url.searchParams.get('id');
    const tempId = url.searchParams.get('temp_id');

    if (!trackingId) {
      console.log('No tracking ID provided');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    console.log(`Email tracking event: ${eventType} for tracking ID: ${trackingId}`);

    // Log the engagement event
    if (tempId) {
      const { error: engagementError } = await supabase
        .from('email_engagement_events')
        .insert({
          temp_id: tempId,
          event_type: eventType,
          engagement_score_delta: getEngagementScoreDelta(eventType),
          event_data: {
            tracking_id: trackingId,
            timestamp: new Date().toISOString(),
            user_agent: req.headers.get('user-agent'),
            ip_address: req.headers.get('x-forwarded-for') || 'unknown'
          }
        });

      if (engagementError) {
        console.error('Error logging engagement event:', engagementError);
      }
    }

    // For email opens, return a 1x1 transparent pixel
    if (eventType === 'open') {
      const pixel = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x04, 0x01, 0x00, 0x3B
      ]);

      return new Response(pixel, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Expires": "0",
          ...corsHeaders
        }
      });
    }

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("Error in email tracking:", error);
    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });
  }
};

function getEngagementScoreDelta(eventType: string): number {
  switch (eventType) {
    case 'open': return 5;
    case 'click': return 15;
    case 'convert': return 50;
    default: return 0;
  }
}

serve(handler);