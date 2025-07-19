
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CalculatorData, Calculations } from '../useCalculatorData';
import { ConfidenceFactors } from '@/lib/calculator/enhancedCalculations';

interface RevenueChartsProps {
  data: CalculatorData;
  calculations: Calculations;
  formatCurrency: (amount: number) => string;
  confidenceFactors: ConfidenceFactors;
}

export const RevenueCharts = ({ data, calculations, formatCurrency, confidenceFactors }: RevenueChartsProps) => {
  // Memoize calculations to prevent excessive re-rendering and logging
  const chartData = useMemo(() => {
    // Only log once when chartData is recalculated
    console.log('RevenueCharts: Calculating chart data');
    
    const leakageData = [
      { name: 'Lead Response', value: calculations.leadResponseLoss, color: '#ef4444' },
      { name: 'Self-Serve Gap', value: calculations.selfServeGap, color: '#f97316' },
      { name: 'Process Automation', value: calculations.processLoss, color: '#eab308' },
      { name: 'Payment Recovery', value: calculations.failedPaymentLoss, color: '#84cc16' }
    ];

    const recoveryData = [
      { name: 'Current State', current: data.companyInfo.currentARR, recovered: 0 },
      { name: '70% Recovery', current: data.companyInfo.currentARR, recovered: calculations.totalLeakage * 0.7 },
      { name: '85% Recovery', current: data.companyInfo.currentARR, recovered: calculations.totalLeakage * 0.85 }
    ];

    const progressionData = [
      { month: 'Month 1', value: 0 },
      { month: 'Month 3', value: calculations.totalLeakage * 0.2 },
      { month: 'Month 6', value: calculations.totalLeakage * 0.5 },
      { month: 'Month 12', value: calculations.totalLeakage * 0.7 }
    ];

    return {
      leakageData: leakageData.filter(item => item.value > 0),
      recoveryData,
      progressionData,
      totalLeakage: calculations.totalLeakage,
      currentARR: data.companyInfo.currentARR,
      leakPercentage: ((calculations.totalLeakage / data.companyInfo.currentARR) * 100).toFixed(1)
    };
  }, [data.companyInfo.currentARR, calculations.leadResponseLoss, calculations.selfServeGap, calculations.processLoss, calculations.failedPaymentLoss, calculations.totalLeakage]);

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <Card className="border-2 border-revenue-warning/20 bg-gradient-to-r from-revenue-warning/5 to-revenue-primary/5">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Revenue Leakage Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-revenue-warning">
                {formatCurrency(chartData.totalLeakage)}
              </div>
              <div className="text-sm text-muted-foreground">Total Annual Leakage</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {chartData.leakPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">of Current ARR</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-revenue-success">
                {formatCurrency(chartData.totalLeakage * 0.7)}
              </div>
              <div className="text-sm text-muted-foreground">70% Recovery Potential</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Leakage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Leakage Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.leakageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.leakageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Annual Loss']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {chartData.leakageData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recovery Potential */}
        <Card>
          <CardHeader>
            <CardTitle>Recovery Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.recoveryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name === 'current' ? 'Current ARR' : 'Additional Revenue'
                    ]}
                  />
                  <Bar dataKey="current" stackId="a" fill="#6366f1" name="current" />
                  <Bar dataKey="recovered" stackId="a" fill="#10b981" name="recovered" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projected Recovery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.progressionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Recovered Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
