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
    // Map workflow types to integration types for monitoring
    const integrationTypeMap: Record<string, string> = {
      'email-automation': 'smartlead',
      'crm-integration': 'twenty_crm',
      'lead-qualification': 'n8n',
      'high-value-alert': 'n8n',
      'abandonment-recovery': 'smartlead',
      'analytics-reporting': 'n8n',
      'results-calculated': 'n8n'
    };

    const integrationType = integrationTypeMap[workflow_type] || 'n8n';

    // Create entries in both tables for backward compatibility and monitoring
    const logEntry: any = {
      workflow_type,
      data_sent: data,
      status,
      created_at: new Date().toISOString()
    };

    const integrationLogEntry: any = {
      integration_type: integrationType,
      status,
      response_data: null,
      retry_count: 0,
      created_at: new Date().toISOString()
    };

    if (status === 'failed' && error) {
      logEntry.error = error;
      integrationLogEntry.error_message = error;
    } else if (status === 'success' && result) {
      logEntry.n8n_execution_id = result.executionId || result.execution_id;
      logEntry.results = result;
      integrationLogEntry.response_data = result;
    }

    // Extract submission_id from data if available
    if (data.temp_id) {
      // Try to find submission_id from temp_id
      const { data: tempSubmission } = await supabaseClient
        .from('temporary_submissions')
        .select('converted_to_user_id')
        .eq('temp_id', data.temp_id)
        .single();

      if (tempSubmission?.converted_to_user_id) {
        // Find the actual submission
        const { data: submission } = await supabaseClient
          .from('submissions')
          .select('id')
          .eq('user_id', tempSubmission.converted_to_user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (submission) {
          integrationLogEntry.submission_id = submission.id;
        }
      }
    }

    // Log to both tables
    await Promise.all([
      supabaseClient.from('automation_logs').insert(logEntry),
      supabaseClient.from('integration_logs').insert(integrationLogEntry)
    ]);

    console.log(`Successfully logged ${status} to both automation_logs and integration_logs`);
  } catch (dbError) {
    console.error(`Failed to log ${status} to database:`, dbError);
    // Fallback: try to log just to automation_logs
    try {
      const fallbackEntry = {
        workflow_type,
        data_sent: data,
        status,
        error: error || dbError.message,
        created_at: new Date().toISOString()
      };
      await supabaseClient.from('automation_logs').insert(fallbackEntry);
    } catch (fallbackError) {
      console.error('Fallback logging also failed:', fallbackError);
    }
  }
};

export const isPlaceholderUrl = (url: string): boolean => {
  return url.includes('webhook.site');
};