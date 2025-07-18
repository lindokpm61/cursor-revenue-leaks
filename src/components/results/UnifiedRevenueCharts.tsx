
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Zap } from "lucide-react";
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
      name: 'Secure Revenue',
      value: calculations.performanceMetrics.secureRevenue,
      color: 'hsl(var(--revenue-success))',
    },
    {
      name: 'Revenue at Risk',
      value: calculations.performanceMetrics.revenueAtRisk,
      color: 'hsl(var(--revenue-warning))',
    },
    {
      name: 'Recovery Potential',
      value: calculations.conservativeRecovery,
      color: 'hsl(var(--revenue-primary))',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Strategic Context Header */}
      <div className="bg-gradient-to-r from-revenue-primary/10 to-revenue-success/10 p-6 rounded-xl border border-revenue-primary/20">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-revenue-primary mb-2">
            Revenue Recovery Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Current performance vs recovery potential across key revenue categories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Zone Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-revenue-primary" />
              Performance Zone Analysis
            </CardTitle>
            <CardDescription>
              Current losses vs recovery potential by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={performanceZoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="current" fill="hsl(var(--revenue-danger))" name="Current Loss" />
                <Bar dataKey="recovery" fill="hsl(var(--revenue-warning))" name="Conservative Recovery" />
                <Bar dataKey="bestClass" fill="hsl(var(--revenue-success))" name="Optimistic Recovery" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-success" />
              Revenue Composition
            </CardTitle>
            <CardDescription>
              Current revenue security and recovery opportunity
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
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-revenue-primary">
                  {calculations.lossPercentageOfARR.toFixed(1)}% of ARR at risk
                </span> - {calculations.recoveryPercentageOfLoss.toFixed(0)}% recoverable
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loss Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-revenue-success" />
            Revenue Loss Breakdown
          </CardTitle>
          <CardDescription>
            Detailed analysis of revenue leakage by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={calculations.lossBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="hsl(var(--revenue-primary))" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {calculations.lossBreakdown.map((item, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-lg border">
                <div className="text-sm font-medium mb-1">{item.title}</div>
                <div className="text-lg font-bold text-foreground">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.percentage.toFixed(1)}% of total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
