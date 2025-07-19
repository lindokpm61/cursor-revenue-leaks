
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Target, Zap, BarChart3, AlertTriangle } from "lucide-react";
import { CalculatorData, Calculations } from "../useCalculatorData";

interface ExecutiveSummaryProps {
  data: CalculatorData;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
}

export const ExecutiveSummary = ({ data, calculations, formatCurrency }: ExecutiveSummaryProps) => {
  // Safe access helper
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const currentARR = safeNumber(data.companyInfo?.currentARR);
  const potentialRecovery70 = safeNumber(calculations.potentialRecovery70);
  const totalLeakage = safeNumber(calculations.totalLeakage);
  const leakagePercentage = currentARR > 0 ? (totalLeakage / currentARR) * 100 : 0;
  
  return (
    <div className="space-y-8">
      {/* Enhanced Context Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-revenue-primary/10 border border-primary/20 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/20">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-xl mb-3">Enhanced Revenue Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This analysis uses 2025 validation benchmarks with exponential decay modeling for lead response, 
              industry-specific conversion rates, and advanced recovery system consideration.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Exponential Decay Model
              </Badge>
              <Badge variant="outline" className="text-xs">
                Industry Benchmarks
              </Badge>
              <Badge variant="outline" className="text-xs">
                Recovery System Analysis
              </Badge>
              {leakagePercentage > 15 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  High Risk: {leakagePercentage.toFixed(1)}% of ARR
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards - Optimized Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-red-50 border-red-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Total Revenue Leak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive leading-none mb-2">
              {formatCurrency(calculations.totalLeakage)}
            </p>
            <p className="text-sm text-muted-foreground">annual loss</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-success" />
              Recovery 70%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-success leading-none mb-2">
              {formatCurrency(calculations.potentialRecovery70)}
            </p>
            <p className="text-sm text-muted-foreground">conservative estimate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Recovery 85%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary leading-none mb-2">
              {formatCurrency(calculations.potentialRecovery85)}
            </p>
            <p className="text-sm text-muted-foreground">optimistic estimate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-revenue-success" />
              ROI Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-success leading-none mb-2">
              {currentARR > 0 
                ? Math.round((potentialRecovery70 / currentARR) * 100)
                : 0}%
            </p>
            <p className="text-sm text-muted-foreground">of current ARR</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
