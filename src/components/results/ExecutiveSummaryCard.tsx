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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
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

  // Single key metric focus
  const totalLeak = submission.total_leak || 0;
  const quickWinValue = Math.min(
    submission.lead_response_loss || 0,
    submission.failed_payment_loss || 0
  );

  // Simplified content based on lead score
  const leadScore = submission.lead_score || 0;
  const showSimplified = isMobile || leadScore < 70;

  // Calculate required values
  const roiPotential = submission.current_arr && submission.current_arr > 0 
    ? Math.round(((submission.recovery_potential_70 || 0) / submission.current_arr) * 100)
    : 0;

  const opportunities = [
    { name: 'Lead Response', value: submission.lead_response_loss || 0 },
    { name: 'Self-Serve Gap', value: submission.selfserve_gap_loss || 0 },
    { name: 'Failed Payments', value: submission.failed_payment_loss || 0 },
    { name: 'Process Inefficiency', value: submission.process_inefficiency_loss || 0 }
  ];
  
  const biggestOpportunity = opportunities.reduce((max, opp) => 
    opp.value > max.value ? opp : max
  );

  const getSimplifiedMessage = () => {
    if (totalLeak >= 10000000) return "Revenue Crisis Detected";
    if (totalLeak >= 5000000) return "Major Revenue Leak"; 
    if (totalLeak >= 1000000) return "Revenue Opportunity Found";
    return "Revenue Analysis Complete";
  };

  // Mobile-first layout with only 3 key metrics
  if (isMobile) {
    return (
      <Card className={`${config.bg} ${config.border} border-2 shadow-xl mb-8 ${urgencyLevel === 'critical' ? 'animate-attention-pulse' : ''}`}>
        <CardHeader className="pb-4">
          <div className="text-center space-y-4">
            <div className={`p-4 rounded-2xl ${config.bg} border ${config.border} mx-auto w-fit`}>
              <UrgencyIcon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-h2 font-bold mb-2">Your Revenue Analysis</CardTitle>
              <Badge 
                variant={urgencyLevel === 'critical' ? 'destructive' : 'outline'} 
                className={`uppercase text-xs font-bold px-3 py-1 ${urgencyLevel === 'critical' ? 'bg-revenue-danger text-white' : ''}`}
              >
                {urgencyLevel === 'critical' ? '🚨' : urgencyLevel === 'high' ? '⚡' : '🎯'} {urgencyLevel} Priority
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-8 space-y-6">
          {/* Mobile: Only 3 Key Metrics */}
          <div className="space-y-4">
            <div className="text-center p-6 rounded-xl bg-revenue-danger/10 border-2 border-revenue-danger/20 relative overflow-hidden min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-revenue-danger/5 to-revenue-danger/10"></div>
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <AlertTriangle className="h-6 w-6 text-revenue-danger" />
                  <span className="text-small font-semibold text-revenue-danger">Annual Loss</span>
                </div>
                <div className="text-hero font-bold text-revenue-danger leading-none mb-2">
                  {formatCurrency(submission.total_leak || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {submission.current_arr && submission.current_arr > 0 
                    ? `${((submission.total_leak || 0) / submission.current_arr * 100).toFixed(1)}% of ARR`
                    : 'N/A'
                  }
                </div>
              </div>
            </div>

            <div className="text-center p-6 rounded-xl bg-revenue-success/10 border-2 border-revenue-success/20 relative overflow-hidden min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-revenue-success/5 to-revenue-success/10"></div>
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Zap className="h-6 w-6 text-revenue-success" />
                  <span className="text-small font-semibold text-revenue-success">Quick Win</span>
                </div>
                <div className="text-hero font-bold text-revenue-success leading-none mb-2">
                  {formatCurrency(quickWinValue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  ⚡ Recoverable in 30-60 days
                </div>
              </div>
            </div>

            <div className="text-center p-6 rounded-xl bg-revenue-primary/10 border-2 border-revenue-primary/20 relative overflow-hidden min-h-[120px]">
              <div className="absolute inset-0 bg-gradient-to-br from-revenue-primary/5 to-revenue-primary/10"></div>
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <TrendingUp className="h-6 w-6 text-revenue-primary" />
                  <span className="text-small font-semibold text-revenue-primary">ROI Potential</span>
                </div>
                <div className="text-hero font-bold text-revenue-primary leading-none mb-2">
                  {roiPotential}%
                </div>
                <div className="text-xs text-muted-foreground">
                  of current ARR
                </div>
              </div>
            </div>
          </div>

          {/* Single Primary CTA for Mobile */}
          <Button 
            onClick={onGetActionPlan}
            size="lg" 
            className="w-full bg-gradient-to-r from-revenue-primary to-primary hover:from-revenue-primary/90 hover:to-primary/90 shadow-attention-glow hover:shadow-attention-pulse text-h3 px-8 py-4 h-auto min-h-[56px] transition-all duration-300"
          >
            <Target className="h-6 w-6 mr-3" />
            Get Your Action Plan
          </Button>

          {/* Simple Key Insight for Mobile */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-revenue-primary/5 border-l-4 border-primary">
            <div className="text-center">
              <div className="font-bold text-small mb-2">💡 Key Insight</div>
              <div className="text-xs text-muted-foreground">
                Focus on {biggestOpportunity.name.toLowerCase()} first - it offers the largest improvement potential of {formatCurrency(biggestOpportunity.value)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop layout with full information
  return (
    <Card className={`${config.bg} ${config.border} border-2 shadow-xl mb-8 ${urgencyLevel === 'critical' ? 'animate-attention-pulse' : ''}`}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${config.bg} border ${config.border}`}>
              <UrgencyIcon className={`h-10 w-10 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-h1 font-bold mb-2">Executive Summary</CardTitle>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={urgencyLevel === 'critical' ? 'destructive' : 'outline'} 
                  className={`uppercase text-xs font-bold px-3 py-1 ${urgencyLevel === 'critical' ? 'bg-revenue-danger text-white' : ''}`}
                >
                  {urgencyLevel === 'critical' ? '🚨' : urgencyLevel === 'high' ? '⚡' : '🎯'} {urgencyLevel} Priority
                </Badge>
                <span className="text-small text-muted-foreground">• 2 min read</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-small text-muted-foreground mb-1">Revenue Health Score</div>
            <div className={`text-hero font-bold ${config.color} leading-none`}>
              {submission.current_arr && submission.total_leak 
                ? Math.max(0, Math.round(100 - ((submission.total_leak / submission.current_arr) * 100)))
                : 'N/A'
              }
            </div>
            <div className="text-small text-muted-foreground mt-1">/100</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Key Metrics Grid - Priority Level 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 rounded-xl bg-revenue-danger/10 border-2 border-revenue-danger/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-revenue-danger/5 to-revenue-danger/10"></div>
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="h-6 w-6 text-revenue-danger" />
                <span className="text-small font-semibold text-revenue-danger">Annual Loss</span>
              </div>
              <div className="text-hero font-bold text-revenue-danger leading-none mb-2">
                {formatCurrency(submission.total_leak || 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                {submission.current_arr && submission.current_arr > 0 
                  ? `${((submission.total_leak || 0) / submission.current_arr * 100).toFixed(1)}% of ARR`
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          <div className="text-center p-6 rounded-xl bg-revenue-success/10 border-2 border-revenue-success/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-revenue-success/5 to-revenue-success/10"></div>
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="h-6 w-6 text-revenue-success" />
                <span className="text-small font-semibold text-revenue-success">Quick Win</span>
              </div>
              <div className="text-hero font-bold text-revenue-success leading-none mb-2">
                {formatCurrency(quickWinValue)}
              </div>
              <div className="text-xs text-muted-foreground">
                ⚡ 30-60 days
              </div>
            </div>
          </div>

          <div className="text-center p-6 rounded-xl bg-revenue-primary/10 border-2 border-revenue-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-revenue-primary/5 to-revenue-primary/10"></div>
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-3">
                <TrendingUp className="h-6 w-6 text-revenue-primary" />
                <span className="text-small font-semibold text-revenue-primary">ROI Potential</span>
              </div>
              <div className="text-hero font-bold text-revenue-primary leading-none mb-2">
                {roiPotential}%
              </div>
              <div className="text-xs text-muted-foreground">
                of current ARR
              </div>
            </div>
          </div>
        </div>

        {/* Action CTAs - Priority Level 1 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            onClick={onGetActionPlan}
            size="lg" 
            className="bg-gradient-to-r from-revenue-primary to-primary hover:from-revenue-primary/90 hover:to-primary/90 shadow-attention-glow hover:shadow-attention-pulse text-h3 px-8 py-4 h-auto min-h-[56px] transition-all duration-300"
          >
            <Target className="h-6 w-6 mr-3" />
            Get Action Plan
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-primary text-primary hover:bg-primary/10 text-h3 px-8 py-4 h-auto min-h-[56px] transition-all duration-300"
          >
            <Calendar className="h-6 w-6 mr-3" />
            Book Expert Call
          </Button>
        </div>

        {/* Key Insights - Priority Level 2 */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-revenue-primary/5 border-l-4 border-primary">
          <h4 className="font-bold text-h3 mb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            Key Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="w-2 h-2 rounded-full bg-revenue-danger mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-small">Revenue Impact</div>
                <div className="text-xs text-muted-foreground">
                  Leak represents {submission.current_arr && submission.total_leak ? ((submission.total_leak / submission.current_arr) * 100).toFixed(1) : 'N/A'}% of your current ARR
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="w-2 h-2 rounded-full bg-revenue-warning mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-small">Top Opportunity</div>
                <div className="text-xs text-muted-foreground">
                  {biggestOpportunity.name} offers the largest improvement potential
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="w-2 h-2 rounded-full bg-revenue-success mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-small">Recovery Potential</div>
                <div className="text-xs text-muted-foreground">
                  Conservative estimates show {formatCurrency(submission.recovery_potential_70 || 0)} potential
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="w-2 h-2 rounded-full bg-revenue-primary mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-medium text-small">Implementation</div>
                <div className="text-xs text-muted-foreground">
                  Begin immediately with quick wins in 30-60 days
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};