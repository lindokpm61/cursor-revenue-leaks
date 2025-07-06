import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Target, Zap } from "lucide-react";
import { CalculatorData, Calculations } from "../useCalculatorData";

interface DetailedBreakdownProps {
  data: CalculatorData;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
}

export const DetailedBreakdown = ({ data, calculations, formatCurrency }: DetailedBreakdownProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Lead Response Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-destructive mb-2">
            {formatCurrency(calculations.leadResponseLoss)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Lost due to slow lead response (48% impact factor)
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Monthly Leads:</span> {data.leadGeneration.monthlyLeads.toLocaleString()}</p>
            <p><span className="font-medium">Avg Deal Value:</span> {formatCurrency(data.leadGeneration.averageDealValue)}</p>
            <p><span className="font-medium">Response Time:</span> {data.leadGeneration.leadResponseTimeHours}h</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-revenue-warning/20 bg-revenue-warning/5">
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
            <p><span className="font-medium">Monthly MRR:</span> {formatCurrency(data.selfServeMetrics.monthlyMRR)}</p>
            <p><span className="font-medium">Failed Rate:</span> {data.operationsData.failedPaymentRate}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Self-Serve Gap
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
            <p><span className="font-medium">Free Signups:</span> {data.selfServeMetrics.monthlyFreeSignups.toLocaleString()}</p>
            <p><span className="font-medium">Conversion Rate:</span> {data.selfServeMetrics.freeToPaidConversionRate}%</p>
            <p><span className="font-medium">Gap to 15%:</span> {Math.max(0, 15 - data.selfServeMetrics.freeToPaidConversionRate)}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-revenue-danger/20 bg-revenue-danger/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-revenue-danger" />
            Process Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-revenue-danger mb-2">
            {formatCurrency(calculations.processLoss)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Annual cost of manual processes (25% efficiency loss)
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Manual Hours/Week:</span> {data.operationsData.manualHoursPerWeek}</p>
            <p><span className="font-medium">Hourly Rate:</span> {formatCurrency(data.operationsData.hourlyRate)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};