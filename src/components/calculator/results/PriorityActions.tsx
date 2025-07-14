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
import { 
  validateCalculationResults,
  getCalculationConfidenceLevel
} from "@/lib/calculator/validationHelpers";

interface PriorityActionsProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
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

export const PriorityActions = ({ submission, formatCurrency }: PriorityActionsProps) => {
  const [isContentOpen, setIsContentOpen] = useState(false);

  const getActionItems = (): ActionItem[] => {
    const actions: ActionItem[] = [];
    
    // Get calculation confidence
    const confidence = getCalculationConfidenceLevel({
      currentARR: submission.current_arr || 0,
      monthlyLeads: submission.monthly_leads || 0,
      monthlyFreeSignups: submission.monthly_free_signups || 0,
      totalLeak: submission.total_leak || 0
    });

    // Validate calculations
    const validation = validateCalculationResults({
      leadResponseLoss: submission.lead_response_loss || 0,
      failedPaymentLoss: submission.failed_payment_loss || 0,
      selfServeGap: submission.selfserve_gap_loss || 0,
      processLoss: submission.process_inefficiency_loss || 0,
      currentARR: submission.current_arr || 0,
      recoveryPotential70: submission.recovery_potential_70 || 0,
      recoveryPotential85: submission.recovery_potential_85 || 0
    });

    // Lead Response Time Action
    if (submission.lead_response_time && submission.lead_response_time > 2 && submission.average_deal_value) {
      // Get effectiveness percentages
      const currentEffectiveness = calculateLeadResponseImpact(submission.lead_response_time, submission.average_deal_value);
      const targetEffectiveness = calculateLeadResponseImpact(1, submission.average_deal_value);
      
      // Calculate annual lead value (assume 3% conversion rate if not provided)
      const conversionRate = submission.free_to_paid_conversion ? submission.free_to_paid_conversion / 100 : 0.03;
      const annualLeadValue = (submission.monthly_leads || 0) * submission.average_deal_value * conversionRate * 12;
      
      // Calculate current and target annual losses
      const currentLoss = annualLeadValue * (1 - currentEffectiveness);
      const targetLoss = annualLeadValue * (1 - targetEffectiveness);
      
      // Recovery potential is the difference between current and target losses
      const recoveryPotential = Math.max(0, currentLoss - targetLoss);
      
      // Cap recovery at reasonable percentage of ARR
      const cappedRecovery = Math.min(recoveryPotential, (submission.current_arr || 0) * 0.15);
      
      const currentProgress = Math.max(0, Math.min(100, 100 - ((submission.lead_response_time - 1) * 15)));
      const targetProgress = 90;
      
      actions.push({
        id: 'lead-response',
        title: 'Optimize Lead Response Time',
        description: 'Reduce response time to under 1 hour for maximum conversion',
        currentMetric: `${submission.lead_response_time}h response time`,
        targetMetric: '1h response time',
        potentialRecovery: cappedRecovery,
        difficulty: 'Easy',
        timeframe: '2-4 weeks',
        icon: Clock,
        priority: cappedRecovery > (submission.current_arr || 0) * 0.05 ? 'urgent' : 'medium',
        currentProgress,
        targetProgress,
        confidence,
        explanation: 'Fast response times dramatically improve lead conversion rates. Each hour of delay reduces conversion probability exponentially.'
      });
    }

    // Self-Serve Conversion Optimization
    if (submission.free_to_paid_conversion && submission.monthly_free_signups && submission.monthly_mrr) {
      const currentConversion = submission.free_to_paid_conversion;
      const industryBenchmark = 4.2; // More realistic benchmark
      
      if (currentConversion < industryBenchmark) {
        const gapRecovery = calculateSelfServeGap(
          submission.monthly_free_signups,
          currentConversion,
          submission.monthly_mrr,
          submission.industry || 'other'
        );
        
        // Cap at reasonable percentage of ARR
        const cappedRecovery = Math.min(gapRecovery, (submission.current_arr || 0) * 0.25);
        
        const currentProgress = (currentConversion / industryBenchmark) * 100;
        const targetProgress = 100;
        
        actions.push({
          id: 'conversion-optimization',
          title: 'Self-Serve Conversion Optimization',
          description: 'Improve free-to-paid conversion through better onboarding and product experience',
          currentMetric: `${currentConversion}% conversion rate`,
          targetMetric: `${industryBenchmark}% conversion rate`,
          potentialRecovery: cappedRecovery,
          difficulty: 'Medium',
          timeframe: '6-12 weeks',
          icon: Target,
          priority: cappedRecovery > (submission.current_arr || 0) * 0.05 ? 'urgent' : 'medium',
          currentProgress,
          targetProgress,
          confidence,
          explanation: 'Better onboarding, feature discovery, and value demonstration can significantly improve conversion rates from free to paid plans.'
        });
      }
    }

    // Process Automation
    if (submission.manual_hours && submission.manual_hours > 10 && submission.hourly_rate) {
      const automationSavings = calculateProcessInefficiency(
        submission.manual_hours,
        submission.hourly_rate,
        0.7 // 70% automation potential
      );
      
      // Cap at reasonable amount
      const cappedSavings = Math.min(automationSavings, (submission.current_arr || 0) * 0.1);
      
      const automationPotential = Math.min(submission.manual_hours * 0.7, submission.manual_hours - 5);
      const currentProgress = Math.max(0, 100 - ((submission.manual_hours / 40) * 100));
      const targetProgress = 85;
      
      actions.push({
        id: 'process-automation',
        title: 'Process Automation Opportunities',
        description: 'Automate repetitive manual tasks to save time and reduce errors',
        currentMetric: `${submission.manual_hours}h/week manual work`,
        targetMetric: `${Math.round(submission.manual_hours - automationPotential)}h/week manual work`,
        potentialRecovery: cappedSavings,
        difficulty: 'Easy',
        timeframe: '3-6 weeks',
        icon: Zap,
        priority: cappedSavings > (submission.current_arr || 0) * 0.02 ? 'urgent' : 'medium',
        currentProgress,
        targetProgress,
        confidence,
        explanation: 'Automating manual processes frees up valuable time for strategic activities and reduces operational costs.'
      });
    }

    // Payment Failure Reduction
    if (submission.failed_payment_rate && submission.failed_payment_rate > 2 && submission.monthly_mrr) {
      // Calculate current annual loss at current failure rate
      const currentLoss = calculateFailedPaymentLoss(
        submission.monthly_mrr,
        submission.failed_payment_rate / 100,
        'basic'
      );
      
      // Calculate target annual loss at improved failure rate (1.5%)
      const targetLoss = calculateFailedPaymentLoss(
        submission.monthly_mrr,
        1.5 / 100,
        'basic'
      );
      
      // Recovery potential is the difference between current and target losses
      const recoveryPotential = Math.max(0, currentLoss - targetLoss);
      
      // Cap at reasonable percentage
      const cappedRecovery = Math.min(recoveryPotential, (submission.current_arr || 0) * 0.08);
      
      const targetFailureRate = 1.5;
      const currentProgress = Math.max(0, 100 - (submission.failed_payment_rate * 5));
      const targetProgress = 85;
      
      actions.push({
        id: 'payment-optimization',
        title: 'Payment Failure Reduction',
        description: 'Implement better payment retry logic and multiple payment methods',
        currentMetric: `${submission.failed_payment_rate}% failure rate`,
        targetMetric: `${targetFailureRate}% failure rate`,
        potentialRecovery: cappedRecovery,
        difficulty: 'Medium',
        timeframe: '6-10 weeks',
        icon: CreditCard,
        priority: cappedRecovery > (submission.current_arr || 0) * 0.02 ? 'urgent' : 'medium',
        currentProgress,
        targetProgress,
        confidence,
        explanation: 'Reducing payment failures through better retry logic and payment methods directly impacts recurring revenue.'
      });
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
              {overallConfidence === 'low' && (
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