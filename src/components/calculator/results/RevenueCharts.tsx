import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Zap, Target, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, LineChart } from "recharts";
import { CalculatorData, Calculations } from "../useCalculatorData";
import { calculateRecoveryRanges, type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";
import { getBenchmark, bestInClassTargets, industryDefaults } from '@/lib/industryDefaults';

interface RevenueChartsProps {
  data: CalculatorData;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
  confidenceFactors?: ConfidenceFactors;
}

export const RevenueCharts = ({ data, calculations, formatCurrency, confidenceFactors }: RevenueChartsProps) => {
  // Default confidence factors if not provided
  const defaultConfidenceFactors: ConfidenceFactors = {
    companySize: 'scaleup',
    currentMaturity: 'intermediate',
    changeManagementCapability: 'medium',
    resourceAvailable: true
  };

  const factors = confidenceFactors || defaultConfidenceFactors;
  
  // Get industry and best-in-class benchmarks
  const industry = data.companyInfo?.industry || 'saas-software';
  const industryBenchmark = industryDefaults[industry] || industryDefaults['saas-software'];
  const bestInClass = bestInClassTargets[industry] || bestInClassTargets['saas-software'];

  // Calculate realistic recovery potential using enhanced calculations
  const losses = {
    leadResponse: calculations.leadResponseLoss,
    selfServe: calculations.selfServeGap,
    processAutomation: calculations.processLoss,
    paymentRecovery: calculations.failedPaymentLoss
  };

  const recoveryRanges = calculateRecoveryRanges(losses, factors);

  // Calculate best-in-class recovery potential (more aggressive than industry average)
  const bestInClassRecoveryMultiplier = 1.4; // 40% higher than conservative estimates
  const bestInClassTotalRecovery = recoveryRanges.conservative.totalRecovery * bestInClassRecoveryMultiplier;

  const leakageData = [
    {
      name: 'Lead Response',
      value: calculations.leadResponseLoss,
      color: 'hsl(var(--destructive))',
    },
    {
      name: 'Failed Payments',
      value: calculations.failedPaymentLoss,
      color: 'hsl(var(--revenue-warning))',
    },
    {
      name: 'Self-Serve Gap',
      value: calculations.selfServeGap,
      color: 'hsl(var(--primary))',
    },
    {
      name: 'Process Loss',
      value: calculations.processLoss,
      color: 'hsl(var(--accent))',
    },
  ];

  // Use enhanced calculations for recovery data
  const recoveryData = [
    {
      category: 'Lead Response',
      current: calculations.leadResponseLoss,
      conservative: recoveryRanges.conservative.categoryRecovery.leadResponse,
      optimistic: recoveryRanges.optimistic.categoryRecovery.leadResponse,
    },
    {
      category: 'Failed Payments',
      current: calculations.failedPaymentLoss,
      conservative: recoveryRanges.conservative.categoryRecovery.paymentRecovery,
      optimistic: recoveryRanges.optimistic.categoryRecovery.paymentRecovery,
    },
    {
      category: 'Self-Serve Gap',
      current: calculations.selfServeGap,
      conservative: recoveryRanges.conservative.categoryRecovery.selfServe,
      optimistic: recoveryRanges.optimistic.categoryRecovery.selfServe,
    },
    {
      category: 'Process Loss',
      current: calculations.processLoss,
      conservative: recoveryRanges.conservative.categoryRecovery.processAutomation,
      optimistic: recoveryRanges.optimistic.categoryRecovery.processAutomation,
    },
  ];

  // Three-tier recovery opportunity visualization
  const recoveryOpportunityData = [
    {
      name: 'Current ARR',
      value: data.companyInfo.currentARR,
      color: 'hsl(var(--muted-foreground))',
    },
    {
      name: 'Industry Average Recovery',
      value: recoveryRanges.conservative.totalRecovery,
      color: 'hsl(var(--revenue-warning))',
    },
    {
      name: 'Best-in-Class Recovery',
      value: bestInClassTotalRecovery,
      color: 'hsl(var(--revenue-success))',
    },
  ];

  // Performance zone chart data
  const performanceZoneData = [
    {
      category: 'Lead Response',
      current: calculations.leadResponseLoss,
      industryAvg: calculations.leadResponseLoss * 0.6, // Industry average performance
      bestInClass: calculations.leadResponseLoss * 0.85, // Best-in-class recovery
    },
    {
      category: 'Self-Serve',
      current: calculations.selfServeGap,
      industryAvg: calculations.selfServeGap * 0.5,
      bestInClass: calculations.selfServeGap * 0.8,
    },
    {
      category: 'Process Automation',
      current: calculations.processLoss,
      industryAvg: calculations.processLoss * 0.7,
      bestInClass: calculations.processLoss * 0.85,
    },
    {
      category: 'Payment Recovery',
      current: calculations.failedPaymentLoss,
      industryAvg: calculations.failedPaymentLoss * 0.4,
      bestInClass: calculations.failedPaymentLoss * 0.65,
    },
  ];

  

  return (
    <>
      {/* Strategic Context Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-revenue-primary/10 to-revenue-success/10 p-6 rounded-xl border border-revenue-primary/20">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-revenue-primary mb-2">
              Strategic Revenue Recovery Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              Three-tier visualization showing progression from current state → industry average → best-in-class performance
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-revenue-primary" />
              Performance Zone Analysis
            </CardTitle>
            <CardDescription>
              Current vs Industry Average vs Best-in-Class recovery potential
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
                <Bar dataKey="industryAvg" fill="hsl(var(--revenue-warning))" name="Industry Avg Recovery" />
                <Bar dataKey="bestInClass" fill="hsl(var(--revenue-success))" name="Best-in-Class Recovery" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-success" />
              Strategic Advantage Opportunity
            </CardTitle>
            <CardDescription>
              Revenue growth through best-in-class performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={recoveryOpportunityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {recoveryOpportunityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-sm text-muted-foreground">
                Best-in-class performance creates <span className="font-semibold text-revenue-primary">
                {Math.round(((bestInClassTotalRecovery - recoveryRanges.conservative.totalRecovery) / recoveryRanges.conservative.totalRecovery) * 100)}% additional upside
                </span> beyond industry averages
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recovery Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-revenue-success" />
            Strategic Recovery Roadmap
          </CardTitle>
          <CardDescription>
            Aggressive improvement targets for competitive advantage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={recoveryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(Number(value)), 
                  name === 'current' ? 'Current Loss' :
                  name === 'conservative' ? 'Industry Average Recovery' :
                  'Best-in-Class Recovery'
                ]} 
              />
              <Bar dataKey="current" fill="hsl(var(--revenue-danger))" name="Current Loss" />
              <Bar dataKey="conservative" fill="hsl(var(--revenue-warning))" name="Industry Avg Recovery" />
              <Bar dataKey="optimistic" fill="hsl(var(--revenue-success))" name="Best-in-Class Recovery" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-revenue-danger/10 rounded-lg border border-revenue-danger/20">
              <div className="text-sm font-medium text-revenue-danger mb-1">Current State</div>
              <div className="text-lg font-bold text-revenue-danger">
                {formatCurrency(Object.values(losses).reduce((sum, loss) => sum + loss, 0))}
              </div>
              <div className="text-xs text-muted-foreground">Annual revenue at risk</div>
            </div>
            <div className="p-4 bg-revenue-warning/10 rounded-lg border border-revenue-warning/20">
              <div className="text-sm font-medium text-revenue-warning mb-1">Industry Average</div>
              <div className="text-lg font-bold text-revenue-warning">
                {formatCurrency(recoveryRanges.conservative.totalRecovery)}
              </div>
              <div className="text-xs text-muted-foreground">Conservative recovery target</div>
            </div>
            <div className="p-4 bg-revenue-success/10 rounded-lg border border-revenue-success/20">
              <div className="text-sm font-medium text-revenue-success mb-1">Best-in-Class</div>
              <div className="text-lg font-bold text-revenue-success">
                {formatCurrency(bestInClassTotalRecovery)}
              </div>
              <div className="text-xs text-muted-foreground">Strategic advantage target</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};