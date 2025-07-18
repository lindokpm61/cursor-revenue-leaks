
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

    // Industry benchmarks for realistic calculations
    const industryLeadConversionRate = 0.03; // 3% typical B2B conversion rate
    const industryResponseTimeOptimal = 1; // 1 hour optimal response time
    const industryConversionRateBenchmark = 3.5; // 3.5% self-serve conversion benchmark

    // Calculate individual losses with realistic, conversion-based formulas
    
    // 1. Lead Response Loss: Based on conversion rate impact from delayed response
    // Calculate actual converted customers per month
    const actualMonthlyConversions = monthlyLeads * industryLeadConversionRate;
    
    // Response delay impact on conversion rate (research shows 50% drop after first hour)
    const responseDelayMultiplier = leadResponseHours > industryResponseTimeOptimal ? 
      Math.min(0.5, (leadResponseHours - industryResponseTimeOptimal) / 24 * 0.2) : 0;
    
    // Lost conversions due to slow response
    const lostConversionsPerMonth = actualMonthlyConversions * responseDelayMultiplier;
    const leadResponseLoss = lostConversionsPerMonth * averageDealValue * 12;

    // 2. Failed Payment Loss: Direct calculation from MRR and failure rate (already correct)
    const failedPaymentLoss = monthlyMRR * (failureRate / 100) * 12 * 0.65; // 65% actual loss after recovery attempts

    // 3. Self-Serve Gap: Based on incremental conversion rate improvement
    const conversionGap = Math.max(0, industryConversionRateBenchmark - conversionRate);
    
    // Calculate value per signup based on current performance
    const currentCustomerValue = conversionRate > 0 && monthlySignups > 0 ? 
      (monthlyMRR * 12) / (monthlySignups * conversionRate / 100) :
      averageDealValue * 0.3; // Conservative estimate for self-serve customers
    
    // Additional conversions from improving to industry benchmark
    const additionalConversionsPerMonth = monthlySignups * (conversionGap / 100);
    const selfServeGap = additionalConversionsPerMonth * currentCustomerValue * 12;

    // 4. Process Inefficiency: Direct cost calculation (already correct)
    const processInefficiency = manualHours * hourlyRate * 52;

    // Apply reasonable caps to prevent unrealistic values
    const cappedLeadResponseLoss = Math.min(leadResponseLoss, currentARR * 0.08);
    const cappedFailedPaymentLoss = Math.min(failedPaymentLoss, currentARR * 0.06);
    const cappedSelfServeGap = Math.min(selfServeGap, currentARR * 0.12);
    const cappedProcessInefficiency = Math.min(processInefficiency, currentARR * 0.05);

    // Total loss with overall cap
    const totalLoss = Math.min(
      cappedLeadResponseLoss + cappedFailedPaymentLoss + cappedSelfServeGap + cappedProcessInefficiency,
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
        amount: cappedLeadResponseLoss,
        percentage: totalLoss > 0 ? (cappedLeadResponseLoss / totalLoss) * 100 : 0,
        color: 'hsl(var(--destructive))'
      },
      {
        category: 'failedPayments',
        title: 'Failed Payment Loss',
        amount: cappedFailedPaymentLoss,
        percentage: totalLoss > 0 ? (cappedFailedPaymentLoss / totalLoss) * 100 : 0,
        color: 'hsl(var(--revenue-warning))'
      },
      {
        category: 'selfServe',
        title: 'Self-Serve Gap',
        amount: cappedSelfServeGap,
        percentage: totalLoss > 0 ? (cappedSelfServeGap / totalLoss) * 100 : 0,
        color: 'hsl(var(--primary))'
      },
      {
        category: 'processInefficiency',
        title: 'Process Inefficiency',
        amount: cappedProcessInefficiency,
        percentage: totalLoss > 0 ? (cappedProcessInefficiency / totalLoss) * 100 : 0,
        color: 'hsl(var(--muted-foreground))'
      }
    ];

    // Performance comparison metrics
    const secureRevenue = Math.max(0, currentARR - totalLoss);
    const industryAverageRecovery = conservativeRecovery;
    const bestInClassRecovery = optimisticRecovery;

    return {
      leadResponseLoss: cappedLeadResponseLoss,
      failedPaymentLoss: cappedFailedPaymentLoss,
      selfServeGap: cappedSelfServeGap,
      processInefficiency: cappedProcessInefficiency,
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
