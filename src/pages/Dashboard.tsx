import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, BarChart3, TrendingUp, DollarSign, Users, LogOut, User, Trash2, Phone, Target, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { submissionService, analyticsService, userProfileService, type Submission, type UserProfile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalLeakage: 0,
    averageLeakage: 0,
    topIndustry: "",
    highIntentLeads: 0,
    activeImplementations: 0
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
      // Load submissions and user profile in parallel
      const [submissionsResponse, profileResponse] = await Promise.all([
        isAdmin 
          ? submissionService.getAll(50)
          : submissionService.getByUserId(user.id, 10),
        userProfileService.getByUserId(user.id)
      ]);
      
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

        // Calculate engagement metrics (simulate for now)
        const highIntentLeads = Math.floor(total * 0.3); // 30% high intent simulation
        const activeImplementations = Math.floor(total * 0.2); // 20% active simulation

        setStats({
          totalSubmissions: total,
          totalLeakage,
          averageLeakage: avgLeakage,
          topIndustry,
          highIntentLeads,
          activeImplementations
        });
      }

      // Set user profile if found
      if (profileResponse.data) {
        setUserProfile(profileResponse.data);
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

  const handleDeleteSubmission = async (submissionId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete the assessment for ${companyName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await submissionService.delete(submissionId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete assessment",
          variant: "destructive",
        });
        return;
      }

      // Remove the submission from the local state
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      
      // Recalculate stats
      const newSubmissions = submissions.filter(s => s.id !== submissionId);
      const total = newSubmissions.length;
      const totalLeakage = newSubmissions.reduce((sum, s) => sum + (s.total_leak || 0), 0);
      const avgLeakage = total > 0 ? totalLeakage / total : 0;
      
      const industries = newSubmissions.reduce((acc, s) => {
        if (s.industry) {
          acc[s.industry] = (acc[s.industry] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      const topIndustry = Object.entries(industries).sort(([,a], [,b]) => b - a)[0]?.[0] || "";

      // Recalculate engagement metrics
      const highIntentLeads = Math.floor(total * 0.3);
      const activeImplementations = Math.floor(total * 0.2);

      setStats({
        totalSubmissions: total,
        totalLeakage,
        averageLeakage: avgLeakage,
        topIndustry,
        highIntentLeads,
        activeImplementations
      });

      toast({
        title: "Success",
        description: "Assessment deleted successfully",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive",
      });
    }
  };

  // Smart Action Buttons Component
  const SmartActionButtons = ({ submission }: { submission: Submission }) => {
    const recoveryPotential = submission.recovery_potential_70 || 0;
    
    // High-value prospects (>$200M recovery)
    if (recoveryPotential > 200000000) {
      return (
        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none'
            }}
            onClick={() => window.open('tel:+1234567890', '_self')}
          >
            🚀 Priority Call
          </Button>
          <Link to={`/action-plan/${submission.id}`}>
            <Button variant="outline" size="sm" className="text-xs">
              📋 Action Plan
            </Button>
          </Link>
        </div>
      );
    }
    
    // Medium-high value (>$100M recovery)
    if (recoveryPotential > 100000000) {
      return (
        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none'
            }}
            onClick={() => window.open('mailto:support@company.com?subject=Strategy Call Request', '_self')}
          >
            📞 Strategy Call
          </Button>
          <Link to={`/results/${submission.id}`}>
            <Button variant="outline" size="sm" className="text-xs">
              📊 Analysis
            </Button>
          </Link>
        </div>
      );
    }
    
    // Medium value ($50M-$100M recovery)
    if (recoveryPotential > 50000000) {
      return (
        <div className="flex items-center gap-2">
          <Button 
            size="sm"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none'
            }}
            onClick={() => window.open('mailto:support@company.com?subject=Consultation Request', '_self')}
          >
            📞 Book Consult
          </Button>
          <Link to={`/action-plan/${submission.id}`}>
            <Button variant="outline" size="sm" className="text-xs">
              📋 Action Plan
            </Button>
          </Link>
        </div>
      );
    }
    
    // Standard value (<$50M recovery)
    return (
      <div className="flex items-center gap-2">
        <Link to={`/action-plan/${submission.id}`}>
          <Button 
            size="sm"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              border: 'none'
            }}
          >
            📋 Action Plan
          </Button>
        </Link>
        <Link to={`/results/${submission.id}`}>
          <Button variant="outline" size="sm" className="text-xs">
            📈 Progress
          </Button>
        </Link>
      </div>
    );
  };

  // Progress Column Component
  const ProgressColumn = ({ submission }: { submission: Submission }) => {
    const actionsChecked = Math.floor(Math.random() * 5); // Simulate actions checked
    const baseProgress = 15; // Analysis completion
    const actionProgress = (actionsChecked / 4) * 85;
    const progressPercentage = Math.round(baseProgress + actionProgress);
    
    const getProgressMessage = (percentage: number) => {
      if (percentage <= 15) return "Analysis Complete";
      if (percentage <= 35) return "Getting Started";
      if (percentage <= 65) return "Making Progress";
      if (percentage <= 85) return "Nearly Complete";
      return "Ready to Implement";
    };
    
    return (
      <TableCell>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Implementation</span>
            <span className="text-xs font-medium">{progressPercentage}%</span>
          </div>
          <div 
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: '#e5e7eb' }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercentage}%`,
                background: progressPercentage > 50 ? 
                  'linear-gradient(90deg, #059669 0%, #34d399 100%)' :
                  'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {getProgressMessage(progressPercentage)}
          </div>
        </div>
      </TableCell>
    );
  };

  // Engagement Badges Component
  const EngagementBadges = ({ submission }: { submission: Submission }) => {
    const recoveryPotential = submission.recovery_potential_70 || 0;
    const actionsChecked = Math.floor(Math.random() * 5);
    const engagementScore = Math.floor(Math.random() * 100);
    const returnVisits = Math.floor(Math.random() * 5);
    const daysSinceCreated = submission.created_at ? 
      Math.floor((Date.now() - new Date(submission.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const badges = [];
    
    // High priority for large opportunities
    if (recoveryPotential > 200000000) {
      badges.push(
        <Badge 
          key="high-priority"
          className="text-xs px-2 py-0.5"
          style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            border: '1px solid #fecaca'
          }}
        >
          🔥 HIGH PRIORITY
        </Badge>
      );
    }
    
    // Actions started indicator
    if (actionsChecked > 0) {
      badges.push(
        <Badge 
          key="actions-started"
          className="text-xs px-2 py-0.5"
          style={{
            backgroundColor: '#f0fdf4',
            color: '#059669',
            border: '1px solid #bbf7d0'
          }}
        >
          🎯 {actionsChecked} Actions
        </Badge>
      );
    }
    
    // High engagement indicator
    if (engagementScore > 70) {
      badges.push(
        <Badge 
          key="high-engagement"
          className="text-xs px-2 py-0.5"
          style={{
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe'
          }}
        >
          ⭐ High Intent
        </Badge>
      );
    }
    
    // Return visits indicator
    if (returnVisits > 1) {
      badges.push(
        <Badge 
          key="return-visits"
          className="text-xs px-2 py-0.5"
          style={{
            backgroundColor: '#fefbf2',
            color: '#d97706',
            border: '1px solid #fed7aa'
          }}
        >
          🔄 Active User
        </Badge>
      );
    }
    
    // New assessment indicator
    if (daysSinceCreated <= 7) {
      badges.push(
        <Badge 
          key="new"
          className="text-xs px-2 py-0.5"
          style={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db'
          }}
        >
          ✨ NEW
        </Badge>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {badges}
      </div>
    );
  };

  // Smart sorting function
  const sortAssessments = (assessments: Submission[]) => {
    return assessments.sort((a, b) => {
      // Primary sort: High engagement users first (simulated)
      const engagementA = Math.floor(Math.random() * 100);
      const engagementB = Math.floor(Math.random() * 100);
      const engagementDiff = engagementB - engagementA;
      if (engagementDiff !== 0) return engagementDiff;
      
      // Secondary sort: High recovery potential
      const recoveryA = a.recovery_potential_70 || 0;
      const recoveryB = b.recovery_potential_70 || 0;
      const recoveryDiff = recoveryB - recoveryA;
      if (recoveryDiff !== 0) return recoveryDiff;
      
      // Tertiary sort: Most recent first
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const sortedSubmissions = sortAssessments(submissions);

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

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
                  <p className="text-sm text-muted-foreground">High Intent Leads</p>
                  <p className="text-2xl font-bold" style={{ color: '#059669' }}>
                    {stats.highIntentLeads}
                  </p>
                </div>
                <Target className="h-8 w-8" style={{ color: '#059669' }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Implementations</p>
                  <p className="text-2xl font-bold" style={{ color: '#2563eb' }}>
                    {stats.activeImplementations}
                  </p>
                </div>
                <Activity className="h-8 w-8" style={{ color: '#2563eb' }} />
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
                  <p className="text-sm text-muted-foreground">
                    {userProfile ? "Total Opportunity" : "Top Industry"}
                  </p>
                  <p className="text-2xl font-bold text-revenue-success">
                    {userProfile 
                      ? formatCurrency(userProfile.total_opportunity || 0)
                      : (stats.topIndustry || "N/A")
                    }
                  </p>
                </div>
                <User className="h-8 w-8 text-revenue-success" />
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
                     <TableHead>Progress</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {sortedSubmissions.map((submission) => (
                     <TableRow key={submission.id}>
                       <TableCell className="font-medium">
                         <div>
                           {submission.company_name}
                           <EngagementBadges submission={submission} />
                         </div>
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
                       <ProgressColumn submission={submission} />
                       <TableCell className="text-muted-foreground">
                         {submission.created_at ? 
                           new Date(submission.created_at).toLocaleDateString() : 
                           'N/A'
                         }
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-col gap-2">
                           <SmartActionButtons submission={submission} />
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => handleDeleteSubmission(submission.id, submission.company_name)}
                             className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                           >
                             <Trash2 className="h-3 w-3 mr-1" />
                             Delete
                           </Button>
                         </div>
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