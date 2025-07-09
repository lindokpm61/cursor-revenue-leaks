import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface N8NTriggerRequest {
  workflow_type: string;
  data: {
    temp_id: string;
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
    
    // Get N8N webhook URL from environment
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    const n8nApiKey = Deno.env.get("N8N_API_KEY");
    
    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ 
          error: "N8N integration not configured",
          execution_id: null 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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
    };

    // Add API key if available
    if (n8nApiKey) {
      n8nHeaders["Authorization"] = `Bearer ${n8nApiKey}`;
    }

    console.log(`Triggering N8N workflow: ${workflow_type}`, {
      url: n8nWebhookUrl,
      payload: webhookPayload
    });

    // Trigger N8N webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: n8nHeaders,
      body: JSON.stringify(webhookPayload),
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
        result: n8nResult
      });
      
      return new Response(
        JSON.stringify({
          error: "N8N workflow execution failed",
          details: n8nResult,
          execution_id: n8nResult.execution_id || null
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("N8N workflow triggered successfully:", n8nResult);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        workflow_type,
        execution_id: n8nResult.execution_id || `exec_${Date.now()}`,
        n8n_response: n8nResult,
        triggered_at: new Date().toISOString()
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