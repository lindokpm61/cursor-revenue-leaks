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
    
    // Cap at 15% of ARR (more conservative)
    const maxLeadResponseLoss = sanitizedInputs.currentARR * 0.15;
    if (leadResponseLoss > maxLeadResponseLoss) {
      leadResponseLoss = maxLeadResponseLoss;
      warnings.push('Lead response loss capped at 15% of ARR');
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
    
    // Cap at 20% of ARR (more conservative)
    const maxSelfServeLoss = sanitizedInputs.currentARR * 0.2;
    if (selfServeGapLoss > maxSelfServeLoss) {
      selfServeGapLoss = maxSelfServeLoss;
      warnings.push('Self-serve gap loss capped at 20% of ARR');
    }
  }

  // Process inefficiency calculation
  let processInefficiencyLoss = 0;
  if (sanitizedInputs.manualHours > 0 && sanitizedInputs.hourlyRate > 0) {
    processInefficiencyLoss = calculateProcessInefficiency(
      sanitizedInputs.manualHours,
      sanitizedInputs.hourlyRate,
      0.6 // Reduced to 60% automation potential (more realistic)
    );
    
    // Cap at 10% of ARR (more conservative)
    const maxProcessLoss = sanitizedInputs.currentARR * 0.1;
    if (processInefficiencyLoss > maxProcessLoss) {
      processInefficiencyLoss = maxProcessLoss;
      warnings.push('Process inefficiency loss capped at 10% of ARR');
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
    
    // Cap at 8% of ARR (more conservative)
    const maxPaymentLoss = sanitizedInputs.currentARR * 0.08;
    if (failedPaymentLoss > maxPaymentLoss) {
      failedPaymentLoss = maxPaymentLoss;
      warnings.push('Failed payment loss capped at 8% of ARR');
    }
  }

  // Calculate total leak with realistic ceiling
  const rawTotalLeak = leadResponseLoss + selfServeGapLoss + processInefficiencyLoss + failedPaymentLoss;
  const maxTotalLeak = sanitizedInputs.currentARR * 0.45; // Maximum 45% of ARR (more realistic)
  const totalLeak = Math.min(rawTotalLeak, maxTotalLeak);
  
  if (rawTotalLeak > maxTotalLeak) {
    warnings.push('Total leak capped at 45% of ARR');
  }

  // Calculate realistic recovery potentials with confidence adjustment
  const confidenceMultiplier = sanitizedInputs.currentARR > 1000000 ? 1.0 : 
                              sanitizedInputs.currentARR > 500000 ? 0.9 : 
                              sanitizedInputs.currentARR > 100000 ? 0.8 : 0.7;
                              
  const baseRecoveryRate = 0.5 * confidenceMultiplier; // Conservative base rate with confidence adjustment
  const optimisticRecoveryRate = 0.65 * confidenceMultiplier; // Optimistic but realistic rate
  
  // Conservative recovery: 50% of total leak (adjusted by confidence), capped at 25% of ARR
  const conservativeRecovery = Math.min(totalLeak * baseRecoveryRate, sanitizedInputs.currentARR * 0.25);
  
  // Optimistic recovery: 65% of total leak (adjusted by confidence), capped at 30% of ARR
  const optimisticRecovery = Math.min(totalLeak * optimisticRecoveryRate, sanitizedInputs.currentARR * 0.3);

  // Action-specific recovery potential (prevents double counting, more conservative)
  const actionRecoveryPotential = {
    leadResponse: Math.min(leadResponseLoss * 0.5, sanitizedInputs.currentARR * 0.08) * confidenceMultiplier,
    selfServeOptimization: Math.min(selfServeGapLoss * 0.4, sanitizedInputs.currentARR * 0.1) * confidenceMultiplier,
    processAutomation: Math.min(processInefficiencyLoss * 0.6, sanitizedInputs.currentARR * 0.06) * confidenceMultiplier,
    paymentRecovery: Math.min(failedPaymentLoss * 0.7, sanitizedInputs.currentARR * 0.04) * confidenceMultiplier
  };

  // Enhanced confidence calculation
  let confidence: 'high' | 'medium' | 'low' = 'high';
  
  if (sanitizedInputs.currentARR < 500000) confidence = 'low';
  else if (sanitizedInputs.currentARR < 1000000) confidence = 'medium';
  
  if (sanitizedInputs.monthlyLeads < 50 || sanitizedInputs.monthlyFreeSignups < 100) {
    confidence = confidence === 'high' ? 'medium' : 'low';
  }
  
  if (totalLeak > sanitizedInputs.currentARR * 0.3) {
    confidence = 'low';
  }
  
  // Add realistic validation flags
  if (optimisticRecovery > sanitizedInputs.currentARR * 0.25) {
    warnings.push('Recovery potential may require significant operational changes');
  }
  
  if (totalLeak < sanitizedInputs.currentARR * 0.05) {
    warnings.push('Total leak may be underestimated for business size');
  }
  
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