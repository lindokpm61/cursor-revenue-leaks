
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, LogOut, Trash2, AlertTriangle, Building2, Clock } from "lucide-react";
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
      freeToPaidConversion: Number(submission.free_to_paid_conversion || 0),
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
    
    if (!confirm(`Are you sure you want to delete the crisis assessment for ${companyName}? This action cannot be undone.`)) {
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
          description: "Failed to delete crisis assessment",
          variant: "destructive",
        });
        return;
      }

      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast({
        title: "Success",
        description: "Crisis assessment deleted successfully",
      });
      console.log('Delete successful, UI updated');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete crisis assessment",
        variant: "destructive",
      });
    }
  };

  const calculateDaysSinceCrisis = (dateString: string) => {
    const crisisDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - crisisDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Summary Cards - Updated to crisis language
  const SummaryCards = () => {
    if (submissions.length === 0) return null;
    
    const totalCrisisValue = submissions.reduce((sum, analysis) => {
      const calculations = getCalculatedValues(analysis);
      return sum + calculations.recovery70Percent;
    }, 0);
    
    const totalAnnualBleeding = submissions.reduce((sum, analysis) => {
      const calculations = getCalculatedValues(analysis);
      return sum + calculations.totalLoss;
    }, 0);
    
    const totalDailyLoss = totalAnnualBleeding / 365;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <Card className="border-destructive/20 shadow-sm bg-gradient-to-br from-background to-destructive/5">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-small text-destructive/80 mb-2">
              Companies in Crisis
            </div>
            <div className="text-h1 text-destructive">
              {submissions.length}
            </div>
            <div className="text-xs text-destructive/60 mt-1">
              Crisis assessments completed
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/30 bg-gradient-to-br from-background to-destructive/10 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-small text-destructive/80 mb-2">
              Total Revenue Hemorrhaging
            </div>
            <div className="text-h1 text-destructive">
              {formatCurrency(totalAnnualBleeding)}
            </div>
            <div className="text-xs text-destructive/60 mt-1">
              Annual bleeding across all companies
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-200 bg-gradient-to-br from-background to-amber-50 dark:border-amber-800/30 dark:to-amber-950/20 shadow-sm">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="text-small text-amber-700 dark:text-amber-300 mb-2">
              Emergency Recovery Potential
            </div>
            <div className="text-h1 text-amber-600 dark:text-amber-400">
              {formatCurrency(totalCrisisValue)}
            </div>
            <div className="text-xs text-amber-600/80 mt-1">
              IF immediate action is taken
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Crisis History - Updated terminology and crisis indicators
  const CrisisHistory = ({ crisisLog }: { crisisLog: Submission[] }) => {
    if (crisisLog.length === 0) return null;
    
    return (
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-h2 text-destructive">Crisis History Log</h2>
            <p className="text-small text-destructive/80 mt-1">
              Historical revenue crisis assessments and emergency response status
            </p>
          </div>
          <Link to="/calculator" state={{ fromDashboard: true }}>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Plus className="h-4 w-4 mr-2" />
              New Crisis Assessment
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {crisisLog.map(analysis => {
            const calculations = getCalculatedValues(analysis);
            const daysSinceCrisis = calculateDaysSinceCrisis(analysis.created_at || '');
            const dailyLoss = calculations.totalLoss / 365;
            const isHighCrisis = calculations.recovery70Percent > 50000000;
            
            return (
              <Card key={analysis.id} className="border-destructive/20 shadow-sm hover:shadow-md hover:border-destructive/30 transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-h3 text-destructive mb-1 truncate">
                        {analysis.company_name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs border-destructive/20">
                          {analysis.industry}
                        </Badge>
                        {isHighCrisis && (
                          <Badge variant="destructive" className="text-xs">
                            Critical Crisis
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-destructive/80">
                        <Clock className="h-3 w-3" />
                        <span>Day {daysSinceCrisis} since crisis detected</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 space-y-2">
                    <div className="text-h2 text-destructive">
                      {formatCurrency(calculations.recovery70Percent)}
                    </div>
                    <div className="text-small text-destructive/80">
                      Emergency recovery potential
                    </div>
                    <div className="text-xs text-destructive/60">
                      Bleeding: {formatCurrency(dailyLoss)}/day
                    </div>
                    <div className="text-xs text-destructive/60">
                      Crisis detected {formatDate(analysis.created_at || '')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={`/results/${analysis.id}`} className="flex-1">
                      <Button variant="destructive" size="sm" className="w-full">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        View Crisis
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
          <Calculator className="h-12 w-12 animate-spin text-destructive mx-auto mb-4" />
          <p className="text-body text-destructive">Loading crisis control center...</p>
        </div>
      </div>
    );
  }

  const latestCrisis = submissions[0];
  const crisisLog = submissions.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Crisis Control Center Navigation */}
      <nav className="border-b border-destructive/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-destructive to-destructive/80">
                <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
              </div>
              <div>
                <span className="text-h3 text-destructive">Crisis Control Center</span>
                <p className="text-xs text-destructive/80 hidden sm:block">
                  Revenue Emergency Management Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-small text-destructive/80 hidden sm:block">
                Emergency Officer: {user?.email}
              </span>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="border-destructive/20 text-destructive hover:bg-destructive/10">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
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
            <div className="p-4 rounded-full bg-destructive/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-h1 text-destructive mb-4">Revenue Crisis Control Center</h1>
            <p className="text-body text-destructive/80 mb-8 max-w-2xl mx-auto">
              Detect and respond to revenue hemorrhaging across your business operations. 
              Start your first crisis assessment to identify critical bleeding points.
            </p>
            <Link to="/calculator" state={{ fromDashboard: true }}>
              <Button size="lg" className="bg-gradient-to-r from-destructive to-destructive/80 px-8 py-4 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/70">
                <Plus className="h-5 w-5 mr-2" />
                Start Crisis Assessment
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Latest Crisis Hero Section */}
            <DashboardHeroSection 
              latestAnalysis={latestCrisis} 
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              calculateROI={calculateROI}
            />
            
            {/* Crisis Portfolio Summary */}
            <SummaryCards />
            
            {/* Crisis History Log */}
            <CrisisHistory crisisLog={crisisLog} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
