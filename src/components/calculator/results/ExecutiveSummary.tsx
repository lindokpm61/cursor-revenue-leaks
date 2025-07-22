
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Target, Zap, BarChart3, AlertTriangle, Clock } from "lucide-react";
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
  const dailyBleed = totalLeakage / 365;
  const hourlyBleed = dailyBleed / 24;
  
  return (
    <div className="space-y-8">
      {/* Strategic Opportunity Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-revenue-growth/20 border-2 border-primary/30 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/30">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-xl mb-3 text-primary">📊 STRATEGIC REVENUE ANALYSIS</h3>
            <p className="text-sm text-primary/90 mb-4 font-medium">
              OPPORTUNITY: Your business has significant revenue optimization potential. Our analysis identifies key areas where strategic improvements can unlock substantial growth. 
              This assessment uses 2025 industry benchmarks to highlight high-impact optimization opportunities.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                <Clock className="h-3 w-3 mr-1" />
                POTENTIAL: {formatCurrency(hourlyBleed)}/hour recoverable
              </Badge>
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                <Target className="h-3 w-3 mr-1" />
                OPPORTUNITY: {leakagePercentage.toFixed(1)}% revenue optimization potential
              </Badge>
              <Badge variant="outline" className="text-xs border-primary text-primary">
                Strategic Growth Protocol
              </Badge>
              <Badge variant="outline" className="text-xs border-primary text-primary">
                Revenue Optimization Available
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Opportunity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-primary/10 border-primary/30 border-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">💰 OPPORTUNITY VALUE</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-primary leading-tight mb-1">
              {formatCurrency(calculations.totalLeakage)}
            </p>
            <p className="text-xs text-primary/80 font-medium leading-tight">
              annual revenue opportunity
            </p>
            <p className="text-xs text-primary/70 mt-1">
              Daily potential: {formatCurrency(dailyBleed)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-revenue-growth/10 border-revenue-growth/30 border-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-revenue-growth" />
              <span className="text-sm font-bold">🎯 Quick Wins</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-revenue-growth leading-tight mb-1">
              {formatCurrency(calculations.potentialRecovery70)}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              strategic optimization potential
            </p>
            <p className="text-xs text-revenue-growth/80 mt-1 font-medium">
              70% achievement confidence
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-revenue-success/10 border-revenue-success/30 border-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-revenue-success" />
              <span className="text-sm font-bold">⚡ Maximum Potential</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-revenue-success leading-tight mb-1">
              {formatCurrency(calculations.potentialRecovery85)}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              full strategic implementation
            </p>
            <p className="text-xs text-revenue-success/80 mt-1 font-medium">
              85% optimal execution rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-primary/10 border-primary/30 border-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold">📈 Growth Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold text-primary leading-tight mb-1">
              {currentARR > 0 
                ? Math.round((potentialRecovery70 / currentARR) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              of current ARR growth potential
            </p>
            <p className="text-xs text-primary/80 mt-1 font-medium">
              Achievable through optimization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Timeline */}
      <div className="bg-gradient-to-r from-primary/10 to-revenue-growth/10 border-2 border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-primary" />
          <h4 className="text-lg font-bold text-primary">🚀 OPTIMIZATION TIMELINE - Strategic Implementation</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 rounded-lg bg-primary/20 border border-primary/30">
            <div className="font-bold text-primary">Next Hour</div>
            <div className="text-primary/80">{formatCurrency(hourlyBleed)} opportunity</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-revenue-growth/20 border border-revenue-growth/30">
            <div className="font-bold text-revenue-growth">Next 24 Hours</div>
            <div className="text-revenue-growth/80">{formatCurrency(dailyBleed)} potential</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-revenue-success/20 border border-revenue-success/30">
            <div className="font-bold text-revenue-success">Next Week</div>
            <div className="text-revenue-success/80">{formatCurrency(dailyBleed * 7)} growth opportunity</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/20 border border-primary/30">
            <div className="font-bold text-primary">Annual Potential</div>
            <div className="text-primary/80">{formatCurrency(totalLeakage)} optimization value</div>
          </div>
        </div>
      </div>
    </div>
  );
};
