import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, LogOut, Trash2, TrendingUp, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { submissionService, userProfileService, type Submission, type UserProfile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeroSection } from "@/components/DashboardHeroSection";
import { calculateUnifiedResults, type UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";

const Dashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        submissionService.getByUserId(user.id, 10),
        userProfileService.getByUserId(user.id)
      ]);
      
      if (submissionsResponse.data) {
        // Sort by most recent first
        const sortedSubmissions = submissionsResponse.data.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        setSubmissions(sortedSubmissions);
      }

      // Set user profile if found, ensuring all UTM fields are present
      if (profileResponse.data) {
        const profile = profileResponse.data as any;
        setUserProfile({
          ...profile,
          utm_source: profile.utm_source || '',
          utm_medium: profile.utm_medium || '',
          utm_campaign: profile.utm_campaign || ''
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Transform submission to unified calculation format and calculate values
  const getCalculatedValues = (submission: Submission) => {
    const calculationInputs: UnifiedCalculationInputs = {
      currentARR: Number(submission.current_arr || 0),
      monthlyMRR: Number(submission.monthly_mrr || 0),
      monthlyLeads: Number(submission.monthly_leads || 0),
      averageDealValue: Number(submission.average_deal_value || 0),
      leadResponseTime: Number(submission.lead_response_time || 24),
      monthlyFreeSignups: Number(submission.monthly_free_signups || 0),
      freeToLaidConversion: Number(submission.free_to_paid_conversion || 0),
      failedPaymentRate: Number(submission.failed_payment_rate || 0),
      manualHours: Number(submission.manual_hours || 0),
      hourlyRate: Number(submission.hourly_rate || 0),
      industry: submission.industry || ''
    };

    return calculateUnifiedResults(calculationInputs);
  };

  const calculateROI = (submission: Submission) => {
    const calculations = getCalculatedValues(submission);
    const recoveryPotential = calculations.recovery70Percent;
    const totalLeakage = calculations.totalLoss;
    return totalLeakage > 0 ? Math.round((recoveryPotential / totalLeakage) * 100) : 0;
  };

  const handleDeleteSubmission = async (submissionId: string, companyName: string) => {
    console.log('Delete button clicked for:', submissionId, companyName);
    
    if (!confirm(`Are you sure you want to delete the assessment for ${companyName}? This action cannot be undone.`)) {
      console.log('Delete cancelled by user');
      return;
    }

    console.log('Starting delete process for submission:', submissionId);
    
    try {
      const { error } = await submissionService.delete(submissionId);
      console.log('Delete response:', { error });
      
      if (error) {
        console.error('Delete failed with error:', error);
        toast({
          title: "Error",
          description: "Failed to delete assessment",
          variant: "destructive",
        });
        return;
      }

      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({
        title: "Success",
        description: "Assessment deleted successfully",
      });
      console.log('Delete successful, UI updated');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive",
      });
    }
  };

  // Summary Cards - Updated to be more contextual
  const SummaryCards = () => {
    if (submissions.length === 0) return null;
    
    const totalRecoveryPotential = submissions.reduce((sum, analysis) => {
      const calculations = getCalculatedValues(analysis);
      return sum + calculations.recovery70Percent;
    }, 0);
    
    const totalAnnualLeak = submissions.reduce((sum, analysis) => {
      const calculations = getCalculatedValues(analysis);
      return sum + calculations.totalLoss;
    }, 0);
    
    const averageRecovery = submissions.length > 0 ? totalRecoveryPotential / submissions.length : 0;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-sm text-muted-foreground mb-2">
              Companies Analyzed
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {submissions.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Revenue assessments completed
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/20 bg-gradient-to-br from-background to-destructive/5 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-sm text-destructive/80 mb-2">
              Total Annual Revenue at Risk
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-destructive">
              {formatCurrency(totalAnnualLeak)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across all analyzed companies
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-gradient-to-br from-background to-green-50 dark:border-green-800/30 dark:to-green-950/20 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-sm text-green-700 dark:text-green-300 mb-2">
              Total Recovery Potential
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalRecoveryPotential)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Recoverable with 70% confidence
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Analysis History - Simplified and more focused
  const AnalysisHistory = ({ previousAnalyses }: { previousAnalyses: Submission[] }) => {
    if (previousAnalyses.length === 0) return null;
    
    return (
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Previous Analyses</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your historical revenue assessments and their current status
            </p>
          </div>
          <Link to="/calculator">
            <Button className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {previousAnalyses.map(analysis => {
            const calculations = getCalculatedValues(analysis);
            const isHighValue = calculations.recovery70Percent > 50000000;
            
            return (
              <Card key={analysis.id} className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {analysis.company_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {analysis.industry}
                        </Badge>
                        {isHighValue && (
                          <Badge variant="default" className="text-xs bg-green-500">
                            High Impact
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 space-y-2">
                    <div className="text-xl sm:text-2xl font-bold mb-1 text-green-600 dark:text-green-400">
                      {formatCurrency(calculations.recovery70Percent)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Recovery potential identified
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Analyzed {formatDate(analysis.created_at || '')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={`/results/${analysis.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        View Results
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteSubmission(analysis.id, analysis.company_name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
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

  const latestAnalysis = submissions[0];
  const previousAnalyses = submissions.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/80">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold">Revenue Dashboard</span>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Strategic Revenue Analysis Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
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
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {submissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Calculator className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Welcome to Your Revenue Dashboard</h1>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your first revenue leak analysis to discover hidden opportunities 
              and unlock your company's growth potential.
            </p>
            <Link to="/calculator">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 px-8 py-4">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Assessment
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Strategic Hero Section with Latest Analysis */}
            <DashboardHeroSection 
              latestAnalysis={latestAnalysis} 
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              calculateROI={calculateROI}
            />
            
            {/* Portfolio Summary Cards */}
            <SummaryCards />
            
            {/* Analysis History */}
            <AnalysisHistory previousAnalyses={previousAnalyses} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
