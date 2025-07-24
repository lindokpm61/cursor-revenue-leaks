import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { 
  generateAnalyticsDashboard,
  trackEmailSequencePerformance,
  analyzeAbandonmentPatterns
} from "@/lib/monitoringAnalytics";

interface DashboardData {
  email_performance: {
    sequences: Array<{
      sequence_type: string;
      total_sent: number;
      open_rate: number;
      click_rate: number;
      conversion_rate: number;
      total_revenue: number;
    }>;
    summary: {
      total_sequences: number;
      avg_open_rate: number;
      avg_click_rate: number;
      total_revenue: number;
    };
  };
  abandonment_insights: {
    steps: Array<{
      current_step: number;
      total_at_step: number;
      abandonment_rate: number;
      conversion_rate: number;
      avg_recovery_potential: number;
      high_value_count: number;
    }>;
    critical_points: any[];
    recovery_opportunities: number;
  };
  generated_at: string;
}

export const AnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const data = await generateAnalyticsDashboard();
      if (data) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      // Trigger fresh analytics generation
      await Promise.all([
        trackEmailSequencePerformance(),
        analyzeAbandonmentPatterns()
      ]);
      
      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);
  };

  const getPerformanceBadge = (rate: number, type: 'open' | 'click' | 'conversion') => {
    const thresholds = {
      open: { good: 25, fair: 15 },
      click: { good: 5, fair: 2 },
      conversion: { good: 8, fair: 3 }
    };
    
    const threshold = thresholds[type];
    if (rate >= threshold.good) {
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    } else if (rate >= threshold.fair) {
      return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Analytics Data Available</h2>
        <p className="text-muted-foreground mb-4">Analytics data will appear once email sequences start running.</p>
        <Button onClick={refreshAnalytics} disabled={refreshing}>
          {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
          Refresh Analytics
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date(dashboardData.generated_at).toLocaleString()}
          </p>
        </div>
        <Button onClick={refreshAnalytics} disabled={refreshing} variant="outline">
          {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Sequences</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.email_performance.summary.total_sequences}</div>
            <p className="text-xs text-muted-foreground">Active sequences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.email_performance.summary.avg_open_rate.toFixed(1)}%
            </div>
            {getPerformanceBadge(dashboardData.email_performance.summary.avg_open_rate, 'open')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.email_performance.summary.avg_click_rate.toFixed(1)}%
            </div>
            {getPerformanceBadge(dashboardData.email_performance.summary.avg_click_rate, 'click')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Attributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData.email_performance.summary.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">From email sequences</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Performance Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Email Sequence Performance</CardTitle>
          <CardDescription>Performance metrics by sequence type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.email_performance.sequences.map((sequence, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{sequence.sequence_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                  <p className="text-sm text-muted-foreground">{sequence.total_sent} emails sent</p>
                </div>
                <div className="flex space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{sequence.open_rate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Opens</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{sequence.click_rate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{sequence.conversion_rate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{formatCurrency(sequence.total_revenue)}</div>
                    <div className="text-muted-foreground">Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Abandonment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Step Abandonment Analysis</CardTitle>
            <CardDescription>Conversion rates by calculator step</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.abandonment_insights.steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Step {step.current_step}</span>
                    <div className="flex items-center space-x-2">
                      {step.abandonment_rate > 50 ? 
                        <AlertTriangle className="h-4 w-4 text-red-500" /> : 
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      }
                      <span className="text-sm">{step.conversion_rate.toFixed(1)}% converted</span>
                    </div>
                  </div>
                  <Progress 
                    value={step.conversion_rate} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{step.total_at_step} users</span>
                    <span>{step.abandonment_rate.toFixed(1)}% abandoned</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recovery Opportunities</CardTitle>
            <CardDescription>Potential revenue from abandoned users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(dashboardData.abandonment_insights.recovery_opportunities)}
                </div>
                <p className="text-sm text-muted-foreground">Total recovery potential</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Critical Steps</h4>
                {dashboardData.abandonment_insights.critical_points.length > 0 ? (
                  dashboardData.abandonment_insights.critical_points.map((step, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">Step {step.current_step}</span>
                      <Badge variant="destructive">{step.abandonment_rate.toFixed(1)}% abandoned</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No critical abandonment points detected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};