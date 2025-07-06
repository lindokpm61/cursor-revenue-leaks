import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Target, Zap, BarChart3 } from "lucide-react";
import { CalculatorData, Calculations } from "../useCalculatorData";

interface ExecutiveSummaryProps {
  data: CalculatorData;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
}

export const ExecutiveSummary = ({ data, calculations, formatCurrency }: ExecutiveSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            Total Revenue Leak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">
            {formatCurrency(calculations.totalLeakage)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">annual loss</p>
        </CardContent>
      </Card>

      <Card className="border-revenue-success/20 bg-revenue-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-revenue-success" />
            Recovery 70%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-revenue-success">
            {formatCurrency(calculations.potentialRecovery70)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">conservative estimate</p>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Recovery 85%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(calculations.potentialRecovery85)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">optimistic estimate</p>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            ROI Potential
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-accent">
            {data.companyInfo.currentARR > 0 
              ? Math.round((calculations.potentialRecovery70 / data.companyInfo.currentARR) * 100)
              : 0}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">of current ARR</p>
        </CardContent>
      </Card>
    </div>
  );
};