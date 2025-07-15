import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  Clock,
  ChevronRight,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { type UserIntent } from "./UserIntentSelector";
import { calculateExecutiveSummary, getUrgencyConfig } from "@/lib/calculator/priorityCalculations";

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
  // Use unified calculation service for all data
  const executiveSummary = calculateExecutiveSummary(submission as any);
  const { totalLeakage, realisticRecovery, quickWins, urgencyLevel, confidenceLevel } = executiveSummary;

  const getTldrContent = () => {
    // Get individual loss components from submission
    const leadLoss = submission.lead_response_loss || 0;
    const paymentLoss = submission.failed_payment_loss || 0;
    const selfServeLoss = submission.selfserve_gap_loss || 0;
    const processLoss = submission.process_inefficiency_loss || 0;
    
    const biggestLoss = Math.max(leadLoss, paymentLoss, selfServeLoss, processLoss);
    const topQuickWin = quickWins[0] || {
      action: 'Process optimization',
      timeframe: '2-4 weeks',
      recoveryAmount: paymentLoss * 0.8
    };

    // Map urgency level to string format for UI
    const urgencyMapping = {
      'Critical': 'high',
      'High': 'high', 
      'Medium': 'medium',
      'Low': 'low'
    } as const;

    switch (userIntent) {
      case "understand-problem":
        const leakPercentage = submission.current_arr ? (totalLeakage / submission.current_arr) * 100 : 0;
        return {
          title: "Your Biggest Problem",
          summary: `You're losing ${formatCurrency(totalLeakage)} annually, with ${formatCurrency(biggestLoss)} from your worst area. This represents ${leakPercentage.toFixed(1)}% of your ARR.`,
          actionText: "Focus on the largest leak first",
          urgency: urgencyMapping[urgencyLevel],
          nextStep: "See detailed breakdown",
          sectionId: "breakdown",
          confidence: confidenceLevel
        };
        
      case "quick-wins":
        const quickWinValue = topQuickWin.recoveryAmount * 0.8; // 80% success rate
        const quickWinName = topQuickWin.action.toLowerCase().includes('payment') ? 'payment recovery systems' : 
                             topQuickWin.action.toLowerCase().includes('lead') ? 'lead response automation' : 'process automation';
        return {
          title: "Your Quick Win",
          summary: `Start with ${quickWinName} - you can recover ${formatCurrency(quickWinValue)} in ${topQuickWin.timeframe} with ${confidenceLevel.toLowerCase()} success probability.`,
          actionText: `Implement ${quickWinName} first`,
          urgency: quickWinValue > 500000 ? "medium" : "low",
          nextStep: "View implementation plan",
          sectionId: "priority-actions",
          confidence: confidenceLevel
        };
        
      case "plan-implementation":
        const timelineComplexity = (submission.current_arr || 0) > 10000000 ? 'enterprise-grade' : 'standard';
        const phases = timelineComplexity === 'enterprise-grade' ? '4-phase' : '3-phase';
        return {
          title: "Your Implementation Strategy",
          summary: `Follow a ${phases} approach: Fix payments (60 days), improve lead response (90 days), then optimize conversion (120 days). Realistic recovery: ${formatCurrency(realisticRecovery)} with ${confidenceLevel.toLowerCase()} confidence.`,
          actionText: "Follow the proven sequence",
          urgency: confidenceLevel === 'Low' ? "medium" : "low",
          nextStep: "See complete timeline",
          sectionId: "timeline",
          confidence: confidenceLevel
        };
        
      case "compare-competitors":
        const gapCount = [leadLoss, selfServeLoss, paymentLoss, processLoss]
          .filter(loss => loss > (submission.current_arr || 0) * 0.02).length; // Gaps >2% of ARR
        const competitiveUrgency = gapCount >= 3 ? "high" : gapCount >= 2 ? "medium" : "low";
        return {
          title: "Competitive Position",
          summary: `You're underperforming industry benchmarks in ${gapCount} key area${gapCount !== 1 ? 's' : ''}, representing ${competitiveUrgency} competitive risk. Closing these gaps could recover ${formatCurrency(realisticRecovery)}.`,
          actionText: "Close competitive gaps",
          urgency: competitiveUrgency,
          nextStep: "View benchmarking details",
          sectionId: "benchmarking",
          confidence: confidenceLevel
        };
        
      default:
        return {
          title: "Key Insight",
          summary: `You have ${formatCurrency(totalLeakage)} in annual revenue leakage with ${formatCurrency(realisticRecovery)} realistic recovery potential through systematic fixes (${confidenceLevel.toLowerCase()} confidence).`,
          actionText: "Start with highest ROI actions",
          urgency: urgencyMapping[urgencyLevel],
          nextStep: "See action plan",
          sectionId: "priority-actions",
          confidence: confidenceLevel
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
                  {tldr.confidence} confidence
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