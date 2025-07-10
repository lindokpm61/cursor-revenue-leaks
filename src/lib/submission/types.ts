// Type definitions for temporary submissions and email sequences

export interface TemporarySubmissionData {
  temp_id: string;
  session_id?: string;
  email?: string;
  company_name?: string;
  industry?: string;
  current_step: number;
  steps_completed: number;
  completion_percentage: number;
  calculator_data: Record<string, any>;
  total_revenue_leak?: number;
  recovery_potential?: number;
  lead_score?: number;
  email_sequences_triggered?: string[];
  last_email_sent_at?: string;
  last_activity_at?: string;
  email_engagement_score?: number;
  twenty_crm_contact_id?: string;
  smartlead_campaign_ids?: string[];
  n8n_workflow_status?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  page_views?: number;
  time_spent_seconds?: number;
  return_visits?: number;
  calculator_interactions?: number;
}

export interface EmailSequenceData {
  temp_id: string;
  sequence_type: string;
  scheduled_for: string;
  contact_email: string;
  contact_data?: Record<string, any>;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  n8n_execution_id?: string;
}