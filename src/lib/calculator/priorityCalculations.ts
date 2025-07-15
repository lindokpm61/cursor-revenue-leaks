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
}

export interface QuickWin {
  action: string;
  impact: number;
  timeframe: string;
  recoveryAmount: number;
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
      urgency: leadResponseLoss > currentARR * 0.12 ? 'Critical' : 'High'
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
      urgency: selfserveGapLoss > currentARR * 0.15 ? 'High' : 'Medium'
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
      urgency: 'Medium'
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
      urgency: failedPaymentLoss > currentARR * 0.05 ? 'High' : 'Medium'
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
      recoveryAmount: action.recoveryAmount
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