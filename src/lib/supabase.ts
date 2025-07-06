import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for submissions
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update'];

export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];
export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert'];

export type EmailSequence = Database['public']['Tables']['email_sequences']['Row'];
export type EmailSequenceInsert = Database['public']['Tables']['email_sequences']['Insert'];
export type EmailSequenceUpdate = Database['public']['Tables']['email_sequences']['Update'];

export type IntegrationLog = Database['public']['Tables']['integration_logs']['Row'];
export type IntegrationLogInsert = Database['public']['Tables']['integration_logs']['Insert'];

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

// Submission operations
export const submissionService = {
  async create(data: SubmissionInsert) {
    const { data: result, error } = await supabase
      .from('submissions')
      .insert(data)
      .select()
      .single();
    
    return { data: result, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async getByUserId(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async getAll(limit = 50) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async update(id: string, updates: SubmissionUpdate) {
    const { data, error } = await supabase
      .from('submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

// Analytics operations
export const analyticsService = {
  async track(eventType: string, submissionId?: string, properties?: any) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        submission_id: submissionId,
        user_id: user.id,
        properties
      });
    
    return { data, error };
  },

  async getEvents(limit = 100) {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  }
};

// User operations
export const userService = {
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { data: user, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }
};

// Email sequence operations
export const emailSequenceService = {
  async create(data: EmailSequenceInsert) {
    const { data: result, error } = await supabase
      .from('email_sequences')
      .insert(data)
      .select()
      .single();
    
    return { data: result, error };
  },

  async getBySubmissionId(submissionId: string) {
    const { data, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async updateStatus(id: string, status: string, timestamps?: Partial<EmailSequenceUpdate>) {
    const { data, error } = await supabase
      .from('email_sequences')
      .update({ status, ...timestamps })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
};

// Integration logs operations
export const integrationLogService = {
  async create(data: IntegrationLogInsert) {
    const { data: result, error } = await supabase
      .from('integration_logs')
      .insert(data)
      .select()
      .single();
    
    return { data: result, error };
  },

  async getByType(integrationType: string, limit = 50) {
    const { data, error } = await supabase
      .from('integration_logs')
      .select('*')
      .eq('integration_type', integrationType)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async getBySubmissionId(submissionId: string) {
    const { data, error } = await supabase
      .from('integration_logs')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }
};

// User profile operations
export const userProfileService = {
  async create(data: UserProfileInsert) {
    const { data: result, error } = await supabase
      .from('user_profiles')
      .insert(data)
      .select()
      .single();
    
    return { data: result, error };
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async update(userId: string, updates: UserProfileUpdate) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async incrementAnalysis(userId: string, opportunityValue: number) {
    // First get current values
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('companies_analyzed, total_opportunity')
      .eq('id', userId)
      .single();

    if (fetchError) return { data: null, error: fetchError };

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        companies_analyzed: (currentProfile?.companies_analyzed || 0) + 1,
        total_opportunity: (currentProfile?.total_opportunity || 0) + opportunityValue,
        last_analysis_date: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  }
};