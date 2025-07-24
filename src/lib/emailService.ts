import { supabase } from '@/integrations/supabase/client';

export interface EmailData {
  type: 'welcome' | 'abandonment' | 'results' | 'custom';
  to: string;
  data?: Record<string, any>;
  template?: string;
  subject?: string;
}

export class EmailService {
  private static async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
      }

      console.log('Email sent successfully:', data);
      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }

  static async sendWelcomeEmail(
    email: string, 
    userData: { userName?: string; companyName?: string }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      type: 'welcome',
      to: email,
      data: userData,
    });
  }

  static async sendAbandonmentEmail(
    email: string, 
    abandonmentData: { 
      userName?: string; 
      recoveryPotential?: number; 
      currentStep?: number;
      tempId: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      type: 'abandonment',
      to: email,
      data: abandonmentData,
    });
  }

  static async sendResultsEmail(
    email: string, 
    resultsData: { 
      userName?: string; 
      companyName?: string;
      totalLeak?: number;
      recoveryPotential?: number;
      resultUrl?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      type: 'results',
      to: email,
      data: resultsData,
    });
  }

  static async sendCustomEmail(
    email: string,
    subject: string,
    template: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      type: 'custom',
      to: email,
      subject,
      template,
    });
  }

  static async scheduleEmailSequence(
    tempId: string,
    email: string,
    sequenceType: string,
    scheduledFor: Date,
    contactData: Record<string, any> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('email_sequence_queue')
        .insert({
          temp_id: tempId,
          contact_email: email,
          sequence_type: sequenceType,
          scheduled_for: scheduledFor.toISOString(),
          contact_data: contactData,
          status: 'pending'
        });

      if (error) {
        console.error('Error scheduling email sequence:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Email sequence scheduling error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown scheduling error' 
      };
    }
  }

  static async cancelEmailSequence(tempId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('email_sequence_queue')
        .update({ status: 'cancelled' })
        .eq('temp_id', tempId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error cancelling email sequence:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Email sequence cancellation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown cancellation error' 
      };
    }
  }

  static async trackEmailEngagement(
    tempId: string,
    eventType: 'opened' | 'clicked' | 'converted',
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('email_engagement_events')
        .insert({
          temp_id: tempId,
          event_type: eventType,
          engagement_score_delta: this.getEngagementScoreDelta(eventType),
          ...data
        });
    } catch (error) {
      console.error('Error tracking email engagement:', error);
    }
  }

  private static getEngagementScoreDelta(eventType: string): number {
    switch (eventType) {
      case 'opened': return 5;
      case 'clicked': return 15;
      case 'converted': return 50;
      default: return 0;
    }
  }

  static async getEmailSequenceStatus(tempId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_sequence_queue')
        .select('*')
        .eq('temp_id', tempId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email sequence status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Email sequence status error:', error);
      return [];
    }
  }
}