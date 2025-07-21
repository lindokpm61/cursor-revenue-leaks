
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
      {/* Crisis Context Banner */}
      <div className="bg-gradient-to-r from-destructive/20 to-revenue-warning/20 border-2 border-destructive/30 rounded-lg p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-destructive/30 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-xl mb-3 text-destructive">🚨 REVENUE CRISIS ASSESSMENT</h3>
            <p className="text-sm text-destructive/90 mb-4 font-medium">
              URGENT: Your business is hemorrhaging revenue RIGHT NOW. Every minute of delay increases your financial bleeding. 
              This assessment uses 2025 crisis validation benchmarks to identify immediate stoppage opportunities.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="destructive" className="text-xs animate-pulse">
                <Clock className="h-3 w-3 mr-1" />
                BLEEDING: {formatCurrency(hourlyBleed)}/hour
              </Badge>
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                CRITICAL: {leakagePercentage.toFixed(1)}% of ARR bleeding
              </Badge>
              <Badge variant="outline" className="text-xs border-destructive text-destructive">
                Emergency Recovery Protocol
              </Badge>
              <Badge variant="outline" className="text-xs border-destructive text-destructive">
                Crisis Intervention Required
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-destructive/10 border-destructive/30 border-2 shadow-lg animate-attention-pulse">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive animate-pulse" />
              🩸 BLEEDING NOW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive leading-none mb-2">
              {formatCurrency(calculations.totalLeakage)}
            </p>
            <p className="text-sm text-destructive/80 font-medium">revenue hemorrhaging annually</p>
            <p className="text-xs text-destructive/70 mt-1">
              Daily loss: {formatCurrency(dailyBleed)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-revenue-warning/10 border-revenue-warning/30 border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-warning" />
              🚑 Emergency Stoppage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-warning leading-none mb-2">
              {formatCurrency(calculations.potentialRecovery70)}
            </p>
            <p className="text-sm text-muted-foreground">immediate bleeding control</p>
            <p className="text-xs text-revenue-warning/80 mt-1 font-medium">
              70% crisis recovery rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-primary/10 border-primary/30 border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              ⚡ Maximum Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary leading-none mb-2">
              {formatCurrency(calculations.potentialRecovery85)}
            </p>
            <p className="text-sm text-muted-foreground">full crisis intervention</p>
            <p className="text-xs text-primary/80 mt-1 font-medium">
              85% emergency success rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-revenue-success/10 border-revenue-success/30 border-2 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-revenue-success" />
              📈 Crisis Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-success leading-none mb-2">
              {currentARR > 0 
                ? Math.round((potentialRecovery70 / currentARR) * 100)
                : 0}%
            </p>
            <p className="text-sm text-muted-foreground">of current ARR at risk</p>
            <p className="text-xs text-revenue-success/80 mt-1 font-medium">
              Recoverable with intervention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Crisis Timeline */}
      <div className="bg-gradient-to-r from-destructive/10 to-revenue-warning/10 border-2 border-destructive/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-destructive animate-pulse" />
          <h4 className="text-lg font-bold text-destructive">⏰ BLEEDING TIMELINE - Every Second Counts</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 rounded-lg bg-destructive/20 border border-destructive/30">
            <div className="font-bold text-destructive">Next Hour</div>
            <div className="text-destructive/80">{formatCurrency(hourlyBleed)} lost</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-revenue-warning/20 border border-revenue-warning/30">
            <div className="font-bold text-revenue-warning">Next 24 Hours</div>
            <div className="text-revenue-warning/80">{formatCurrency(dailyBleed)} bleeding</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-100 border border-orange-300">
            <div className="font-bold text-orange-700">Next Week</div>
            <div className="text-orange-600">{formatCurrency(dailyBleed * 7)} hemorrhage</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-100 border border-red-300">
            <div className="font-bold text-red-700">If No Action</div>
            <div className="text-red-600">{formatCurrency(totalLeakage)} annual loss</div>
          </div>
        </div>
      </div>
    </div>
  );
};
