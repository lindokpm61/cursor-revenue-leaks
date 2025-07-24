
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Clock, Zap, BarChart3 } from "lucide-react";
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

  const monthlyOpportunity = calculations.totalLoss / 12;
  const opportunityLevel = calculations.totalLoss > 1000000 ? 'high' : calculations.totalLoss > 500000 ? 'medium' : 'standard';
  
  const getOpportunityConfig = () => {
    switch (opportunityLevel) {
      case 'high':
        return {
          title: "HIGH-IMPACT: Strategic Revenue Opportunities",
          subtitle: "Significant growth potential identified across key performance areas",
          timeframe: "Strategic Implementation",
          impact: "High-Impact Opportunities",
          color: "primary"
        };
      case 'medium':
        return {
          title: "STRATEGIC: Revenue Growth Opportunities",
          subtitle: "Multiple optimization areas with strong ROI potential",
          timeframe: "Growth Implementation", 
          impact: "Strategic Opportunities",
          color: "primary"
        };
      default:
        return {
          title: "OPPORTUNITY: Revenue Optimization Potential",
          subtitle: "Clear optimization paths identified for revenue growth",
          timeframe: "Optimization Timeline",
          impact: "Growth Opportunities",
          color: "primary"
        };
    }
  };

  const opportunityConfig = getOpportunityConfig();

  return (
    <div className="space-y-6">
      {/* Strategic Opportunity Banner */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-br from-background via-background to-primary/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-primary">
                  {opportunityConfig.title}
                </h2>
                <p className="text-muted-foreground max-w-2xl">
                  {opportunityConfig.subtitle}
                </p>
              </div>
              <Badge variant="outline" className="ml-4 border-primary text-primary">
                {opportunityConfig.impact}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-primary">Monthly Opportunity</div>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(monthlyOpportunity)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-revenue-growth/10">
                  <Target className="h-4 w-4 text-revenue-growth" />
                </div>
                <div>
                  <div className="text-sm font-medium text-revenue-growth">Recovery Target</div>
                  <div className="text-lg font-bold text-revenue-growth">
                    {formatCurrency(calculations.conservativeRecovery)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-primary">Implementation</div>
                  <div className="text-sm font-semibold text-primary">
                    {opportunityConfig.timeframe}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Analysis Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-revenue-growth/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">
                Strategic Revenue Analysis for {latestAnalysis.company_name}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Your {latestAnalysis.industry} company has <span className="font-semibold text-primary">
                  {formatCurrency(monthlyOpportunity)} in monthly growth potential</span> through strategic 
                  optimization of key revenue systems.
                </p>
                <p>
                  Strategic implementation could unlock{" "}
                  <span className="font-semibold text-revenue-growth">
                    {formatCurrency(calculations.conservativeRecovery)} in annual revenue growth
                  </span>{" "}
                  through systematic optimization initiatives.
                </p>
                <p className="text-primary font-medium bg-primary/10 p-2 rounded border border-primary/20">
                  💡 OPPORTUNITY: Every month of optimization delay represents{" "}
                  {formatCurrency(monthlyOpportunity / 30)} in daily growth potential.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
