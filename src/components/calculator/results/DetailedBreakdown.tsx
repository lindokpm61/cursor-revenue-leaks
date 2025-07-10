import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Target, Zap } from "lucide-react";
import { CalculatorData, Calculations } from "../useCalculatorData";

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
            Lost due to slow lead response (48% impact factor)
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Monthly Leads:</span> {safeData.leadGeneration.monthlyLeads.toLocaleString()}</p>
            <p><span className="font-medium">Avg Deal Value:</span> {formatCurrency(safeData.leadGeneration.averageDealValue)}</p>
            <p><span className="font-medium">Response Time:</span> {safeData.leadGeneration.leadResponseTimeHours}h</p>
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
            Annual loss from failed payments
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Monthly MRR:</span> {formatCurrency(safeData.selfServeMetrics.monthlyMRR)}</p>
            <p><span className="font-medium">Failed Rate:</span> {safeData.operationsData.failedPaymentRate}%</p>
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
            Gap between current and 15% benchmark conversion
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Free Signups:</span> {safeData.selfServeMetrics.monthlyFreeSignups.toLocaleString()}</p>
            <p><span className="font-medium">Conversion Rate:</span> {safeData.selfServeMetrics.freeToPaidConversionRate}%</p>
            <p><span className="font-medium">Gap to 15%:</span> {Math.max(0, 15 - safeData.selfServeMetrics.freeToPaidConversionRate)}%</p>
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
            Annual cost of manual processes (25% efficiency loss)
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Manual Hours/Week:</span> {safeData.operationsData.manualHoursPerWeek}</p>
            <p><span className="font-medium">Hourly Rate:</span> {formatCurrency(safeData.operationsData.hourlyRate)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};