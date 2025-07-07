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
          <div className="text-center space-y-6">
            <div className={`p-4 rounded-2xl ${config.bg} border ${config.border} mx-auto w-fit`}>
              <UrgencyIcon className={`h-8 w-8 ${config.color}`} />
            </div>
            {/* PRIMARY LEVEL: Hero headline */}
            <div>
              <CardTitle className="text-[48px] leading-tight font-black mb-4 text-foreground">
                {getSimplifiedMessage()}
              </CardTitle>
              <Badge 
                variant={urgencyLevel === 'critical' ? 'destructive' : 'outline'} 
                className={`uppercase text-sm font-bold px-4 py-2 ${urgencyLevel === 'critical' ? 'bg-revenue-danger text-white' : ''}`}
              >
                {urgencyLevel === 'critical' ? '🚨' : urgencyLevel === 'high' ? '⚡' : '🎯'} {urgencyLevel} Priority
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-8 space-y-8">
          {/* PRIMARY LEVEL: Single key metric with 48px font */}
          <div className="text-center p-8 rounded-xl bg-revenue-danger/10 border-2 border-revenue-danger/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-revenue-danger/5 to-revenue-danger/10"></div>
            <div className="relative space-y-4">
              <div className="text-[48px] font-black text-revenue-danger leading-none">
                {formatCurrency(totalLeak)}
              </div>
              <div className="text-[16px] text-muted-foreground">
                Annual Revenue Loss
              </div>
            </div>
          </div>


          {/* PRIMARY CTA - 56px height minimum */}
          <Button 
            onClick={onGetActionPlan}
            size="lg" 
            className="w-full bg-gradient-to-r from-revenue-primary to-primary hover:from-revenue-primary/90 hover:to-primary/90 shadow-attention-glow hover:shadow-attention-pulse text-[20px] font-bold px-8 py-4 h-[56px] transition-all duration-300"
          >
            <Target className="h-6 w-6 mr-3" />
            Get Action Plan
          </Button>

          {/* SECONDARY ACTIONS with generous spacing */}
          <div className="space-y-4 pt-4">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full border-2 border-primary text-primary hover:bg-primary/10 text-[16px] px-8 py-3 h-[48px] transition-all duration-300"
            >
              Email Me Results
            </Button>
            
            {/* TERTIARY LEVEL: Details with 14px font */}
            <div className="text-center">
              <button className="text-[14px] text-muted-foreground underline">
                How we calculated this
              </button>
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
        {/* PRIMARY LEVEL: Hero headline and key message */}
        <div className="text-center mb-8 space-y-4">
          <div className={`p-4 rounded-2xl ${config.bg} border ${config.border} mx-auto w-fit`}>
            <UrgencyIcon className={`h-10 w-10 ${config.color}`} />
          </div>
          <CardTitle className="text-[48px] leading-tight font-black text-foreground">
            {getSimplifiedMessage()}
          </CardTitle>
          <div className="text-[24px] font-semibold text-revenue-danger">
            Losing {formatCurrency(totalLeak)} Annually
          </div>
          <Badge 
            variant={urgencyLevel === 'critical' ? 'destructive' : 'outline'} 
            className={`uppercase text-sm font-bold px-4 py-2 ${urgencyLevel === 'critical' ? 'bg-revenue-danger text-white' : ''}`}
          >
            {urgencyLevel === 'critical' ? '🚨' : urgencyLevel === 'high' ? '⚡' : '🎯'} {urgencyLevel} Priority
          </Badge>
        </div>

      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* PRIMARY CTA - 56px height minimum, distinctive color */}
        <Button 
          onClick={onGetActionPlan}
          size="lg" 
          className="w-full bg-gradient-to-r from-revenue-primary to-primary hover:from-revenue-primary/90 hover:to-primary/90 shadow-attention-glow hover:shadow-attention-pulse text-[20px] font-bold px-8 py-4 h-[56px] transition-all duration-300"
        >
          <Target className="h-6 w-6 mr-3" />
          Get Action Plan
        </Button>

        {/* SECONDARY ACTIONS with reduced visual weight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-primary text-primary hover:bg-primary/10 text-[16px] px-6 py-3 h-[48px] transition-all duration-300"
          >
            Email Me Results
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-muted-foreground/30 text-muted-foreground hover:bg-muted/10 text-[16px] px-6 py-3 h-[48px] transition-all duration-300"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Expert Call
          </Button>
        </div>

        {/* SECONDARY LEVEL: Implementation preview with 24px headers */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-revenue-primary/5 border border-primary/20 space-y-4">
          <h4 className="text-[24px] font-bold text-foreground mb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="h-6 w-6 text-primary" />
            </div>
            Implementation Timeline
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50 text-center">
              <div className="text-revenue-success font-bold mb-2">30 Days</div>
              <div className="text-[14px] text-muted-foreground">Quick wins implementation</div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 text-center">
              <div className="text-revenue-warning font-bold mb-2">90 Days</div>
              <div className="text-[14px] text-muted-foreground">Process optimization</div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 text-center">
              <div className="text-revenue-primary font-bold mb-2">180 Days</div>
              <div className="text-[14px] text-muted-foreground">Full recovery achieved</div>
            </div>
          </div>
        </div>

        {/* TERTIARY LEVEL: Details with 14px font, collapsible */}
        <details className="group">
          <summary className="cursor-pointer text-[14px] text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            How we calculated this analysis
          </summary>
          <div className="mt-4 p-4 rounded-lg bg-muted/20 border border-muted-foreground/20">
            <div className="text-[14px] text-muted-foreground space-y-2">
              <p>• Revenue leak calculated from operational inefficiencies and missed opportunities</p>
              <p>• Quick win estimates based on industry benchmarks for immediate improvements</p>
              <p>• ROI potential derived from conservative recovery scenarios (70% success rate)</p>
              <p>• Timeline estimates account for typical implementation challenges and resource allocation</p>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};