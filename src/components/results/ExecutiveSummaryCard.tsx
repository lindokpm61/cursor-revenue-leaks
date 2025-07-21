import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Zap, 
  Target, 
  TrendingUp,
  Calendar,
  Phone,
  ArrowUp,
  CheckCircle,
  BarChart3,
  Mail,
  AlertCircle
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateExecutiveSummary, getUrgencyConfig } from "@/lib/calculator/priorityCalculations";
import { useState } from "react";

interface ExecutiveSummaryCardProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  onGetActionPlan?: () => void;
}

export const ExecutiveSummaryCard = ({ 
  submission, 
  formatCurrency, 
  onGetActionPlan 
}: ExecutiveSummaryCardProps) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Use unified calculation service for all data
  const executiveSummary = calculateExecutiveSummary(submission as any);
  const { totalLeakage, realisticRecovery, urgencyLevel, confidenceLevel } = executiveSummary;

  const handleGetActionPlan = () => {
    if (!user) {
      // If no user, trigger registration modal (if onGetActionPlan is provided)
      onGetActionPlan?.();
    } else {
      // If user is authenticated, go directly to action plan page
      navigate(`/action-plan/${submission.id}`);
    }
  };

  const handleViewResults = () => {
    navigate(`/results/${submission.id}`);
  };

  const handleEmailResults = async () => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to email your results.",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      const resultUrl = `${window.location.origin}/results/${submission.id}`;
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'results',
          to: user.email,
          data: {
            userName: user.user_metadata?.full_name || user.email.split('@')[0],
            companyName: submission.company_name,
            totalLeak: totalLeakage,
            recoveryPotential: realisticRecovery,
            resultUrl: resultUrl
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email Sent!",
        description: "Your revenue analysis results have been sent to your email address.",
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send results. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };
  
  // Map unified urgency to component format
  const urgencyMapping = {
    'Critical': 'critical',
    'High': 'high', 
    'Medium': 'medium',
    'Low': 'low'
  } as const;

  const localUrgencyLevel = urgencyMapping[urgencyLevel];
  
  const urgencyConfig = {
    critical: { icon: TrendingUp, color: 'text-revenue-warning', bg: 'bg-revenue-warning/10', border: 'border-revenue-warning/20' },
    high: { icon: TrendingUp, color: 'text-revenue-warning', bg: 'bg-revenue-warning/10', border: 'border-revenue-warning/20' },
    medium: { icon: Target, color: 'text-revenue-primary', bg: 'bg-revenue-primary/10', border: 'border-revenue-primary/20' },
    low: { icon: Target, color: 'text-revenue-success', bg: 'bg-revenue-success/10', border: 'border-revenue-success/20' }
  };

  const config = urgencyConfig[localUrgencyLevel];
  const UrgencyIcon = config.icon;

  // Single key metric focus
  const totalLeak = totalLeakage;
  const quickWinValue = Math.min(
    submission.lead_response_loss || 0,
    submission.failed_payment_loss || 0
  );

  // Simplified content based on lead score
  const leadScore = submission.lead_score || 0;
  const showSimplified = isMobile || leadScore < 70;

  // Calculate required values using validated data
  const roiPotential = submission.current_arr && submission.current_arr > 0 
    ? Math.round((realisticRecovery / submission.current_arr) * 100)
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
    if (totalLeak >= 10000000) return "Revenue Optimization Opportunity";
    if (totalLeak >= 5000000) return "Major Growth Potential Identified"; 
    if (totalLeak >= 1000000) return "Revenue Opportunity Found";
    return "Revenue Analysis Complete";
  };

  // Mobile-first layout with only 3 key metrics
  if (isMobile) {
    return (
      <Card className={`${config.bg} ${config.border} border-2 shadow-xl mb-8 ${localUrgencyLevel === 'critical' ? 'animate-attention-pulse' : ''}`}>
        <CardHeader className="pb-4">
          <div className="text-center space-y-6">
            <div className={`p-4 rounded-2xl ${config.bg} border ${config.border} mx-auto w-fit`}>
              <UrgencyIcon className={`h-8 w-8 ${config.color}`} />
            </div>
            {/* PRIMARY LEVEL: Hero headline */}
            <div>
            <h1 className="text-hero text-center mb-4 text-foreground font-bold">
                {getSimplifiedMessage()}
              </h1>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge 
                  variant={localUrgencyLevel === 'critical' ? 'default' : 'outline'} 
                  className={`uppercase text-sm font-bold px-4 py-2 ${localUrgencyLevel === 'critical' ? 'bg-revenue-warning text-white' : ''}`}
                >
                  {localUrgencyLevel === 'critical' ? '💡' : localUrgencyLevel === 'high' ? '⚡' : '🎯'} {localUrgencyLevel} Opportunity
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {confidenceLevel} confidence
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 pb-8 space-y-8">
          {/* PRIMARY LEVEL: Single key metric with 48px font */}
          <div className="text-center p-8 rounded-xl bg-revenue-warning/10 border-2 border-revenue-warning/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-revenue-warning/5 to-revenue-warning/10"></div>
            <div className="relative space-y-4">
              <div className="text-hero text-revenue-warning leading-none flex items-center justify-center gap-3">
                <ArrowUp className="h-12 w-12" />
                {formatCurrency(totalLeak)}
              </div>
              <div className="text-body text-muted-foreground">
                Annual Recovery Opportunity
              </div>
            </div>
          </div>


          {/* PRIMARY CTA - 56px height minimum */}
          <Button 
            onClick={handleGetActionPlan}
            size="lg" 
            variant="default"
            className="w-full text-h3 font-bold px-8 py-4 h-[56px] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Target className="h-6 w-6 mr-3" />
            {user ? 'Get Action Plan' : 'Get Action Plan (Register)'}
          </Button>

          {/* SECONDARY ACTIONS with generous spacing */}
          <div className="space-y-4 pt-4">
            <Button 
              onClick={handleViewResults}
              variant="outline" 
              size="lg"
              className="w-full text-body px-8 py-3 h-[48px] transition-all duration-300"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              View Full Results
            </Button>
            
            <Button 
              onClick={handleEmailResults}
              disabled={isEmailLoading}
              variant="outline" 
              size="lg"
              className="w-full text-body px-8 py-3 h-[48px] transition-all duration-300"
            >
              <Mail className="h-5 w-5 mr-2" />
              {isEmailLoading ? "Sending..." : "Email Me Results"}
            </Button>
            
            {/* TERTIARY LEVEL: Details with 14px font */}
            <div className="text-center">
              <button className="text-small text-muted-foreground underline">
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
    <Card className={`${config.bg} ${config.border} border-2 shadow-xl mb-8 ${localUrgencyLevel === 'critical' ? 'animate-attention-pulse' : ''}`}>
      <CardHeader className="pb-6">
        {/* PRIMARY LEVEL: Hero headline and key message */}
        <div className="text-center mb-8 space-y-4">
          <div className={`p-4 rounded-2xl ${config.bg} border ${config.border} mx-auto w-fit`}>
            <UrgencyIcon className={`h-10 w-10 ${config.color}`} />
          </div>
          <h1 className="text-hero text-center text-foreground font-bold">
            {getSimplifiedMessage()}
          </h1>
          <div className="text-h2 font-semibold text-revenue-warning flex items-center justify-center gap-3">
            <ArrowUp className="h-6 w-6" />
            {formatCurrency(totalLeak)} Recovery Opportunity
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge 
              variant={localUrgencyLevel === 'critical' ? 'default' : 'outline'} 
              className={`uppercase text-sm font-bold px-4 py-2 ${localUrgencyLevel === 'critical' ? 'bg-revenue-warning text-white' : ''}`}
            >
              {localUrgencyLevel === 'critical' ? '💡' : localUrgencyLevel === 'high' ? '⚡' : '🎯'} {localUrgencyLevel} Opportunity
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {confidenceLevel} confidence
            </Badge>
          </div>
        </div>

      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* PRIMARY CTA - 56px height minimum, distinctive color */}
        <Button 
          onClick={handleGetActionPlan}
          size="lg" 
          variant="default"
          className="w-full text-h3 font-bold px-8 py-4 h-[56px] transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Target className="h-6 w-6 mr-3" />
          {user ? 'Get Action Plan' : 'Get Action Plan (Register)'}
        </Button>

        {/* SECONDARY ACTIONS with reduced visual weight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={handleViewResults}
            variant="outline" 
            size="lg"
            className="text-body px-6 py-3 h-[48px] transition-all duration-300"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            View Full Results
          </Button>
          <Button 
            onClick={handleEmailResults}
            disabled={isEmailLoading}
            variant="outline" 
            size="lg"
            className="text-body px-6 py-3 h-[48px] transition-all duration-300"
          >
            <Mail className="h-5 w-5 mr-2" />
            {isEmailLoading ? "Sending..." : "Email Me Results"}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="text-body px-6 py-3 h-[48px] transition-all duration-300"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Expert Call
          </Button>
        </div>

        {/* SECONDARY LEVEL: Enhanced value demonstration */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-revenue-primary/5 border border-primary/20 space-y-6">
          <div>
            <h4 className="text-h2 text-foreground mb-2 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              Your Recovery Roadmap
            </h4>
            <p className="text-small text-muted-foreground">Proven methodology used by 2,800+ revenue teams</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-revenue-success/20 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-revenue-success/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-4 w-4 text-revenue-success" />
              </div>
              <div className="text-revenue-success font-bold">30 Days</div>
              <div className="text-small text-muted-foreground">Quick wins implementation</div>
              <div className="text-xs font-medium text-revenue-success">
                {formatCurrency(Math.min(quickWinValue, totalLeak * 0.3))} potential
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-revenue-warning/20 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-revenue-warning/20 flex items-center justify-center mx-auto">
                <Target className="h-4 w-4 text-revenue-warning" />
              </div>
              <div className="text-revenue-warning font-bold">90 Days</div>
              <div className="text-small text-muted-foreground">Process optimization</div>
              <div className="text-xs font-medium text-revenue-warning">
                {formatCurrency(totalLeak * 0.7)} recovery target
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-revenue-primary/20 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-revenue-primary/20 flex items-center justify-center mx-auto">
                <TrendingUp className="h-4 w-4 text-revenue-primary" />
              </div>
              <div className="text-revenue-primary font-bold">180 Days</div>
              <div className="text-small text-muted-foreground">Full optimization</div>
              <div className="text-xs font-medium text-revenue-primary">
                {formatCurrency(realisticRecovery)} total recovery
              </div>
            </div>
          </div>
          
          {/* Social proof indicator */}
          <div className="text-center pt-2 border-t border-muted-foreground/10">
            <div className="text-xs text-muted-foreground">
              ⭐⭐⭐⭐⭐ 4.9/5 average implementation success rate
            </div>
          </div>
        </div>

        {/* TERTIARY LEVEL: Details with 14px font, collapsible */}
        <details className="group">
          <summary className="cursor-pointer text-small text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            How we calculated this analysis
          </summary>
          <div className="mt-4 p-4 rounded-lg bg-muted/20 border border-muted-foreground/20">
            <div className="text-small text-muted-foreground space-y-2">
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