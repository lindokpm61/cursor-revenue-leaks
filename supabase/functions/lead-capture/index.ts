import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadCaptureRequest {
  tempId: string;
  email?: string;
  phone?: string;
  companyName?: string;
  eventType: 'email_capture' | 'phone_capture' | 'company_capture' | 'lead_qualification';
  calculatorData?: any;
  utmData?: any;
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

    const { tempId, email, phone, companyName, eventType, calculatorData, utmData }: LeadCaptureRequest = await req.json();

    if (!tempId) {
      return new Response(
        JSON.stringify({ error: 'temp_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing lead capture: ${eventType} for tempId: ${tempId}`);

    // Update temporary submission with captured data
    const updateData: any = {
      last_activity_at: new Date().toISOString(),
    };

    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (companyName) updateData.company_name = companyName;
    if (calculatorData) updateData.calculator_data = calculatorData;

    // Add UTM data to attribution_data
    if (utmData) {
      updateData.attribution_data = utmData;
    }

    // Calculate lead score based on captured information
    let leadScore = 0;
    if (email) leadScore += 25;
    if (phone) leadScore += 20;
    if (companyName) leadScore += 15;
    if (calculatorData?.companyInfo?.currentARR) {
      const arr = calculatorData.companyInfo.currentARR;
      if (arr > 10000000) leadScore += 40; // $10M+ ARR
      else if (arr > 1000000) leadScore += 30; // $1M+ ARR
      else if (arr > 100000) leadScore += 20; // $100K+ ARR
      else leadScore += 10;
    }

    updateData.lead_score = Math.min(leadScore, 100);

    // Update temporary submission
    const { data: tempSubmission, error: updateError } = await supabase
      .from('temporary_submissions')
      .update(updateData)
      .eq('temp_id', tempId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating temporary submission:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update submission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event_type: `lead_${eventType}`,
      properties: {
        temp_id: tempId,
        email,
        phone,
        company_name: companyName,
        lead_score: updateData.lead_score,
        utm_data: utmData
      },
      created_at: new Date().toISOString()
    });

    // Trigger email sequence if email was captured
    if (email && eventType === 'email_capture') {
      try {
        await supabase.functions.invoke('email-automation', {
          body: {
            action: 'schedule_welcome_sequence',
            tempId,
            email,
            leadScore: updateData.lead_score,
            companyName
          }
        });
      } catch (emailError) {
        console.error('Error triggering email sequence:', emailError);
        // Don't fail the main request if email automation fails
      }
    }

    // Trigger lead qualification workflow for high-value leads
    if (updateData.lead_score >= 70) {
      try {
        await supabase.functions.invoke('lead-qualification', {
          body: {
            tempId,
            email,
            leadScore: updateData.lead_score,
            eventType: 'high_value_lead_detected'
          }
        });
      } catch (qualificationError) {
        console.error('Error triggering lead qualification:', qualificationError);
        // Don't fail the main request
      }
    }

    console.log(`Lead capture completed for ${tempId}, lead score: ${updateData.lead_score}`);

    return new Response(
      JSON.stringify({
        success: true,
        leadScore: updateData.lead_score,
        tempId,
        message: `Lead ${eventType} captured successfully`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in lead-capture function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});