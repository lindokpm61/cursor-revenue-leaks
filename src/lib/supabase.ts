import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for submissions
export type Submission = Database['public']['Tables']['submissions']['Row'];
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update'];

export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row'];
export type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert'];

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