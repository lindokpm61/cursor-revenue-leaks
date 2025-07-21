
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Clock, Target, Zap } from "lucide-react";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";

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
    created_at: string | null;
    contact_email: string | null;
    user_id?: string | null;
  };
  formatCurrency: (amount: number) => string;
}

export const StrategicOverview = ({ latestAnalysis, formatCurrency }: StrategicOverviewProps) => {
  console.log('=== STRATEGIC OVERVIEW DEBUG ===');
  console.log('latestAnalysis prop:', latestAnalysis);

  // Transform to SubmissionData format for UnifiedResultsService
  const submissionData: SubmissionData = {
    id: latestAnalysis.id,
    company_name: latestAnalysis.company_name || '',
    contact_email: latestAnalysis.contact_email || '',
    industry: latestAnalysis.industry || '',
    current_arr: Number(latestAnalysis.current_arr || 0),
    monthly_leads: Number(latestAnalysis.monthly_leads || 0),
    average_deal_value: Number(latestAnalysis.average_deal_value || 0),
    lead_response_time: Number(latestAnalysis.lead_response_time || 24),
    monthly_free_signups: Number(latestAnalysis.monthly_free_signups || 0),
    free_to_paid_conversion: Number(latestAnalysis.free_to_paid_conversion || 0),
    monthly_mrr: Number(latestAnalysis.monthly_mrr || 0),
    failed_payment_rate: Number(latestAnalysis.failed_payment_rate || 0),
    manual_hours: Number(latestAnalysis.manual_hours || 0),
    hourly_rate: Number(latestAnalysis.hourly_rate || 0),
    lead_score: 0,
    user_id: latestAnalysis.user_id,
    created_at: latestAnalysis.created_at || new Date().toISOString()
  };

  console.log('Transformed submissionData for UnifiedResultsService:', submissionData);

  const calculations = UnifiedResultsService.calculateResults(submissionData);
  console.log('UnifiedResultsService calculations in StrategicOverview:', calculations);

  const monthlyLoss = calculations.totalLoss / 12;
  const urgencyLevel = calculations.totalLoss > 1000000 ? 'critical' : calculations.totalLoss > 500000 ? 'emergency' : 'urgent';
  
  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          title: "CRITICAL: Revenue Hemorrhaging Detected",
          subtitle: "Financial emergency requiring immediate intervention",
          timeframe: "Emergency Action Required",
          impact: "Business Critical Crisis",
          color: "destructive"
        };
      case 'emergency':
        return {
          title: "EMERGENCY: Major Revenue Bleeding",
          subtitle: "Significant financial losses requiring urgent action",
          timeframe: "Urgent Response Needed", 
          impact: "High-Impact Crisis",
          color: "destructive"
        };
      default:
        return {
          title: "URGENT: Revenue Leak Detected",
          subtitle: "Active financial bleeding requiring immediate attention",
          timeframe: "Time-Sensitive Action",
          impact: "Critical Issue",
          color: "destructive"
        };
    }
  };

  const urgencyConfig = getUrgencyConfig();

  return (
    <div className="space-y-6">
      {/* Crisis Alert Banner */}
      <Card className="border-l-4 border-l-destructive bg-gradient-to-br from-background via-background to-destructive/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-destructive">
                  {urgencyConfig.title}
                </h2>
                <p className="text-muted-foreground max-w-2xl">
                  {urgencyConfig.subtitle}
                </p>
              </div>
              <Badge variant={urgencyConfig.color as any} className="ml-4 animate-pulse">
                {urgencyConfig.impact}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <div className="text-sm font-medium text-destructive">Monthly Bleeding</div>
                  <div className="text-lg font-bold text-destructive">
                    {formatCurrency(monthlyLoss)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-revenue-warning/10">
                  <AlertTriangle className="h-4 w-4 text-revenue-warning" />
                </div>
                <div>
                  <div className="text-sm font-medium text-revenue-warning">Emergency Fix Target</div>
                  <div className="text-lg font-bold text-revenue-warning">
                    {formatCurrency(calculations.conservativeRecovery)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Clock className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <div className="text-sm font-medium text-destructive">Response Time</div>
                  <div className="text-sm font-semibold text-destructive">
                    {urgencyConfig.timeframe}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Impact Analysis */}
      <Card className="bg-gradient-to-br from-destructive/5 to-revenue-warning/5 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-destructive/20 mt-1">
              <Zap className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-destructive">
                Financial Crisis Analysis for {latestAnalysis.company_name}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Your {latestAnalysis.industry} company is <span className="font-semibold text-destructive">actively bleeding{" "}
                  {formatCurrency(monthlyLoss)} every month</span> through critical gaps in your revenue systems.
                </p>
                <p>
                  Emergency intervention could stop{" "}
                  <span className="font-semibold text-revenue-warning">
                    {formatCurrency(calculations.conservativeRecovery)} in annual losses
                  </span>{" "}
                  with immediate corrective action.
                </p>
                <p className="text-destructive font-medium bg-destructive/10 p-2 rounded border border-destructive/20">
                  ⚠️ CRITICAL: Every day of delay costs you{" "}
                  {formatCurrency(monthlyLoss / 30)}. This financial hemorrhaging will worsen without intervention.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
