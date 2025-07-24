
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, LogOut, Trash2, TrendingUp, Building2, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { submissionService, userProfileService, type Submission, type UserProfile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeroSection } from "@/components/DashboardHeroSection";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";

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

  // Transform submission to UnifiedResultsService format and calculate values
  const transformSubmissionToUnifiedFormat = (submission: Submission): SubmissionData => {
    console.log('=== DASHBOARD SUBMISSION TRANSFORMATION DEBUG ===');
    console.log('Original submission:', submission);

    const transformed: SubmissionData = {
      id: submission.id,
      company_name: submission.company_name || '',
      contact_email: submission.contact_email || '',
      industry: submission.industry || '',
      current_arr: Number(submission.current_arr || 0),
      monthly_leads: Number(submission.monthly_leads || 0),
      average_deal_value: Number(submission.average_deal_value || 0),
      lead_response_time: Number(submission.lead_response_time || 24),
      monthly_free_signups: Number(submission.monthly_free_signups || 0),
      free_to_paid_conversion: Number(submission.free_to_paid_conversion || 0),
      monthly_mrr: Number(submission.monthly_mrr || 0),
      failed_payment_rate: Number(submission.failed_payment_rate || 0),
      manual_hours: Number(submission.manual_hours || 0),
      hourly_rate: Number(submission.hourly_rate || 0),
      lead_score: Number(submission.lead_score || 0),
      user_id: submission.user_id,
      created_at: submission.created_at || new Date().toISOString()
    };

    console.log('Transformed submission for UnifiedResultsService:', transformed);
    return transformed;
  };

  const getCalculatedValues = (submission: Submission) => {
    const submissionData = transformSubmissionToUnifiedFormat(submission);
    const results = UnifiedResultsService.calculateResults(submissionData);
    console.log('=== DASHBOARD CALCULATED VALUES DEBUG ===');
    console.log('UnifiedResultsService results for submission', submission.id, ':', results);
    return results;
  };

  const calculateROI = (submission: Submission) => {
    const calculations = getCalculatedValues(submission);
    const recoveryPotential = calculations.conservativeRecovery;
    const totalLeakage = calculations.totalLoss;
    return totalLeakage > 0 ? Math.round((recoveryPotential / totalLeakage) * 100) : 0;
  };

  const handleDeleteSubmission = async (submissionId: string, companyName: string) => {
    console.log('Delete button clicked for:', submissionId, companyName);
    
    if (!confirm(`Are you sure you want to delete the strategic analysis for ${companyName}? This action cannot be undone.`)) {
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
          description: "Failed to delete strategic analysis",
          variant: "destructive",
        });
        return;
      }

      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({
        title: "Success",
        description: "Strategic analysis deleted successfully",
      });
      console.log('Delete successful, UI updated');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete strategic analysis",
        variant: "destructive",
      });
    }
  };

  const calculateDaysSinceAnalysis = (dateString: string) => {
    const analysisDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - analysisDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Summary Cards - Updated to use UnifiedResultsService
  const SummaryCards = () => {
    if (submissions.length === 0) return null;
    
    const totalOpportunityValue = submissions.reduce((sum, analysis) => {
      const calculations = getCalculatedValues(analysis);
      return sum + calculations.conservativeRecovery;
    }, 0);
    
    const totalGrowthPotential = submissions.reduce((sum, analysis) => {
      const calculations = getCalculatedValues(analysis);
      return sum + calculations.totalLoss;
    }, 0);
    
    const totalMonthlyGrowth = totalGrowthPotential / 12;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-background to-primary/5">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-small text-primary/80 mb-2">
              Strategic Analyses
            </div>
            <div className="text-h1 text-primary">
              {submissions.length}
            </div>
            <div className="text-xs text-primary/60 mt-1">
              Revenue optimization assessments
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/10 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-small text-primary/80 mb-2">
              Total Growth Potential
            </div>
            <div className="text-h1 text-primary">
              {formatCurrency(totalGrowthPotential)}
            </div>
            <div className="text-xs text-primary/60 mt-1">
              Annual opportunity across all companies
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-gradient-to-br from-background to-green-50 dark:border-green-800/30 dark:to-green-950/20 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-small text-green-700 dark:text-green-300 mb-2">
              Strategic Recovery Potential
            </div>
            <div className="text-h1 text-green-600 dark:text-green-400">
              {formatCurrency(totalOpportunityValue)}
            </div>
            <div className="text-xs text-green-600/80 mt-1">
              Conservative implementation estimate
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Strategic History - Updated to use UnifiedResultsService
  const StrategicHistory = ({ strategicAnalyses }: { strategicAnalyses: Submission[] }) => {
    if (strategicAnalyses.length === 0) return null;
    
    return (
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-h2 text-primary">Strategic Analysis History</h2>
            <p className="text-small text-primary/80 mt-1">
              Historical revenue optimization assessments and growth opportunities
            </p>
          </div>
          <Link to="/calculator" state={{ fromDashboard: true }}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Strategic Analysis
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {strategicAnalyses.map(analysis => {
            const calculations = getCalculatedValues(analysis);
            const daysSinceAnalysis = calculateDaysSinceAnalysis(analysis.created_at || '');
            const monthlyGrowth = calculations.totalLoss / 12;
            const isHighOpportunity = calculations.conservativeRecovery > 5000000;
            
            return (
              <Card key={analysis.id} className="border-primary/20 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-h3 text-primary mb-1 truncate">
                        {analysis.company_name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-primary/20">
                          {analysis.industry}
                        </Badge>
                        {isHighOpportunity && (
                          <Badge variant="default" className="text-xs bg-primary">
                            High Opportunity
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-primary/80">
                        <Clock className="h-3 w-3" />
                        <span>Day {daysSinceAnalysis} since analysis</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 space-y-2">
                    <div className="text-h2 text-primary">
                      {formatCurrency(calculations.conservativeRecovery)}
                    </div>
                    <div className="text-small text-primary/80">
                      Strategic recovery potential
                    </div>
                    <div className="text-xs text-primary/60">
                      Growth opportunity: {formatCurrency(monthlyGrowth)}/month
                    </div>
                    <div className="text-xs text-primary/60">
                      Analysis completed {formatDate(analysis.created_at || '')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={`/results/${analysis.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        View Analysis
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteSubmission(analysis.id, analysis.company_name)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
          <p className="text-body text-primary">Loading strategic optimization hub...</p>
        </div>
      </div>
    );
  }

  const latestAnalysis = submissions[0];
  const strategicHistory = submissions.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Strategic Hub Navigation */}
      <nav className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/80">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-h3 text-primary">Strategic Revenue Hub</span>
                <p className="text-xs text-primary/80 hidden sm:block">
                  Revenue Optimization & Growth Analysis Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-small text-primary/80 hidden sm:block">
                Strategy Partner: {user?.email}
              </span>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary hover:bg-primary/10">
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
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-h1 text-primary mb-4">Strategic Revenue Optimization Hub</h1>
            <p className="text-body text-primary/80 mb-8 max-w-2xl mx-auto">
              Identify and capture revenue growth opportunities across your business operations. 
              Start your strategic analysis to discover optimization potential.
            </p>
            <Link to="/calculator" state={{ fromDashboard: true }}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 px-8 py-4 text-primary-foreground hover:from-primary/90 hover:to-primary/70">
                <Plus className="h-5 w-5 mr-2" />
                Start Strategic Analysis
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Latest Analysis Hero Section */}
            <DashboardHeroSection 
              latestAnalysis={latestAnalysis} 
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              calculateROI={calculateROI}
            />
            
            {/* Strategic Portfolio Summary */}
            <SummaryCards />
            
            {/* Strategic Analysis History */}
            <StrategicHistory strategicAnalyses={strategicHistory} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
