import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Target, Zap } from "lucide-react";
import { CalculatorData, Calculations } from "../useCalculatorData";
import { 
  INDUSTRY_BENCHMARKS, 
  RECOVERY_SYSTEMS,
  validateRecoveryAssumptions 
} from '@/lib/calculator/enhancedCalculations';

interface DetailedBreakdownProps {
  data: CalculatorData;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
}

export const DetailedBreakdown = ({ data, calculations, formatCurrency }: DetailedBreakdownProps) => {
  // Safe access helper
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const safeData = {
    leadGeneration: {
      monthlyLeads: safeNumber(data.leadGeneration?.monthlyLeads),
      averageDealValue: safeNumber(data.leadGeneration?.averageDealValue),
      leadResponseTimeHours: safeNumber(data.leadGeneration?.leadResponseTimeHours),
    },
    selfServeMetrics: {
      monthlyFreeSignups: safeNumber(data.selfServeMetrics?.monthlyFreeSignups),
      freeToPaidConversionRate: safeNumber(data.selfServeMetrics?.freeToPaidConversionRate),
      monthlyMRR: safeNumber(data.selfServeMetrics?.monthlyMRR),
    },
    operationsData: {
      failedPaymentRate: safeNumber(data.operationsData?.failedPaymentRate),
      manualHoursPerWeek: safeNumber(data.operationsData?.manualHoursPerWeek),
      hourlyRate: safeNumber(data.operationsData?.hourlyRate),
    }
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-revenue-warning" />
            Lead Response Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-revenue-warning mb-2">
            {formatCurrency(calculations.leadResponseLoss)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Revenue lost from delayed lead response (exponential decay model)
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Monthly Leads:</span> {safeData.leadGeneration.monthlyLeads.toLocaleString()}</p>
            <p><span className="font-medium">Avg Deal Value:</span> {formatCurrency(safeData.leadGeneration.averageDealValue)}</p>
            <p><span className="font-medium">Response Time:</span> {safeData.leadGeneration.leadResponseTimeHours}h</p>
            <p><span className="font-medium">Optimal Time:</span> ≤2h for this deal size</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-revenue-warning" />
            Failed Payment Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-revenue-warning mb-2">
            {formatCurrency(calculations.failedPaymentLoss)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Annual loss from payment failures with recovery system consideration
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Monthly MRR:</span> {formatCurrency(safeData.selfServeMetrics.monthlyMRR)}</p>
            <p><span className="font-medium">Failed Rate:</span> {safeData.operationsData.failedPaymentRate}%</p>
            <p><span className="font-medium">Recovery System:</span> Basic (30% recovery)</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Self-Serve Opportunity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary mb-2">
            {formatCurrency(calculations.selfServeGap)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Gap between current and industry benchmark conversion rates
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Free Signups:</span> {safeData.selfServeMetrics.monthlyFreeSignups.toLocaleString()}</p>
            <p><span className="font-medium">Current Rate:</span> {safeData.selfServeMetrics.freeToPaidConversionRate}%</p>
            <p><span className="font-medium">Industry Benchmark:</span> {INDUSTRY_BENCHMARKS[data.companyInfo?.industry as keyof typeof INDUSTRY_BENCHMARKS]?.conversionRate || 15}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Process Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary mb-2">
            {formatCurrency(calculations.processLoss)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Cost of manual processes with 70% automation potential
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Manual Hours/Week:</span> {safeData.operationsData.manualHoursPerWeek}</p>
            <p><span className="font-medium">Hourly Rate:</span> {formatCurrency(safeData.operationsData.hourlyRate)}</p>
            <p><span className="font-medium">Automation Potential:</span> 70%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};