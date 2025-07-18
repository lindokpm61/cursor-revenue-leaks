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
import { calculatePriorityActions, PriorityAction } from "@/lib/calculator/priorityCalculations";
import { StrategicCTASection } from "@/components/results/StrategicCTASection";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";

interface PriorityActionsProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  calculatorData?: any; // Add calculator data for unified calculations
  variant?: 'condensed' | 'standard' | 'detailed' | 'competitive';
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

export const PriorityActions = ({ submission, formatCurrency, calculatorData, variant = 'standard' }: PriorityActionsProps) => {
  const [isContentOpen, setIsContentOpen] = useState(variant === 'condensed' ? true : false);

  // Calculate unified results for accurate CTA values
  const unifiedCalculations = UnifiedResultsService.calculateResults(submission);

  // Use centralized priority calculations
  const priorityActions = calculatePriorityActions(submission);

  // Convert PriorityAction to ActionItem format
  const getActionItems = (): ActionItem[] => {
    return priorityActions.map((action: PriorityAction) => {
      // Map icons
      const iconMap: Record<string, any> = {
        'lead-response': Clock,
        'selfserve-optimization': Target, 
        'process-automation': Zap,
        'payment-recovery': CreditCard
      };

      // Calculate current/target metrics based on action type
      let currentMetric = '';
      let targetMetric = '';
      let currentProgress = 50;
      let targetProgress = 80;

      switch (action.id) {
        case 'lead-response':
          currentMetric = `${submission.lead_response_time || 0}h response time`;
          targetMetric = '1h response time (best-in-class)';
          currentProgress = Math.max(0, Math.min(100, 100 - ((submission.lead_response_time || 0) - 1.0) * 25));
          targetProgress = 90;
          break;
        case 'selfserve-optimization':
          const bestInClassConversion = Math.max(4.5, (submission.free_to_paid_conversion || 0) * 1.8);
          currentMetric = `${submission.free_to_paid_conversion || 0}% conversion rate`;
          targetMetric = `${bestInClassConversion.toFixed(1)}% conversion rate (best-in-class)`;
          currentProgress = ((submission.free_to_paid_conversion || 0) / bestInClassConversion) * 100;
          targetProgress = 95;
          break;
        case 'process-automation':
          const bestInClassManual = Math.round((submission.manual_hours || 0) * 0.15); // 85% automation
          currentMetric = `${submission.manual_hours || 0}h/week manual work`;
          targetMetric = `${bestInClassManual}h/week manual work (85% automated)`;
          currentProgress = Math.max(0, 100 - (((submission.manual_hours || 0) / 40) * 100));
          targetProgress = 85;
          break;
        case 'payment-recovery':
          const bestInClassFailure = Math.max(1.2, (submission.failed_payment_rate || 0) * 0.3); // 70% reduction
          currentMetric = `${submission.failed_payment_rate || 0}% failure rate`;
          targetMetric = `${bestInClassFailure.toFixed(1)}% failure rate (best-in-class)`;
          currentProgress = Math.max(0, 100 - (((submission.failed_payment_rate || 0) - 1.2) * 10));
          targetProgress = 88;
          break;
      }

      return {
        id: action.id,
        title: action.title,
        description: action.description,
        currentMetric,
        targetMetric,
        potentialRecovery: action.recoveryAmount,
        difficulty: action.effort as 'Easy' | 'Medium' | 'Hard',
        timeframe: action.timeframe,
        icon: iconMap[action.id] || Target,
        priority: action.urgency === 'Critical' || action.urgency === 'High' ? 'urgent' : 'medium',
        currentProgress,
        targetProgress,
        confidence: action.confidence.toLowerCase() as 'high' | 'medium' | 'low',
        explanation: action.description
      };
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
  
  // Filter actions based on variant
  const getFilteredActions = () => {
    const urgentActions = actions.filter(action => action.priority === 'urgent');
    const mediumActions = actions.filter(action => action.priority === 'medium');
    
    switch (variant) {
      case 'condensed':
        // Show only top 2 actions for quick wins
        return {
          urgent: urgentActions.slice(0, 1),
          medium: mediumActions.slice(0, 1)
        };
      case 'competitive':
        // Add competitive messaging to actions
        return {
          urgent: urgentActions.map(action => ({
            ...action,
            description: `${action.description} • Close competitive gaps faster`
          })),
          medium: mediumActions.map(action => ({
            ...action,
            description: `${action.description} • Industry benchmark alignment`
          }))
        };
      default:
        return { urgent: urgentActions, medium: mediumActions };
    }
  };

  const { urgent: urgentActions, medium: mediumActions } = getFilteredActions();

  // Determine overall confidence based on actions
  const overallConfidence = { level: 'medium' }; // Default confidence
  
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
                <CardTitle className="text-2xl">Strategic Priority Actions</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Aggressive improvement targets for competitive advantage and market leadership
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
                      🚨 URGENT PRIORITY (Strategic Advantage Opportunities)
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
                      📈 MEDIUM PRIORITY (Competitive Positioning)
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

              {actions.length > 0 && (
                <div className="mt-8">
                  <StrategicCTASection
                    totalLeak={unifiedCalculations.totalLoss}
                    recovery70={unifiedCalculations.conservativeRecovery}
                    leadScore={submission.lead_score || 0}
                    formatCurrency={formatCurrency}
                  />
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};
