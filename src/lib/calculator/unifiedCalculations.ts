// Unified calculation engine for Action Plan system
// This serves as the single source of truth for all calculations

import {
  calculateLeadResponseImpact,
  calculateSelfServeGap,
  calculateProcessInefficiency,
  calculateFailedPaymentLoss,
  INDUSTRY_BENCHMARKS
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
  // Core losses (bounded and validated)
  leadResponseLoss: number;
  selfServeGapLoss: number;
  processInefficiencyLoss: number;
  failedPaymentLoss: number;
  totalLeak: number;
  
  // Recovery potential (realistic bounds)
  conservativeRecovery: number; // 50-60% of losses
  optimisticRecovery: number;   // 70-80% of losses
  
  // Action-specific recovery (prevents double counting)
  actionRecoveryPotential: {
    leadResponse: number;
    selfServeOptimization: number;
    processAutomation: number;
    paymentRecovery: number;
  };
  
  // Validation metadata
  confidence: 'high' | 'medium' | 'low';
  bounds: {
    maxTotalLeak: number;
    maxRecovery: number;
    warningFlags: string[];
  };
}

export const calculateUnifiedResults = (inputs: UnifiedCalculationInputs): UnifiedCalculationResults => {
  // Input validation and sanitization
  const sanitizedInputs = {
    currentARR: Math.max(0, inputs.currentARR || 0),
    monthlyMRR: Math.max(0, inputs.monthlyMRR || 0),
    monthlyLeads: Math.max(0, inputs.monthlyLeads || 0),
    averageDealValue: Math.max(0, inputs.averageDealValue || 0),
    leadResponseTime: Math.max(0, inputs.leadResponseTime || 0),
    monthlyFreeSignups: Math.max(0, inputs.monthlyFreeSignups || 0),
    freeToLaidConversion: Math.max(0, Math.min(100, inputs.freeToLaidConversion || 0)),
    failedPaymentRate: Math.max(0, Math.min(50, inputs.failedPaymentRate || 0)),
    manualHours: Math.max(0, Math.min(80, inputs.manualHours || 0)),
    hourlyRate: Math.max(0, Math.min(500, inputs.hourlyRate || 0)),
    industry: inputs.industry || 'other'
  };

  const warnings: string[] = [];
  
  // Calculate individual losses with realistic bounds
  let leadResponseLoss = 0;
  if (sanitizedInputs.leadResponseTime > 1 && sanitizedInputs.averageDealValue > 0 && sanitizedInputs.monthlyLeads > 0) {
    const currentEffectiveness = calculateLeadResponseImpact(sanitizedInputs.leadResponseTime, sanitizedInputs.averageDealValue);
    const targetEffectiveness = calculateLeadResponseImpact(1, sanitizedInputs.averageDealValue);
    
    // Calculate annual lead value with conservative conversion rate
    const conversionRate = sanitizedInputs.freeToLaidConversion > 0 ? sanitizedInputs.freeToLaidConversion / 100 : 0.03;
    const annualLeadValue = sanitizedInputs.monthlyLeads * sanitizedInputs.averageDealValue * conversionRate * 12;
    
    // Calculate potential recovery from lead response improvement
    const currentLoss = annualLeadValue * (1 - currentEffectiveness);
    const targetLoss = annualLeadValue * (1 - targetEffectiveness);
    leadResponseLoss = Math.max(0, currentLoss - targetLoss);
    
    // Cap at 20% of ARR (previously unlimited)
    const maxLeadResponseLoss = sanitizedInputs.currentARR * 0.2;
    if (leadResponseLoss > maxLeadResponseLoss) {
      leadResponseLoss = maxLeadResponseLoss;
      warnings.push('Lead response loss capped at 20% of ARR');
    }
  }

  // Self-serve gap calculation with conservative bounds
  let selfServeGapLoss = 0;
  if (sanitizedInputs.monthlyFreeSignups > 0 && sanitizedInputs.monthlyMRR > 0) {
    selfServeGapLoss = calculateSelfServeGap(
      sanitizedInputs.monthlyFreeSignups,
      sanitizedInputs.freeToLaidConversion,
      sanitizedInputs.monthlyMRR,
      sanitizedInputs.industry
    );
    
    // Cap at 30% of ARR (previously could be much higher)
    const maxSelfServeLoss = sanitizedInputs.currentARR * 0.3;
    if (selfServeGapLoss > maxSelfServeLoss) {
      selfServeGapLoss = maxSelfServeLoss;
      warnings.push('Self-serve gap loss capped at 30% of ARR');
    }
  }

  // Process inefficiency calculation
  let processInefficiencyLoss = 0;
  if (sanitizedInputs.manualHours > 0 && sanitizedInputs.hourlyRate > 0) {
    processInefficiencyLoss = calculateProcessInefficiency(
      sanitizedInputs.manualHours,
      sanitizedInputs.hourlyRate,
      0.7 // 70% automation potential
    );
    
    // Cap at 15% of ARR
    const maxProcessLoss = sanitizedInputs.currentARR * 0.15;
    if (processInefficiencyLoss > maxProcessLoss) {
      processInefficiencyLoss = maxProcessLoss;
      warnings.push('Process inefficiency loss capped at 15% of ARR');
    }
  }

  // Failed payment loss calculation
  let failedPaymentLoss = 0;
  if (sanitizedInputs.failedPaymentRate > 0 && sanitizedInputs.monthlyMRR > 0) {
    failedPaymentLoss = calculateFailedPaymentLoss(
      sanitizedInputs.monthlyMRR,
      sanitizedInputs.failedPaymentRate / 100,
      'basic'
    );
    
    // Cap at 10% of ARR
    const maxPaymentLoss = sanitizedInputs.currentARR * 0.1;
    if (failedPaymentLoss > maxPaymentLoss) {
      failedPaymentLoss = maxPaymentLoss;
      warnings.push('Failed payment loss capped at 10% of ARR');
    }
  }

  // Calculate total leak with absolute ceiling
  const rawTotalLeak = leadResponseLoss + selfServeGapLoss + processInefficiencyLoss + failedPaymentLoss;
  const maxTotalLeak = sanitizedInputs.currentARR * 0.6; // Maximum 60% of ARR
  const totalLeak = Math.min(rawTotalLeak, maxTotalLeak);
  
  if (rawTotalLeak > maxTotalLeak) {
    warnings.push('Total leak capped at 60% of ARR');
  }

  // Calculate realistic recovery potentials (prevent double counting)
  const baseRecoveryRate = 0.6; // Conservative base rate
  const optimisticRecoveryRate = 0.75; // Optimistic but realistic rate
  
  // Conservative recovery: 60% of total leak, capped at 40% of ARR
  const conservativeRecovery = Math.min(totalLeak * baseRecoveryRate, sanitizedInputs.currentARR * 0.4);
  
  // Optimistic recovery: 75% of total leak, capped at 50% of ARR
  const optimisticRecovery = Math.min(totalLeak * optimisticRecoveryRate, sanitizedInputs.currentARR * 0.5);

  // Action-specific recovery potential (prevents double counting)
  const actionRecoveryPotential = {
    leadResponse: Math.min(leadResponseLoss * 0.7, sanitizedInputs.currentARR * 0.15),
    selfServeOptimization: Math.min(selfServeGapLoss * 0.6, sanitizedInputs.currentARR * 0.2),
    processAutomation: Math.min(processInefficiencyLoss * 0.8, sanitizedInputs.currentARR * 0.1),
    paymentRecovery: Math.min(failedPaymentLoss * 0.5, sanitizedInputs.currentARR * 0.05)
  };

  // Confidence calculation
  let confidence: 'high' | 'medium' | 'low' = 'high';
  
  if (sanitizedInputs.currentARR < 100000) confidence = 'low';
  else if (sanitizedInputs.monthlyLeads < 20 || sanitizedInputs.monthlyFreeSignups < 50) confidence = 'medium';
  
  if (totalLeak > sanitizedInputs.currentARR * 0.4) confidence = 'low';
  
  return {
    leadResponseLoss,
    selfServeGapLoss,
    processInefficiencyLoss,
    failedPaymentLoss,
    totalLeak,
    conservativeRecovery,
    optimisticRecovery,
    actionRecoveryPotential,
    confidence,
    bounds: {
      maxTotalLeak,
      maxRecovery: optimisticRecovery,
      warningFlags: warnings
    }
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

export const generateRealisticTimeline = (
  calculations: UnifiedCalculationResults,
  inputs: UnifiedCalculationInputs
): TimelinePhase[] => {
  const phases: TimelinePhase[] = [];
  const { actionRecoveryPotential } = calculations;
  
  // Phase 1: Quick Wins (Months 1-2)
  if (actionRecoveryPotential.leadResponse > inputs.currentARR * 0.01) {
    phases.push({
      id: 'lead-response',
      title: 'Lead Response Optimization',
      description: 'Implement automated lead response and notification systems',
      startMonth: 1,
      endMonth: 2,
      difficulty: 'easy',
      recoveryPotential: actionRecoveryPotential.leadResponse,
      prerequisites: [],
      actions: [
        { title: 'Set up lead automation tools', weeks: 2, owner: 'Marketing' },
        { title: 'Configure notification systems', weeks: 1, owner: 'Sales Ops' },
        { title: 'Train response team', weeks: 2, owner: 'Sales Management' },
        { title: 'Implement lead scoring', weeks: 3, owner: 'Marketing Ops' }
      ]
    });
  }

  // Phase 2: Payment Recovery (Months 2-4) - Can run parallel with Phase 1
  if (actionRecoveryPotential.paymentRecovery > inputs.currentARR * 0.005) {
    phases.push({
      id: 'payment-recovery',
      title: 'Payment Recovery System',
      description: 'Implement advanced payment retry logic and multiple payment methods',
      startMonth: 2,
      endMonth: 4,
      difficulty: 'medium',
      recoveryPotential: actionRecoveryPotential.paymentRecovery,
      prerequisites: [],
      actions: [
        { title: 'Audit current payment flows', weeks: 2, owner: 'Finance' },
        { title: 'Implement retry logic', weeks: 4, owner: 'Engineering' },
        { title: 'Add alternative payment methods', weeks: 3, owner: 'Product' },
        { title: 'Set up dunning management', weeks: 2, owner: 'Finance' }
      ]
    });
  }

  // Phase 3: Self-Serve Optimization (Months 3-6)
  if (actionRecoveryPotential.selfServeOptimization > inputs.currentARR * 0.02) {
    phases.push({
      id: 'self-serve-optimization',
      title: 'Self-Serve Conversion Optimization',
      description: 'Improve onboarding flow and conversion funnel',
      startMonth: 3,
      endMonth: 6,
      difficulty: 'medium',
      recoveryPotential: actionRecoveryPotential.selfServeOptimization,
      prerequisites: ['lead-response'], // Benefit from better lead data
      actions: [
        { title: 'Analyze conversion funnel', weeks: 3, owner: 'Product Analytics' },
        { title: 'Redesign onboarding flow', weeks: 6, owner: 'Product' },
        { title: 'Implement in-app guidance', weeks: 4, owner: 'Engineering' },
        { title: 'A/B test improvements', weeks: 8, owner: 'Growth' }
      ]
    });
  }

  // Phase 4: Process Automation (Months 4-8)
  if (actionRecoveryPotential.processAutomation > inputs.currentARR * 0.01) {
    phases.push({
      id: 'process-automation',
      title: 'Process Automation Initiative',
      description: 'Automate manual processes and eliminate operational inefficiencies',
      startMonth: 4,
      endMonth: 8,
      difficulty: 'hard',
      recoveryPotential: actionRecoveryPotential.processAutomation,
      prerequisites: ['payment-recovery'], // Need stable systems first
      actions: [
        { title: 'Process audit and mapping', weeks: 4, owner: 'Operations' },
        { title: 'Automation tool selection', weeks: 3, owner: 'IT' },
        { title: 'Workflow automation setup', weeks: 8, owner: 'Engineering' },
        { title: 'Team training and rollout', weeks: 4, owner: 'Operations' }
      ]
    });
  }

  return phases.sort((a, b) => a.startMonth - b.startMonth);
};