
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Siren, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { UnifiedCalculations } from "@/lib/results/UnifiedResultsService";

interface UnifiedRevenueChartsProps {
  calculations: UnifiedCalculations;
  formatCurrency: (amount: number) => string;
}

export const UnifiedRevenueCharts = ({ calculations, formatCurrency }: UnifiedRevenueChartsProps) => {
  // Performance zone data for the bar chart
  const performanceZoneData = [
    {
      category: 'Lead Response',
      current: calculations.leadResponseLoss,
      recovery: calculations.leadResponseLoss * 0.6,
      bestClass: calculations.leadResponseLoss * 0.8,
    },
    {
      category: 'Failed Payments',
      current: calculations.failedPaymentLoss,
      recovery: calculations.failedPaymentLoss * 0.4,
      bestClass: calculations.failedPaymentLoss * 0.65,
    },
    {
      category: 'Self-Serve',
      current: calculations.selfServeGap,
      recovery: calculations.selfServeGap * 0.5,
      bestClass: calculations.selfServeGap * 0.8,
    },
    {
      category: 'Process',
      current: calculations.processInefficiency,
      recovery: calculations.processInefficiency * 0.7,
      bestClass: calculations.processInefficiency * 0.85,
    },
  ];

  // Revenue composition pie chart data
  const revenueCompositionData = [
    {
      name: 'Stable Revenue',
      value: calculations.performanceMetrics.secureRevenue,
      color: 'hsl(var(--revenue-success))',
    },
    {
      name: 'Revenue Hemorrhaging',
      value: calculations.performanceMetrics.revenueAtRisk,
      color: 'hsl(var(--destructive))',
    },
    {
      name: 'Recovery Potential',
      value: calculations.conservativeRecovery,
      color: 'hsl(var(--revenue-primary))',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Emergency Status Header */}
      <div className="bg-gradient-to-r from-destructive/20 to-orange-500/20 p-6 rounded-xl border-2 border-destructive/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Siren className="h-6 w-6 text-destructive animate-pulse" />
            <h3 className="text-xl font-bold text-destructive">
              REVENUE CRISIS DAMAGE ASSESSMENT
            </h3>
            <Badge variant="destructive" className="animate-pulse">CRITICAL</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time bleeding analysis across all revenue failure points
          </p>
          <div className="mt-3 text-sm">
            <span className="text-destructive font-semibold">
              Daily Loss: {formatCurrency(calculations.totalLoss / 365)}
            </span>
            <span className="text-muted-foreground mx-2">•</span>
            <span className="text-orange-600 font-semibold">
              Hourly Bleeding: {formatCurrency(calculations.totalLoss / (365 * 24))}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Zone Analysis */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Revenue Hemorrhaging Zones
              <Badge variant="destructive" className="ml-2">ACTIVE BLEEDING</Badge>
            </CardTitle>
            <CardDescription>
              Critical failure points causing immediate revenue loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={performanceZoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="current" fill="hsl(var(--destructive))" name="Active Bleeding" />
                <Bar dataKey="recovery" fill="hsl(var(--revenue-warning))" name="Emergency Recovery" />
                <Bar dataKey="bestClass" fill="hsl(var(--revenue-success))" name="Full Recovery" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Composition */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Revenue Security Status
              <Badge variant="outline" className="ml-2 border-orange-500 text-orange-600">COMPROMISED</Badge>
            </CardTitle>
            <CardDescription>
              Critical assessment of revenue stability and hemorrhaging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={revenueCompositionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueCompositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-bold text-destructive">
                    {calculations.lossPercentageOfARR.toFixed(1)}% of ARR hemorrhaging
                  </span>
                </div>
                <div className="text-orange-600 font-semibold">
                  {calculations.recoveryPercentageOfLoss.toFixed(0)}% emergency recoverable
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loss Breakdown Chart */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Siren className="h-5 w-5 text-destructive animate-pulse" />
            Critical Revenue Bleeding Sources
            <Badge variant="destructive">EMERGENCY ASSESSMENT</Badge>
          </CardTitle>
          <CardDescription>
            Immediate intervention required - every hour costs more revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={calculations.lossBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {calculations.lossBreakdown.map((item, index) => (
              <div key={index} className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="text-sm font-medium mb-1 text-destructive">{item.title}</div>
                <div className="text-lg font-bold text-destructive">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {item.percentage.toFixed(1)}% of bleeding
                </div>
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                  {formatCurrency(item.amount / 365)}/day
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
