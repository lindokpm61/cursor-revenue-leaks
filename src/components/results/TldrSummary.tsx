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
import { validateCalculationResults, getCalculationConfidenceLevel } from "@/lib/calculator/validationHelpers";

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
  // Validate calculations and apply realistic bounds
  const validation = validateCalculationResults({
    leadResponseLoss: submission.lead_response_loss || 0,
    failedPaymentLoss: submission.failed_payment_loss || 0,
    selfServeGap: submission.selfserve_gap_loss || 0,
    processLoss: submission.process_inefficiency_loss || 0,
    currentARR: submission.current_arr || 0,
    recoveryPotential70: submission.recovery_potential_70 || 0,
    recoveryPotential85: submission.recovery_potential_85 || 0
  });

  const confidenceLevel = getCalculationConfidenceLevel({
    currentARR: submission.current_arr || 0,
    monthlyLeads: submission.monthly_leads || 0,
    monthlyFreeSignups: submission.monthly_free_signups || 0,
    totalLeak: submission.total_leak || 0
  });

  // Use validated values or apply caps
  const validatedLeadLoss = validation.leadResponse.adjustedValue || submission.lead_response_loss || 0;
  const validatedSelfServeLoss = validation.selfServe.adjustedValue || submission.selfserve_gap_loss || 0;
  const validatedFailedPaymentLoss = submission.failed_payment_loss || 0;
  const validatedProcessLoss = submission.process_inefficiency_loss || 0;
  
  const validatedTotalLeak = validatedLeadLoss + validatedFailedPaymentLoss + validatedSelfServeLoss + validatedProcessLoss;
  
  // Calculate realistic recovery potential (capped at validated totals)
  const realisticRecovery70 = Math.min(
    submission.recovery_potential_70 || 0,
    validatedTotalLeak * 0.7,
    (submission.current_arr || 0) * 2 // Never more than 2x ARR
  );

  const getTldrContent = () => {
    const biggestLoss = Math.max(
      validatedLeadLoss,
      validatedFailedPaymentLoss,
      validatedSelfServeLoss,
      validatedProcessLoss
    );

    // Quick win based on implementation ease vs value
    const quickWinOptions = [
      { value: validatedFailedPaymentLoss, ease: 4, name: 'payment_recovery' },
      { value: validatedLeadLoss * 0.3, ease: 3, name: 'lead_response' }, // 30% of lead response is quick
      { value: validatedProcessLoss * 0.5, ease: 2, name: 'process_automation' }
    ];
    
    const quickestWin = quickWinOptions
      .filter(option => option.value > 0)
      .sort((a, b) => (b.value / (6 - b.ease)) - (a.value / (6 - a.ease)))[0] || quickWinOptions[0];

    switch (userIntent) {
      case "understand-problem":
        const leakPercentage = submission.current_arr ? (validatedTotalLeak / submission.current_arr) * 100 : 0;
        const hasWarnings = !validation.overall.isValid;
        return {
          title: "Your Biggest Problem",
          summary: `You're losing ${formatCurrency(validatedTotalLeak)} annually, with ${formatCurrency(biggestLoss)} from your worst area. This represents ${leakPercentage.toFixed(1)}% of your ARR${hasWarnings ? ' (estimate adjusted for realism)' : ''}.`,
          actionText: "Focus on the largest leak first",
          urgency: leakPercentage > 15 ? "high" : leakPercentage > 8 ? "medium" : "low",
          nextStep: "See detailed breakdown",
          sectionId: "breakdown",
          confidence: confidenceLevel,
          hasWarnings
        };
        
      case "quick-wins":
        const quickWinValue = quickestWin.value * 0.8; // 80% success rate
        const quickWinName = quickestWin.name === 'payment_recovery' ? 'payment recovery systems' : 
                             quickestWin.name === 'lead_response' ? 'lead response automation' : 'process automation';
        return {
          title: "Your Quick Win",
          summary: `Start with ${quickWinName} - you can recover ${formatCurrency(quickWinValue)} in 30-60 days with ${quickestWin.ease >= 3 ? 'minimal' : 'moderate'} complexity and high success probability.`,
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
          summary: `Follow a ${phases} approach: Fix payments (60 days), improve lead response (90 days), then optimize conversion (120 days). Realistic recovery: ${formatCurrency(realisticRecovery70)} with ${confidenceLevel} confidence.`,
          actionText: "Follow the proven sequence",
          urgency: confidenceLevel.level === 'low' ? "medium" : "low",
          nextStep: "See complete timeline",
          sectionId: "timeline",
          confidence: confidenceLevel
        };
        
      case "compare-competitors":
        const gapCount = [validatedLeadLoss, validatedSelfServeLoss, validatedFailedPaymentLoss, validatedProcessLoss]
          .filter(loss => loss > (submission.current_arr || 0) * 0.02).length; // Gaps >2% of ARR
        const competitiveUrgency = gapCount >= 3 ? "high" : gapCount >= 2 ? "medium" : "low";
        return {
          title: "Competitive Position",
          summary: `You're underperforming industry benchmarks in ${gapCount} key area${gapCount !== 1 ? 's' : ''}, representing ${competitiveUrgency} competitive risk. Closing these gaps could recover ${formatCurrency(realisticRecovery70)}.`,
          actionText: "Close competitive gaps",
          urgency: competitiveUrgency,
          nextStep: "View benchmarking details",
          sectionId: "benchmarking",
          confidence: confidenceLevel
        };
        
      default:
        return {
          title: "Key Insight",
          summary: `You have ${formatCurrency(validatedTotalLeak)} in annual revenue leakage with ${formatCurrency(realisticRecovery70)} realistic recovery potential through systematic fixes (${confidenceLevel} confidence).`,
          actionText: "Start with highest ROI actions",
          urgency: "medium",
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
                {tldr.confidence && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {typeof tldr.confidence === 'object' ? tldr.confidence.level : tldr.confidence} confidence
                  </Badge>
                )}
                {tldr.hasWarnings && (
                  <Badge variant="outline" className="text-xs px-2 py-1 text-revenue-warning border-revenue-warning/50">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    adjusted
                  </Badge>
                )}
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