import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const trackingType = url.searchParams.get('type');
  const trackingId = url.searchParams.get('id');
  const redirectUrl = url.searchParams.get('redirect');

  try {
    if (trackingType === 'open' && trackingId) {
      // Track email open
      await supabase
        .from('email_sequence_queue')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', trackingId);

      // Return 1x1 transparent pixel
      const pixel = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
        0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x21, 0xF9, 0x04, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x04, 0x01, 0x00, 0x3B
      ]);

      return new Response(pixel, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    }

    if (trackingType === 'click' && trackingId) {
      // Track email click
      await supabase
        .from('email_sequence_queue')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', trackingId);

      // Redirect to the intended URL
      if (redirectUrl) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': decodeURIComponent(redirectUrl) },
        });
      }
    }

    return new Response('Invalid tracking request', { status: 400 });

  } catch (error) {
    console.error('Email tracking error:', error);
    return new Response('Tracking error', { status: 500 });
  }
};

serve(handler);