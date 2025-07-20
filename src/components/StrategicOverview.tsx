
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Clock, Target } from "lucide-react";
import { calculateUnifiedResults, type UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";

interface StrategicOverviewProps {
  latestAnalysis: {
    id: string;
    company_name: string;
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
}

export const StrategicOverview = ({ latestAnalysis, formatCurrency }: StrategicOverviewProps) => {
  const calculationInputs: UnifiedCalculationInputs = {
    currentARR: Number(latestAnalysis.current_arr || 0),
    monthlyMRR: Number(latestAnalysis.monthly_mrr || 0),
    monthlyLeads: Number(latestAnalysis.monthly_leads || 0),
    averageDealValue: Number(latestAnalysis.average_deal_value || 0),
    leadResponseTime: Number(latestAnalysis.lead_response_time || 24),
    monthlyFreeSignups: Number(latestAnalysis.monthly_free_signups || 0),
    freeToPaidConversion: Number(latestAnalysis.free_to_paid_conversion || 0),
    failedPaymentRate: Number(latestAnalysis.failed_payment_rate || 0),
    manualHours: Number(latestAnalysis.manual_hours || 0),
    hourlyRate: Number(latestAnalysis.hourly_rate || 0),
    industry: latestAnalysis.industry || ''
  };

  const calculations = calculateUnifiedResults(calculationInputs);
  const monthlyLeak = calculations.totalLoss / 12;
  const urgencyLevel = calculations.totalLoss > 1000000 ? 'critical' : calculations.totalLoss > 500000 ? 'high' : 'medium';
  
  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          title: "Critical Revenue Leak Detected",
          subtitle: "Immediate action required to prevent significant losses",
          timeframe: "Next 30 days",
          impact: "Business critical",
          color: "destructive"
        };
      case 'high':
        return {
          title: "Significant Revenue Opportunity",
          subtitle: "High-impact improvements available for implementation",
          timeframe: "Next 60 days", 
          impact: "High priority",
          color: "default"
        };
      default:
        return {
          title: "Revenue Optimization Opportunity",
          subtitle: "Steady improvements to enhance revenue performance",
          timeframe: "Next 90 days",
          impact: "Standard priority",
          color: "secondary"
        };
    }
  };

  const urgencyConfig = getUrgencyConfig();

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-br from-background via-background to-primary/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {urgencyConfig.title}
                </h2>
                <p className="text-muted-foreground max-w-2xl">
                  {urgencyConfig.subtitle}
                </p>
              </div>
              <Badge variant={urgencyConfig.color as any} className="ml-4">
                {urgencyConfig.impact}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <div className="text-sm font-medium">Monthly Loss</div>
                  <div className="text-lg font-bold text-destructive">
                    {formatCurrency(monthlyLeak)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Recovery Target</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(calculations.recovery70Percent)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Timeframe</div>
                  <div className="text-sm font-semibold text-primary">
                    {urgencyConfig.timeframe}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What This Means Section */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-900/20 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10 mt-1">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                What This Means for {latestAnalysis.company_name}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Your {latestAnalysis.industry} company is currently losing{" "}
                  <span className="font-semibold text-destructive">
                    {formatCurrency(monthlyLeak)} every month
                  </span>{" "}
                  due to revenue leaks in your current processes.
                </p>
                <p>
                  Our analysis shows you could recover{" "}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(calculations.recovery70Percent)} annually
                  </span>{" "}
                  by implementing targeted improvements with 70% confidence.
                </p>
                <p className="text-primary font-medium">
                  The longer you wait, the more revenue you lose. Each month of delay costs you{" "}
                  {formatCurrency(monthlyLeak)}.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
