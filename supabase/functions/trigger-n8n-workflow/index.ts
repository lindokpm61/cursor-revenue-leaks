import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkflowTriggerRequest {
  workflowType: string;
  data: any;
}

interface N8NResponse {
  executionId?: string;
  success?: boolean;
  [key: string]: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { workflowType, data }: WorkflowTriggerRequest = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // N8N webhook URLs from environment variables
    const N8N_WEBHOOKS: Record<string, string | undefined> = {
      'email-automation': Deno.env.get('N8N_EMAIL_AUTOMATION_WEBHOOK'),
      'crm-integration': Deno.env.get('N8N_CRM_INTEGRATION_WEBHOOK'),
      'lead-qualification': Deno.env.get('N8N_LEAD_QUALIFICATION_WEBHOOK'),
      'high-value-alert': Deno.env.get('N8N_HIGH_VALUE_ALERT_WEBHOOK'),
      'abandonment-recovery': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK')
    };
    
    const webhookUrl = N8N_WEBHOOKS[workflowType];
    if (!webhookUrl) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }
    
    console.log(`Triggering N8N workflow: ${workflowType} at ${webhookUrl}`);
    
    // Send data to N8N
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('N8N_API_KEY')}`,
        'X-Source': 'revenue-calculator'
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        environment: Deno.env.get('ENVIRONMENT') || 'production'
      })
    });
    
    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }
    
    const result: N8NResponse = await n8nResponse.json();
    
    // Log successful trigger in database
    await supabaseClient
      .from('automation_logs')
      .insert({
        workflow_type: workflowType,
        n8n_execution_id: result.executionId,
        data_sent: data,
        status: 'success',
        results: result,
        created_at: new Date().toISOString()
      });
    
    console.log(`N8N workflow triggered successfully: ${workflowType}, execution: ${result.executionId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        executionId: result.executionId,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('N8N trigger failed:', error);
    
    // Log failed trigger
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('automation_logs')
        .insert({
          workflow_type: (await req.json())?.workflowType || 'unknown',
          error: error.message,
          status: 'failed',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});