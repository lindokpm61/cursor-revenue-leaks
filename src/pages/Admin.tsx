import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Users, BarChart3, TrendingUp, DollarSign, 
  Search, Filter, Download, ArrowLeft, Eye, Edit, 
  Trash2, AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [submissions, setSubmissions] = useState<Tables<'submissions'>[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Tables<'submissions'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [analytics, setAnalytics] = useState({
    totalSubmissions: 0,
    weeklySubmissions: 0,
    averageLeakage: 0,
    topIndustries: [] as Array<{ industry: string; count: number }>,
    conversionFunnel: [] as Array<{ stage: string; count: number }>
  });

  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate("/dashboard");
      return;
    }
    loadAdminData();
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, industryFilter, statusFilter]);

  const loadAdminData = async () => {
    try {
      // Get submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (submissionsError) throw submissionsError;

      if (submissionsData) {
        setSubmissions(submissionsData);
        
        // Calculate analytics from submissions data
        const totalSubmissions = submissionsData.length;
        const weeklySubmissions = submissionsData.filter(sub => 
          new Date(sub.created_at || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length;
        const averageLeakage = submissionsData.reduce((sum, sub) => sum + (sub.total_leak || 0), 0) / totalSubmissions;
        
        // Top industries
        const industryCount: Record<string, number> = {};
        submissionsData.forEach(sub => {
          if (sub.industry) {
            industryCount[sub.industry] = (industryCount[sub.industry] || 0) + 1;
          }
        });
        const topIndustries = Object.entries(industryCount)
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => b.count - a.count);

        setAnalytics({
          totalSubmissions,
          weeklySubmissions,
          averageLeakage,
          topIndustries,
          conversionFunnel: [] // Placeholder for now
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter(sub => sub.industry === industryFilter);
    }

    if (statusFilter !== "all") {
      // Since we don't have a status field in submissions table, skip this filter for now
      // filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      // For now, just show a message since we don't have status in the submissions table
      toast({
        title: "Info",
        description: "Status update feature will be available once status field is added to database",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      'Company Name,Email,Industry,Current ARR,Total Leakage,Recovery Potential,Lead Score,Status,Created Date',
      ...filteredSubmissions.map(sub => [
        sub.company_name,
        sub.contact_email,
        sub.industry,
        sub.current_arr,
        sub.total_leak || 0,
        sub.recovery_potential_70 || 0,
        sub.lead_score || 0,
        'new', // Default status since we don't have this field
        sub.created_at || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-leak-submissions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
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
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full lg:w-[400px] grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor and manage revenue leak calculator submissions
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Submissions</p>
                      <p className="text-2xl font-bold">{analytics.totalSubmissions}</p>
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
                      <p className="text-2xl font-bold text-revenue-success">{analytics.weeklySubmissions}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-revenue-success" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Leakage</p>
                      <p className="text-2xl font-bold text-revenue-warning">
                        {formatCurrency(analytics.averageLeakage)}
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
                      <p className="text-sm text-muted-foreground">High-Value Leads</p>
                      <p className="text-2xl font-bold text-revenue-danger">
                        {submissions.filter(s => (s.lead_score || 0) >= 80).length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-revenue-danger" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Industries */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Top Industries</CardTitle>
                <CardDescription>Industries with the most submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topIndustries.slice(0, 5).map((industry, index) => (
                    <div key={industry.industry} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="capitalize">{industry.industry}</span>
                      </div>
                      <Badge variant="outline">{industry.count} submissions</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Management Tab */}
          <TabsContent value="leads" className="space-y-6">
            {/* Filters */}
            <Card className="border-border/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search companies or emails..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {analytics.topIndustries.map((industry) => (
                        <SelectItem key={industry.industry} value={industry.industry}>
                          {industry.industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Submissions Table */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Lead Submissions ({filteredSubmissions.length})</CardTitle>
                <CardDescription>
                  Manage and track revenue leak calculator submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>ARR</TableHead>
                      <TableHead>Leakage</TableHead>
                      <TableHead>Lead Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{submission.company_name}</div>
                            <div className="text-sm text-muted-foreground">{submission.contact_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {submission.industry}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(submission.current_arr || 0)}</TableCell>
                        <TableCell className="text-revenue-danger">
                          {formatCurrency(submission.total_leak || 0)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getLeadScoreColor(submission.lead_score || 0)}`}>
                            {submission.lead_score || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">New</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {submission.created_at ? 
                            new Date(submission.created_at).toLocaleDateString() : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link to={`/results/${submission.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Analytics & Insights</h2>
              <p className="text-muted-foreground">
                Detailed analytics and performance metrics
              </p>
            </div>

            {/* Conversion Funnel */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Lead progression through sales stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.conversionFunnel.map((stage, index) => (
                    <div key={stage.stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="capitalize">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(stage.count / analytics.totalSubmissions) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {stage.count} ({Math.round((stage.count / analytics.totalSubmissions) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;