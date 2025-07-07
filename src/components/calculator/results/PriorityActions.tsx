import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Target, 
  CreditCard, 
  Settings,
  Users,
  Zap,
  ChevronRight
} from "lucide-react";
import { type Submission } from "@/lib/supabase";

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
}

export const PriorityActions = ({ submission, formatCurrency }: PriorityActionsProps) => {
  const getActionItems = (): ActionItem[] => {
    const actions: ActionItem[] = [];

    // Lead Response Time Action
    if (submission.lead_response_time && submission.lead_response_time > 2) {
      const targetResponseTime = 1;
      const currentProgress = Math.max(0, 100 - (submission.lead_response_time * 10));
      const targetProgress = 90;
      
      actions.push({
        id: 'lead-response',
        title: 'Fix Lead Response Time',
        description: 'Reduce response time to under 1 hour for maximum conversion',
        currentMetric: `${submission.lead_response_time}h response time`,
        targetMetric: `${targetResponseTime}h response time`,
        potentialRecovery: submission.lead_response_loss || 0,
        difficulty: 'Easy',
        timeframe: '2-4 weeks',
        icon: Clock,
        priority: 'urgent',
        currentProgress,
        targetProgress
      });
    }

    // Self-Serve Conversion Optimization
    if (submission.free_to_paid_conversion && submission.free_to_paid_conversion < 15) {
      const industryBenchmark = 15;
      const currentProgress = (submission.free_to_paid_conversion / industryBenchmark) * 100;
      const targetProgress = 100;
      
      actions.push({
        id: 'conversion-optimization',
        title: 'Self-Serve Conversion Optimization',
        description: 'Improve free-to-paid conversion rate to industry benchmark',
        currentMetric: `${submission.free_to_paid_conversion}% conversion rate`,
        targetMetric: `${industryBenchmark}% conversion rate`,
        potentialRecovery: submission.selfserve_gap_loss || 0,
        difficulty: 'Medium',
        timeframe: '4-8 weeks',
        icon: Target,
        priority: 'urgent',
        currentProgress,
        targetProgress
      });
    }

    // Process Automation
    if (submission.manual_hours && submission.manual_hours > 10) {
      const automationPotential = Math.min(submission.manual_hours * 0.7, submission.manual_hours - 5);
      const currentProgress = 100 - ((submission.manual_hours / 40) * 100);
      const targetProgress = 85;
      
      actions.push({
        id: 'process-automation',
        title: 'Process Automation Opportunities',
        description: 'Automate repetitive manual tasks to save time and reduce errors',
        currentMetric: `${submission.manual_hours}h/week manual work`,
        targetMetric: `${Math.round(submission.manual_hours - automationPotential)}h/week manual work`,
        potentialRecovery: submission.process_inefficiency_loss || 0,
        difficulty: 'Easy',
        timeframe: '3-6 weeks',
        icon: Zap,
        priority: 'urgent',
        currentProgress,
        targetProgress
      });
    }

    // Payment Failure Reduction
    if (submission.failed_payment_rate && submission.failed_payment_rate > 2) {
      const targetFailureRate = 1.5;
      const currentProgress = 100 - (submission.failed_payment_rate * 10);
      const targetProgress = 85;
      
      actions.push({
        id: 'payment-optimization',
        title: 'Payment Failure Reduction',
        description: 'Implement better payment retry logic and multiple payment methods',
        currentMetric: `${submission.failed_payment_rate}% failure rate`,
        targetMetric: `${targetFailureRate}% failure rate`,
        potentialRecovery: submission.failed_payment_loss || 0,
        difficulty: 'Medium',
        timeframe: '6-10 weeks',
        icon: CreditCard,
        priority: 'medium',
        currentProgress,
        targetProgress
      });
    }

    // Additional Process Improvements
    if (submission.manual_hours && submission.manual_hours > 5) {
      actions.push({
        id: 'process-efficiency',
        title: 'Process Efficiency Improvements',
        description: 'Streamline workflows and eliminate bottlenecks in your operations',
        currentMetric: 'Manual workflow dependencies',
        targetMetric: 'Automated workflow orchestration',
        potentialRecovery: (submission.process_inefficiency_loss || 0) * 0.3,
        difficulty: 'Hard',
        timeframe: '8-12 weeks',
        icon: Settings,
        priority: 'medium',
        currentProgress: 40,
        targetProgress: 90
      });
    }

    return actions.sort((a, b) => {
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

  if (actions.length === 0) {
    return null;
  }

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
              Ranked revenue recovery opportunities by impact and implementation difficulty
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
                          <div className="font-bold text-revenue-primary">{formatCurrency(action.potentialRecovery)}</div>
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
                          <div className="font-bold text-revenue-primary">{formatCurrency(action.potentialRecovery)}</div>
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};