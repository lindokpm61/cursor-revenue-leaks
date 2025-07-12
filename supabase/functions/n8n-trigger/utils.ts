import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { N8NWebhookResult, WebhookPayload } from './types.ts';

export const createSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

export const createWebhookPayload = (workflow_type: string, data: any): WebhookPayload => {
  // Ensure required fields are present for different workflow types
  const basePayload = {
    workflow_type,
    timestamp: new Date().toISOString(),
    environment: Deno.env.get('ENVIRONMENT') || 'production',
    triggered_from: "supabase_edge_function",
    request_id: crypto.randomUUID()
  };

  // Add data validation for specific workflow types
  if (workflow_type === 'submission-completed' && data) {
    return {
      ...basePayload,
      submission_id: data.id || data.submission_id,
      user_id: data.user_id,
      company_name: data.company_name,
      email: data.email || data.contact_email,
      industry: data.industry,
      lead_score: Number(data.lead_score) || 0,
      total_leak: Number(data.calculations?.totalLeakage || data.total_leak) || 0,
      recovery_potential: Number(data.calculations?.potentialRecovery70 || data.recovery_potential_70) || 0,
      current_arr: Number(data.current_arr) || 0,
      monthly_leads: Number(data.monthly_leads) || 0,
      trigger_data: {
        ...data,
        // Ensure all numeric fields are properly typed
        lead_score: Number(data.lead_score) || 0,
        total_leak: Number(data.calculations?.totalLeakage || data.total_leak) || 0,
        recovery_potential_70: Number(data.calculations?.potentialRecovery70 || data.recovery_potential_70) || 0,
        current_arr: Number(data.current_arr) || 0,
        monthly_leads: Number(data.monthly_leads) || 0
      }
    };
  }

  return {
    ...basePayload,
    trigger_data: data
  };
};

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