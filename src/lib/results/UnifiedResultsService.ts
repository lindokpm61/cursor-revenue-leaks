
// Clean unified calculation service - single source of truth
// Updated with realistic caps and industry-standard impact calculations

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
    // DEBUG: Log input data
    console.log('=== UNIFIED RESULTS SERVICE INPUT ===');
    console.log('Input submission:', submission);

    // FIXED: More careful sanitization that preserves valid data
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

    // DEBUG: Log sanitized inputs
    console.log('=== SANITIZED INPUTS ===');
    console.log({
      currentARR,
      monthlyLeads,
      averageDealValue,
      leadResponseHours,
      monthlySignups,
      conversionRate,
      monthlyMRR,
      failureRate,
      manualHours,
      hourlyRate
    });

    // CRITICAL: Check for valid data before warning
    if (currentARR === 0 && monthlyLeads === 0 && monthlyMRR === 0) {
      console.warn('=== WARNING: All key metrics are zero - check data transformation ===');
      console.warn('Original submission data check:', {
        originalARR: submission.current_arr,
        originalLeads: submission.monthly_leads,
        originalMRR: submission.monthly_mrr
      });
    }

    // Industry benchmarks for realistic calculations
    const industryLeadConversionRate = 0.025; // 2.5% typical B2B conversion rate
    const industryResponseTimeOptimal = 1; // 1 hour optimal response time
    const industryConversionRateBenchmark = 3.5; // 3.5% self-serve conversion benchmark

    // Calculate individual losses with realistic, conversion-based formulas
    
    // 1. Lead Response Loss: More aggressive calculation for poor response times
    const actualMonthlyConversions = monthlyLeads * industryLeadConversionRate;
    
    // Enhanced response delay impact - research shows significant drop-off after first hour
    let responseDelayMultiplier = 0;
    if (leadResponseHours > industryResponseTimeOptimal) {
      if (leadResponseHours <= 2) {
        responseDelayMultiplier = 0.15; // 15% loss for 2-hour response
      } else if (leadResponseHours <= 4) {
        responseDelayMultiplier = 0.30; // 30% loss for 4-hour response
      } else if (leadResponseHours <= 8) {
        responseDelayMultiplier = 0.50; // 50% loss for 8-hour response
      } else if (leadResponseHours <= 24) {
        responseDelayMultiplier = 0.70; // 70% loss for 24-hour response
      } else {
        responseDelayMultiplier = 0.85; // 85% loss for >24-hour response
      }
    }
    
    const lostConversionsPerMonth = actualMonthlyConversions * responseDelayMultiplier;
    const leadResponseLoss = lostConversionsPerMonth * averageDealValue * 12;

    // DEBUG: Log lead response calculation
    console.log('=== LEAD RESPONSE CALCULATION ===');
    console.log({
      actualMonthlyConversions,
      responseDelayMultiplier,
      lostConversionsPerMonth,
      leadResponseLoss
    });

    // 2. Failed Payment Loss: Direct calculation from MRR and failure rate
    const failedPaymentLoss = monthlyMRR * (failureRate / 100) * 12 * 0.70; // 70% actual loss after recovery attempts

    // DEBUG: Log failed payment calculation
    console.log('=== FAILED PAYMENT CALCULATION ===');
    console.log({
      monthlyMRR,
      failureRate,
      failedPaymentLoss
    });

    // 3. Self-Serve Gap: More realistic calculation with better customer value estimation
    const conversionGap = Math.max(0, industryConversionRateBenchmark - conversionRate);
    
    // Enhanced self-serve customer value calculation
    let realisticSelfServeValue;
    if (monthlyMRR > 0 && monthlySignups > 0 && conversionRate > 0) {
      // Calculate average customer value from existing metrics
      const existingCustomers = (monthlyMRR * 12) / Math.max(1, averageDealValue * 0.8);
      const currentSelfServeCustomers = monthlySignups * (conversionRate / 100) * 12;
      if (currentSelfServeCustomers > 0) {
        realisticSelfServeValue = Math.min(averageDealValue * 0.6, (monthlyMRR * 12) / currentSelfServeCustomers);
      } else {
        realisticSelfServeValue = Math.min(averageDealValue * 0.4, 8000);
      }
    } else {
      realisticSelfServeValue = Math.min(averageDealValue * 0.4, 8000);
    }
    
    const additionalConversionsPerMonth = monthlySignups * (conversionGap / 100);
    const selfServeGap = additionalConversionsPerMonth * realisticSelfServeValue * 12;

    // DEBUG: Log self-serve calculation
    console.log('=== SELF-SERVE CALCULATION ===');
    console.log({
      conversionGap,
      realisticSelfServeValue,
      additionalConversionsPerMonth,
      selfServeGap
    });

    // 4. Process Inefficiency: Direct cost calculation
    const processInefficiency = manualHours * hourlyRate * 52;

    // DEBUG: Log process inefficiency calculation
    console.log('=== PROCESS INEFFICIENCY CALCULATION ===');
    console.log({
      manualHours,
      hourlyRate,
      processInefficiency
    });

    // FIXED: Apply more realistic caps but don't cap when ARR is zero
    const cappedLeadResponseLoss = currentARR > 0 ? 
      Math.min(leadResponseLoss, currentARR * 0.15) : 
      leadResponseLoss; // Keep original value if no ARR to cap against
    
    const cappedFailedPaymentLoss = currentARR > 0 ? 
      Math.min(failedPaymentLoss, currentARR * 0.08) : 
      failedPaymentLoss;
    
    const cappedSelfServeGap = currentARR > 0 ? 
      Math.min(selfServeGap, currentARR * 0.12) : 
      selfServeGap;
    
    const cappedProcessInefficiency = currentARR > 0 ? 
      Math.min(processInefficiency, currentARR * 0.06) : 
      processInefficiency;

    // DEBUG: Log capping
    console.log('=== CAPPING CALCULATIONS ===');
    console.log('Before capping:', {
      leadResponseLoss,
      failedPaymentLoss,
      selfServeGap,
      processInefficiency
    });
    console.log('After capping:', {
      cappedLeadResponseLoss,
      cappedFailedPaymentLoss,
      cappedSelfServeGap,
      cappedProcessInefficiency
    });

    // FIXED: Only apply overall cap when ARR exists
    const totalLoss = currentARR > 0 ? 
      Math.min(
        cappedLeadResponseLoss + cappedFailedPaymentLoss + cappedSelfServeGap + cappedProcessInefficiency,
        currentARR * 0.35 // Overall cap at 35% of ARR
      ) :
      cappedLeadResponseLoss + cappedFailedPaymentLoss + cappedSelfServeGap + cappedProcessInefficiency;

    // DEBUG: Log total loss calculation
    console.log('=== TOTAL LOSS CALCULATION ===');
    console.log('Sum before overall cap:', cappedLeadResponseLoss + cappedFailedPaymentLoss + cappedSelfServeGap + cappedProcessInefficiency);
    console.log('Overall cap (35% of ARR):', currentARR * 0.35);
    console.log('Final totalLoss:', totalLoss);

    // Recovery calculations with realistic expectations
    const conservativeRecovery = totalLoss * 0.65; // 65% recovery rate
    const optimisticRecovery = totalLoss * 0.82; // 82% recovery rate

    // DEBUG: Log recovery calculations
    console.log('=== RECOVERY CALCULATIONS ===');
    console.log({
      conservativeRecovery,
      optimisticRecovery
    });

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

    const finalResult = {
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

    // DEBUG: Log final result
    console.log('=== FINAL UNIFIED RESULTS ===');
    console.log('Final calculations object:', finalResult);

    return finalResult;
  }

  static formatCurrency(amount: number): string {
    if (!isFinite(amount) || isNaN(amount)) return '$0';
    
    const result = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);

    // DEBUG: Log currency formatting
    console.log(`formatCurrency(${amount}) = ${result}`);
    
    return result;
  }
}
