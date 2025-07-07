import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Zap, 
  Target, 
  TrendingUp,
  Calendar,
  Phone
} from "lucide-react";
import { type Submission } from "@/lib/supabase";

interface ExecutiveSummaryCardProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  onGetActionPlan: () => void;
}

export const ExecutiveSummaryCard = ({ 
  submission, 
  formatCurrency, 
  onGetActionPlan 
}: ExecutiveSummaryCardProps) => {
  const getUrgencyLevel = (leak: number, arr: number) => {
    if (!arr || arr === 0) return 'low';
    const percentage = (leak / arr) * 100;
    if (percentage >= 20) return 'critical';
    if (percentage >= 10) return 'high';
    return 'medium';
  };

  const urgencyLevel = getUrgencyLevel(submission.total_leak || 0, submission.current_arr || 0);
  
  const urgencyConfig = {
    critical: { icon: AlertTriangle, color: 'text-revenue-danger', bg: 'bg-revenue-danger/10', border: 'border-revenue-danger/20' },
    high: { icon: AlertTriangle, color: 'text-revenue-warning', bg: 'bg-revenue-warning/10', border: 'border-revenue-warning/20' },
    medium: { icon: Target, color: 'text-revenue-primary', bg: 'bg-revenue-primary/10', border: 'border-revenue-primary/20' },
    low: { icon: Target, color: 'text-revenue-success', bg: 'bg-revenue-success/10', border: 'border-revenue-success/20' }
  };

  const config = urgencyConfig[urgencyLevel];
  const UrgencyIcon = config.icon;

  // Calculate biggest opportunity
  const opportunities = [
    { name: 'Lead Response', value: submission.lead_response_loss || 0 },
    { name: 'Self-Serve Gap', value: submission.selfserve_gap_loss || 0 },
    { name: 'Failed Payments', value: submission.failed_payment_loss || 0 },
    { name: 'Process Inefficiency', value: submission.process_inefficiency_loss || 0 }
  ];
  
  const biggestOpportunity = opportunities.reduce((max, opp) => 
    opp.value > max.value ? opp : max
  );

  const quickWinValue = Math.min(
    submission.lead_response_loss || 0,
    submission.failed_payment_loss || 0
  );

  const roiPotential = submission.current_arr && submission.current_arr > 0 
    ? Math.round(((submission.recovery_potential_70 || 0) / submission.current_arr) * 100)
    : 0;

  return (
    <Card className={`${config.bg} ${config.border} border-2 shadow-xl mb-8`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${config.bg}`}>
              <UrgencyIcon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Executive Summary</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={urgencyLevel === 'critical' ? 'destructive' : 'outline'} className="uppercase text-xs font-semibold">
                  {urgencyLevel} Priority
                </Badge>
                <span className="text-sm text-muted-foreground">• 2 min read</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Revenue Health Score</div>
            <div className={`text-3xl font-bold ${config.color}`}>
              {submission.current_arr && submission.total_leak 
                ? Math.max(0, Math.round(100 - ((submission.total_leak / submission.current_arr) * 100)))
                : 'N/A'
              }/100
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-4 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-revenue-danger" />
              <span className="text-sm font-medium text-muted-foreground">Annual Leak</span>
            </div>
            <div className="text-2xl font-bold text-revenue-danger">
              {formatCurrency(submission.total_leak || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {submission.current_arr && submission.current_arr > 0 
                ? `${((submission.total_leak || 0) / submission.current_arr * 100).toFixed(1)}% of ARR`
                : 'N/A'
              }
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-revenue-warning" />
              <span className="text-sm font-medium text-muted-foreground">Biggest Opportunity</span>
            </div>
            <div className="text-2xl font-bold text-revenue-warning">
              {formatCurrency(biggestOpportunity.value)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {biggestOpportunity.name}
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-revenue-success" />
              <span className="text-sm font-medium text-muted-foreground">Quick Win Value</span>
            </div>
            <div className="text-2xl font-bold text-revenue-success">
              {formatCurrency(quickWinValue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              30-60 days
            </div>
          </div>

          <div className="text-center p-4 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-revenue-primary" />
              <span className="text-sm font-medium text-muted-foreground">ROI Potential</span>
            </div>
            <div className="text-2xl font-bold text-revenue-primary">
              {roiPotential}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of current ARR
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onGetActionPlan}
            size="lg" 
            className="bg-gradient-to-r from-revenue-primary to-primary hover:from-revenue-primary/90 hover:to-primary/90"
          >
            <Target className="h-5 w-5 mr-2" />
            Get Action Plan
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Expert Call
          </Button>
        </div>

        {/* Quick Insights */}
        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Key Insights
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Revenue leak represents {submission.current_arr && submission.total_leak ? ((submission.total_leak / submission.current_arr) * 100).toFixed(1) : 'N/A'}% of your current ARR</li>
            <li>• {biggestOpportunity.name} offers the largest single improvement opportunity</li>
            <li>• Conservative recovery estimates show {formatCurrency(submission.recovery_potential_70 || 0)} potential</li>
            <li>• Implementation can begin immediately with quick wins in 30-60 days</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};