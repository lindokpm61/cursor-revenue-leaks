// Temporarily disabled - service references non-existent tables
// TODO: Implement when proper database schema is in place

export type Submission = any; // Temporary type
export type SubmissionInsert = any;
export type SubmissionUpdate = any;
export type UserProfile = any;

// Add missing services that other files expect
export const userPatternService = {
  async getPattern(userId: string) { return { data: null, error: null }; },
  async getSubmissionsByEmail(email: string) { return { data: [], error: null }; },
  async analyzeUserPattern(email: string) { return { data: null, error: null }; }
};

export const submissionService = {
  async create(data: any) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('calculator_submissions').insert([data]).select().single();
  },
  async getById(id: string) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('calculator_submissions').select('*').eq('id', id).single();
  },
  async getByUserId(userId: string, limit?: number) { 
    const { supabase } = await import('@/integrations/supabase/client');
    let query = supabase.from('calculator_submissions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    return await query;
  },
  async getAll(limit?: number) { 
    const { supabase } = await import('@/integrations/supabase/client');
    let query = supabase.from('calculator_submissions').select('*').order('created_at', { ascending: false });
    if (limit) query = query.limit(limit);
    return await query;
  },
  async getAllWithUserData() { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('calculator_submissions').select('*, profiles(*)').order('created_at', { ascending: false });
  },
  async update(id: string, data: any) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('calculator_submissions').update(data).eq('id', id).select().single();
  },
  async delete(id: string) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('calculator_submissions').delete().eq('id', id);
  },
  async incrementAnalysis(id: string) { return { data: null, error: null }; }
};

export const analyticsService = {
  async track(event: string, data?: any) { return { data: null, error: null }; },
  async getEvents() { return { data: [], error: null }; },
  async getDashboardMetrics(userId: string, filters?: any) { return { data: { total_submissions: 0, avg_score: 0 }, error: null }; }
};

export const userService = {
  async getCurrentUser() { return { data: null, error: null }; },
  async signOut() { return { error: null }; },
  async getUsersWithAnalytics(limit = 500) { 
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // Get users from auth.users via profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(limit);

      if (profilesError) {
        return { data: null, error: profilesError };
      }

      // Get submission counts for each user
      const { data: submissions, error: submissionsError } = await supabase
        .from('calculator_submissions')
        .select('user_id, id, recovery_potential_85, created_at');

      if (submissionsError) {
        console.warn('Could not fetch submissions:', submissionsError);
      }

      // Combine the data
      const usersWithAnalytics = profiles?.map(profile => {
        const userSubmissions = submissions?.filter(s => s.user_id === profile.id) || [];
        const totalSubmissions = userSubmissions.length;
        const totalPipelineValue = userSubmissions.reduce((sum, s) => sum + (s.recovery_potential_85 || 0), 0);
        const firstSubmission = userSubmissions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
        const lastSubmission = userSubmissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        return {
          user_id: profile.id,
          email: profile.id, // We don't have direct access to email from auth.users
          created_at: profile.created_at,
          email_confirmed_at: profile.created_at, // Assume confirmed if they have a profile
          last_sign_in_at: profile.updated_at,
          user_role: 'user', // Default role
          user_company: profile.company_name,
          user_type: profile.user_type || 'standard',
          total_submissions: totalSubmissions,
          companies_analyzed: totalSubmissions, // Each submission = 1 company
          first_submission_date: firstSubmission?.created_at || null,
          last_submission_date: lastSubmission?.created_at || null,
          avg_lead_score: 0, // Would need calculation
          total_pipeline_value: totalPipelineValue,
          account_status: 'active'
        };
      }) || [];

      return { data: usersWithAnalytics, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
  async deleteUser(userId: string) { return { data: null, error: { message: 'Service disabled' } }; }
};

export const emailSequenceService = {
  async create(data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async getBySubmissionId(submissionId: string) { return { data: [], error: null }; },
  async updateStatus(id: string, status: string) { return { data: null, error: { message: 'Service disabled' } }; },
  async update(id: string, data: any) { return { data: null, error: { message: 'Service disabled' } }; }
};

export const integrationLogService = {
  async create(data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async getByType(type: string, limit?: number) { return { data: [], error: null }; },
  async getBySubmissionId(submissionId: string) { return { data: [], error: null }; }
};

export const calculateLeadScore = (data: any) => 0;

export const leadScoringService = {
  async recalculateAllScores() { return { data: { updated: 0 }, error: null }; },
  async recalculateScore(submissionId: string) { return { data: null, error: { message: 'Service disabled' } }; },
  async getScoreStats(filters?: any) { return { data: { total: 0, scored: 0, unscored: 0 }, error: null }; }
};

export const userProfileService = {
  async create(data: any) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('profiles').insert([data]).select().single();
  },
  async getByUserId(userId: string) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('profiles').select('*').eq('id', userId).single();
  },
  async update(userId: string, data: any) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('profiles').update(data).eq('id', userId).select().single();
  },
  async delete(userId: string) { 
    const { supabase } = await import('@/integrations/supabase/client');
    return await supabase.from('profiles').delete().eq('id', userId);
  },
  async incrementAnalysis(userId: string, value?: any) { return { data: null, error: null }; },
  async getUsersWithAnalytics(limit = 500) { 
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // Get users from profiles table with comprehensive data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(limit);

      if (profilesError) {
        return { data: null, error: profilesError };
      }

      // Get submission analytics for each user
      const { data: submissionData, error: submissionsError } = await supabase
        .from('calculator_submissions')
        .select('user_id, id, recovery_potential_85, created_at, company_name');

      if (submissionsError) {
        console.warn('Could not fetch submissions:', submissionsError);
      }

      // Combine the data
      const usersWithAnalytics = profiles?.map(profile => {
        const userSubmissions = submissionData?.filter(s => s.user_id === profile.id) || [];
        const totalSubmissions = userSubmissions.length;
        const totalPipelineValue = userSubmissions.reduce((sum, s) => sum + (s.recovery_potential_85 || 0), 0);
        const avgLeadScore = totalSubmissions > 0 ? Math.round(totalPipelineValue / totalSubmissions / 10000) : 0;
        
        // Get unique companies analyzed
        const uniqueCompanies = new Set(userSubmissions.map(s => s.company_name).filter(Boolean)).size;
        
        const firstSubmission = userSubmissions.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )[0];
        const lastSubmission = userSubmissions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          user_id: profile.id,
          email: `user-${profile.id.slice(0, 8)}@example.com`, // Placeholder email since we can't access auth.users
          created_at: profile.created_at,
          email_confirmed_at: profile.created_at, // Assume confirmed if they have a profile
          last_sign_in_at: profile.updated_at,
          user_role: profile.role || 'user',
          user_company: profile.company_name || profile.actual_company_name,
          user_type: profile.user_type || 'standard',
          total_submissions: totalSubmissions,
          companies_analyzed: uniqueCompanies,
          first_submission_date: firstSubmission?.created_at || null,
          last_submission_date: lastSubmission?.created_at || null,
          avg_lead_score: avgLeadScore,
          total_pipeline_value: totalPipelineValue,
          account_status: totalSubmissions > 0 ? 'active' : 'inactive'
        };
      }) || [];

      return { data: usersWithAnalytics, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};