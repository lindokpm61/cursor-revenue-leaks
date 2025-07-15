import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Target, 
  CreditCard, 
  Settings,
  Users,
  Zap,
  ChevronRight,
  ChevronDown,
  Info
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { 
  calculateLeadResponseImpact,
  calculateSelfServeGap,
  calculateProcessInefficiency,
  calculateFailedPaymentLoss
} from "@/lib/calculator/enhancedCalculations";
import { calculateUnifiedResults, UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";
import { 
  validateCalculationResults,
  getCalculationConfidenceLevel
} from "@/lib/calculator/validationHelpers";

interface PriorityActionsProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  calculatorData?: any; // Add calculator data for unified calculations
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  currentMetric: string;
  targetMetric: string;
  potentialRecovery: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeframe: string;
  icon: any;
  priority: 'urgent' | 'medium';
  currentProgress: number;
  targetProgress: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
}

export const PriorityActions = ({ submission, formatCurrency, calculatorData }: PriorityActionsProps) => {
  const [isContentOpen, setIsContentOpen] = useState(false);

  // Use unified calculations if calculator data is available
  const getUnifiedCalculations = () => {
    if (!calculatorData) return null;
    
    const inputs: UnifiedCalculationInputs = {
      currentARR: calculatorData.companyInfo?.currentARR || submission.current_arr || 0,
      monthlyMRR: calculatorData.selfServe?.monthlyMRR || submission.monthly_mrr || 0,
      monthlyLeads: calculatorData.leadGeneration?.monthlyLeads || submission.monthly_leads || 0,
      averageDealValue: calculatorData.leadGeneration?.averageDealValue || submission.average_deal_value || 0,
      leadResponseTime: calculatorData.leadGeneration?.leadResponseTime || submission.lead_response_time || 0,
      monthlyFreeSignups: calculatorData.selfServe?.monthlyFreeSignups || submission.monthly_free_signups || 0,
      freeToLaidConversion: calculatorData.selfServe?.freeToLaidConversion || submission.free_to_paid_conversion || 0,
      failedPaymentRate: calculatorData.selfServe?.failedPaymentRate || submission.failed_payment_rate || 0,
      manualHours: calculatorData.operations?.manualHours || submission.manual_hours || 0,
      hourlyRate: calculatorData.operations?.hourlyRate || submission.hourly_rate || 0,
      industry: calculatorData.companyInfo?.industry || submission.industry
    };
    
    return calculateUnifiedResults(inputs);
  };

  const unifiedCalcs = getUnifiedCalculations();

  const getActionItems = (): ActionItem[] => {
    const actions: ActionItem[] = [];
    const currentARR = submission.current_arr || 0;
    const totalLeak = submission.total_leak || 0;
    
    // Track total recovery across all actions to prevent overlap
    let totalAllocatedRecovery = 0;
    const maxAllowableRecovery = Math.min(totalLeak * 0.60, currentARR * 0.30); // Cap at 60% of leak or 30% of ARR
    
    // Get calculation confidence
    const confidence = getCalculationConfidenceLevel({
      currentARR: currentARR,
      monthlyLeads: submission.monthly_leads || 0,
      monthlyFreeSignups: submission.monthly_free_signups || 0,
      totalLeak: totalLeak
    });

    // Validate calculations
    const validation = validateCalculationResults({
      leadResponseLoss: submission.lead_response_loss || 0,
      failedPaymentLoss: submission.failed_payment_loss || 0,
      selfServeGap: submission.selfserve_gap_loss || 0,
      processLoss: submission.process_inefficiency_loss || 0,
      currentARR: currentARR,
      recoveryPotential70: submission.recovery_potential_70 || 0,
      recoveryPotential85: submission.recovery_potential_85 || 0
    });

    // Lead Response Time Action
    if (submission.lead_response_time && submission.lead_response_time > 2 && submission.average_deal_value) {
      // Use unified calculations if available, otherwise fallback to legacy
      let baseRecovery: number;
      
      if (unifiedCalcs) {
        baseRecovery = unifiedCalcs.actionRecoveryPotential.leadResponse;
      } else {
        // Legacy calculation as fallback with more conservative estimates
        const currentEffectiveness = calculateLeadResponseImpact(submission.lead_response_time, submission.average_deal_value);
        const targetEffectiveness = calculateLeadResponseImpact(1.5, submission.average_deal_value); // More realistic target
        
        const conversionRate = submission.free_to_paid_conversion ? submission.free_to_paid_conversion / 100 : 0.03;
        const annualLeadValue = (submission.monthly_leads || 0) * submission.average_deal_value * conversionRate * 12;
        
        const currentLoss = annualLeadValue * (1 - currentEffectiveness);
        const targetLoss = annualLeadValue * (1 - targetEffectiveness);
        
        const recoveryPotential = Math.max(0, currentLoss - targetLoss) * 0.65; // 65% achievable recovery
        baseRecovery = Math.min(recoveryPotential, Math.min(currentARR * 0.12, totalLeak * 0.20));
      }
      
      // Ensure we don't exceed total allowable recovery
      const cappedRecovery = Math.min(baseRecovery, maxAllowableRecovery - totalAllocatedRecovery);
      
      if (cappedRecovery > currentARR * 0.01) { // Only include if > 1% of ARR
        totalAllocatedRecovery += cappedRecovery;
        
        const currentProgress = Math.max(0, Math.min(100, 100 - ((submission.lead_response_time - 1.5) * 20)));
        const targetProgress = 85; // More realistic target
        
        actions.push({
          id: 'lead-response',
          title: 'Optimize Lead Response Time',
          description: 'Reduce response time to under 1.5 hours through automation and process improvements',
          currentMetric: `${submission.lead_response_time}h response time`,
          targetMetric: '1.5h response time',
          potentialRecovery: cappedRecovery,
          difficulty: 'Easy',
          timeframe: '4-6 weeks', // More realistic timeframe
          icon: Clock,
          priority: cappedRecovery > currentARR * 0.05 ? 'urgent' : 'medium',
          currentProgress,
          targetProgress,
          confidence: unifiedCalcs?.confidence || confidence.level,
          explanation: 'Fast response times improve lead conversion rates. Implementation includes automation setup, team training, and process optimization.'
        });
      }
    }

    // Self-Serve Conversion Optimization
    if (submission.free_to_paid_conversion && submission.monthly_free_signups && submission.monthly_mrr && totalAllocatedRecovery < maxAllowableRecovery) {
      const currentConversion = submission.free_to_paid_conversion;
      const industryBenchmark = Math.min(4.2, currentConversion + 2.0); // More realistic benchmark - max 2% improvement
      
      if (currentConversion < industryBenchmark) {
        // Use unified calculations if available
        let baseRecovery: number;
        
        if (unifiedCalcs) {
          baseRecovery = unifiedCalcs.actionRecoveryPotential.selfServeOptimization;
        } else {
          // Legacy calculation with more conservative estimates
          const gapRecovery = calculateSelfServeGap(
            submission.monthly_free_signups,
            currentConversion,
            submission.monthly_mrr,
            submission.industry || 'other'
          );
          // Much more conservative - only 40% of calculated gap is achievable
          baseRecovery = Math.min(gapRecovery * 0.40, Math.min(currentARR * 0.15, totalLeak * 0.25));
        }
        
        // Ensure no overlap with previous actions
        const cappedRecovery = Math.min(baseRecovery, maxAllowableRecovery - totalAllocatedRecovery);
        
        if (cappedRecovery > currentARR * 0.01) {
          totalAllocatedRecovery += cappedRecovery;
          
          const currentProgress = (currentConversion / industryBenchmark) * 100;
          const targetProgress = 90; // More realistic target
          
          actions.push({
            id: 'conversion-optimization',
            title: 'Self-Serve Conversion Optimization',
            description: 'Systematic improvement of free-to-paid conversion through onboarding optimization and user experience enhancements',
            currentMetric: `${currentConversion}% conversion rate`,
            targetMetric: `${industryBenchmark.toFixed(1)}% conversion rate`,
            potentialRecovery: cappedRecovery,
            difficulty: 'Medium',
            timeframe: '8-12 weeks', // More realistic timeframe
            icon: Target,
            priority: cappedRecovery > currentARR * 0.04 ? 'urgent' : 'medium',
            currentProgress,
            targetProgress,
            confidence: unifiedCalcs?.confidence || confidence.level,
            explanation: 'Systematic onboarding improvements, feature discovery enhancements, and value demonstration can improve conversion rates. Requires A/B testing and gradual optimization.'
          });
        }
      }
    }

    // Process Automation
    if (submission.manual_hours && submission.manual_hours > 15 && submission.hourly_rate && totalAllocatedRecovery < maxAllowableRecovery) {
      const automationSavings = calculateProcessInefficiency(
        submission.manual_hours,
        submission.hourly_rate,
        0.45 // 45% automation potential (more realistic)
      );
      
      // Much more conservative recovery estimate
      const baseRecovery = Math.min(automationSavings * 0.60, Math.min(currentARR * 0.08, totalLeak * 0.15));
      const cappedSavings = Math.min(baseRecovery, maxAllowableRecovery - totalAllocatedRecovery);
      
      if (cappedSavings > currentARR * 0.01) {
        totalAllocatedRecovery += cappedSavings;
        
        const automationPotential = Math.min(submission.manual_hours * 0.45, submission.manual_hours - 8); // Keep minimum 8h manual
        const currentProgress = Math.max(0, 100 - ((submission.manual_hours / 40) * 100));
        const targetProgress = 75; // More realistic target
        
        actions.push({
          id: 'process-automation',
          title: 'Process Automation Initiative',
          description: 'Systematically automate repetitive manual tasks through workflow optimization and tool implementation',
          currentMetric: `${submission.manual_hours}h/week manual work`,
          targetMetric: `${Math.round(submission.manual_hours - automationPotential)}h/week manual work`,
          potentialRecovery: cappedSavings,
          difficulty: 'Medium', // More realistic difficulty
          timeframe: '8-12 weeks', // More realistic timeframe
          icon: Zap,
          priority: cappedSavings > currentARR * 0.03 ? 'urgent' : 'medium',
          currentProgress,
          targetProgress,
          confidence: confidence.level,
          explanation: 'Process automation requires careful analysis, tool selection, implementation, and team training. Recovery comes from reduced operational costs and improved efficiency.'
        });
      }
    }

    // Payment Failure Reduction
    if (submission.failed_payment_rate && submission.failed_payment_rate > 2.5 && submission.monthly_mrr && totalAllocatedRecovery < maxAllowableRecovery) {
      // Calculate current annual loss at current failure rate
      const currentLoss = calculateFailedPaymentLoss(
        submission.monthly_mrr,
        submission.failed_payment_rate / 100,
        'basic'
      );
      
      // More realistic target failure rate based on current rate
      const targetFailureRate = Math.max(1.8, submission.failed_payment_rate - 1.5); // Max 1.5% improvement
      
      // Calculate target annual loss at improved failure rate
      const targetLoss = calculateFailedPaymentLoss(
        submission.monthly_mrr,
        targetFailureRate / 100,
        'basic'
      );
      
      // Recovery potential with more conservative estimate
      const baseRecoveryPotential = Math.max(0, currentLoss - targetLoss) * 0.70; // Only 70% achievable
      const cappedRecovery = Math.min(
        baseRecoveryPotential, 
        Math.min(currentARR * 0.06, totalLeak * 0.12),
        maxAllowableRecovery - totalAllocatedRecovery
      );
      
      if (cappedRecovery > currentARR * 0.01) {
        totalAllocatedRecovery += cappedRecovery;
        
        const currentProgress = Math.max(0, 100 - ((submission.failed_payment_rate - 1.5) * 8));
        const targetProgress = 80; // More realistic target
        
        actions.push({
          id: 'payment-optimization',
          title: 'Payment Recovery Enhancement',
          description: 'Reduce payment failures through improved retry logic, multiple payment methods, and dunning management',
          currentMetric: `${submission.failed_payment_rate}% failure rate`,
          targetMetric: `${targetFailureRate.toFixed(1)}% failure rate`,
          potentialRecovery: cappedRecovery,
          difficulty: 'Medium',
          timeframe: '10-14 weeks', // More realistic timeframe
          icon: CreditCard,
          priority: cappedRecovery > currentARR * 0.025 ? 'urgent' : 'medium',
          currentProgress,
          targetProgress,
          confidence: confidence.level,
          explanation: 'Payment optimization requires integration work, testing, and gradual rollout. Recovery comes from reduced involuntary churn and improved payment success rates.'
        });
      }
    }

    // Filter out actions with very low recovery potential
    const filteredActions = actions.filter(action => 
      action.potentialRecovery > (submission.current_arr || 0) * 0.01 // At least 1% of ARR
    );

    return filteredActions.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'urgent' ? -1 : 1;
      }
      return b.potentialRecovery - a.potentialRecovery;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-revenue-success';
      case 'Medium': return 'text-revenue-warning';
      case 'Hard': return 'text-revenue-danger';
      default: return 'text-muted-foreground';
    }
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'default' as const;
      case 'Medium': return 'secondary' as const;
      case 'Hard': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const actions = getActionItems();
  const urgentActions = actions.filter(action => action.priority === 'urgent');
  const mediumActions = actions.filter(action => action.priority === 'medium');

  // Get overall confidence level
  const overallConfidence = getCalculationConfidenceLevel({
    currentARR: submission.current_arr || 0,
    monthlyLeads: submission.monthly_leads || 0,
    monthlyFreeSignups: submission.monthly_free_signups || 0,
    totalLeak: submission.total_leak || 0
  });

  if (actions.length === 0) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Priority Actions</CardTitle>
              <p className="text-muted-foreground mt-1">
                Your operations appear to be well-optimized. Continue monitoring key metrics.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Priority Actions</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Ranked revenue recovery opportunities by impact and implementation difficulty
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-4">
                <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-6 pt-6">
              {overallConfidence.level === 'low' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Some calculations may have lower confidence due to limited data. Consider these recommendations as directional guidance and validate with your specific business context.
                  </AlertDescription>
                </Alert>
              )}
              {urgentActions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-revenue-danger" />
                    <h3 className="text-lg font-semibold text-revenue-danger">
                      🚨 URGENT PRIORITY (High Impact, Quick Wins)
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {urgentActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Card key={action.id} className="border-revenue-danger/20 bg-gradient-to-r from-background to-revenue-danger/5">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-revenue-danger/10">
                                  <Icon className="h-5 w-5 text-revenue-danger" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg">{action.title}</h4>
                                  <p className="text-sm text-muted-foreground">{action.description}</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Current</div>
                                <div className="font-medium">{action.currentMetric}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Target</div>
                                <div className="font-medium text-revenue-success">{action.targetMetric}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Recovery Potential</div>
                                <div className="font-bold text-revenue-primary">
                                  {formatCurrency(action.potentialRecovery)}
                                  {action.confidence === 'low' && (
                                    <span className="text-xs text-muted-foreground ml-1">(estimate)</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Timeline</div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getDifficultyBadgeVariant(action.difficulty)}>
                                    {action.difficulty}
                                  </Badge>
                                  <span className="text-sm">{action.timeframe}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Current Performance</span>
                                <span>{Math.round(action.currentProgress)}%</span>
                              </div>
                              <Progress value={action.currentProgress} className="h-2" />
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Target: {Math.round(action.targetProgress)}%</span>
                              </div>
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">{action.explanation}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {mediumActions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-revenue-warning" />
                    <h3 className="text-lg font-semibold text-revenue-warning">
                      📈 MEDIUM PRIORITY (Medium Impact)
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {mediumActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Card key={action.id} className="border-revenue-warning/20 bg-gradient-to-r from-background to-revenue-warning/5">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-revenue-warning/10">
                                  <Icon className="h-5 w-5 text-revenue-warning" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{action.title}</h4>
                                  <p className="text-sm text-muted-foreground">{action.description}</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Current</div>
                                <div className="font-medium">{action.currentMetric}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Target</div>
                                <div className="font-medium text-revenue-success">{action.targetMetric}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Recovery Potential</div>
                                <div className="font-bold text-revenue-primary">
                                  {formatCurrency(action.potentialRecovery)}
                                  {action.confidence === 'low' && (
                                    <span className="text-xs text-muted-foreground ml-1">(estimate)</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Timeline</div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={getDifficultyBadgeVariant(action.difficulty)}>
                                    {action.difficulty}
                                  </Badge>
                                  <span className="text-sm">{action.timeframe}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Current Performance</span>
                                <span>{Math.round(action.currentProgress)}%</span>
                              </div>
                              <Progress value={action.currentProgress} className="h-2" />
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Target: {Math.round(action.targetProgress)}%</span>
                              </div>
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">{action.explanation}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};