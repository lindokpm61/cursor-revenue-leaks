import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { submissionService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("30d");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({
    dailyTrends: [] as Array<{ date: string; submissions: number; revenue: number }>,
    leadScoreDistribution: [] as Array<{ range: string; count: number }>,
    industryBreakdown: [] as Array<{ industry: string; count: number; value: number }>,
    companySize: [] as Array<{ size: string; count: number; opportunity: number }>,
    conversionFunnel: [] as Array<{ stage: string; count: number; percentage: number }>,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [timeFilter]);

  const loadAnalyticsData = async () => {
    try {
      const response = await submissionService.getAll(500);
      if (response.data) {
        const allSubmissions = response.data;
        
        // Filter by time period
        const cutoffDate = new Date();
        const days = parseInt(timeFilter.replace('d', ''));
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const filteredSubmissions = allSubmissions.filter(s => 
          new Date(s.created_at!) > cutoffDate
        );
        
        setSubmissions(filteredSubmissions);
        calculateAnalytics(filteredSubmissions);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (data: any[]) => {
    // Daily trends
    const dailyData = new Map();
    data.forEach(sub => {
      const date = new Date(sub.created_at!).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { submissions: 0, revenue: 0 });
      }
      const current = dailyData.get(date);
      current.submissions += 1;
      current.revenue += sub.recovery_potential_70 || 0;
    });

    const dailyTrends = Array.from(dailyData.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Lead score distribution
    const scoreRanges = {
      '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
    };
    data.forEach(sub => {
      const score = sub.lead_score || 0;
      if (score <= 20) scoreRanges['0-20']++;
      else if (score <= 40) scoreRanges['21-40']++;
      else if (score <= 60) scoreRanges['41-60']++;
      else if (score <= 80) scoreRanges['61-80']++;
      else scoreRanges['81-100']++;
    });

    const leadScoreDistribution = Object.entries(scoreRanges)
      .map(([range, count]) => ({ range, count }));

    // Industry breakdown
    const industryData = new Map();
    data.forEach(sub => {
      const industry = sub.industry || 'Unknown';
      if (!industryData.has(industry)) {
        industryData.set(industry, { count: 0, value: 0 });
      }
      const current = industryData.get(industry);
      current.count += 1;
      current.value += sub.recovery_potential_70 || 0;
    });

    const industryBreakdown = Array.from(industryData.entries())
      .map(([industry, stats]) => ({ industry, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Company size by ARR
    const sizeRanges = {
      'Startup (<$1M)': 0,
      'Scale-up ($1M-$10M)': 0, 
      'Growth ($10M-$50M)': 0,
      'Enterprise ($50M+)': 0
    };
    const sizeOpportunity = {
      'Startup (<$1M)': 0,
      'Scale-up ($1M-$10M)': 0,
      'Growth ($10M-$50M)': 0, 
      'Enterprise ($50M+)': 0
    };

    data.forEach(sub => {
      const arr = sub.current_arr || 0;
      const opportunity = sub.recovery_potential_70 || 0;
      
      if (arr < 1000000) {
        sizeRanges['Startup (<$1M)']++;
        sizeOpportunity['Startup (<$1M)'] += opportunity;
      } else if (arr < 10000000) {
        sizeRanges['Scale-up ($1M-$10M)']++;
        sizeOpportunity['Scale-up ($1M-$10M)'] += opportunity;
      } else if (arr < 50000000) {
        sizeRanges['Growth ($10M-$50M)']++;
        sizeOpportunity['Growth ($10M-$50M)'] += opportunity;
      } else {
        sizeRanges['Enterprise ($50M+)']++;
        sizeOpportunity['Enterprise ($50M+)'] += opportunity;
      }
    });

    const companySize = Object.entries(sizeRanges)
      .map(([size, count]) => ({ 
        size, 
        count, 
        opportunity: sizeOpportunity[size as keyof typeof sizeOpportunity] 
      }));

    // Conversion funnel (mock data - would need actual conversion tracking)
    const conversionFunnel = [
      { stage: 'Visitors', count: data.length * 5, percentage: 100 },
      { stage: 'Started Calculator', count: data.length * 2, percentage: 40 },
      { stage: 'Completed Analysis', count: data.length, percentage: 20 },
      { stage: 'High-Value Leads', count: data.filter(s => (s.lead_score || 0) >= 80).length, percentage: 5 },
    ];

    setAnalytics({
      dailyTrends,
      leadScoreDistribution,
      industryBreakdown,
      companySize,
      conversionFunnel,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Detailed analytics and performance metrics
          </p>
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Submission Trends */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Daily Submission Trends</CardTitle>
            <CardDescription>Submissions and revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="submissions" stroke="#8884d8" name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Score Distribution */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Lead Score Distribution</CardTitle>
            <CardDescription>Distribution of lead quality scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.leadScoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Industry Breakdown</CardTitle>
            <CardDescription>Submissions by industry sector</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.industryBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ industry, count }) => `${industry}: ${count}`}
                >
                  {analytics.industryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Company Size Analysis */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Revenue Opportunity by Company Size</CardTitle>
            <CardDescription>Opportunity value by company ARR range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.companySize}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="size" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="opportunity" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="border-border/50 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversion Funnel Analysis</CardTitle>
            <CardDescription>User journey through the revenue leak calculator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.conversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <span className="font-medium">{stage.stage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-64 bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">
                      {stage.count.toLocaleString()} ({stage.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;