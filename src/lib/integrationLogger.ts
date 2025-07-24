// Unified integration logging service

import { supabase } from "@/integrations/supabase/client";

export interface IntegrationLogData {
  submission_id?: string;
  integration_type: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  response_data?: any;
  error_message?: string;
  retry_count?: number;
}

export interface AnalyticsEventData {
  event_type: string;
  user_id?: string;
  submission_id?: string;
  properties?: any;
}

class IntegrationLogger {
  // Log integration activities
  async logIntegration(data: IntegrationLogData): Promise<void> {
    try {
      // Integration logs table doesn't exist in current schema - logging to console for now
      console.log('Integration log would be saved:', { ...data, created_at: new Date().toISOString() });
      // TODO: Implement when integration_logs table is added
    } catch (err) {
      console.error('Exception in logIntegration:', err);
    }
  }

  // Log analytics events
  async logAnalytics(data: AnalyticsEventData): Promise<void> {
    try {
      // Analytics events table doesn't exist in current schema - logging to console for now
      console.log('Analytics event would be saved:', { ...data, created_at: new Date().toISOString() });
      // TODO: Implement when analytics_events table is added
    } catch (err) {
      console.error('Exception in logAnalytics:', err);
    }
  }

  // Log N8N workflow triggers
  async logN8NTrigger(
    workflowType: string, 
    data: any, 
    status: 'success' | 'failed',
    error?: string,
    executionId?: string
  ): Promise<void> {
    try {
      // Automation logs table doesn't exist in current schema - logging to console for now
      console.log('N8N trigger would be logged:', {
        workflow_type: workflowType,
        data_sent: data,
        status,
        error: error || null,
        n8n_execution_id: executionId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      // TODO: Implement when automation_logs table is added
    } catch (err) {
      console.error('Exception in logN8NTrigger:', err);
    }
  }

  // Log calculator progress with error handling
  async logCalculatorProgress(
    tempId: string,
    step: number,
    data: any,
    calculations?: any
  ): Promise<void> {
    try {
      await this.logAnalytics({
        event_type: 'calculator_step_completed',
        properties: {
          temp_id: tempId,
          step,
          data,
          calculations,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Exception in logCalculatorProgress:', err);
    }
  }

  // Log email sequence events
  async logEmailSequence(
    tempId: string,
    sequenceType: string,
    action: 'scheduled' | 'sent' | 'cancelled' | 'failed',
    details?: any
  ): Promise<void> {
    try {
      await this.logAnalytics({
        event_type: 'email_sequence_action',
        properties: {
          temp_id: tempId,
          sequence_type: sequenceType,
          action,
          details,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Exception in logEmailSequence:', err);
    }
  }

  // Log user conversion events
  async logUserConversion(
    tempId: string,
    userId: string,
    submissionId: string,
    conversionData: any
  ): Promise<void> {
    try {
      await Promise.all([
        this.logIntegration({
          submission_id: submissionId,
          integration_type: 'user_conversion',
          status: 'success',
          response_data: {
            temp_id: tempId,
            user_id: userId,
            conversion_data: conversionData
          }
        }),
        this.logAnalytics({
          event_type: 'user_converted',
          user_id: userId,
          submission_id: submissionId,
          properties: {
            temp_id: tempId,
            conversion_data: conversionData,
            timestamp: new Date().toISOString()
          }
        })
      ]);
    } catch (err) {
      console.error('Exception in logUserConversion:', err);
    }
  }

  // Log system errors with context
  async logSystemError(
    context: string,
    error: Error,
    additionalData?: any
  ): Promise<void> {
    try {
      await this.logIntegration({
        integration_type: 'system_error',
        status: 'failed',
        error_message: error.message,
        response_data: {
          context,
          stack: error.stack,
          additional_data: additionalData,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Exception in logSystemError:', err);
    }
  }
}

// Export singleton instance
export const integrationLogger = new IntegrationLogger();

// Export individual methods for convenience
export const {
  logIntegration,
  logAnalytics,
  logN8NTrigger,
  logCalculatorProgress,
  logEmailSequence,
  logUserConversion,
  logSystemError
} = integrationLogger;