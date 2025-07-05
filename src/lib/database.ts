// Custom Database Client - No Supabase SDK dependency
interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface CalculatorSubmission {
  id?: string;
  company_name: string;
  email: string;
  industry: string;
  current_arr: number;
  monthly_leads: number;
  average_deal_value: number;
  lead_response_time_hours: number;
  monthly_free_signups: number;
  free_to_paid_conversion_rate: number;
  monthly_mrr: number;
  failed_payment_rate: number;
  manual_hours_per_week: number;
  hourly_rate: number;
  calculations: {
    leadResponseLoss: number;
    failedPaymentLoss: number;
    selfServeGap: number;
    processLoss: number;
    totalLeakage: number;
    potentialRecovery70: number;
    potentialRecovery85: number;
  };
  lead_score?: number;
  status?: 'new' | 'contacted' | 'qualified' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

class DatabaseClient {
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      url: process.env.VITE_DATABASE_URL || 'http://localhost:3000/api',
      anonKey: process.env.VITE_DATABASE_ANON_KEY || 'demo-key',
      serviceKey: process.env.VITE_DATABASE_SERVICE_KEY
    };
  }

  private async apiCall<T = any>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any,
    useServiceKey = false
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useServiceKey ? this.config.serviceKey : this.config.anonKey}`
      };

      const response = await fetch(`${this.config.url}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      const result = await response.json();
      
      return {
        data: result,
        status: response.status,
        error: response.ok ? undefined : result.message || 'API Error'
      };
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Network Error'
      };
    }
  }

  // Submissions
  async createSubmission(submission: Omit<CalculatorSubmission, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<CalculatorSubmission>> {
    return this.apiCall('/submissions', 'POST', submission);
  }

  async getSubmission(id: string): Promise<ApiResponse<CalculatorSubmission>> {
    return this.apiCall(`/submissions/${id}`);
  }

  async getSubmissions(filters?: {
    limit?: number;
    offset?: number;
    industry?: string;
    status?: string;
    order_by?: string;
  }): Promise<ApiResponse<CalculatorSubmission[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return this.apiCall(`/submissions?${params.toString()}`);
  }

  async updateSubmission(id: string, updates: Partial<CalculatorSubmission>): Promise<ApiResponse<CalculatorSubmission>> {
    return this.apiCall(`/submissions/${id}`, 'PUT', updates, true);
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.apiCall('/auth/login', 'POST', { email, password });
  }

  async register(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.apiCall('/auth/register', 'POST', { email, password });
  }

  async getProfile(token: string): Promise<ApiResponse<User>> {
    return this.apiCall('/auth/profile', 'GET', undefined, false);
  }

  // Analytics
  async getAnalytics(): Promise<ApiResponse<{
    totalSubmissions: number;
    weeklySubmissions: number;
    averageLeakage: number;
    topIndustries: Array<{ industry: string; count: number }>;
    conversionFunnel: Array<{ stage: string; count: number }>;
  }>> {
    return this.apiCall('/analytics', 'GET', undefined, true);
  }

  async getDailyMetrics(): Promise<ApiResponse<Array<{
    date: string;
    submissions: number;
    totalLeakage: number;
    averageArr: number;
  }>>> {
    return this.apiCall('/analytics/daily', 'GET', undefined, true);
  }

  // Lead scoring calculation
  calculateLeadScore(submission: CalculatorSubmission): number {
    let score = 0;
    
    // ARR-based points (20-50 points)
    if (submission.current_arr >= 10000000) score += 50; // $10M+
    else if (submission.current_arr >= 5000000) score += 40; // $5M+
    else if (submission.current_arr >= 1000000) score += 30; // $1M+
    else if (submission.current_arr >= 500000) score += 20; // $500K+
    else score += 10;

    // Leak impact points (10-40 points)
    const totalLeakage = submission.calculations.totalLeakage;
    if (totalLeakage >= 1000000) score += 40; // $1M+ leak
    else if (totalLeakage >= 500000) score += 30; // $500K+ leak
    else if (totalLeakage >= 250000) score += 20; // $250K+ leak
    else if (totalLeakage >= 100000) score += 15; // $100K+ leak
    else score += 10;

    // Industry multiplier (5-10 points)
    const highValueIndustries = ['technology', 'financial services', 'healthcare', 'enterprise software'];
    if (highValueIndustries.includes(submission.industry.toLowerCase())) {
      score += 10;
    } else {
      score += 5;
    }

    return Math.min(score, 100); // Cap at 100
  }
}

export const db = new DatabaseClient();