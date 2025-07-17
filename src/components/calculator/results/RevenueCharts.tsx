import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalculatorData, Calculations } from "../useCalculatorData";
import { calculateRecoveryRanges, type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";

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
  
  // Calculate realistic recovery potential using enhanced calculations
  const losses = {
    leadResponse: calculations.leadResponseLoss,
    selfServe: calculations.selfServeGap,
    processAutomation: calculations.processLoss,
    paymentRecovery: calculations.failedPaymentLoss
  };

  const recoveryRanges = calculateRecoveryRanges(losses, factors);

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

  // Fix: Show "Current ARR vs Recovery Opportunity" instead of misleading total vs leaked
  const totalVsRecoveryData = [
    {
      name: 'Current ARR',
      value: data.companyInfo.currentARR,
      color: 'hsl(var(--revenue-success))',
    },
    {
      name: 'Recovery Opportunity',
      value: recoveryRanges.conservative.totalRecovery,
      color: 'hsl(var(--revenue-primary))',
    },
  ];

  

  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-revenue-warning" />
              Revenue Leakage by Source
            </CardTitle>
            <CardDescription>
              Annual revenue loss breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leakageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-revenue-success" />
              Current ARR vs Recovery Opportunity
            </CardTitle>
            <CardDescription>
              Current annual recurring revenue vs potential recovery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={totalVsRecoveryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {totalVsRecoveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Potential */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-revenue-success" />
            Recovery Potential by Category
          </CardTitle>
            <CardDescription>
              Realistic recovery potential based on implementation factors
            </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={recoveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="current" fill="hsl(var(--destructive))" name="Current Loss" />
              <Bar dataKey="conservative" fill="hsl(var(--revenue-warning))" name="Conservative Recovery" />
              <Bar dataKey="optimistic" fill="hsl(var(--revenue-success))" name="Optimistic Recovery" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
};