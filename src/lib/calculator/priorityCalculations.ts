
import { Tables } from '@/integrations/supabase/types';
import { UnifiedResultsService, type SubmissionData } from '@/lib/results/UnifiedResultsService';

type Submission = Tables<'calculator_submissions'>;

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

// Helper function to transform submission to SubmissionData format
function transformSubmissionToSubmissionData(submission: Submission): SubmissionData {
  return {
    id: submission.id || '',
    company_name: submission.company_name || '',
    contact_email: submission.contact_email || '',
    industry: submission.industry,
    current_arr: submission.current_arr || 0,
    monthly_leads: submission.monthly_leads || 0,
    average_deal_value: submission.average_deal_value || 0,
    lead_response_time: submission.lead_response_time || 0,
    monthly_free_signups: submission.monthly_free_signups || 0,
    free_to_paid_conversion: submission.free_to_paid_conversion || 0,
    monthly_mrr: submission.monthly_mrr || 0,
    failed_payment_rate: submission.failed_payment_rate || 0,
    manual_hours: submission.manual_hours || 0,
    hourly_rate: submission.hourly_rate || 0,
    lead_score: submission.lead_score || 50,
    user_id: submission.user_id,
    created_at: submission.created_at || new Date().toISOString()
  };
}

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

  // FIXED: Use UnifiedResultsService for consistent results
  const submissionData = transformSubmissionToSubmissionData(submission);
  const unifiedResults = UnifiedResultsService.calculateResults(submissionData);
  
  const currentARR = submissionData.current_arr;
  const leadResponseLoss = unifiedResults.leadResponseLoss;
  const selfserveGapLoss = unifiedResults.selfServeGap;
  const processLoss = unifiedResults.processInefficiency;
  const failedPaymentLoss = unifiedResults.failedPaymentLoss;
  const totalRecovery = unifiedResults.conservativeRecovery;

  console.log("=== UNIFIED RESULTS VALUES ===");
  console.log({
    currentARR,
    leadResponseLoss,
    selfserveGapLoss,
    processLoss,
    failedPaymentLoss,
    totalRecovery
  });

  // Use realistic recovery rates
  const leadResponseRecovery = leadResponseLoss * 0.65;
  const selfserveRecovery = selfserveGapLoss * 0.55;
  const processRecovery = processLoss * 0.75;
  const paymentRecovery = failedPaymentLoss * 0.70;

  // Calculate total potential recovery for impact percentages
  const totalActionRecovery = leadResponseRecovery + selfserveRecovery + processRecovery + paymentRecovery;
  
  const actions: PriorityAction[] = [];

  // Lower thresholds - virtually any loss should trigger actions
  const leadResponseThreshold = Math.max(currentARR * 0.0001, 1000);
  const selfserveThreshold = Math.max(currentARR * 0.0001, 500);
  const processThreshold = Math.max(currentARR * 0.0001, 1000);
  const paymentThreshold = Math.max(currentARR * 0.0001, 500);

  console.log('=== PRIORITY ACTION THRESHOLDS ===');
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

  // Lead Response Optimization
  if (leadResponseLoss > leadResponseThreshold) {
    console.log("Adding lead response action - loss:", leadResponseLoss, "threshold:", leadResponseThreshold);
    actions.push(createLeadResponseAction(leadResponseRecovery, totalActionRecovery, currentARR, leadResponseLoss));
  }

  // Self-Serve Gap
  if (selfserveGapLoss > selfserveThreshold) {
    console.log("Adding self-serve action - loss:", selfserveGapLoss, "threshold:", selfserveThreshold);
    actions.push(createSelfServeAction(selfserveRecovery, totalActionRecovery, currentARR, selfserveGapLoss));
  }

  // Process Inefficiency
  if (processLoss > processThreshold) {
    console.log("Adding process action - loss:", processLoss, "threshold:", processThreshold);
    actions.push(createProcessAction(processRecovery, totalActionRecovery, currentARR, processLoss));
  }

  // Payment Recovery
  if (failedPaymentLoss > paymentThreshold) {
    console.log("Adding payment action - loss:", failedPaymentLoss, "threshold:", paymentThreshold);
    actions.push(createPaymentAction(paymentRecovery, totalActionRecovery, currentARR, failedPaymentLoss));
  }

  // Ensure we have actions if data is available
  console.log("Current actions count:", actions.length);
  
  const hasLeadData = (submission.monthly_leads || 0) > 0 && (submission.average_deal_value || 0) > 0;
  const hasSelfServeData = (submission.monthly_free_signups || 0) > 0;
  const hasProcessData = (submission.manual_hours || 0) > 0 && (submission.hourly_rate || 0) > 0;
  const hasPaymentData = (submission.monthly_mrr || 0) > 0 && (submission.failed_payment_rate || 0) > 0;

  // Add fallback actions if no actions met thresholds but data exists
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
  // FIXED: Use UnifiedResultsService for consistent results
  const submissionData = transformSubmissionToSubmissionData(submission);
  const unifiedResults = UnifiedResultsService.calculateResults(submissionData);
  const currentARR = submission.current_arr || 0;
  
  // Map unified calculation results to executive summary format
  const totalLeak = unifiedResults.totalLoss;
  const priorityActions = calculatePriorityActions(submission);
  const quickWins = calculateQuickWins(submission);
  const realisticRecovery = unifiedResults.conservativeRecovery;
  
  // Determine urgency level based on leak percentage
  const leakPercentage = currentARR > 0 ? (totalLeak / currentARR) * 100 : 0;
  let urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  if (leakPercentage > 25) urgencyLevel = 'Critical';
  else if (leakPercentage > 15) urgencyLevel = 'High';
  else if (leakPercentage > 8) urgencyLevel = 'Medium';
  else urgencyLevel = 'Low';
  
  // Use unified calculation confidence level
  const confidenceLevel: 'High' | 'Medium' | 'Low' = 
    unifiedResults.lossPercentageOfARR > 15 ? 'High' :
    unifiedResults.lossPercentageOfARR > 8 ? 'Medium' : 'Low';
  
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
