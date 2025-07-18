
// Clean unified calculation service - single source of truth
// No legacy fallbacks, no debugging logs, just clean calculations

export interface SubmissionData {
  id: string;
  company_name: string;
  contact_email: string;
  industry?: string;
  current_arr: number;
  monthly_leads: number;
  average_deal_value: number;
  lead_response_time: number;
  monthly_free_signups: number;
  free_to_paid_conversion: number;
  monthly_mrr: number;
  failed_payment_rate: number;
  manual_hours: number;
  hourly_rate: number;
  lead_score: number;
  user_id?: string;
  created_at: string;
}

export interface UnifiedCalculations {
  // Core losses
  leadResponseLoss: number;
  failedPaymentLoss: number;
  selfServeGap: number;
  processInefficiency: number;
  totalLoss: number;
  
  // Recovery potentials
  conservativeRecovery: number;
  optimisticRecovery: number;
  
  // Performance metrics
  lossPercentageOfARR: number;
  recoveryPercentageOfLoss: number;
  
  // Breakdown for charts
  lossBreakdown: Array<{
    category: string;
    title: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  
  // Performance comparison
  performanceMetrics: {
    currentARR: number;
    secureRevenue: number;
    revenueAtRisk: number;
    industryAverageRecovery: number;
    bestInClassRecovery: number;
  };
}

export class UnifiedResultsService {
  static calculateResults(submission: SubmissionData): UnifiedCalculations {
    // Sanitize inputs
    const currentARR = Math.max(0, submission.current_arr || 0);
    const monthlyLeads = Math.max(0, submission.monthly_leads || 0);
    const averageDealValue = Math.max(1000, submission.average_deal_value || 5000);
    const leadResponseHours = Math.max(0.5, Math.min(168, submission.lead_response_time || 24));
    const monthlySignups = Math.max(0, submission.monthly_free_signups || 0);
    const conversionRate = Math.max(0, Math.min(25, submission.free_to_paid_conversion || 2));
    const monthlyMRR = Math.max(0, submission.monthly_mrr || 0);
    const failureRate = Math.max(0, Math.min(30, submission.failed_payment_rate || 5));
    const manualHours = Math.max(0, Math.min(80, submission.manual_hours || 10));
    const hourlyRate = Math.max(25, Math.min(500, submission.hourly_rate || 75));

    // Calculate individual losses with realistic formulas
    
    // 1. Lead Response Loss: Based on response delay impact
    const responseDelayImpact = Math.min(0.12, (leadResponseHours - 1) / 24 * 0.05); // Max 12% impact
    const leadResponseLoss = Math.min(
      monthlyLeads * averageDealValue * responseDelayImpact * 12,
      currentARR * 0.08 // Cap at 8% of ARR
    );

    // 2. Failed Payment Loss: Direct calculation from MRR and failure rate
    const failedPaymentLoss = Math.min(
      monthlyMRR * (failureRate / 100) * 12 * 0.65, // 65% actual loss after recovery attempts
      currentARR * 0.06 // Cap at 6% of ARR
    );

    // 3. Self-Serve Gap: Conversion rate improvement opportunity
    const industryBenchmark = 3.5;
    const conversionGap = Math.max(0, industryBenchmark - conversionRate);
    const estimatedCustomerValue = monthlyMRR > 0 && conversionRate > 0 ? 
      (monthlyMRR * 12) / (monthlySignups * conversionRate / 100) :
      averageDealValue * 0.3; // Estimate for self-serve
    
    const selfServeGap = Math.min(
      monthlySignups * (conversionGap / 100) * estimatedCustomerValue * 12,
      currentARR * 0.12 // Cap at 12% of ARR
    );

    // 4. Process Inefficiency: Direct cost calculation
    const processInefficiency = Math.min(
      manualHours * hourlyRate * 52,
      currentARR * 0.05 // Cap at 5% of ARR
    );

    // Total loss with overall cap
    const totalLoss = Math.min(
      leadResponseLoss + failedPaymentLoss + selfServeGap + processInefficiency,
      currentARR * 0.25 // Overall cap at 25% of ARR
    );

    // Recovery calculations with realistic expectations
    const conservativeRecovery = totalLoss * 0.60; // 60% recovery rate
    const optimisticRecovery = totalLoss * 0.80; // 80% recovery rate

    // Performance metrics
    const lossPercentageOfARR = currentARR > 0 ? (totalLoss / currentARR) * 100 : 0;
    const recoveryPercentageOfLoss = totalLoss > 0 ? (conservativeRecovery / totalLoss) * 100 : 0;

    // Loss breakdown for charts
    const lossBreakdown = [
      {
        category: 'leadResponse',
        title: 'Lead Response Loss',
        amount: leadResponseLoss,
        percentage: totalLoss > 0 ? (leadResponseLoss / totalLoss) * 100 : 0,
        color: 'hsl(var(--destructive))'
      },
      {
        category: 'failedPayments',
        title: 'Failed Payment Loss',
        amount: failedPaymentLoss,
        percentage: totalLoss > 0 ? (failedPaymentLoss / totalLoss) * 100 : 0,
        color: 'hsl(var(--revenue-warning))'
      },
      {
        category: 'selfServe',
        title: 'Self-Serve Gap',
        amount: selfServeGap,
        percentage: totalLoss > 0 ? (selfServeGap / totalLoss) * 100 : 0,
        color: 'hsl(var(--primary))'
      },
      {
        category: 'processInefficiency',
        title: 'Process Inefficiency',
        amount: processInefficiency,
        percentage: totalLoss > 0 ? (processInefficiency / totalLoss) * 100 : 0,
        color: 'hsl(var(--muted-foreground))'
      }
    ];

    // Performance comparison metrics
    const secureRevenue = Math.max(0, currentARR - totalLoss);
    const industryAverageRecovery = conservativeRecovery;
    const bestInClassRecovery = optimisticRecovery;

    return {
      leadResponseLoss,
      failedPaymentLoss,
      selfServeGap,
      processInefficiency,
      totalLoss,
      conservativeRecovery,
      optimisticRecovery,
      lossPercentageOfARR,
      recoveryPercentageOfLoss,
      lossBreakdown,
      performanceMetrics: {
        currentARR,
        secureRevenue,
        revenueAtRisk: totalLoss,
        industryAverageRecovery,
        bestInClassRecovery
      }
    };
  }

  static formatCurrency(amount: number): string {
    if (!isFinite(amount) || isNaN(amount)) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);
  }
}
