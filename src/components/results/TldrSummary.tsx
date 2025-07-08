import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { type UserIntent } from "./UserIntentSelector";

interface TldrSummaryProps {
  submission: Submission;
  userIntent: UserIntent;
  formatCurrency: (amount: number) => string;
  onExpandSection?: (sectionId: string) => void;
}

export const TldrSummary = ({ 
  submission, 
  userIntent, 
  formatCurrency,
  onExpandSection 
}: TldrSummaryProps) => {
  const getTldrContent = () => {
    const biggestLoss = Math.max(
      submission.lead_response_loss || 0,
      submission.failed_payment_loss || 0,
      submission.selfserve_gap_loss || 0,
      submission.process_inefficiency_loss || 0
    );

    const quickestWin = Math.min(
      submission.lead_response_loss || Infinity,
      submission.failed_payment_loss || Infinity
    );

    switch (userIntent) {
      case "understand-problem":
        return {
          title: "Your Biggest Problem",
          summary: `You're losing ${formatCurrency(submission.total_leak || 0)} annually, with ${formatCurrency(biggestLoss)} coming from your worst-performing area. This represents ${submission.leak_percentage?.toFixed(1)}% of your current ARR.`,
          actionText: "Focus on the largest leak first",
          urgency: "high",
          nextStep: "See detailed breakdown",
          sectionId: "breakdown"
        };
        
      case "quick-wins":
        return {
          title: "Your Quick Win",
          summary: `Start with payment recovery systems - you can recover ${formatCurrency(quickestWin * 0.8)} in 30-60 days with minimal technical complexity and high success probability.`,
          actionText: "Implement payment fixes first",
          urgency: "medium",
          nextStep: "View implementation plan",
          sectionId: "priority-actions"
        };
        
      case "plan-implementation":
        return {
          title: "Your Implementation Strategy",
          summary: `Follow a 3-phase approach: Fix payments (60 days), improve lead response (90 days), then optimize conversion (120 days). Total potential recovery: ${formatCurrency(submission.recovery_potential_70 || 0)}.`,
          actionText: "Follow the proven sequence",
          urgency: "low",
          nextStep: "See complete timeline",
          sectionId: "timeline"
        };
        
      case "compare-competitors":
        return {
          title: "Competitive Position",
          summary: `You're underperforming industry benchmarks in 2-3 key areas, representing significant competitive disadvantage. Fixing these gaps could improve your market position substantially.`,
          actionText: "Close competitive gaps",
          urgency: "medium",
          nextStep: "View benchmarking details",
          sectionId: "benchmarking"
        };
        
      default:
        return {
          title: "Key Insight",
          summary: `You have ${formatCurrency(submission.total_leak || 0)} in annual revenue leakage with ${formatCurrency(submission.recovery_potential_70 || 0)} realistic recovery potential through systematic fixes.`,
          actionText: "Start with highest ROI actions",
          urgency: "medium",
          nextStep: "See action plan",
          sectionId: "priority-actions"
        };
    }
  };

  const tldr = getTldrContent();
  
  const urgencyConfig = {
    high: { 
      color: "text-revenue-danger", 
      bg: "bg-revenue-danger/10", 
      border: "border-revenue-danger/20",
      icon: AlertTriangle,
      badge: "🚨 Critical"
    },
    medium: { 
      color: "text-revenue-warning", 
      bg: "bg-revenue-warning/10", 
      border: "border-revenue-warning/20",
      icon: Target,
      badge: "⚡ Important"
    },
    low: { 
      color: "text-revenue-primary", 
      bg: "bg-revenue-primary/10", 
      border: "border-revenue-primary/20",
      icon: TrendingUp,
      badge: "📋 Strategic"
    }
  };

  const config = urgencyConfig[tldr.urgency];
  const UrgencyIcon = config.icon;

  return (
    <Card className={`mb-6 ${config.bg} ${config.border} border-2 shadow-lg`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`p-2 sm:p-3 rounded-xl ${config.bg} border ${config.border} flex-shrink-0`}>
            <UrgencyIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-3">
              <h3 className="font-bold text-xl sm:text-h2 leading-tight">{tldr.title}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold px-3 py-1">
                  {config.badge}
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  30 sec read
                </Badge>
              </div>
            </div>
            
            <p className="text-sm sm:text-body mb-4 leading-relaxed">
              {tldr.summary}
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.bg} border ${config.border} flex-shrink-0`}>
                  <Lightbulb className={`h-4 w-4 ${config.color}`} />
                </div>
                <span className="font-medium text-sm sm:text-small">{tldr.actionText}</span>
              </div>
              
              {onExpandSection && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onExpandSection(tldr.sectionId)}
                  className="text-xs px-4 py-2 hover:shadow-md transition-all duration-200 w-fit"
                >
                  {tldr.nextStep}
                  <ChevronRight className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};