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
  async create(data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async getById(id: string) { 
    // Return a stub submission for the specific ID to avoid breaking the UI
    return { 
      data: {
        id,
        company_name: 'Demo Company',
        contact_email: 'demo@example.com',
        current_arr: 1000000,
        lead_response_loss: 50000,
        failed_payment_loss: 30000,
        selfserve_gap_loss: 40000,
        process_inefficiency_loss: 35000,
        total_leak: 155000,
        recovery_potential_70: 108500,
        recovery_potential_85: 131750,
        lead_score: 75,
        user_id: 'demo-user',
        created_at: new Date().toISOString()
      }, 
      error: null 
    }; 
  },
  async getByUserId(userId: string) { return { data: [], error: null }; },
  async getAll() { return { data: [], error: null }; },
  async getAllWithUserData() { return { data: [], error: null }; },
  async update(id: string, data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async delete(id: string) { return { error: { message: 'Service disabled' } }; },
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
  async getUsersWithAnalytics() { return { data: [], error: null }; },
  async deleteUser(userId: string) { return { data: null, error: { message: 'Service disabled' } }; }
};

export const emailSequenceService = {
  async create(data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async getBySubmissionId(submissionId: string) { return { data: [], error: null }; },
  async updateStatus(id: string, status: string) { return { data: null, error: { message: 'Service disabled' } }; },
  async update(id: string, data: any) { return { data: null, error: { message: 'Service disabled' } }; }
};

export const integrationLogService = {
  async create(type: string, data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async getByType(type: string, limit?: number) { return { data: [], error: null }; },
  async getBySubmissionId(submissionId: string) { return { data: [], error: null }; }
};

export const calculateLeadScore = (data: any) => 0;

export const leadScoringService = {
  async recalculateAllScores() { return { data: { updated: 0 }, error: null }; },
  async recalculateScore(submissionId: string) { return { data: null, error: { message: 'Service disabled' } }; },
  async getScoreStats() { return { data: { total: 0, scored: 0, unscored: 0 }, error: null }; }
};

export const userProfileService = {
  async create(data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async getByUserId(userId: string) { return { data: null, error: null }; },
  async update(userId: string, data: any) { return { data: null, error: { message: 'Service disabled' } }; },
  async delete(userId: string) { return { error: { message: 'Service disabled' } }; },
  async incrementAnalysis(userId: string) { return { data: null, error: null }; },
  async getUsersWithAnalytics(filters?: any) { return { data: [], error: null }; }
};