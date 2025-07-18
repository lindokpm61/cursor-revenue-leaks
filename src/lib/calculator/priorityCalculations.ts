import { Tables } from '@/integrations/supabase/types';

type Submission = Tables<'submissions'>;

export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  impact: number;
  effort: 'Low' | 'Medium' | 'High';
  timeframe: string;
  recoveryAmount: number;
  confidence: 'High' | 'Medium' | 'Low';
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  complexity: 'Low' | 'Medium' | 'High';
  paybackPeriod: string;
  whyItMatters: string;
  dependencies: string[];
  implementationSteps: string[];
}

export interface QuickWin {
  action: string;
  impact: number;
  timeframe: string;
  recoveryAmount: number;
  confidence: 'High' | 'Medium' | 'Low';
  complexity: 'Low' | 'Medium' | 'High';
  whyItMatters: string;
}

export interface ExecutiveSummary {
  totalLeakage: number;
  realisticRecovery: number;
  priorityActions: PriorityAction[];
  quickWins: QuickWin[];
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  confidenceLevel: 'High' | 'Medium' | 'Low';
  timeToValue: string;
  businessImpact: string;
}

const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Dynamic confidence scoring based on loss amount and company size
function getConfidenceLevel(lossAmount: number, currentARR: number, actionType: string): 'High' | 'Medium' | 'Low' {
  const lossPercentage = currentARR > 0 ? (lossAmount / currentARR) * 100 : 0;
  
  // Higher confidence for larger companies and more significant losses
  if (currentARR > 10000000 && lossPercentage > 5) return 'High'; // $10M+ ARR with 5%+ loss
  if (currentARR > 5000000 && lossPercentage > 3) return 'High';  // $5M+ ARR with 3%+ loss
  if (currentARR > 1000000 && lossPercentage > 2) return 'Medium'; // $1M+ ARR with 2%+ loss
  if (lossPercentage > 1) return 'Medium'; // Any company with 1%+ loss
  return 'Low';
}

// Dynamic urgency based on relative impact
function getUrgencyLevel(lossAmount: number, currentARR: number, actionType: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  const lossPercentage = currentARR > 0 ? (lossAmount / currentARR) * 100 : 0;
  
  // Urgency based on percentage of ARR lost
  if (lossPercentage > 8) return 'Critical';
  if (lossPercentage > 5) return 'High';
  if (lossPercentage > 2) return 'Medium';
  return 'Low';
}

// Helper functions to create action objects
function createLeadResponseAction(recovery: number, totalRecovery: number, currentARR: number, loss: number): PriorityAction {
  return {
    id: 'lead-response',
    title: 'Accelerate Lead Response Time',
    description: 'Implement automated lead routing and instant response systems',
    impact: Math.round((recovery / totalRecovery) * 100),
    effort: 'Medium',
    timeframe: '4-6 weeks',
    recoveryAmount: recovery,
    confidence: getConfidenceLevel(loss, currentARR, 'lead_response'),
    urgency: getUrgencyLevel(loss, currentARR, 'lead_response'),
    complexity: 'Medium',
    paybackPeriod: '2-3 months',
    whyItMatters: 'Faster lead response dramatically increases conversion rates. Every hour of delay reduces conversion probability by 10%.',
    dependencies: ['CRM integration', 'Sales team training'],
    implementationSteps: [
      'Set up automated lead routing',
      'Create instant response templates',
      'Train sales team on new process',
      'Monitor response time metrics'
    ]
  };
}

function createSelfServeAction(recovery: number, totalRecovery: number, currentARR: number, loss: number): PriorityAction {
  return {
    id: 'selfserve-optimization',
    title: 'Optimize Self-Serve Experience',
    description: 'Improve onboarding flow and reduce friction points',
    impact: Math.round((recovery / totalRecovery) * 100),
    effort: 'High',
    timeframe: '8-12 weeks',
    recoveryAmount: recovery,
    confidence: getConfidenceLevel(loss, currentARR, 'selfserve'),
    urgency: getUrgencyLevel(loss, currentARR, 'selfserve'),
    complexity: 'High',
    paybackPeriod: '4-6 months',
    whyItMatters: 'Self-serve optimization reduces customer acquisition costs and improves user experience, leading to higher conversion rates.',
    dependencies: ['UX/UI team', 'Product development', 'User research'],
    implementationSteps: [
      'Conduct user journey analysis',
      'Identify friction points in onboarding',
      'Design improved user flows',
      'A/B test new experience',
      'Roll out optimized flow'
    ]
  };
}

function createProcessAction(recovery: number, totalRecovery: number, currentARR: number, loss: number): PriorityAction {
  return {
    id: 'process-automation',
    title: 'Automate Manual Processes',
    description: 'Eliminate repetitive tasks and streamline workflows',
    impact: Math.round((recovery / totalRecovery) * 100),
    effort: 'Low',
    timeframe: '2-4 weeks',
    recoveryAmount: recovery,
    confidence: getConfidenceLevel(loss, currentARR, 'process'),
    urgency: getUrgencyLevel(loss, currentARR, 'process'),
    complexity: 'Low',
    paybackPeriod: '1-2 months',
    whyItMatters: 'Automation reduces operational costs, eliminates human error, and frees up team capacity for strategic work.',
    dependencies: ['Operations team', 'Technical resources'],
    implementationSteps: [
      'Map current manual processes',
      'Identify automation opportunities',
      'Implement workflow automation',
      'Train team on new processes',
      'Monitor efficiency gains'
    ]
  };
}

function createPaymentAction(recovery: number, totalRecovery: number, currentARR: number, loss: number): PriorityAction {
  return {
    id: 'payment-recovery',
    title: 'Improve Payment Recovery',
    description: 'Implement dunning management and payment retry logic',
    impact: Math.round((recovery / totalRecovery) * 100),
    effort: 'Low',
    timeframe: '1-2 weeks',
    recoveryAmount: recovery,
    confidence: getConfidenceLevel(loss, currentARR, 'payment'),
    urgency: getUrgencyLevel(loss, currentARR, 'payment'),
    complexity: 'Low',
    paybackPeriod: '1 month',
    whyItMatters: 'Failed payment recovery directly impacts revenue retention and reduces involuntary churn.',
    dependencies: ['Payment processor integration', 'Customer success team'],
    implementationSteps: [
      'Set up automated dunning sequences',
      'Implement smart retry logic',
      'Create customer communication templates',
      'Monitor recovery rates',
      'Optimize based on performance'
    ]
  };
}

export function calculatePriorityActions(submission: Submission): PriorityAction[] {
  console.log("=== PRIORITY ACTIONS CALCULATION DEBUG ===");
  console.log("Input submission:", submission);

  // FIXED: Check if submission has pre-calculated losses or extract from calculator_data
  let currentARR, leadResponseLoss, selfserveGapLoss, processLoss, failedPaymentLoss, totalRecovery;

  if (submission.lead_response_loss !== undefined) {
    // Use pre-calculated values (new format)
    currentARR = safeNumber(submission.current_arr);
    leadResponseLoss = safeNumber(submission.lead_response_loss);
    selfserveGapLoss = safeNumber(submission.selfserve_gap_loss);
    processLoss = safeNumber(submission.process_inefficiency_loss);
    failedPaymentLoss = safeNumber(submission.failed_payment_loss);
    totalRecovery = safeNumber(submission.recovery_potential_70);
  } else {
    // Extract from raw submission data (fallback)
    currentARR = safeNumber(submission.current_arr);
    leadResponseLoss = 0; // Will be calculated below if needed
    selfserveGapLoss = 0;
    processLoss = 0;
    failedPaymentLoss = 0;
    totalRecovery = safeNumber(submission.recovery_potential_70);
  }

  console.log("=== EXTRACTED VALUES ===");
  console.log({
    currentARR,
    leadResponseLoss,
    selfserveGapLoss,
    processLoss,
    failedPaymentLoss,
    totalRecovery
  });

  // Calculate realistic action-specific recoveries (conservative estimates)
  const leadResponseRecovery = leadResponseLoss * 0.5; // 50% recovery potential
  const selfserveRecovery = selfserveGapLoss * 0.4; // 40% recovery potential
  const processRecovery = processLoss * 0.6; // 60% recovery potential
  const paymentRecovery = failedPaymentLoss * 0.7; // 70% recovery potential

  // Calculate total potential recovery for impact percentages
  const totalActionRecovery = leadResponseRecovery + selfserveRecovery + processRecovery + paymentRecovery;
  
  const actions: PriorityAction[] = [];

  // CRITICAL FIX: Much lower thresholds - virtually any loss should trigger actions
  const leadResponseThreshold = Math.max(currentARR * 0.0001, 1000); // 0.01% of ARR or $1K minimum
  const selfserveThreshold = Math.max(currentARR * 0.0001, 500); // 0.01% of ARR or $500 minimum
  const processThreshold = Math.max(currentARR * 0.0001, 1000); // 0.01% of ARR or $1K minimum
  const paymentThreshold = Math.max(currentARR * 0.0001, 500); // 0.01% of ARR or $500 minimum

  console.log('=== ULTRA-LOW PRIORITY ACTION THRESHOLDS ===');
  console.log({
    currentARR,
    leadResponseLoss,
    selfserveGapLoss,
    processLoss,
    failedPaymentLoss,
    leadResponseThreshold,
    selfserveThreshold,
    processThreshold,
    paymentThreshold,
    totalActionRecovery,
    totalRecovery
  });

  // Lead Response Optimization (if ANY significant loss)
  if (leadResponseLoss > leadResponseThreshold) {
    console.log("Adding lead response action - loss:", leadResponseLoss, "threshold:", leadResponseThreshold);
    actions.push(createLeadResponseAction(leadResponseRecovery, totalActionRecovery, currentARR, leadResponseLoss));
  } else {
    console.log("Skipping lead response action - loss:", leadResponseLoss, "threshold:", leadResponseThreshold);
  }

  // Self-Serve Gap (if ANY significant loss)
  if (selfserveGapLoss > selfserveThreshold) {
    console.log("Adding self-serve action - loss:", selfserveGapLoss, "threshold:", selfserveThreshold);
    actions.push(createSelfServeAction(selfserveRecovery, totalActionRecovery, currentARR, selfserveGapLoss));
  } else {
    console.log("Skipping self-serve action - loss:", selfserveGapLoss, "threshold:", selfserveThreshold);
  }

  // Process Inefficiency (if ANY significant loss)
  if (processLoss > processThreshold) {
    console.log("Adding process action - loss:", processLoss, "threshold:", processThreshold);
    actions.push(createProcessAction(processRecovery, totalActionRecovery, currentARR, processLoss));
  } else {
    console.log("Skipping process action - loss:", processLoss, "threshold:", processThreshold);
  }

  // Payment Recovery (if ANY significant loss)
  if (failedPaymentLoss > paymentThreshold) {
    console.log("Adding payment action - loss:", failedPaymentLoss, "threshold:", paymentThreshold);
    actions.push(createPaymentAction(paymentRecovery, totalActionRecovery, currentARR, failedPaymentLoss));
  } else {
    console.log("Skipping payment action - loss:", failedPaymentLoss, "threshold:", paymentThreshold);
  }

  // ENHANCED: Always ensure we have 4 actions if data is available
  console.log("Current actions count:", actions.length);
  
  // Check for any meaningful data and create corresponding actions if missing
  const hasLeadData = (submission.monthly_leads || 0) > 0 && (submission.average_deal_value || 0) > 0;
  const hasSelfServeData = (submission.monthly_free_signups || 0) > 0;
  const hasProcessData = (submission.manual_hours || 0) > 0 && (submission.hourly_rate || 0) > 0;
  const hasPaymentData = (submission.monthly_mrr || 0) > 0 && (submission.failed_payment_rate || 0) > 0;

  console.log("Data availability check:", {
    hasLeadData,
    hasSelfServeData,
    hasProcessData,
    hasPaymentData
  });

  // Add self-serve action if data is available but action wasn't created
  if (hasSelfServeData && !actions.find(a => a.id === 'selfserve-optimization')) {
    console.log("Adding self-serve action based on signup data");
    const monthlySignups = safeNumber(submission.monthly_free_signups);
    const conversionRate = safeNumber(submission.free_to_paid_conversion);
    const dealValue = safeNumber(submission.average_deal_value);
    // Calculate potential recovery from improving conversion rate by 1.5%
    const improvementPotential = Math.max(1.5, conversionRate * 0.5);
    const annualRecovery = monthlySignups * (improvementPotential / 100) * dealValue * 12;
    actions.push(createSelfServeAction(annualRecovery * 0.4, totalActionRecovery, currentARR, annualRecovery));
  }

  // If still no actions, create fallback actions with minimal values
  if (actions.length === 0) {
    console.log("No actions met thresholds, creating fallback actions");
    
    if (hasLeadData) {
      actions.push(createLeadResponseAction(10000, 50000, currentARR, 5000));
    }
    if (hasSelfServeData) {
      actions.push(createSelfServeAction(8000, 50000, currentARR, 4000));
    }
    if (hasProcessData) {
      actions.push(createProcessAction(15000, 50000, currentARR, 7500));
    }
    if (hasPaymentData) {
      actions.push(createPaymentAction(5000, 50000, currentARR, 2500));
    }
  }

  // Recalculate impact percentages for displayed actions only
  const totalDisplayedRecovery = actions.reduce((sum, action) => sum + action.recoveryAmount, 0);
  if (totalDisplayedRecovery > 0) {
    actions.forEach(action => {
      action.impact = Math.round((action.recoveryAmount / totalDisplayedRecovery) * 100);
    });
  }

  console.log("=== FINAL PRIORITY ACTIONS ===");
  console.log("Generated actions:", actions);

  // Sort by recovery amount (highest first) and limit to top 4
  return actions.sort((a, b) => b.recoveryAmount - a.recoveryAmount).slice(0, 4);
}

export function calculateQuickWins(submission: Submission): QuickWin[] {
  const actions = calculatePriorityActions(submission);
  
  return actions
    .filter(action => action.effort === 'Low' || action.timeframe.includes('1-2 weeks') || action.timeframe.includes('2-4 weeks'))
    .map(action => ({
      action: action.title,
      impact: action.impact,
      timeframe: action.timeframe,
      recoveryAmount: action.recoveryAmount,
      confidence: action.confidence,
      complexity: action.complexity,
      whyItMatters: action.whyItMatters
    }))
    .slice(0, 2); // Top 2 quick wins
}

export function getConfidenceMultiplier(confidence: 'High' | 'Medium' | 'Low'): number {
  switch (confidence) {
    case 'High':
      return 1.0;
    case 'Medium':
      return 0.8;
    case 'Low':
      return 0.6;
    default:
      return 0.8;
  }
}

export function calculateTotalPotentialRecovery(actions: PriorityAction[]): number {
  return actions.reduce((total, action) => {
    const adjustedRecovery = action.recoveryAmount * getConfidenceMultiplier(action.confidence);
    return total + adjustedRecovery;
  }, 0);
}

export function calculateExecutiveSummary(submission: Submission): ExecutiveSummary {
  const currentARR = safeNumber(submission.current_arr);
  const totalLeak = safeNumber(submission.total_leak);
  const priorityActions = calculatePriorityActions(submission);
  const quickWins = calculateQuickWins(submission);
  const realisticRecovery = calculateTotalPotentialRecovery(priorityActions);
  
  // Determine urgency level based on leak percentage
  const leakPercentage = currentARR > 0 ? (totalLeak / currentARR) * 100 : 0;
  let urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  if (leakPercentage > 25) urgencyLevel = 'Critical';
  else if (leakPercentage > 15) urgencyLevel = 'High';
  else if (leakPercentage > 8) urgencyLevel = 'Medium';
  else urgencyLevel = 'Low';
  
  // Determine confidence level based on data quality
  const confidenceLevel: 'High' | 'Medium' | 'Low' = priorityActions.length >= 3 ? 'High' : 
                                                     priorityActions.length >= 2 ? 'Medium' : 'Low';
  
  // Calculate time to value based on quick wins
  const timeToValue = quickWins.length > 0 ? 
    quickWins[0].timeframe : 
    priorityActions.length > 0 ? priorityActions[0].timeframe : '8-12 weeks';
  
  // Generate business impact statement
  const businessImpact = realisticRecovery > currentARR * 0.1 ? 
    'High-impact opportunity with significant revenue recovery potential' :
    realisticRecovery > currentARR * 0.05 ?
    'Moderate-impact opportunity with meaningful revenue improvements' :
    'Low-impact opportunity with incremental revenue gains';
  
  return {
    totalLeakage: totalLeak,
    realisticRecovery,
    priorityActions,
    quickWins,
    urgencyLevel,
    confidenceLevel,
    timeToValue,
    businessImpact
  };
}

export function getUrgencyConfig(urgency: 'Critical' | 'High' | 'Medium' | 'Low') {
  switch (urgency) {
    case 'Critical':
      return {
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        icon: '🚨',
        label: 'Critical'
      };
    case 'High':
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '⚡',
        label: 'High Priority'
      };
    case 'Medium':
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: '⚠️',
        label: 'Medium Priority'
      };
    case 'Low':
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: '✅',
        label: 'Low Priority'
      };
  }
}
