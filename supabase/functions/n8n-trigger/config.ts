export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const getN8NWebhooks = () => ({
  // Core workflow types
  'email-automation': Deno.env.get('N8N_EMAIL_AUTOMATION_WEBHOOK') || 'https://webhook.site/placeholder-email-automation',
  'crm-integration': Deno.env.get('N8N_CRM_INTEGRATION_WEBHOOK') || 'https://webhook.site/placeholder-crm-integration',
  'lead-qualification': Deno.env.get('N8N_LEAD_QUALIFICATION_WEBHOOK') || 'https://webhook.site/placeholder-lead-qualification',
  'high-value-alert': Deno.env.get('N8N_HIGH_VALUE_ALERT_WEBHOOK') || 'https://webhook.site/placeholder-high-value-alert',
  'abandonment-recovery': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK') || 'https://webhook.site/placeholder-abandonment-recovery',
  'analytics-reporting': Deno.env.get('N8N_ANALYTICS_REPORTING_WEBHOOK') || 'https://webhook.site/placeholder-analytics-reporting',
  
  // Results and calculation workflows
  'results-calculated': Deno.env.get('N8N_ANALYTICS_REPORTING_WEBHOOK') || 'https://webhook.site/placeholder-results-calculated',
  'submission-completed': Deno.env.get('N8N_CRM_INTEGRATION_WEBHOOK') || 'https://webhook.site/placeholder-submission-completed',
  
  // Email sequence workflows
  'abandoned-step-1': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK') || 'https://webhook.site/placeholder-abandoned-step-1',
  'abandoned-step-2': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK') || 'https://webhook.site/placeholder-abandoned-step-2',
  'abandoned-step-3': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK') || 'https://webhook.site/placeholder-abandoned-step-3',
  'abandoned-step-4': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK') || 'https://webhook.site/placeholder-abandoned-step-4',
  'incomplete-calculator': Deno.env.get('N8N_ABANDONMENT_RECOVERY_WEBHOOK') || 'https://webhook.site/placeholder-incomplete-calculator',
  
  // Lead nurturing workflows
  'welcome-sequence': Deno.env.get('N8N_EMAIL_AUTOMATION_WEBHOOK') || 'https://webhook.site/placeholder-welcome-sequence',
  'follow-up-sequence': Deno.env.get('N8N_EMAIL_AUTOMATION_WEBHOOK') || 'https://webhook.site/placeholder-follow-up-sequence',
  
  // Maintenance and cleanup workflows
  'system-maintenance': Deno.env.get('N8N_ANALYTICS_REPORTING_WEBHOOK') || 'https://webhook.site/placeholder-system-maintenance',
  'data-cleanup': Deno.env.get('N8N_ANALYTICS_REPORTING_WEBHOOK') || 'https://webhook.site/placeholder-data-cleanup'
});

export const createN8NHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Source": "revenue-calculator"
  };

  const n8nApiKey = Deno.env.get('N8N_API_KEY');
  const webhookApiKey = Deno.env.get('N8N_WEBHOOK_API_KEY');
  
  if (n8nApiKey) {
    headers["Authorization"] = `Bearer ${n8nApiKey}`;
  }
  if (webhookApiKey) {
    headers["X-Webhook-Key"] = webhookApiKey;
  }

  return headers;
};