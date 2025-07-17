import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Target, Zap } from "lucide-react";
import { CalculatorData, Calculations } from "../useCalculatorData";
import { 
  INDUSTRY_BENCHMARKS, 
  RECOVERY_SYSTEMS,
  validateRecoveryAssumptions 
} from '@/lib/calculator/enhancedCalculations';
import { getBenchmark, bestInClassTargets, industryDefaults } from '@/lib/industryDefaults';

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
  // Get industry and best-in-class benchmarks
  const industry = data.companyInfo?.industry || 'saas-software';
  const industryBenchmark = industryDefaults[industry] || industryDefaults['saas-software'];
  const bestInClass = bestInClassTargets[industry] || bestInClassTargets['saas-software'];

  // Calculate three-tier opportunity analysis
  const currentResponseTime = safeData.leadGeneration.leadResponseTimeHours;
  const industryAvgResponseTime = industryBenchmark.leadResponseTimeHours;
  const bestInClassResponseTime = bestInClass.leadResponseTimeMinutes / 60; // Convert minutes to hours

  const currentConversionRate = safeData.selfServeMetrics.freeToPaidConversionRate;
  const industryAvgConversion = industryBenchmark.freeToPaidConversionRate;
  const bestInClassConversion = bestInClass.freeToPaidConversionRateMax;

  return (
    <div className="space-y-8">
      {/* Strategic Context Header */}
      <div className="bg-gradient-to-r from-revenue-primary/10 to-revenue-success/10 p-6 rounded-xl border border-revenue-primary/20">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-revenue-primary mb-2">
            Revenue Breakdown: Three-Tier Opportunity Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Current performance vs industry average vs best-in-class targets - showing the strategic advantage available through aggressive improvements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-revenue-warning" />
              Lead Response Strategic Gap
            </CardTitle>
            <CardDescription>
              Time-to-response competitive advantage opportunity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-revenue-warning mb-1">
                  {formatCurrency(calculations.leadResponseLoss)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Annual loss from response time disadvantage
                </p>
              </div>
              
              {/* Three-tier performance analysis */}
              <div className="space-y-3 bg-background/50 p-4 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground mb-2">PERFORMANCE BENCHMARKING</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-revenue-danger/10 rounded border border-revenue-danger/20">
                    <div className="font-bold text-revenue-danger">{currentResponseTime}h</div>
                    <div className="text-revenue-danger">Current</div>
                  </div>
                  <div className="text-center p-2 bg-revenue-warning/10 rounded border border-revenue-warning/20">
                    <div className="font-bold text-revenue-warning">{industryAvgResponseTime}h</div>
                    <div className="text-revenue-warning">Industry Avg</div>
                  </div>
                  <div className="text-center p-2 bg-revenue-success/10 rounded border border-revenue-success/20">
                    <div className="font-bold text-revenue-success">{bestInClassResponseTime}h</div>
                    <div className="text-revenue-success">Best-in-Class</div>
                  </div>
                </div>
                <div className="text-xs text-revenue-primary font-medium">
                  🎯 Strategic Advantage: Achieve sub-1.5h response time for market leadership position
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Monthly Leads:</span> {safeData.leadGeneration.monthlyLeads.toLocaleString()}</p>
                <p><span className="font-medium">Deal Value:</span> {formatCurrency(safeData.leadGeneration.averageDealValue)}</p>
                <p><span className="font-medium">Competitive Gap:</span> {(currentResponseTime - bestInClassResponseTime).toFixed(1)}h slower than leaders</p>
              </div>
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
              Self-Serve Strategic Advantage
            </CardTitle>
            <CardDescription>
              Conversion rate optimization for competitive dominance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-primary mb-1">
                  {formatCurrency(calculations.selfServeGap)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Revenue upside from best-in-class conversion optimization
                </p>
              </div>
              
              {/* Three-tier conversion analysis */}
              <div className="space-y-3 bg-background/50 p-4 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground mb-2">CONVERSION RATE BENCHMARKING</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-revenue-danger/10 rounded border border-revenue-danger/20">
                    <div className="font-bold text-revenue-danger">{currentConversionRate}%</div>
                    <div className="text-revenue-danger">Current</div>
                  </div>
                  <div className="text-center p-2 bg-revenue-warning/10 rounded border border-revenue-warning/20">
                    <div className="font-bold text-revenue-warning">{industryAvgConversion}%</div>
                    <div className="text-revenue-warning">Industry Avg</div>
                  </div>
                  <div className="text-center p-2 bg-revenue-success/10 rounded border border-revenue-success/20">
                    <div className="font-bold text-revenue-success">{bestInClassConversion}%</div>
                    <div className="text-revenue-success">Best-in-Class</div>
                  </div>
                </div>
                <div className="text-xs text-revenue-primary font-medium">
                  🎯 Strategic Target: {Math.round((bestInClassConversion - currentConversionRate) / currentConversionRate * 100)}% improvement achievable for market leadership
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Free Signups:</span> {safeData.selfServeMetrics.monthlyFreeSignups.toLocaleString()}</p>
                <p><span className="font-medium">Current Rate:</span> {currentConversionRate}%</p>
                <p><span className="font-medium">Competitive Gap:</span> {(bestInClassConversion - currentConversionRate).toFixed(1)}% behind leaders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Process Excellence Advantage
            </CardTitle>
            <CardDescription>
              Automation-driven operational superiority
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-primary mb-1">
                  {formatCurrency(calculations.processLoss)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Annual savings from best-in-class automation (85% reduction achievable)
                </p>
              </div>
              
              {/* Process efficiency analysis */}
              <div className="space-y-3 bg-background/50 p-4 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground mb-2">OPERATIONAL EFFICIENCY TARGETS</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-revenue-danger/10 rounded border border-revenue-danger/20">
                    <div className="font-bold text-revenue-danger">{safeData.operationsData.manualHoursPerWeek}h</div>
                    <div className="text-revenue-danger">Current Manual</div>
                  </div>
                  <div className="text-center p-2 bg-revenue-warning/10 rounded border border-revenue-warning/20">
                    <div className="font-bold text-revenue-warning">{Math.round(safeData.operationsData.manualHoursPerWeek * 0.4)}h</div>
                    <div className="text-revenue-warning">Industry Avg</div>
                  </div>
                  <div className="text-center p-2 bg-revenue-success/10 rounded border border-revenue-success/20">
                    <div className="font-bold text-revenue-success">{Math.round(safeData.operationsData.manualHoursPerWeek * 0.15)}h</div>
                    <div className="text-revenue-success">Best-in-Class</div>
                  </div>
                </div>
                <div className="text-xs text-revenue-primary font-medium">
                  🎯 Strategic Goal: 85% automation rate for operational excellence
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Current Manual Hours:</span> {safeData.operationsData.manualHoursPerWeek}/week</p>
                <p><span className="font-medium">Hourly Cost:</span> {formatCurrency(safeData.operationsData.hourlyRate)}</p>
                <p><span className="font-medium">Best-in-Class Target:</span> 85% automation (vs 70% industry standard)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};