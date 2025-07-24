
import { StrategicOverview } from "@/components/StrategicOverview";
import { PriorityActionCards } from "@/components/PriorityActionCards";

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
    contact_email: string | null;
    user_id?: string | null;
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
  return (
    <div className="space-y-8">
      {/* Strategic Overview */}
      <StrategicOverview 
        latestAnalysis={latestAnalysis}
        formatCurrency={formatCurrency}
      />
      
      {/* Priority Actions */}
      <PriorityActionCards 
        latestAnalysis={latestAnalysis}
        formatCurrency={formatCurrency}
      />

      {/* Strategic Analysis Context Footer */}
      <div className="text-center py-6 border-t border-border/30 bg-gradient-to-r from-primary/5 to-revenue-growth/5 rounded-lg">
        <div className="space-y-2">
          <p className="text-small font-medium text-primary">
            Revenue Optimization Assessment completed {formatDate(latestAnalysis.created_at || '')}
          </p>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            This strategic analysis uses proprietary revenue optimization methodology with comprehensive 
            growth opportunity assessment. Implementation support available through consultation.
          </p>
        </div>
      </div>
    </div>
  );
};
