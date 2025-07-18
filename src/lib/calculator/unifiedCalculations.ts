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
  freeToLaidConversion: number;
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

// Main calculation function with enhanced recovery matrix and realistic factors
export const calculateUnifiedResults = (inputs: UnifiedCalculationInputs): UnifiedCalculationResults => {
  // Input sanitization and validation
  const sanitizedInputs = {
    ...inputs,
    currentARR: Math.max(0, inputs.currentARR || 0),
    monthlyLeads: Math.max(0, inputs.monthlyLeads || 0),
    leadResponseTimeHours: Math.max(0.1, Math.min(168, inputs.leadResponseTime || 24)),
    averageDealValue: Math.max(100, inputs.averageDealValue || 5000),
    monthlyFreeSignups: Math.max(0, inputs.monthlyFreeSignups || 0),
    currentConversionRate: Math.max(0, Math.min(25, inputs.freeToLaidConversion || 2)),
    monthlyMRR: Math.max(0, inputs.monthlyMRR || 0),
    failedPaymentRate: Math.max(0, Math.min(30, inputs.failedPaymentRate || 5)),
    manualHoursPerWeek: Math.max(0, Math.min(80, inputs.manualHours || 10)),
    hourlyRate: Math.max(25, Math.min(500, inputs.hourlyRate || 75))
  };

  // Calculate core losses with progressive caps based on company size
  const getCapMultiplier = (arr: number) => {
    if (arr > 10000000) return 1.0;    // Enterprise - full caps
    if (arr > 5000000) return 0.85;    // Large - 85% of caps
    if (arr > 1000000) return 0.70;    // Medium - 70% of caps
    return 0.50;                       // Small - 50% of caps
  };
  
  const capMultiplier = getCapMultiplier(sanitizedInputs.currentARR);

  const leadResponseLoss = Math.min(
    calculateLeadResponseImpact(sanitizedInputs.leadResponseTimeHours, sanitizedInputs.averageDealValue) 
    * sanitizedInputs.monthlyLeads 
    * sanitizedInputs.averageDealValue 
    * 12 
    * (1 - calculateLeadResponseImpact(sanitizedInputs.leadResponseTimeHours, sanitizedInputs.averageDealValue)),
    sanitizedInputs.currentARR * 0.12 * capMultiplier // Progressive cap
  );

  const failedPaymentLoss = Math.min(
    calculateFailedPaymentLoss(sanitizedInputs.monthlyMRR, sanitizedInputs.failedPaymentRate),
    sanitizedInputs.currentARR * 0.10 * capMultiplier
  );

  const selfServeGapLoss = Math.min(
    calculateSelfServeGap(
      sanitizedInputs.monthlyFreeSignups,
      sanitizedInputs.currentConversionRate,
      sanitizedInputs.monthlyMRR,
      sanitizedInputs.industry
    ),
    sanitizedInputs.currentARR * 0.20 * capMultiplier
  );

  const processInefficiencyLoss = Math.min(
    calculateProcessInefficiency(
      sanitizedInputs.manualHoursPerWeek,
      sanitizedInputs.hourlyRate
    ),
    sanitizedInputs.currentARR * 0.06 * capMultiplier
  );

  const totalLoss = leadResponseLoss + failedPaymentLoss + selfServeGapLoss + processInefficiencyLoss;

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
    totalLoss > sanitizedInputs.currentARR * 0.3, // High loss ratio
    sanitizedInputs.currentARR < 1000000,         // Small company
    selfServeGapLoss > totalLoss * 0.4,          // Heavy dependence on self-serve
    processInefficiencyLoss > totalLoss * 0.3    // High process inefficiency
  ].filter(Boolean).length;

  const confidenceLevel: 'high' | 'medium' | 'low' = 
    riskFactorCount === 0 ? 'high' :
    riskFactorCount <= 2 ? 'medium' : 'low';

  // Apply progressive confidence multipliers
  const confidenceMultiplier = {
    'high': 0.95,
    'medium': 0.85,
    'low': 0.70
  }[confidenceLevel];

  const recovery70Percent = recoveryRanges.conservative.totalRecovery * confidenceMultiplier;
  const recovery85Percent = recoveryRanges.optimistic.totalRecovery * confidenceMultiplier;
  const recoveryBestCase = recoveryRanges.bestCase.totalRecovery * confidenceMultiplier;

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

  return {
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

// Enhanced investment calculation with realistic cost modeling
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
  
  // Company scale factors with much more conservative resource allocation
  const getCompanyScaleFactors = (arr: number) => {
    if (arr > 50000000) return { // $50M+ ARR
      blendedDailyRate: 600, // Mix of internal + consulting
      partTimeAllocation: 0.6, // 60% time allocation
      toolingBudget: 150000
    };
    if (arr > 10000000) return { // $10M+ ARR
      blendedDailyRate: 500,
      partTimeAllocation: 0.5,
      toolingBudget: 100000
    };
    if (arr > 5000000) return { // $5M+ ARR
      blendedDailyRate: 400,
      partTimeAllocation: 0.4,
      toolingBudget: 75000
    };
    if (arr > 1000000) return { // $1M+ ARR
      blendedDailyRate: 350,
      partTimeAllocation: 0.3,
      toolingBudget: 50000
    };
    return { // < $1M ARR
      blendedDailyRate: 300,
      partTimeAllocation: 0.25,
      toolingBudget: 25000
    };
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
    
    // Conservative difficulty multipliers
    const difficultyMultiplier = {
      'easy': 1.0,
      'medium': 1.2,
      'hard': 1.4
    }[phase.difficulty];

    // Blended daily rate (internal staff + occasional consulting)
    const dailyRate = scaleFactors.blendedDailyRate * difficultyMultiplier * industryFactors.complexityFactor;
    
    // Small team sizes with part-time allocation
    const teamSize = phase.difficulty === 'easy' ? 1 : 
                    phase.difficulty === 'medium' ? 1.5 : 2;
    
    // Apply part-time allocation to realistic resource commitment
    const effectiveTeamSize = teamSize * scaleFactors.partTimeAllocation;
    
    // Weekly cost = daily rate × effective team size × 5 days
    const weeklyTeamCost = dailyRate * effectiveTeamSize * 5;
    
    const phaseImplementationCost = weeklyTeamCost * totalWeeks;
    implementationCost += phaseImplementationCost;
    
    // Ongoing costs (much lower - 5-10% of implementation cost annually)
    const ongoingMultiplier = phase.difficulty === 'easy' ? 0.05 : 
                             phase.difficulty === 'medium' ? 0.075 : 0.10;
    
    ongoingAnnualCost += phaseImplementationCost * ongoingMultiplier;
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

  // Phase 3: Self-Serve Optimization (Months 4-8) - Depends on lead data
  if (actionSpecificRecovery.selfServe > arrThreshold) {
    phases.push({
      id: 'self-serve-optimization',
      title: 'Self-Serve Conversion Optimization',
      description: 'Improve onboarding flow and conversion funnel with extensive testing',
      startMonth: 4,
      endMonth: 8,
      difficulty: 'medium',
      recoveryPotential: actionSpecificRecovery.selfServe,
      prerequisites: [], // Can run independently
      actions: [
        { title: 'Deep-dive conversion funnel analysis', weeks: 4, owner: 'Product Analytics' },
        { title: 'User research and feedback collection', weeks: 3, owner: 'UX Research' },
        { title: 'Redesign onboarding experience', weeks: 6, owner: 'Product' },
        { title: 'Implement in-app guidance system', weeks: 5, owner: 'Engineering' },
        { title: 'A/B test onboarding improvements', weeks: 8, owner: 'Growth' },
        { title: 'Optimize conversion touchpoints', weeks: 4, owner: 'Product' }
      ]
    });
  }

  // Phase 4: Process Automation (Months 6-12) - Most complex, requires stable foundation
  if (actionSpecificRecovery.processAutomation > Math.max(inputs.currentARR * 0.004, 20000)) {
    phases.push({
      id: 'process-automation',
      title: 'Process Automation Initiative',
      description: 'Comprehensive automation of manual processes and workflow optimization',
      startMonth: 6,
      endMonth: 12,
      difficulty: 'hard',
      recoveryPotential: actionSpecificRecovery.processAutomation,
      prerequisites: [], // Can run independently with proper planning
      actions: [
        { title: 'Comprehensive process audit', weeks: 4, owner: 'Operations' },
        { title: 'Process mapping and documentation', weeks: 3, owner: 'Operations' },
        { title: 'Automation tool evaluation', weeks: 3, owner: 'IT' },
        { title: 'Workflow automation design', weeks: 6, owner: 'Operations' },
        { title: 'Automation platform implementation', weeks: 8, owner: 'Engineering' },
        { title: 'Team training and change management', weeks: 4, owner: 'HR' },
        { title: 'Rollout and optimization', weeks: 4, owner: 'Operations' }
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