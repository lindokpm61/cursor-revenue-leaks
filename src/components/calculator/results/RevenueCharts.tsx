import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalculatorData, Calculations } from "../useCalculatorData";

interface RevenueChartsProps {
  data: CalculatorData;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
}

export const RevenueCharts = ({ data, calculations, formatCurrency }: RevenueChartsProps) => {
  const leakageData = [
    {
      name: 'Lead Response',
      value: calculations.leadResponseLoss,
      color: '#EF4444',
    },
    {
      name: 'Failed Payments',
      value: calculations.failedPaymentLoss,
      color: '#F97316',
    },
    {
      name: 'Self-Serve Gap',
      value: calculations.selfServeGap,
      color: '#EAB308',
    },
    {
      name: 'Process Loss',
      value: calculations.processLoss,
      color: '#8B5CF6',
    },
  ];

  const recoveryData = [
    {
      category: 'Lead Response',
      current: calculations.leadResponseLoss,
      potential70: calculations.leadResponseLoss * 0.7,
      potential85: calculations.leadResponseLoss * 0.85,
    },
    {
      category: 'Failed Payments',
      current: calculations.failedPaymentLoss,
      potential70: calculations.failedPaymentLoss * 0.7,
      potential85: calculations.failedPaymentLoss * 0.85,
    },
    {
      category: 'Self-Serve Gap',
      current: calculations.selfServeGap,
      potential70: calculations.selfServeGap * 0.7,
      potential85: calculations.selfServeGap * 0.85,
    },
    {
      category: 'Process Loss',
      current: calculations.processLoss,
      potential70: calculations.processLoss * 0.7,
      potential85: calculations.processLoss * 0.85,
    },
  ];

  const totalVsLeakedData = [
    {
      name: 'Current Revenue',
      value: data.companyInfo.currentARR,
      color: '#22C55E',
    },
    {
      name: 'Lost Revenue',
      value: calculations.totalLeakage,
      color: '#EF4444',
    },
  ];

  const TOTAL_COLORS = ['#22C55E', '#EF4444'];

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
                <Bar dataKey="value" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-revenue-success" />
              Total Revenue vs Lost Revenue
            </CardTitle>
            <CardDescription>
              Current ARR compared to leaked revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={totalVsLeakedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {totalVsLeakedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TOTAL_COLORS[index % TOTAL_COLORS.length]} />
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
            Conservative (70%) vs optimistic (85%) recovery scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={recoveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="current" fill="#EF4444" name="Current Loss" />
              <Bar dataKey="potential70" fill="#F97316" name="70% Recovery" />
              <Bar dataKey="potential85" fill="#22C55E" name="85% Recovery" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
};