// Unified calculation engine for Action Plan system
// This serves as the single source of truth for all calculations

import { 
  calculateLeadResponseImpact,
  calculateFailedPaymentLoss,
  calculateSelfServeGap,
  calculateProcessInefficiency,
  calculateEnhancedLeadScore,
  calculateRealisticRecoveryPotential,
  calculateRecoveryRanges,
  INDUSTRY_BENCHMARKS,
  type ConfidenceFactors 
} from './enhancedCalculations';

export interface UnifiedCalculationInputs {
  currentARR: number;
  monthlyMRR: number;
  monthlyLeads: number;
  averageDealValue: number;
  leadResponseTime: number;
  monthlyFreeSignups: number;
  freeToPaidConversion: number;
  failedPaymentRate: number;
  manualHours: number;
  hourlyRate: number;
  industry?: string;
}

export interface UnifiedCalculationResults {
  // Core losses (already calculated)
  leadResponseLoss: number;
  selfServeGapLoss: number;
  processInefficiencyLoss: number;
  failedPaymentLoss: number;
  totalLoss: number;
  
  // Enhanced recovery potentials with realistic factors
  recovery70Percent: number; // Conservative scenario
  recovery85Percent: number; // Optimistic scenario
  recoveryBestCase: number;   // Best case scenario
  
  actionSpecificRecovery: {
    leadResponse: number;
    selfServe: number;
    processAutomation: number;
    paymentRecovery: number;
  };
  
  // Implementation factors and risks
  implementationFactors: Record<string, number>;
  riskAdjustments: Record<string, number>;
  
  // Confidence and validation
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceBounds: {
    lower: number;
    upper: number;
  };
  
  // Recovery timeline and constraints
  recoveryTimeline: {
    year1: number;
    year2: number;
    year3: number;
  };
}

// Main calculation function with fixed and realistic formulas
export const calculateUnifiedResults = (inputs: UnifiedCalculationInputs): UnifiedCalculationResults => {
  // Input sanitization and validation
  const sanitizedInputs = {
    ...inputs,
    currentARR: Math.max(0, inputs.currentARR || 0),
    monthlyLeads: Math.max(0, inputs.monthlyLeads || 0),
    leadResponseTimeHours: Math.max(0.1, Math.min(168, inputs.leadResponseTime || 24)),
    averageDealValue: Math.max(100, inputs.averageDealValue || 5000),
    monthlyFreeSignups: Math.max(0, inputs.monthlyFreeSignups || 0),
    currentConversionRate: Math.max(0, Math.min(25, inputs.freeToPaidConversion || 2)),
    monthlyMRR: Math.max(0, inputs.monthlyMRR || 0),
    failedPaymentRate: Math.max(0, Math.min(30, inputs.failedPaymentRate || 5)),
    manualHoursPerWeek: Math.max(0, Math.min(80, inputs.manualHours || 10)),
    hourlyRate: Math.max(25, Math.min(500, inputs.hourlyRate || 75))
  };

  console.log('=== UNIFIED CALCULATIONS DEBUG ===');
  console.log('Sanitized inputs:', {
    currentARR: sanitizedInputs.currentARR,
    monthlyLeads: sanitizedInputs.monthlyLeads,
    leadResponseTimeHours: sanitizedInputs.leadResponseTimeHours,
    averageDealValue: sanitizedInputs.averageDealValue,
    monthlyMRR: sanitizedInputs.monthlyMRR,
    failedPaymentRate: sanitizedInputs.failedPaymentRate
  });

  // FIXED: Simplified Lead Response Loss Calculation
  // Formula: Monthly leads × Deal value × Response impact % × 12 months
  const responseImpactFactor = Math.min(0.15, sanitizedInputs.leadResponseTimeHours / 24 * 0.03); // Max 15% impact
  const leadResponseLoss = Math.min(
    sanitizedInputs.monthlyLeads * sanitizedInputs.averageDealValue * responseImpactFactor * 12,
    sanitizedInputs.currentARR * 0.08 // Cap at 8% of ARR
  );

  console.log('Lead response calculation:', {
    monthlyLeads: sanitizedInputs.monthlyLeads,
    averageDealValue: sanitizedInputs.averageDealValue,
    responseImpactFactor: responseImpactFactor,
    annualLoss: leadResponseLoss,
    percentOfARR: ((leadResponseLoss / sanitizedInputs.currentARR) * 100).toFixed(2) + '%'
  });

  // FIXED: Simplified Failed Payment Loss Calculation
  // Formula: Monthly MRR × Failure rate % × 12 months
  const failedPaymentLoss = Math.min(
    sanitizedInputs.monthlyMRR * (sanitizedInputs.failedPaymentRate / 100) * 12,
    sanitizedInputs.currentARR * 0.06 // Cap at 6% of ARR
  );

  console.log('Failed payment calculation:', {
    monthlyMRR: sanitizedInputs.monthlyMRR,
    failedPaymentRate: sanitizedInputs.failedPaymentRate,
    annualLoss: failedPaymentLoss,
    percentOfARR: ((failedPaymentLoss / sanitizedInputs.currentARR) * 100).toFixed(2) + '%'
  });

  // FIXED: Simplified Self-Serve Gap Calculation
  // Formula: Monthly signups × Conversion gap × Estimated value × 12 months
  const industryConversionRate = 3.5; // Industry average
  const conversionGap = Math.max(0, industryConversionRate - sanitizedInputs.currentConversionRate);
  const estimatedCustomerValue = sanitizedInputs.monthlyMRR > 0 ? 
    (sanitizedInputs.monthlyMRR * 12) / Math.max(1, sanitizedInputs.monthlyFreeSignups * sanitizedInputs.currentConversionRate / 100) :
    sanitizedInputs.averageDealValue;
  
  const selfServeGapLoss = Math.min(
    sanitizedInputs.monthlyFreeSignups * (conversionGap / 100) * estimatedCustomerValue * 12,
    sanitizedInputs.currentARR * 0.12 // Cap at 12% of ARR
  );

  console.log('Self-serve calculation:', {
    monthlySignups: sanitizedInputs.monthlyFreeSignups,
    currentConversion: sanitizedInputs.currentConversionRate,
    conversionGap: conversionGap,
    estimatedCustomerValue: estimatedCustomerValue,
    annualLoss: selfServeGapLoss,
    percentOfARR: ((selfServeGapLoss / sanitizedInputs.currentARR) * 100).toFixed(2) + '%'
  });

  // FIXED: Simplified Process Inefficiency Calculation
  // Formula: Weekly hours × Hourly rate × 52 weeks
  const processInefficiencyLoss = Math.min(
    sanitizedInputs.manualHoursPerWeek * sanitizedInputs.hourlyRate * 52,
    sanitizedInputs.currentARR * 0.05 // Cap at 5% of ARR
  );

  console.log('Process inefficiency calculation:', {
    weeklyHours: sanitizedInputs.manualHoursPerWeek,
    hourlyRate: sanitizedInputs.hourlyRate,
    annualCost: processInefficiencyLoss,
    percentOfARR: ((processInefficiencyLoss / sanitizedInputs.currentARR) * 100).toFixed(2) + '%'
  });

  const totalLoss = leadResponseLoss + failedPaymentLoss + selfServeGapLoss + processInefficiencyLoss;

  console.log('Total loss calculation:', {
    leadResponse: leadResponseLoss,
    failedPayment: failedPaymentLoss,
    selfServeGap: selfServeGapLoss,
    processInefficiency: processInefficiencyLoss,
    total: totalLoss,
    percentOfARR: ((totalLoss / sanitizedInputs.currentARR) * 100).toFixed(2) + '%'
  });

  // Determine confidence factors based on inputs and company characteristics
  const confidenceFactors: ConfidenceFactors = {
    companySize: sanitizedInputs.currentARR > 10000000 ? 'enterprise' : 
                 sanitizedInputs.currentARR > 1000000 ? 'scaleup' : 'startup',
    currentMaturity: sanitizedInputs.currentARR > 5000000 ? 'advanced' :
                     sanitizedInputs.currentARR > 1000000 ? 'intermediate' : 'basic',
    resourceAvailable: sanitizedInputs.currentARR > 2000000,
    changeManagementCapability: sanitizedInputs.currentARR > 5000000 ? 'high' :
                                sanitizedInputs.currentARR > 1000000 ? 'medium' : 'low'
  };

  // Calculate realistic recovery potential using new matrix approach
  const losses = {
    leadResponse: leadResponseLoss,
    selfServe: selfServeGapLoss,
    processAutomation: processInefficiencyLoss,
    paymentRecovery: failedPaymentLoss
  };

  const recoveryRanges = calculateRecoveryRanges(losses, confidenceFactors);

  // Determine confidence level based on multiple factors
  const riskFactorCount = [
    totalLoss > sanitizedInputs.currentARR * 0.25, // High loss ratio (reduced from 0.3)
    sanitizedInputs.currentARR < 1000000,         // Small company
    selfServeGapLoss > totalLoss * 0.4,          // Heavy dependence on self-serve
    processInefficiencyLoss > totalLoss * 0.3    // High process inefficiency
  ].filter(Boolean).length;

  const confidenceLevel: 'high' | 'medium' | 'low' = 
    riskFactorCount === 0 ? 'high' :
    riskFactorCount <= 2 ? 'medium' : 'low';

  // Apply progressive confidence multipliers
  const confidenceMultiplier = {
    'high': 0.90,    // Reduced from 0.95
    'medium': 0.75,  // Reduced from 0.85
    'low': 0.60      // Reduced from 0.70
  }[confidenceLevel];

  const recovery70Percent = recoveryRanges.conservative.totalRecovery * confidenceMultiplier;
  const recovery85Percent = recoveryRanges.optimistic.totalRecovery * confidenceMultiplier;
  const recoveryBestCase = recoveryRanges.bestCase.totalRecovery * confidenceMultiplier;

  console.log('Recovery calculations:', {
    conservative: recoveryRanges.conservative.totalRecovery,
    optimistic: recoveryRanges.optimistic.totalRecovery,
    bestCase: recoveryRanges.bestCase.totalRecovery,
    confidenceLevel: confidenceLevel,
    confidenceMultiplier: confidenceMultiplier,
    final70: recovery70Percent,
    final85: recovery85Percent,
    finalBest: recoveryBestCase
  });

  // Calculate confidence bounds with realistic spreads
  const confidenceBounds = {
    lower: recovery70Percent * 0.75, // 25% lower bound
    upper: recoveryBestCase * 1.15   // 15% upper bound
  };

  // Calculate recovery timeline with realistic ramp-up
  const recoveryTimeline = {
    year1: recovery70Percent * 0.25, // 25% in year 1 (more realistic)
    year2: recovery70Percent * 0.70, // 70% by year 2
    year3: recovery70Percent * 1.00  // 100% by year 3
  };

  const finalResults = {
    leadResponseLoss,
    selfServeGapLoss,
    processInefficiencyLoss,
    failedPaymentLoss,
    totalLoss,
    recovery70Percent,
    recovery85Percent,
    recoveryBestCase,
    actionSpecificRecovery: {
      leadResponse: (recoveryRanges.conservative.categoryRecovery.leadResponse || 0) * confidenceMultiplier,
      selfServe: (recoveryRanges.conservative.categoryRecovery.selfServe || 0) * confidenceMultiplier,
      processAutomation: (recoveryRanges.conservative.categoryRecovery.processAutomation || 0) * confidenceMultiplier,
      paymentRecovery: (recoveryRanges.conservative.categoryRecovery.paymentRecovery || 0) * confidenceMultiplier
    },
    implementationFactors: recoveryRanges.conservative.implementationFactors,
    riskAdjustments: recoveryRanges.conservative.riskAdjustments,
    confidenceLevel,
    confidenceBounds,
    recoveryTimeline
  };

  console.log('=== FINAL UNIFIED RESULTS ===', finalResults);
  console.log('Total loss as % of ARR:', ((totalLoss / sanitizedInputs.currentARR) * 100).toFixed(2) + '%');

  return finalResults;
};

// Timeline calculation with realistic phases and dependencies
export interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  startMonth: number;
  endMonth: number;
  difficulty: 'easy' | 'medium' | 'hard';
  recoveryPotential: number;
  prerequisites: string[];
  actions: {
    title: string;
    weeks: number;
    owner: string;
  }[];
}

// Work type classification for realistic cost modeling
export interface WorkTypeConfig {
  dailyRate: number;
  teamSize: number;
  fteFactor: number;
  toolingCostMultiplier: number;
  ongoingMultiplier: number;
}

const WORK_TYPE_CONFIGS: Record<string, WorkTypeConfig> = {
  'quick-optimization': {
    dailyRate: 150,    // Internal optimization work
    teamSize: 1,       // Single person
    fteFactor: 0.2,    // 20% time allocation
    toolingCostMultiplier: 0.1,
    ongoingMultiplier: 0.05
  },
  'tool-implementation': {
    dailyRate: 250,    // Blended internal + some external
    teamSize: 1.2,     // Minimal team
    fteFactor: 0.3,    // 30% time allocation
    toolingCostMultiplier: 0.3,
    ongoingMultiplier: 0.075
  },
  'technical-development': {
    dailyRate: 400,    // Developer rates
    teamSize: 1.5,     // Small dev team
    fteFactor: 0.4,    // 40% time allocation
    toolingCostMultiplier: 0.5,
    ongoingMultiplier: 0.10
  },
  'complex-automation': {
    dailyRate: 500,    // Senior dev + PM
    teamSize: 2,       // Small specialized team
    fteFactor: 0.5,    // 50% time allocation
    toolingCostMultiplier: 0.7,
    ongoingMultiplier: 0.15
  }
};

// Function to classify work type based on phase characteristics
const classifyWorkType = (phase: TimelinePhase): string => {
  switch (phase.id) {
    case 'self-serve-optimization':
      return 'quick-optimization';
    case 'lead-response':
      return 'tool-implementation';
    case 'payment-recovery':
      return 'technical-development';
    case 'process-automation':
      return 'complex-automation';
    default:
      return phase.difficulty === 'easy' ? 'quick-optimization' :
             phase.difficulty === 'medium' ? 'tool-implementation' : 'technical-development';
  }
};

// Enhanced investment calculation with work-type based cost modeling
export const calculateRealisticInvestment = (
  phases: TimelinePhase[],
  inputs: UnifiedCalculationInputs
): { 
  implementationCost: number; 
  ongoingCost: number; 
  totalAnnualInvestment: number;
  paybackMonths: number;
} => {
  // Calculate total annual recovery potential for validation
  const totalRecovery = phases.reduce((sum, phase) => sum + phase.recoveryPotential, 0);
  
  // Company scale factors for tooling and infrastructure
  const getCompanyScaleFactors = (arr: number) => {
    if (arr > 10000000) return { toolingBudget: 25000, infrastructureFactor: 1.2 };
    if (arr > 5000000) return { toolingBudget: 15000, infrastructureFactor: 1.1 };
    if (arr > 1000000) return { toolingBudget: 10000, infrastructureFactor: 1.0 };
    return { toolingBudget: 5000, infrastructureFactor: 0.8 };
  };

  // Industry-specific adjustments (much more conservative)
  const getIndustryFactors = (industry?: string) => {
    const industryMap: Record<string, { complexityFactor: number; complianceFactor: number }> = {
      'fintech': { complexityFactor: 1.2, complianceFactor: 1.3 },
      'healthcare': { complexityFactor: 1.15, complianceFactor: 1.25 },
      'e-commerce': { complexityFactor: 0.9, complianceFactor: 1.0 },
      'saas': { complexityFactor: 1.0, complianceFactor: 1.05 },
      'manufacturing': { complexityFactor: 1.1, complianceFactor: 1.1 },
      'other': { complexityFactor: 1.0, complianceFactor: 1.0 }
    };
    
    const normalizedIndustry = industry?.toLowerCase().replace(/[^a-z]/g, '') || 'other';
    return industryMap[normalizedIndustry] || industryMap.other;
  };

  const scaleFactors = getCompanyScaleFactors(inputs.currentARR);
  const industryFactors = getIndustryFactors(inputs.industry);

  let implementationCost = 0;
  let ongoingAnnualCost = 0;
  
  phases.forEach(phase => {
    const totalWeeks = phase.actions.reduce((sum, action) => sum + action.weeks, 0);
    const workType = classifyWorkType(phase);
    const workConfig = WORK_TYPE_CONFIGS[workType];
    
    // Use work-type specific daily rates
    const dailyRate = workConfig.dailyRate * industryFactors.complexityFactor;
    
    // Apply work-type specific team configuration
    const effectiveTeamSize = workConfig.teamSize * workConfig.fteFactor;
    
    // Weekly cost = daily rate × effective team size × 5 days
    const weeklyTeamCost = dailyRate * effectiveTeamSize * 5;
    
    const phaseImplementationCost = weeklyTeamCost * totalWeeks;
    implementationCost += phaseImplementationCost;
    
    // Use work-type specific ongoing costs
    ongoingAnnualCost += phaseImplementationCost * workConfig.ongoingMultiplier;
  });
  
  // Add reasonable tooling costs (not per-phase, but total)
  implementationCost += scaleFactors.toolingBudget;
  ongoingAnnualCost += scaleFactors.toolingBudget * 0.2; // 20% ongoing for licenses
  
  // Small infrastructure costs
  const baseInfrastructure = Math.min(inputs.currentARR * 0.005, 25000);
  const complianceCosts = baseInfrastructure * (industryFactors.complianceFactor - 1);
  
  implementationCost += baseInfrastructure + complianceCosts;
  ongoingAnnualCost += (baseInfrastructure + complianceCosts) * 0.3;
  
  // Small project management overhead (5% max)
  const projectManagementCost = implementationCost * 0.05;
  implementationCost += projectManagementCost;
  
  // CRITICAL: Investment validation and capping
  const maxInvestmentThreshold = totalRecovery * 0.4; // Never exceed 40% of recovery
  
  if (implementationCost > maxInvestmentThreshold) {
    // Scale down the entire implementation proportionally
    const scalingFactor = maxInvestmentThreshold / implementationCost;
    implementationCost = maxInvestmentThreshold;
    ongoingAnnualCost *= scalingFactor;
  }
  
  // For very small recoveries, suggest minimum viable implementation
  if (totalRecovery < 100000) { // Less than $100K recovery
    implementationCost = Math.min(implementationCost, 25000);
    ongoingAnnualCost = Math.min(ongoingAnnualCost, 5000);
  }
  
  // Total annual investment
  const amortizationYears = 2; // Conservative 2-year payback expectation
  const totalAnnualInvestment = (implementationCost / amortizationYears) + ongoingAnnualCost;
  
  // Calculate realistic payback period
  const monthlyRecovery = totalRecovery / 12;
  const paybackMonths = monthlyRecovery > 0 ? (implementationCost / monthlyRecovery) : 24;
  
  return {
    implementationCost: Math.round(implementationCost),
    ongoingCost: Math.round(ongoingAnnualCost),
    totalAnnualInvestment: Math.round(totalAnnualInvestment),
    paybackMonths: Math.min(Math.round(paybackMonths), 24) // Cap at 2 years
  };
};

// ROI calculation helper
export const calculateRealisticROI = (
  annualRecovery: number,
  totalAnnualInvestment: number,
  confidence: 'high' | 'medium' | 'low'
): { roi: number; confidenceAdjustedROI: number; category: string } => {
  if (totalAnnualInvestment <= 0) return { roi: 0, confidenceAdjustedROI: 0, category: 'Invalid' };
  
  // Basic ROI calculation: ((Annual Recovery - Annual Investment) / Annual Investment) * 100
  const roi = ((annualRecovery - totalAnnualInvestment) / totalAnnualInvestment) * 100;
  
  // Apply confidence adjustment
  const confidenceMultiplier = confidence === 'high' ? 1.0 : 
                              confidence === 'medium' ? 0.8 : 0.6;
  
  const confidenceAdjustedROI = roi * confidenceMultiplier;
  
  // Cap ROI at realistic business levels
  const cappedROI = Math.min(confidenceAdjustedROI, 300);
  
  // Categorize ROI
  let category: string;
  if (cappedROI < 25) category = 'Low Return';
  else if (cappedROI < 75) category = 'Moderate Return';
  else if (cappedROI < 150) category = 'Strong Return';
  else category = 'Exceptional Return';
  
  return { 
    roi: Math.max(roi, -100), // Don't show worse than 100% loss
    confidenceAdjustedROI: Math.max(cappedROI, -100), 
    category 
  };
};

export const generateRealisticTimeline = (
  calculations: UnifiedCalculationResults,
  inputs: UnifiedCalculationInputs
): TimelinePhase[] => {
  const phases: TimelinePhase[] = [];
  const { actionSpecificRecovery } = calculations;
  
  // Realistic thresholds - include phases with meaningful impact
  const arrThreshold = Math.max(inputs.currentARR * 0.005, 25000); // 0.5% of ARR or $25K minimum
  
  // Phase 1: Lead Response (Months 1-3) - Always start here if viable
  if (actionSpecificRecovery.leadResponse > arrThreshold) {
    phases.push({
      id: 'lead-response',
      title: 'Lead Response Optimization',
      description: 'Implement automated lead response and notification systems with 2-month ramp-up',
      startMonth: 1,
      endMonth: 3,
      difficulty: 'easy',
      recoveryPotential: actionSpecificRecovery.leadResponse,
      prerequisites: [],
      actions: [
        { title: 'Audit current response processes', weeks: 2, owner: 'Sales Ops' },
        { title: 'Implement lead automation tools', weeks: 3, owner: 'Marketing' },
        { title: 'Configure notification systems', weeks: 2, owner: 'Sales Ops' },
        { title: 'Train response team', weeks: 2, owner: 'Sales Management' },
        { title: 'Implement lead scoring system', weeks: 3, owner: 'Marketing Ops' },
        { title: 'Monitor and optimize performance', weeks: 2, owner: 'Revenue Ops' }
      ]
    });
  }

  // Phase 2: Payment Recovery (Months 2-5) - Can run parallel with Phase 1
  if (actionSpecificRecovery.paymentRecovery > Math.max(inputs.currentARR * 0.003, 15000)) {
    phases.push({
      id: 'payment-recovery',
      title: 'Payment Recovery System',
      description: 'Implement advanced payment retry logic and failure prevention',
      startMonth: 2,
      endMonth: 5,
      difficulty: 'medium',
      recoveryPotential: actionSpecificRecovery.paymentRecovery,
      prerequisites: [],
      actions: [
        { title: 'Analyze payment failure patterns', weeks: 2, owner: 'Finance' },
        { title: 'Design retry logic system', weeks: 3, owner: 'Engineering' },
        { title: 'Implement payment retry automation', weeks: 4, owner: 'Engineering' },
        { title: 'Add alternative payment methods', weeks: 3, owner: 'Product' },
        { title: 'Deploy dunning management', weeks: 2, owner: 'Finance' },
        { title: 'Monitor recovery performance', weeks: 2, owner: 'Finance' }
      ]
    });
  }

  // Phase 3: Self-Serve Optimization (Months 4-6) - Quick wins only
  if (actionSpecificRecovery.selfServe > arrThreshold) {
    phases.push({
      id: 'self-serve-optimization',
      title: 'Enhance Self-Serve Conversion',
      description: 'Quick optimization wins using existing tools and simple changes',
      startMonth: 4,
      endMonth: 6,
      difficulty: 'easy',
      recoveryPotential: actionSpecificRecovery.selfServe,
      prerequisites: [], // Can run independently
      actions: [
        { title: 'Review conversion analytics', weeks: 1, owner: 'Product' },
        { title: 'Identify quick UX fixes', weeks: 1, owner: 'Product' },
        { title: 'Update onboarding copy', weeks: 2, owner: 'Marketing' },
        { title: 'Add simple conversion triggers', weeks: 2, owner: 'Product' },
        { title: 'Test and deploy changes', weeks: 2, owner: 'Product' }
      ]
    });
  }

  // Phase 4: Process Automation (Months 6-10) - Focus on high-impact automations
  if (actionSpecificRecovery.processAutomation > Math.max(inputs.currentARR * 0.004, 20000)) {
    phases.push({
      id: 'process-automation',
      title: 'Automate Critical Processes',
      description: 'Implement key workflow automations using existing tools',
      startMonth: 6,
      endMonth: 10,
      difficulty: 'hard',
      recoveryPotential: actionSpecificRecovery.processAutomation,
      prerequisites: [], // Can run independently with proper planning
      actions: [
        { title: 'Map current workflows', weeks: 2, owner: 'Operations' },
        { title: 'Identify automation opportunities', weeks: 2, owner: 'Operations' },
        { title: 'Configure automation tools', weeks: 3, owner: 'Operations' },
        { title: 'Implement key automations', weeks: 4, owner: 'Operations' },
        { title: 'Train team on new processes', weeks: 2, owner: 'Operations' },
        { title: 'Monitor and optimize', weeks: 3, owner: 'Operations' }
      ]
    });
  }

  // Validate dependencies and adjust timeline
  const finalPhases = phases.filter(phase => {
    if (phase.prerequisites.length === 0) return true;
    return phase.prerequisites.every(prereq => 
      phases.some(p => p.id === prereq && p.endMonth < phase.startMonth)
    );
  });

  return finalPhases.sort((a, b) => a.startMonth - b.startMonth);
};
