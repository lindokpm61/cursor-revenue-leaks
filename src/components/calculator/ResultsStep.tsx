import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorData, Calculations } from "./useCalculatorData";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ResultsStepProps {
  data: CalculatorData;
  calculations: Calculations;
}

export const ResultsStep = ({ data, calculations }: ResultsStepProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const leakageData = [
    {
      name: 'Lead Qualification',
      value: calculations.leadQualificationLeak,
      color: '#EF4444',
    },
    {
      name: 'Sales Conversion',
      value: calculations.conversionLeak,
      color: '#F97316',
    },
    {
      name: 'Customer Retention',
      value: calculations.retentionLeak,
      color: '#EAB308',
    },
  ];

  const recoveryData = [
    {
      category: 'Lead Qualification',
      current: calculations.leadQualificationLeak,
      potential: calculations.leadQualificationLeak * 0.4,
    },
    {
      category: 'Sales Conversion',
      current: calculations.conversionLeak,
      potential: calculations.conversionLeak * 0.3,
    },
    {
      category: 'Customer Retention',
      current: calculations.retentionLeak,
      potential: calculations.retentionLeak * 0.2,
    },
  ];

  const COLORS = ['#EF4444', '#F97316', '#EAB308'];

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <p className="text-sm text-muted-foreground mt-1">per month</p>
          </CardContent>
        </Card>

        <Card className="border-revenue-success/20 bg-revenue-success/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-success" />
              Recovery Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-success">
              {formatCurrency(calculations.potentialRecovery)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">per month</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Annual Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(calculations.annualImpact)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">potential recovery</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Leakage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-revenue-warning" />
              Revenue Leakage Breakdown
            </CardTitle>
            <CardDescription>
              Monthly revenue loss by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leakageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leakageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-revenue-success" />
              Recovery Potential by Category
            </CardTitle>
            <CardDescription>
              Current losses vs. potential recovery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recoveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="current" fill="#EF4444" name="Current Loss" />
                <Bar dataKey="potential" fill="#22C55E" name="Recovery Potential" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Detailed Analysis & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h3 className="font-semibold text-destructive mb-2">Lead Qualification Issues</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {((data.leadMetrics.leadQualificationRate || 0) < 50 
                  ? "Low qualification rate indicates need for better lead scoring and qualification processes."
                  : "Good qualification rate, but there's still room for optimization."
                )}
              </p>
              <p className="text-lg font-medium">
                Monthly Loss: {formatCurrency(calculations.leadQualificationLeak)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-revenue-warning/10 border border-revenue-warning/20">
              <h3 className="font-semibold text-revenue-warning mb-2">Sales Conversion Gaps</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {((data.conversionData.opportunityToCustomerRate || 0) < 25
                  ? "Low conversion rate suggests need for improved sales processes and training."
                  : "Decent conversion rate with opportunity for further improvement."
                )}
              </p>
              <p className="text-lg font-medium">
                Monthly Loss: {formatCurrency(calculations.conversionLeak)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-revenue-danger/10 border border-revenue-danger/20">
              <h3 className="font-semibold text-revenue-danger mb-2">Customer Retention Challenges</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {((data.operationsData.customerChurnRate || 0) > 5
                  ? "High churn rate indicates urgent need for customer success improvements."
                  : "Churn rate is manageable but reducing it further would significantly impact revenue."
                )}
              </p>
              <p className="text-lg font-medium">
                Monthly Loss: {formatCurrency(calculations.retentionLeak)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Immediate Actions (0-30 days)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Implement lead scoring system</li>
                <li>• Reduce lead response time</li>
                <li>• Review sales process bottlenecks</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Medium-term (1-3 months)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Sales team training program</li>
                <li>• Customer success automation</li>
                <li>• Predictive churn analysis</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Long-term (3-6 months)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• CRM optimization</li>
                <li>• Advanced analytics implementation</li>
                <li>• Customer journey optimization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};