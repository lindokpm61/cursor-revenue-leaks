import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, TrendingUp, DollarSign, AlertTriangle,
  Eye, ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { submissionService, analyticsService, leadScoringService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import IntegrationStatusWidget from "@/components/admin/IntegrationStatusWidget";
import QuickActionsPanel from "@/components/admin/QuickActionsPanel";
import DataFreshnessIndicator from "@/components/admin/DataFreshnessIndicator";
import ActivityLogWidget from "@/components/admin/ActivityLogWidget";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [recalculatingScores, setRecalculatingScores] = useState(false);
  const [scoreStats, setScoreStats] = useState({ total: 0, scored: 0, unscored: 0 });
  const [metrics, setMetrics] = useState({
    totalSubmissions: 0,
    weeklySubmissions: 0,
    averageLeakage: 0,
    totalPipeline: 0,
    highValueLeads: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    loadScoreStats();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      loadScoreStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [submissionsResponse] = await Promise.all([
        submissionService.getAll(20),
      ]);

      if (submissionsResponse.data) {
        const submissions = submissionsResponse.data;
        setRecentSubmissions(submissions.slice(0, 5));
        
        // Calculate metrics
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklySubmissions = submissions.filter(s => 
          new Date(s.created_at!) > weekAgo
        ).length;
        
        const totalLeakage = submissions.reduce((acc, s) => acc + (s.total_leak || 0), 0);
        const averageLeakage = submissions.length > 0 ? totalLeakage / submissions.length : 0;
        
        const totalPipeline = submissions.reduce((acc, s) => 
          acc + (s.recovery_potential_70 || 0), 0
        );
        
        const highValueLeads = submissions.filter(s => (s.lead_score || 0) >= 80).length;

        setMetrics({
          totalSubmissions: submissions.length,
          weeklySubmissions,
          averageLeakage,
          totalPipeline,
          highValueLeads,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScoreStats = async () => {
    try {
      const response = await leadScoringService.getScoreStats();
      if (response.data) {
        setScoreStats(response.data);
      }
    } catch (error) {
      console.error('Error loading score stats:', error);
    }
  };

  const handleRecalculateAllScores = async () => {
    setRecalculatingScores(true);
    try {
      const response = await leadScoringService.recalculateAllScores();
      if (response.error) {
        throw response.error;
      }
      
      toast({
        title: "Scores Recalculated",
        description: `Successfully updated ${response.data?.updated || 0} lead scores`,
      });
      
      // Refresh data
      await Promise.all([loadDashboardData(), loadScoreStats()]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate lead scores",
        variant: "destructive",
      });
    } finally {
      setRecalculatingScores(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of revenue leak calculator performance and key metrics
          </p>
        </div>
        <div className="flex gap-3">
          {scoreStats.unscored > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {scoreStats.unscored} leads need score calculation
              </p>
              <Button 
                onClick={handleRecalculateAllScores}
                disabled={recalculatingScores}
                variant="outline"
                size="sm"
              >
                {recalculatingScores ? "Recalculating..." : "Recalculate All Scores"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Freshness */}
      <DataFreshnessIndicator />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{metrics.totalSubmissions}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-revenue-success">{metrics.weeklySubmissions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-revenue-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold text-revenue-primary">
                  {formatCurrency(metrics.totalPipeline)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-revenue-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High-Value Leads</p>
                <p className="text-2xl font-bold text-revenue-danger">
                  {metrics.highValueLeads}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-revenue-danger" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions - Moved up */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Latest revenue leak calculator submissions</CardDescription>
          </div>
          <Link to="/admin/leads">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{submission.company_name}</p>
                      <p className="text-sm text-muted-foreground">{submission.contact_email}</p>
                    </div>
                    {submission.industry && (
                      <Badge variant="outline" className="capitalize">
                        {submission.industry}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Revenue Leak</p>
                  <p className="font-medium text-revenue-danger">
                    {formatCurrency(submission.total_leak || 0)}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-muted-foreground">Lead Score</p>
                  <p className={`font-bold ${
                    (submission.lead_score || 0) >= 80 ? 'text-revenue-danger' :
                    (submission.lead_score || 0) >= 60 ? 'text-revenue-warning' :
                    'text-revenue-success'
                  }`}>
                    {submission.lead_score || 0}
                  </p>
                </div>
                <Link to={`/results/${submission.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operational Widgets - Moved down */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IntegrationStatusWidget />
        <QuickActionsPanel />
      </div>

      {/* Activity Log */}
      <ActivityLogWidget />
    </div>
  );
};

export default AdminDashboard;