import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface N8NTriggerRequest {
  workflow_type: string;
  data: {
    temp_id?: string;
    sequence_type?: string;
    contact_email?: string;
    company_name?: string;
    recovery_potential?: number;
    calculator_step?: number;
    lead_score?: number;
    industry?: string;
    current_arr?: number;
    utm_data?: {
      source?: string;
      medium?: string;
      campaign?: string;
    };
    timestamp: string;
    source: string;
    report_type?: string;
    period?: string;
    summary?: any;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const { workflow_type, data }: N8NTriggerRequest = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // N8N webhook URLs from environment variables
    const N8N_WEBHOOKS = {
      'email-automation': Deno.env.get('N8N_EMAIL_AUTOMATION_WEBHOOK'),
      'crm-integration': Deno.env.get('N8N_CRM_INTEGRATION_WEBHOOK'),
      'lead-qualification': Deno.env.get('N8N_LEAD_QUALIFICATION_WEBHOOK'),
      'high-value-alert': Deno.env.get('N8N_HIGH_VALUE_ALERT_WEBHOOK'),
      'abandonment-recovery': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK'),
      'analytics-reporting': Deno.env.get('N8N_ANALYTICS_REPORTING_WEBHOOK') || 'https://placeholder-n8n.com/webhook/analytics-reporting'
    };
    
    const n8nWebhookUrl = N8N_WEBHOOKS[workflow_type];
    if (!n8nWebhookUrl) {
      console.error(`Unknown workflow type: ${workflow_type}`);
      return new Response(
        JSON.stringify({
          error: `Unknown workflow type: ${workflow_type}`,
          available_types: Object.keys(N8N_WEBHOOKS)
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log(`Triggering N8N workflow: ${workflow_type} at ${n8nWebhookUrl}`);

    // Prepare N8N webhook payload
    const webhookPayload = {
      workflow_type,
      trigger_data: data,
      metadata: {
        triggered_from: "supabase_edge_function",
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID()
      }
    };

    // Prepare headers for N8N request
    const n8nHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Source": "revenue-calculator"
    };

    // Add authentication if available
    const n8nApiKey = Deno.env.get('N8N_API_KEY');
    const webhookApiKey = Deno.env.get('N8N_WEBHOOK_API_KEY');
    
    if (n8nApiKey) {
      n8nHeaders["Authorization"] = `Bearer ${n8nApiKey}`;
    }
    if (webhookApiKey) {
      n8nHeaders["X-Webhook-Key"] = webhookApiKey;
    }

    console.log(`Triggering N8N workflow: ${workflow_type}`, {
      url: n8nWebhookUrl,
      hasAuth: !!n8nApiKey
    });

    // Trigger N8N webhook with enhanced payload
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: n8nHeaders,
      body: JSON.stringify({
        ...data,
        workflow_type,
        timestamp: new Date().toISOString(),
        environment: Deno.env.get('ENVIRONMENT') || 'production'
      }),
    });

    let n8nResult;
    try {
      n8nResult = await n8nResponse.json();
    } catch (error) {
      // If N8N doesn't return JSON, create a mock response
      n8nResult = {
        status: n8nResponse.ok ? "success" : "error",
        execution_id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        statusCode: n8nResponse.status
      };
    }

    if (!n8nResponse.ok) {
      console.error("N8N webhook failed:", {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        url: n8nWebhookUrl,
        result: n8nResult
      });
      
      // Log failed trigger in database
      try {
        await supabaseClient
          .from('automation_logs')
          .insert({
            workflow_type: workflow_type,
            error: `N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`,
            status: 'failed',
            data_sent: data,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('Failed to log error to database:', dbError);
      }
      
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: `error sending request for url (${n8nWebhookUrl})`,
          execution_id: null
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("N8N workflow triggered successfully:", n8nResult);

    // Log successful trigger in database
    try {
      await supabaseClient
        .from('automation_logs')
        .insert({
          workflow_type: workflow_type,
          n8n_execution_id: n8nResult.executionId || n8nResult.execution_id,
          data_sent: data,
          status: 'success',
          results: n8nResult,
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.error('Failed to log success to database:', dbError);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        workflow_type,
        execution_id: n8nResult.execution_id || n8nResult.executionId || `exec_${Date.now()}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in N8N trigger function:", error);
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        execution_id: null
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);