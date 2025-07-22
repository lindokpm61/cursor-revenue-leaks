
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  ArrowRight,
  Calendar,
  FileText,
  Target,
  Clock,
  Building2,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { submissionService, userProfileService, type Submission } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !authLoading) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load submissions and profile in parallel
      const [submissionsPromise, profilePromise] = await Promise.allSettled([
        loadSubmissions(),
        loadUserProfile()
      ]);

      if (submissionsPromise.status === 'rejected') {
        console.error('Failed to load submissions:', submissionsPromise.reason);
      }
      
      if (profilePromise.status === 'rejected') {
        console.error('Failed to load profile:', profilePromise.reason);
      }
      
    } catch (error) {
      console.error('Dashboard loading error:', error);
      toast({
        title: "Loading Error",
        description: "Some dashboard data couldn't be loaded. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProfileLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await submissionService.getByUserId(user.id);
      
      if (error) {
        throw error;
      }
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load your analyses. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setProfileLoading(true);
      const profile = await userProfileService.getById(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Don't show error toast for profile as it's not critical
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    
    toast({
      title: "Dashboard Refreshed",
      description: "Your data has been updated.",
    });
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalOpportunity = submissions.reduce((sum, sub) => sum + (sub.total_leak || 0), 0);
  const totalRecoveryPotential = submissions.reduce((sum, sub) => sum + (sub.recovery_potential_70 || 0), 0);
  
  // Show loading state for initial auth and data loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <LoadingSkeleton className="h-8 w-64" />
                <LoadingSkeleton className="h-4 w-48" />
              </div>
              <LoadingSkeleton className="h-10 w-40" />
            </div>
            
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <LoadingSkeleton className="h-4 w-24" />
                    <LoadingSkeleton variant="circular" className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <LoadingSkeleton className="h-8 w-20 mb-2" />
                    <LoadingSkeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Recent analyses skeleton */}
            <Card>
              <CardHeader>
                <LoadingSkeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <LoadingSkeleton variant="circular" className="h-12 w-12" />
                      <div className="flex-1 space-y-2">
                        <LoadingSkeleton className="h-5 w-48" />
                        <LoadingSkeleton className="h-4 w-32" />
                      </div>
                      <LoadingSkeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex items-center justify-center mt-8">
            <LoadingSpinner size="lg" text="Loading your strategic dashboard..." />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <Calculator className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-h1 mb-2">Access Required</h2>
            <p className="text-body text-muted-foreground mb-6">
              Please log in to access your strategic dashboard.
            </p>
            <Link to="/login">
              <Button>
                Log In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LoadingOverlay isLoading={refreshing} text="Refreshing dashboard data...">
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-h1 text-foreground">Strategic Dashboard</h1>
              <p className="text-body text-muted-foreground">
                Welcome back, {user.email}! Track your revenue optimization opportunities.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-small font-medium">Total Analyses</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-h1 font-bold">{submissions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Strategic assessments completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-small font-medium">Revenue Opportunity</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <LoadingSkeleton className="h-8 w-24 mb-2" />
                ) : (
                  <div className="text-h1 font-bold text-revenue-warning">
                    {formatCurrency(totalOpportunity)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Total leakage identified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-small font-medium">Recovery Potential</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <LoadingSkeleton className="h-8 w-24 mb-2" />
                ) : (
                  <div className="text-h1 font-bold text-revenue-success">
                    {formatCurrency(totalRecoveryPotential)}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Conservative estimate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-small font-medium">Companies Analyzed</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <LoadingSkeleton className="h-8 w-24 mb-2" />
                ) : (
                  <div className="text-h1 font-bold">
                    {userProfile?.companies_analyzed || submissions.length}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Strategic assessments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Strategic Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analyses Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your first revenue optimization assessment to unlock growth opportunities.
                  </p>
                  <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {submission.company_name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {submission.industry}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(submission.total_leak || 0)} opportunity
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(submission.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/results/${submission.id}`)}
                        >
                          View Results
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {submissions.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        View All Analyses ({submissions.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA Section */}
          {submissions.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-revenue-growth/10 rounded-xl border-2 border-primary/20 text-center">
              <h3 className="text-h2 font-bold text-primary mb-2">
                Ready to Optimize Your Revenue?
              </h3>
              <p className="text-body text-primary/80 mb-4">
                Book a strategic consultation to implement your revenue optimization opportunities
              </p>
              <Button
                onClick={() => window.open('https://cal.com/rev-calculator/revenuecalculator-strategy-session', '_blank')}
                className="bg-gradient-to-r from-primary to-revenue-growth text-white"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Strategy Consultation
              </Button>
            </div>
          )}
        </div>
      </div>
    </LoadingOverlay>
  );
};

export default Dashboard;
