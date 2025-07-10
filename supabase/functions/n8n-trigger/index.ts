import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, getN8NWebhooks, createN8NHeaders } from './config.ts';
import { 
  createSupabaseClient, 
  createWebhookPayload, 
  parseN8NResponse, 
  logToDatabase, 
  isPlaceholderUrl 
} from './utils.ts';
import type { N8NTriggerRequest } from './types.ts';

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
    const supabaseClient = createSupabaseClient();
    
    // Get N8N webhook URLs
    const N8N_WEBHOOKS = getN8NWebhooks();
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

    // Prepare N8N request
    const n8nHeaders = createN8NHeaders();
    const requestBody = {
      ...data,
      workflow_type,
      timestamp: new Date().toISOString(),
      environment: Deno.env.get('ENVIRONMENT') || 'production'
    };

    console.log(`Triggering N8N workflow: ${workflow_type}`, {
      url: n8nWebhookUrl,
      hasAuth: !!Deno.env.get('N8N_API_KEY')
    });

    // Trigger N8N webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: n8nHeaders,
      body: JSON.stringify(requestBody),
    });

    const n8nResult = await parseN8NResponse(n8nResponse);
    const isPlaceholder = isPlaceholderUrl(n8nWebhookUrl);
    
    if (!n8nResponse.ok && !isPlaceholder) {
      console.error("N8N webhook failed:", {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        url: n8nWebhookUrl,
        result: n8nResult
      });
      
      // Log failed trigger in database
      await logToDatabase(
        supabaseClient, 
        workflow_type, 
        data, 
        'failed', 
        `N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`
      );
      
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
    
    // For placeholder URLs, always log as successful
    if (isPlaceholder) {
      console.log("Placeholder webhook triggered successfully:", {
        url: n8nWebhookUrl,
        workflow_type,
        status: n8nResponse.status
      });
    }

    console.log("N8N workflow triggered successfully:", n8nResult);

    // Log successful trigger in database
    await logToDatabase(supabaseClient, workflow_type, data, 'success', undefined, n8nResult);

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