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
  async getUsersWithAnalytics(filters?: any) { return { data: [], error: null }; },
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
  async getUsersWithAnalytics(filters?: any) { return { data: [], error: null }; }
};