
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, BarChart3 } from "lucide-react";
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
      name: 'Revenue Opportunity',
      value: calculations.performanceMetrics.revenueAtRisk,
      color: 'hsl(var(--primary))',
    },
    {
      name: 'Recovery Potential',
      value: calculations.conservativeRecovery,
      color: 'hsl(var(--revenue-primary))',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Strategic Analysis Header */}
      <div className="bg-gradient-to-r from-primary/10 to-revenue-growth/10 p-6 rounded-xl border-2 border-primary/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Target className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold text-primary">
              STRATEGIC REVENUE ANALYSIS
            </h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">COMPREHENSIVE</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            In-depth opportunity analysis across all revenue optimization areas
          </p>
          <div className="mt-3 text-sm">
            <span className="text-primary font-semibold">
              Monthly Opportunity: {formatCurrency(calculations.totalLoss / 12)}
            </span>
            <span className="text-muted-foreground mx-2">•</span>
            <span className="text-revenue-growth font-semibold">
              Recovery Potential: {formatCurrency(calculations.conservativeRecovery)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Optimization Analysis */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Optimization Zones
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">OPPORTUNITY MAPPED</Badge>
            </CardTitle>
            <CardDescription>
              Strategic improvement areas with highest revenue impact potential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={performanceZoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Opportunity" />
                <Bar dataKey="recovery" fill="hsl(var(--revenue-growth))" name="Strategic Recovery" />
                <Bar dataKey="bestClass" fill="hsl(var(--revenue-success))" name="Best-in-Class Potential" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Composition */}
        <Card className="border-revenue-growth/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-revenue-growth" />
              Revenue Performance Portfolio
              <Badge variant="outline" className="ml-2 border-revenue-growth text-revenue-growth">STRATEGICALLY ANALYZED</Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive view of revenue stability and growth opportunities
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
                  <span className="font-bold text-primary">
                    {calculations.lossPercentageOfARR.toFixed(1)}% optimization opportunity
                  </span>
                </div>
                <div className="text-revenue-growth font-semibold">
                  {calculations.recoveryPercentageOfLoss.toFixed(0)}% strategic potential
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunity Breakdown Chart with Strategic Blur Overlay */}
      <div className="relative min-h-[500px]">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Strategic Revenue Opportunity Sources
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">PRIORITIZED ANALYSIS</Badge>
            </CardTitle>
            <CardDescription>
              Data-driven insights for strategic revenue optimization initiatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={calculations.lossBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              {calculations.lossBreakdown.map((item, index) => (
                <div key={index} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-sm font-medium mb-1 text-primary">{item.title}</div>
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.percentage.toFixed(1)}% of opportunity
                  </div>
                  <Badge variant="outline" className="text-xs border-revenue-growth text-revenue-growth">
                    {formatCurrency(item.amount / 12)}/month
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategic Revenue Analysis Overlay */}
        <div className="absolute inset-0 bg-background/65 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 border border-border/50">
          <div className="text-center p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">
              Complete Revenue Analysis Available
            </h3>
            <p className="text-muted-foreground mb-6">
              Access detailed revenue optimization insights, source-by-source breakdowns, and strategic priority rankings for maximum impact.
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Revenue Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
