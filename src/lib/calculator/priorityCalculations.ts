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

export function calculatePriorityActions(submission: Submission): PriorityAction[] {
  const currentARR = safeNumber(submission.current_arr);
  const leadResponseLoss = safeNumber(submission.lead_response_loss);
  const selfserveGapLoss = safeNumber(submission.selfserve_gap_loss);
  const processLoss = safeNumber(submission.process_inefficiency_loss);
  const failedPaymentLoss = safeNumber(submission.failed_payment_loss);
  const totalRecovery = safeNumber(submission.recovery_potential_70);

  // Calculate realistic action-specific recoveries (no overlap)
  const leadResponseRecovery = leadResponseLoss * 0.7; // 70% recovery potential
  const selfserveRecovery = selfserveGapLoss * 0.6; // 60% recovery potential
  const processRecovery = processLoss * 0.8; // 80% recovery potential
  const paymentRecovery = failedPaymentLoss * 0.85; // 85% recovery potential

  const actions: PriorityAction[] = [];

  // Lead Response Optimization (if significant loss)
  if (leadResponseLoss > currentARR * 0.05) {
    actions.push({
      id: 'lead-response',
      title: 'Accelerate Lead Response Time',
      description: 'Implement automated lead routing and instant response systems',
      impact: Math.round((leadResponseRecovery / totalRecovery) * 100),
      effort: 'Medium',
      timeframe: '4-6 weeks',
      recoveryAmount: leadResponseRecovery,
      confidence: leadResponseLoss > currentARR * 0.1 ? 'High' : 'Medium',
      urgency: leadResponseLoss > currentARR * 0.12 ? 'Critical' : 'High',
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
    });
  }

  // Self-Serve Gap (if significant loss)
  if (selfserveGapLoss > currentARR * 0.08) {
    actions.push({
      id: 'selfserve-optimization',
      title: 'Optimize Self-Serve Experience',
      description: 'Improve onboarding flow and reduce friction points',
      impact: Math.round((selfserveRecovery / totalRecovery) * 100),
      effort: 'High',
      timeframe: '8-12 weeks',
      recoveryAmount: selfserveRecovery,
      confidence: 'Medium',
      urgency: selfserveGapLoss > currentARR * 0.15 ? 'High' : 'Medium',
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
    });
  }

  // Process Inefficiency (if significant loss)
  if (processLoss > currentARR * 0.03) {
    actions.push({
      id: 'process-automation',
      title: 'Automate Manual Processes',
      description: 'Eliminate repetitive tasks and streamline workflows',
      impact: Math.round((processRecovery / totalRecovery) * 100),
      effort: 'Low',
      timeframe: '2-4 weeks',
      recoveryAmount: processRecovery,
      confidence: 'High',
      urgency: 'Medium',
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
    });
  }

  // Payment Recovery (if significant loss)
  if (failedPaymentLoss > currentARR * 0.02) {
    actions.push({
      id: 'payment-recovery',
      title: 'Improve Payment Recovery',
      description: 'Implement dunning management and payment retry logic',
      impact: Math.round((paymentRecovery / totalRecovery) * 100),
      effort: 'Low',
      timeframe: '1-2 weeks',
      recoveryAmount: paymentRecovery,
      confidence: 'High',
      urgency: failedPaymentLoss > currentARR * 0.05 ? 'High' : 'Medium',
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
    });
  }

  // Sort by impact (highest first)
  return actions.sort((a, b) => b.impact - a.impact).slice(0, 3);
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