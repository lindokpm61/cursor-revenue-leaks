import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, BarChart3, TrendingUp, DollarSign, Users, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { submissionService, analyticsService, type Submission } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalLeakage: 0,
    averageLeakage: 0,
    topIndustry: ""
  });

  const { user, logout, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const submissionsResponse = isAdmin 
        ? await submissionService.getAll(50)
        : await submissionService.getByUserId(user.id, 10);
      
      if (submissionsResponse.data) {
        setSubmissions(submissionsResponse.data);
        
        // Calculate stats
        const total = submissionsResponse.data.length;
        const totalLeakage = submissionsResponse.data.reduce((sum, s) => sum + (s.total_leak || 0), 0);
        const avgLeakage = total > 0 ? totalLeakage / total : 0;
        
        // Find top industry
        const industries = submissionsResponse.data.reduce((acc, s) => {
          if (s.industry) {
            acc[s.industry] = (acc[s.industry] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        const topIndustry = Object.entries(industries).sort(([,a], [,b]) => b - a)[0]?.[0] || "";

        setStats({
          totalSubmissions: total,
          totalLeakage,
          averageLeakage: avgLeakage,
          topIndustry
        });
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getLeakageColor = (leakage: number) => {
    if (leakage >= 1000000) return "text-revenue-danger";
    if (leakage >= 500000) return "text-revenue-warning";
    return "text-revenue-success";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Revenue Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.email}
              </span>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Revenue Analysis</h1>
            <p className="text-muted-foreground">
              Track your revenue leak assessments and optimization progress
            </p>
          </div>
          <Link to="/calculator">
            <Button className="bg-gradient-to-r from-primary to-revenue-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assessments</p>
                  <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue Leaks</p>
                  <p className="text-2xl font-bold text-revenue-danger">
                    {formatCurrency(stats.totalLeakage)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-revenue-danger" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Leakage</p>
                  <p className="text-2xl font-bold text-revenue-warning">
                    {formatCurrency(stats.averageLeakage)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-revenue-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Industry</p>
                  <p className="text-2xl font-bold capitalize">{stats.topIndustry || "N/A"}</p>
                </div>
                <Users className="h-8 w-8 text-revenue-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>
              Your latest revenue leak analyses and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your first revenue leak analysis to see insights here
                </p>
                <Link to="/calculator">
                  <Button className="bg-gradient-to-r from-primary to-revenue-primary">
                    Create First Assessment
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Current ARR</TableHead>
                    <TableHead>Total Leakage</TableHead>
                    <TableHead>Recovery Potential</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.company_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {submission.industry || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(submission.current_arr || 0)}
                      </TableCell>
                      <TableCell className={getLeakageColor(submission.total_leak || 0)}>
                        {formatCurrency(submission.total_leak || 0)}
                      </TableCell>
                      <TableCell className="text-revenue-success">
                        {formatCurrency(submission.recovery_potential_70 || 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {submission.created_at ? 
                          new Date(submission.created_at).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Link to={`/results/${submission.id}`}>
                          <Button variant="outline" size="sm">
                            View Results
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;