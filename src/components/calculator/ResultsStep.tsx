import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalculatorData, Calculations } from "./useCalculatorData";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Zap, BarChart3, Save, Share2, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { submissionService, analyticsService } from "@/lib/supabase";
import { integrations } from "@/lib/integrations";

interface ResultsStepProps {
  data: CalculatorData;
  calculations: Calculations;
}

export const ResultsStep = ({ data, calculations }: ResultsStepProps) => {
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6'];
  const TOTAL_COLORS = ['#22C55E', '#EF4444'];

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your results",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const submissionData = {
        company_name: data.companyInfo.companyName,
        contact_email: data.companyInfo.email,
        industry: data.companyInfo.industry,
        current_arr: data.companyInfo.currentARR,
        monthly_leads: data.leadGeneration.monthlyLeads,
        average_deal_value: data.leadGeneration.averageDealValue,
        lead_response_time: data.leadGeneration.leadResponseTimeHours,
        monthly_free_signups: data.selfServeMetrics.monthlyFreeSignups,
        free_to_paid_conversion: data.selfServeMetrics.freeToPaidConversionRate,
        monthly_mrr: data.selfServeMetrics.monthlyMRR,
        failed_payment_rate: data.operationsData.failedPaymentRate,
        manual_hours: data.operationsData.manualHoursPerWeek,
        hourly_rate: data.operationsData.hourlyRate,
        lead_response_loss: Math.round(calculations.leadResponseLoss),
        failed_payment_loss: Math.round(calculations.failedPaymentLoss),
        selfserve_gap_loss: Math.round(calculations.selfServeGap),
        process_inefficiency_loss: Math.round(calculations.processLoss),
        total_leak: Math.round(calculations.totalLeakage),
        recovery_potential_70: Math.round(calculations.potentialRecovery70),
        recovery_potential_85: Math.round(calculations.potentialRecovery85),
        leak_percentage: data.companyInfo.currentARR > 0 
          ? Math.round((calculations.totalLeakage / data.companyInfo.currentARR) * 100)
          : 0,
        user_id: user.id,
      };

      const { data: savedSubmission, error } = await submissionService.create(submissionData);
      
      if (error) {
        throw error;
      }

      // Track analytics
      await analyticsService.track('submission_saved', savedSubmission?.id);

      toast({
        title: "Results Saved",
        description: "Your revenue analysis has been saved successfully",
      });

      // Navigate to results page
      if (savedSubmission?.id) {
        navigate(`/results/${savedSubmission.id}`);
      }
    } catch (error) {
      console.error('Error saving submission:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <p className="text-sm text-muted-foreground mt-1">annual loss</p>
          </CardContent>
        </Card>

        <Card className="border-revenue-success/20 bg-revenue-success/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-success" />
              Recovery 70%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-success">
              {formatCurrency(calculations.potentialRecovery70)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">conservative estimate</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Recovery 85%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(calculations.potentialRecovery85)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">optimistic estimate</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              ROI Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent">
              {data.companyInfo.currentARR > 0 
                ? Math.round((calculations.potentialRecovery70 / data.companyInfo.currentARR) * 100)
                : 0}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">of current ARR</p>
          </CardContent>
        </Card>
      </div>

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

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Lead Response Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive mb-2">
              {formatCurrency(calculations.leadResponseLoss)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Lost due to slow lead response (48% impact factor)
            </p>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Monthly Leads:</span> {data.leadGeneration.monthlyLeads.toLocaleString()}</p>
              <p><span className="font-medium">Avg Deal Value:</span> {formatCurrency(data.leadGeneration.averageDealValue)}</p>
              <p><span className="font-medium">Response Time:</span> {data.leadGeneration.leadResponseTimeHours}h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-revenue-warning/20 bg-revenue-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-revenue-warning" />
              Failed Payment Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-revenue-warning mb-2">
              {formatCurrency(calculations.failedPaymentLoss)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Annual loss from failed payments
            </p>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Monthly MRR:</span> {formatCurrency(data.selfServeMetrics.monthlyMRR)}</p>
              <p><span className="font-medium">Failed Rate:</span> {data.operationsData.failedPaymentRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Self-Serve Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary mb-2">
              {formatCurrency(calculations.selfServeGap)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Gap between current and 15% benchmark conversion
            </p>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Free Signups:</span> {data.selfServeMetrics.monthlyFreeSignups.toLocaleString()}</p>
              <p><span className="font-medium">Conversion Rate:</span> {data.selfServeMetrics.freeToPaidConversionRate}%</p>
              <p><span className="font-medium">Gap to 15%:</span> {Math.max(0, 15 - data.selfServeMetrics.freeToPaidConversionRate)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-revenue-danger/20 bg-revenue-danger/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-revenue-danger" />
              Process Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-revenue-danger mb-2">
              {formatCurrency(calculations.processLoss)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Annual cost of manual processes (25% efficiency loss)
            </p>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Manual Hours/Week:</span> {data.operationsData.manualHoursPerWeek}</p>
              <p><span className="font-medium">Hourly Rate:</span> {formatCurrency(data.operationsData.hourlyRate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-primary to-revenue-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Results"}
        </Button>
      </div>

      {/* Action Plan */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Recommended Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Quick Wins (0-30 days)</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Implement automated lead response system</li>
                <li>• Set up failed payment recovery workflows</li>
                <li>• Review and optimize onboarding flow</li>
                <li>• Automate most time-consuming manual tasks</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Long-term Impact (3-6 months)</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Advanced lead scoring and qualification</li>
                <li>• Predictive churn prevention</li>
                <li>• Self-serve optimization program</li>
                <li>• Complete process automation suite</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-background rounded-lg border">
            <p className="text-sm font-medium text-foreground mb-2">
              💡 Priority Focus: {
                calculations.leadResponseLoss > calculations.failedPaymentLoss && 
                calculations.leadResponseLoss > calculations.selfServeGap && 
                calculations.leadResponseLoss > calculations.processLoss
                  ? "Lead Response Optimization"
                  : calculations.failedPaymentLoss > calculations.selfServeGap && 
                    calculations.failedPaymentLoss > calculations.processLoss
                  ? "Payment Recovery Systems"
                  : calculations.selfServeGap > calculations.processLoss
                  ? "Self-Serve Conversion"
                  : "Process Automation"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              This area represents your largest revenue leak and should be addressed first for maximum impact.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};