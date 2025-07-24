import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalculatorEventRequest {
  eventType: string;
  tempId: string;
  stepData?: any;
  calculatedResults?: any;
}

Deno.serve(async (req) => {
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
    const { eventType, tempId, stepData, calculatedResults }: CalculatorEventRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log(`Processing calculator event: ${eventType} for tempId: ${tempId}`);
    
    // Route different calculator events to appropriate N8N workflows
    switch (eventType) {
      case 'step_completed':
        await triggerStepCompletionWorkflow(tempId, stepData, supabaseClient);
        break;
        
      case 'calculator_completed':
        await triggerCalculatorCompletionWorkflow(tempId, calculatedResults, supabaseClient);
        break;
        
      case 'user_registered':
        await triggerUserRegistrationWorkflow(tempId, stepData, supabaseClient);
        break;
        
      case 'abandonment_detected':
        await triggerAbandonmentWorkflow(tempId, stepData, supabaseClient);
        break;
        
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Calculator event trigger failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions for triggering N8N workflows
async function triggerStepCompletionWorkflow(tempId: string, stepData: any, supabaseClient: any) {
  const triggerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-n8n-workflow`;
  
  try {
    await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        workflowType: 'email-automation',
        data: {
          trigger_type: 'step_completed',
          temp_id: tempId,
          step_number: stepData.stepNumber,
          email: stepData.email,
          company_name: stepData.companyName,
          industry: stepData.industry,
          progress_percentage: (stepData.stepNumber / 4) * 100,
          utm_data: stepData.utmData
        }
      })
    });
    
    console.log(`Step completion workflow triggered for tempId: ${tempId}, step: ${stepData.stepNumber}`);
  } catch (error) {
    console.error('Failed to trigger step completion workflow:', error);
  }
}

async function triggerCalculatorCompletionWorkflow(tempId: string, results: any, supabaseClient: any) {
  const triggerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-n8n-workflow`;
  
  try {
    const isHighValue = results.recoveryPotential > 100000000;
    
    await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        workflowType: isHighValue ? 'high-value-alert' : 'email-automation',
        data: {
          trigger_type: 'calculator_completed',
          temp_id: tempId,
          total_revenue_leak: results.totalRevenueLeak,
          recovery_potential: results.recoveryPotential,
          lead_score: results.leadScore,
          is_high_value: isHighValue
        }
      })
    });
    
    console.log(`Calculator completion workflow triggered for tempId: ${tempId}, high value: ${isHighValue}`);
  } catch (error) {
    console.error('Failed to trigger calculator completion workflow:', error);
  }
}

async function triggerUserRegistrationWorkflow(tempId: string, stepData: any, supabaseClient: any) {
  const triggerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-n8n-workflow`;
  
  try {
    await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        workflowType: 'crm-integration',
        data: {
          trigger_type: 'user_registered',
          temp_id: tempId,
          user_data: stepData
        }
      })
    });
    
    console.log(`User registration workflow triggered for tempId: ${tempId}`);
  } catch (error) {
    console.error('Failed to trigger user registration workflow:', error);
  }
}

async function triggerAbandonmentWorkflow(tempId: string, stepData: any, supabaseClient: any) {
  const triggerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/trigger-n8n-workflow`;
  
  try {
    await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        workflowType: 'abandonment-recovery',
        data: {
          trigger_type: 'abandonment_detected',
          temp_id: tempId,
          abandonment_data: stepData
        }
      })
    });
    
    console.log(`Abandonment recovery workflow triggered for tempId: ${tempId}`);
  } catch (error) {
    console.error('Failed to trigger abandonment workflow:', error);
  }
}