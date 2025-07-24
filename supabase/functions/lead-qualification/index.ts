import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadQualificationRequest {
  tempId?: string;
  email?: string;
  leadScore?: number;
  eventType: 'high_value_lead_detected' | 'consultant_detected' | 'enterprise_detected' | 'manual_qualification';
  qualificationData?: any;
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

    const { tempId, email, leadScore, eventType, qualificationData }: LeadQualificationRequest = await req.json();

    console.log(`Processing lead qualification: ${eventType} for tempId: ${tempId}`);

    let tempSubmission = null;
    
    // Get temporary submission data if tempId provided
    if (tempId) {
      const { data } = await supabase
        .from('temporary_submissions')
        .select('*')
        .eq('temp_id', tempId)
        .single();
      tempSubmission = data;
    }

    let qualification = {
      qualified: false,
      qualification_type: 'standard',
      priority_score: leadScore || 0,
      qualification_reason: '',
      recommended_actions: [] as string[]
    };

    switch (eventType) {
      case 'high_value_lead_detected':
        qualification = await qualifyHighValueLead(tempSubmission, leadScore);
        break;
        
      case 'consultant_detected':
        qualification = await qualifyConsultantLead(tempSubmission, email);
        break;
        
      case 'enterprise_detected':
        qualification = await qualifyEnterpriseLead(tempSubmission);
        break;
        
      case 'manual_qualification':
        qualification = qualificationData || qualification;
        break;
    }

    // Update temporary submission with qualification data
    if (tempId) {
      await supabase
        .from('temporary_submissions')
        .update({
          user_classification: qualification.qualification_type,
          special_handling: qualification.qualified,
          lead_score: Math.max(qualification.priority_score, leadScore || 0),
          last_activity_at: new Date().toISOString()
        })
        .eq('temp_id', tempId);
    }

    // Log qualification event
    await supabase.from('analytics_events').insert({
      event_type: `lead_qualified_${eventType}`,
      properties: {
        temp_id: tempId,
        email,
        qualification,
        original_lead_score: leadScore,
        qualified: qualification.qualified
      },
      created_at: new Date().toISOString()
    });

    // Trigger appropriate workflows based on qualification
    if (qualification.qualified) {
      await triggerQualifiedLeadWorkflows(supabase, tempId, email, qualification, tempSubmission);
    }

    console.log(`Lead qualification completed for ${tempId}: ${qualification.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}`);

    return new Response(
      JSON.stringify({
        success: true,
        qualified: qualification.qualified,
        qualification,
        tempId,
        eventType
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in lead-qualification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function qualifyHighValueLead(tempSubmission: any, leadScore?: number) {
  const score = leadScore || tempSubmission?.lead_score || 0;
  const arr = tempSubmission?.calculator_data?.companyInfo?.currentARR || 0;
  const recoveryPotential = tempSubmission?.recovery_potential || 0;
  
  const qualified = score >= 70 || arr >= 1000000 || recoveryPotential >= 500000;
  
  return {
    qualified,
    qualification_type: qualified ? 'high_value' : 'standard',
    priority_score: Math.max(score, qualified ? 85 : score),
    qualification_reason: qualified 
      ? `High-value lead: Lead Score ${score}, ARR $${arr.toLocaleString()}, Recovery Potential $${recoveryPotential.toLocaleString()}`
      : 'Does not meet high-value criteria',
    recommended_actions: qualified 
      ? ['priority_follow_up', 'sales_team_notification', 'personalized_demo_offer']
      : ['standard_nurture_sequence']
  };
}

async function qualifyConsultantLead(tempSubmission: any, email?: string) {
  const emailDomain = email ? email.split('@')[1] : '';
  const consultantIndicators = [
    'consulting', 'advisory', 'partners', 'group', 'solutions', 'strategy'
  ];
  
  const isConsultantEmail = consultantIndicators.some(indicator => 
    emailDomain.toLowerCase().includes(indicator)
  );
  
  const multipleCompanies = tempSubmission?.calculator_interactions > 2;
  
  const qualified = isConsultantEmail || multipleCompanies;
  
  return {
    qualified,
    qualification_type: 'consultant',
    priority_score: qualified ? 90 : 60,
    qualification_reason: qualified 
      ? `Consultant detected: ${isConsultantEmail ? 'consultant email domain' : 'multiple company analyses'}`
      : 'No consultant indicators found',
    recommended_actions: qualified 
      ? ['consultant_partnership_outreach', 'multi_client_demo', 'white_label_discussion']
      : ['standard_nurture_sequence']
  };
}

async function qualifyEnterpriseLead(tempSubmission: any) {
  const arr = tempSubmission?.calculator_data?.companyInfo?.currentARR || 0;
  const employees = tempSubmission?.calculator_data?.companyInfo?.employeeCount || 0;
  const isEnterprise = arr >= 10000000 || employees >= 500;
  
  return {
    qualified: isEnterprise,
    qualification_type: isEnterprise ? 'enterprise' : 'standard',
    priority_score: isEnterprise ? 95 : 70,
    qualification_reason: isEnterprise 
      ? `Enterprise lead: ARR $${arr.toLocaleString()}, ${employees} employees`
      : 'Does not meet enterprise criteria',
    recommended_actions: isEnterprise 
      ? ['enterprise_sales_team', 'custom_demo', 'executive_outreach', 'sla_priority']
      : ['standard_nurture_sequence']
  };
}

async function triggerQualifiedLeadWorkflows(
  supabase: any, 
  tempId?: string, 
  email?: string, 
  qualification?: any,
  tempSubmission?: any
) {
  try {
    // Trigger high-value alert workflow
    const n8nHighValueWebhook = Deno.env.get('N8N_HIGH_VALUE_ALERT_WEBHOOK');
    if (n8nHighValueWebhook) {
      await fetch(n8nHighValueWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempId,
          email,
          qualification,
          submissionData: tempSubmission,
          timestamp: new Date().toISOString()
        })
      });
    }

    // Schedule priority follow-up email
    if (email && qualification.recommended_actions.includes('priority_follow_up')) {
      await supabase.from('email_sequence_queue').insert({
        temp_id: tempId,
        contact_email: email,
        sequence_type: 'qualified_lead_priority',
        scheduled_for: new Date().toISOString(), // Immediate
        contact_data: {
          qualification,
          priority: true,
          sequence_step: 1
        },
        status: 'pending'
      });
    }

    // Trigger CRM integration for qualified leads
    await supabase.functions.invoke('crm-integration', {
      body: {
        action: 'create_qualified_lead',
        tempId,
        email,
        qualification,
        priority: true
      }
    });

    console.log(`Qualified lead workflows triggered for ${tempId}`);
  } catch (error) {
    console.error('Error triggering qualified lead workflows:', error);
  }
}