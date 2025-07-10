import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { N8NWebhookResult, WebhookPayload } from './types.ts';

export const createSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

export const createWebhookPayload = (workflow_type: string, data: any): WebhookPayload => ({
  workflow_type,
  trigger_data: data,
  metadata: {
    triggered_from: "supabase_edge_function",
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID()
  }
});

export const parseN8NResponse = async (response: Response): Promise<N8NWebhookResult> => {
  try {
    return await response.json();
  } catch (error) {
    // If N8N doesn't return JSON, create a mock response
    return {
      status: response.ok ? "success" : "error",
      execution_id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      statusCode: response.status
    };
  }
};

export const logToDatabase = async (
  supabaseClient: any,
  workflow_type: string,
  data: any,
  status: 'success' | 'failed',
  error?: string,
  result?: N8NWebhookResult
) => {
  try {
    const logEntry: any = {
      workflow_type,
      data_sent: data,
      status,
      created_at: new Date().toISOString()
    };

    if (status === 'failed' && error) {
      logEntry.error = error;
    } else if (status === 'success' && result) {
      logEntry.n8n_execution_id = result.executionId || result.execution_id;
      logEntry.results = result;
    }

    await supabaseClient
      .from('automation_logs')
      .insert(logEntry);
  } catch (dbError) {
    console.error(`Failed to log ${status} to database:`, dbError);
  }
};

export const isPlaceholderUrl = (url: string): boolean => {
  return url.includes('webhook.site');
};