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

// Investment calculation helper
export const calculateRealisticInvestment = (
  phases: TimelinePhase[],
  inputs: UnifiedCalculationInputs
): { 
  implementationCost: number; 
  ongoingCost: number; 
  totalAnnualInvestment: number;
  paybackMonths: number;
} => {
  // Activity-based costing instead of flat percentages
  let implementationCost = 0;
  let ongoingAnnualCost = 0;
  
  phases.forEach(phase => {
    const totalWeeks = phase.actions.reduce((sum, action) => sum + action.weeks, 0);
    
    // Calculate implementation cost based on phase complexity and duration
    const costPerWeek = phase.difficulty === 'easy' ? 5000 : 
                       phase.difficulty === 'medium' ? 8000 : 12000;
    
    implementationCost += totalWeeks * costPerWeek;
    
    // Ongoing operational costs (maintenance, tools, training)
    const ongoingCostMultiplier = phase.difficulty === 'easy' ? 0.1 : 
                                 phase.difficulty === 'medium' ? 0.15 : 0.2;
    
    ongoingAnnualCost += (totalWeeks * costPerWeek) * ongoingCostMultiplier;
  });
  
  // Add base infrastructure and tool costs
  const baseInfrastructureCost = Math.min(inputs.currentARR * 0.02, 50000);
  implementationCost += baseInfrastructureCost;
  ongoingAnnualCost += baseInfrastructureCost * 0.3; // 30% of base for ongoing
  
  // Total annual investment (implementation amortized over 3 years + ongoing)
  const totalAnnualInvestment = (implementationCost / 3) + ongoingAnnualCost;
  
  // Calculate payback period
  const totalRecovery = phases.reduce((sum, phase) => sum + phase.recoveryPotential, 0);
  const paybackMonths = totalRecovery > 0 ? (implementationCost / (totalRecovery / 12)) : 36;
  
  return {
    implementationCost,
    ongoingCost: ongoingAnnualCost,
    totalAnnualInvestment,
    paybackMonths: Math.min(paybackMonths, 36) // Cap at 3 years
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
  const { actionRecoveryPotential } = calculations;
  
  // Stricter thresholds - only include phases with meaningful impact
  const arrThreshold = inputs.currentARR * 0.02; // 2% of ARR minimum
  
  // Phase 1: Lead Response (Months 1-3) - Always start here if viable
  if (actionRecoveryPotential.leadResponse > arrThreshold) {
    phases.push({
      id: 'lead-response',
      title: 'Lead Response Optimization',
      description: 'Implement automated lead response and notification systems with 2-month ramp-up',
      startMonth: 1,
      endMonth: 3,
      difficulty: 'easy',
      recoveryPotential: actionRecoveryPotential.leadResponse,
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
  if (actionRecoveryPotential.paymentRecovery > inputs.currentARR * 0.01) {
    phases.push({
      id: 'payment-recovery',
      title: 'Payment Recovery System',
      description: 'Implement advanced payment retry logic and failure prevention',
      startMonth: 2,
      endMonth: 5,
      difficulty: 'medium',
      recoveryPotential: actionRecoveryPotential.paymentRecovery,
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
  if (actionRecoveryPotential.selfServeOptimization > arrThreshold) {
    phases.push({
      id: 'self-serve-optimization',
      title: 'Self-Serve Conversion Optimization',
      description: 'Improve onboarding flow and conversion funnel with extensive testing',
      startMonth: 4,
      endMonth: 8,
      difficulty: 'medium',
      recoveryPotential: actionRecoveryPotential.selfServeOptimization,
      prerequisites: ['lead-response'], // Need better lead data first
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
  if (actionRecoveryPotential.processAutomation > inputs.currentARR * 0.015) {
    phases.push({
      id: 'process-automation',
      title: 'Process Automation Initiative',
      description: 'Comprehensive automation of manual processes and workflow optimization',
      startMonth: 6,
      endMonth: 12,
      difficulty: 'hard',
      recoveryPotential: actionRecoveryPotential.processAutomation,
      prerequisites: ['payment-recovery'], // Need stable operational foundation
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