export interface N8NTriggerRequest {
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

export interface N8NWebhookResult {
  status?: string;
  execution_id?: string;
  executionId?: string;
  statusCode?: number;
}

export interface WebhookPayload {
  workflow_type: string;
  trigger_data: any;
  metadata: {
    triggered_from: string;
    timestamp: string;
    request_id: string;
  };
}