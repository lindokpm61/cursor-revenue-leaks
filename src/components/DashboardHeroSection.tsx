
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
      {/* Crisis Overview */}
      <StrategicOverview 
        latestAnalysis={latestAnalysis}
        formatCurrency={formatCurrency}
      />
      
      {/* Emergency Actions */}
      <PriorityActionCards 
        latestAnalysis={latestAnalysis}
        formatCurrency={formatCurrency}
      />

      {/* Crisis Analysis Context Footer */}
      <div className="text-center py-6 border-t border-border/30 bg-gradient-to-r from-destructive/5 to-revenue-warning/5 rounded-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">
            Crisis Assessment completed {formatDate(latestAnalysis.created_at || '')}
          </p>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            This emergency analysis uses proprietary revenue leak detection methodology with real-time 
            financial hemorrhaging assessment. Immediate action required to prevent further losses.
          </p>
        </div>
      </div>
    </div>
  );
};
