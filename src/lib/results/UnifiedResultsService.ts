import { industryDefaults, bestInClassTargets } from '@/lib/industryDefaults';

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

    // Get industry-specific benchmarks
    const normalizedIndustry = (submission.industry || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    
    const industryKeys = Object.keys(industryDefaults);
    const exactMatch = industryKeys.find(key => key === normalizedIndustry);
    const partialMatch = !exactMatch ? 
      industryKeys.find(key => normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) : 
      null;
      
    const industryKey = (exactMatch || partialMatch || 
      (normalizedIndustry.includes('saas') ? 'saas-software' : 'other')) as keyof typeof industryDefaults;
      
    const industryData = industryDefaults[industryKey];
    const bestInClassData = bestInClassTargets[industryKey];

    console.log('=== UNIFIED RESULTS SERVICE DEBUG ===');
    console.log('Industry mapping:', {
      originalIndustry: submission.industry,
      normalizedIndustry,
      industryKey,
      industryData: industryData.freeToPaidConversionRate,
      bestInClassRate: bestInClassData.freeToPaidConversionRateMax
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
    const industryConversionRateBenchmark = industryData.freeToPaidConversionRate; // Use industry-specific benchmark
    const bestInClassConversionRate = bestInClassData.freeToPaidConversionRateMax; // Use industry-specific best-in-class

    console.log('Conversion benchmarks:', {
      userRate: conversionRate,
      industryBenchmark: industryConversionRateBenchmark,
      bestInClass: bestInClassConversionRate
    });

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
    
    // 2. Failed Payment Loss: Direct calculation from MRR and failure rate
    const failedPaymentLoss = monthlyMRR * (failureRate / 100) * 12 * 0.70; // 70% actual loss after recovery attempts

    // 3. Self-Serve Gap: FIXED - Use industry-specific best-in-class performance
    const conversionGap = Math.max(0, bestInClassConversionRate - conversionRate);
    
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

    // DEBUG: Enhanced self-serve calculation details
    console.log('=== ENHANCED SELF-SERVE GAP CALCULATION DEBUG ===');
    console.log('Current conversion rate:', conversionRate);
    console.log('Industry benchmark rate:', industryConversionRateBenchmark);
    console.log('Best-in-class rate:', bestInClassConversionRate);
    console.log('Conversion gap (best-in-class - current):', conversionGap);
    console.log('Monthly signups:', monthlySignups);
    console.log('Additional conversions per month:', additionalConversionsPerMonth);
    console.log('Realistic self-serve value:', realisticSelfServeValue);
    console.log('Annual self-serve gap:', selfServeGap);

    // 4. Process Inefficiency: Direct cost calculation
    const processInefficiency = manualHours * hourlyRate * 52;

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

    // FIXED: Only apply overall cap when ARR exists
    const totalLoss = currentARR > 0 ? 
      Math.min(
        cappedLeadResponseLoss + cappedFailedPaymentLoss + cappedSelfServeGap + cappedProcessInefficiency,
        currentARR * 0.35 // Overall cap at 35% of ARR
      ) :
      cappedLeadResponseLoss + cappedFailedPaymentLoss + cappedSelfServeGap + cappedProcessInefficiency;

    // Recovery calculations with realistic expectations
    const conservativeRecovery = totalLoss * 0.65; // 65% recovery rate
    const optimisticRecovery = totalLoss * 0.82; // 82% recovery rate

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

    console.log('=== FINAL UNIFIED RESULTS ===');
    console.log('Self-serve gap final:', cappedSelfServeGap);
    console.log('Total loss:', totalLoss);

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

    return result;
  }
}
