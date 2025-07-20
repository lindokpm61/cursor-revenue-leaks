
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, TrendingUp, Building2, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { calculateUnifiedResults, type UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";

interface DashboardHeroSectionProps {
  latestAnalysis: {
    id: string;
    company_name: string;
    created_at: string | null;
    current_arr: number | null;
    monthly_mrr: number | null;
    monthly_leads: number | null;
    average_deal_value: number | null;
    lead_response_time: number | null;
    monthly_free_signups: number | null;
    free_to_paid_conversion: number | null;
    failed_payment_rate: number | null;
    manual_hours: number | null;
    hourly_rate: number | null;
    industry: string | null;
  };
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  calculateROI: (submission: any) => number;
}

export const DashboardHeroSection = ({ 
  latestAnalysis, 
  formatCurrency, 
  formatDate,
  calculateROI 
}: DashboardHeroSectionProps) => {
  const navigate = useNavigate();

  // Transform submission to unified calculation format
  const getCalculatedValues = (analysis: typeof latestAnalysis) => {
    const calculationInputs: UnifiedCalculationInputs = {
      currentARR: Number(analysis.current_arr || 0),
      monthlyMRR: Number(analysis.monthly_mrr || 0),
      monthlyLeads: Number(analysis.monthly_leads || 0),
      averageDealValue: Number(analysis.average_deal_value || 0),
      leadResponseTime: Number(analysis.lead_response_time || 24),
      monthlyFreeSignups: Number(analysis.monthly_free_signups || 0),
      freeToLaidConversion: Number(analysis.free_to_paid_conversion || 0),
      failedPaymentRate: Number(analysis.failed_payment_rate || 0),
      manualHours: Number(analysis.manual_hours || 0),
      hourlyRate: Number(analysis.hourly_rate || 0),
      industry: analysis.industry || ''
    };

    return calculateUnifiedResults(calculationInputs);
  };

  const calculations = getCalculatedValues(latestAnalysis);
  const isHighImpact = calculations.recovery70Percent > 100000000;
  const urgencyLevel = calculations.totalLoss > 50000000 ? 'high' : calculations.totalLoss > 20000000 ? 'medium' : 'low';

  const handleViewResults = () => {
    navigate(`/results/${latestAnalysis.id}`);
  };

  const handleViewActionPlan = () => {
    navigate(`/action-plan/${latestAnalysis.id}`);
  };

  const handleBookCall = () => {
    window.open('https://calendly.com/your-calendar', '_blank');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Company Identity & Context */}
      <div className="bg-gradient-to-br from-background via-background to-muted/30 rounded-2xl p-6 sm:p-8 border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {latestAnalysis.company_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Revenue Recovery Analysis
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-background">
              {latestAnalysis.industry}
            </Badge>
            {latestAnalysis.current_arr && (
              <Badge variant="secondary">
                {formatCurrency(latestAnalysis.current_arr)} ARR
              </Badge>
            )}
            <Badge 
              variant={urgencyLevel === 'high' ? 'destructive' : urgencyLevel === 'medium' ? 'default' : 'secondary'}
              className="hidden sm:inline-flex"
            >
              {urgencyLevel === 'high' ? 'High Impact' : urgencyLevel === 'medium' ? 'Medium Impact' : 'Standard Impact'}
            </Badge>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="border-destructive/20 bg-gradient-to-br from-background to-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="text-sm font-medium text-destructive/80">
                  Annual Revenue Leak
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-destructive mb-1">
                {formatCurrency(calculations.totalLoss)}
              </div>
              <div className="text-xs text-muted-foreground">
                Every month = {formatCurrency(calculations.totalLoss / 12)} lost
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-gradient-to-br from-background to-green-50 dark:border-green-800/30 dark:to-green-950/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  Recovery Potential
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {formatCurrency(calculations.recovery70Percent)}
              </div>
              <div className="text-xs text-muted-foreground">
                70% confidence level
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm font-medium text-primary/80">
                  ROI Potential
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {calculateROI(latestAnalysis)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Implementation return
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            Analysis completed {formatDate(latestAnalysis.created_at || '')}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Validated methodology • Enterprise-grade analysis
            </span>
          </div>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-3xl"></div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Full Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed breakdown of your {formatCurrency(calculations.recovery70Percent)} opportunity
                </p>
              </div>
              <Button 
                onClick={handleViewResults}
                className="w-full"
                size="lg"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Results
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Action Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Step-by-step implementation roadmap
                </p>
              </div>
              <Button 
                onClick={handleViewActionPlan}
                variant="outline"
                className="w-full"
                size="lg"
              >
                View Action Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isHighImpact ? 'border-green-500 bg-gradient-to-br from-background to-green-50 dark:to-green-950/20' : 'border-primary bg-gradient-to-br from-background to-primary/5'} sm:col-span-2 lg:col-span-1 relative overflow-hidden`}>
          {isHighImpact && (
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="bg-green-500 text-white">
                Priority
              </Badge>
            </div>
          )}
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {isHighImpact ? 'Priority Strategy Call' : 'Strategy Consultation'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isHighImpact 
                    ? 'High-impact opportunity requires immediate attention'
                    : 'Expert guidance for implementation'
                  }
                </p>
              </div>
              <Button 
                onClick={handleBookCall}
                variant={isHighImpact ? "default" : "secondary"}
                className={`w-full ${isHighImpact ? 'bg-green-600 hover:bg-green-700' : ''}`}
                size="lg"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {isHighImpact ? 'Book Priority Call' : 'Book Consultation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methodology Footer */}
      <div className="text-center py-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Analysis based on proprietary revenue optimization methodology • Results backed by industry benchmarks
        </p>
      </div>
    </div>
  );
};
