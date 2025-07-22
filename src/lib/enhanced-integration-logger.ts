import { supabase } from "@/integrations/supabase/client";

interface IntegrationLogData {
  integration_type: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  submission_id?: string;
  temp_id?: string;
  user_id?: string;
  request_data?: any;
  response_data?: any;
  error_message?: string;
  retry_count?: number;
  max_retries?: number;
  next_retry_at?: string;
  execution_time_ms?: number;
}

interface ConversionEventData {
  session_id?: string;
  user_id?: string;
  temp_id?: string;
  event_type: string;
  event_data?: any;
  page_url?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  user_agent?: string;
  ip_address?: string;
}

class EnhancedIntegrationLogger {
  async logIntegration(data: IntegrationLogData): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_logs')
        .insert(data);
      
      if (error) {
        console.error('Failed to log integration:', error);
      }
    } catch (error) {
      console.error('Error logging integration:', error);
    }
  }

  async logConversionEvent(data: ConversionEventData): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversion_events')
        .insert(data);
      
      if (error) {
        console.error('Failed to log conversion event:', error);
      }
    } catch (error) {
      console.error('Error logging conversion event:', error);
    }
  }

  async updateIntegrationStatus(
    id: string, 
    status: 'success' | 'failed' | 'retrying',
    response_data?: any,
    error_message?: string,
    execution_time_ms?: number
  ): Promise<void> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (response_data) updateData.response_data = response_data;
      if (error_message) updateData.error_message = error_message;
      if (execution_time_ms) updateData.execution_time_ms = execution_time_ms;
      
      const { error } = await supabase
        .from('integration_logs')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error('Failed to update integration status:', error);
      }
    } catch (error) {
      console.error('Error updating integration status:', error);
    }
  }

  async getIntegrationHealth(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('integration_logs')
        .select('integration_type, status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to get integration health:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting integration health:', error);
      return null;
    }
  }

  async getFailedIntegrations(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('status', 'failed')
        .lt('retry_count', 3)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to get failed integrations:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting failed integrations:', error);
      return [];
    }
  }
}

export const enhancedIntegrationLogger = new EnhancedIntegrationLogger();