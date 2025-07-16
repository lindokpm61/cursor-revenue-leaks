import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, LogOut, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { submissionService, userProfileService, type Submission, type UserProfile } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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

  const calculateROI = (submission: Submission) => {
    const recoveryPotential = submission.recovery_potential_70 || 0;
    const totalLeakage = submission.total_leak || 0;
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

  // Hero Analysis Section
  const HeroAnalysisSection = ({ latestAnalysis }: { latestAnalysis: Submission }) => {
    const isHighValue = (latestAnalysis.recovery_potential_70 || 0) > 100000000;
    
    return (
      <div 
        className="rounded-2xl p-12 mb-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <h1 className="text-h1 font-bold text-foreground mb-2">
          Your Revenue Recovery Opportunity
        </h1>
        
        <p className="text-h3 text-muted-foreground mb-8">
          Analysis for {latestAnalysis.company_name} • Generated {formatDate(latestAnalysis.created_at || '')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
          <div 
            className="p-6 rounded-xl border"
            style={{
              background: '#fef2f2',
              borderColor: '#fecaca'
            }}
          >
            <div className="text-small font-semibold mb-2" style={{ color: '#991b1b' }}>
              Annual Revenue Leak
            </div>
            <div className="text-h1 font-bold" style={{ color: '#dc2626' }}>
              {formatCurrency(latestAnalysis.total_leak || 0)}
            </div>
          </div>
          
          <div 
            className="p-6 rounded-xl border"
            style={{
              background: '#f0fdf4',
              borderColor: '#bbf7d0'
            }}
          >
            <div className="text-small font-semibold mb-2" style={{ color: '#166534' }}>
              Recovery Potential
            </div>
            <div className="text-h1 font-bold" style={{ color: '#059669' }}>
              {formatCurrency(latestAnalysis.recovery_potential_70 || 0)}
            </div>
          </div>
          
          <div 
            className="p-6 rounded-xl border"
            style={{
              background: '#eff6ff',
              borderColor: '#bfdbfe'
            }}
          >
            <div className="text-small font-semibold mb-2" style={{ color: '#1e40af' }}>
              ROI Potential
            </div>
            <div className="text-h1 font-bold" style={{ color: '#2563eb' }}>
              {calculateROI(latestAnalysis)}%
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center flex-wrap">
          {isHighValue ? (
            <Button 
              size="lg"
              className="text-h3 px-8 py-4"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
              onClick={() => window.open('mailto:support@company.com?subject=Priority Strategy Call Request', '_self')}
            >
              🚀 Book Priority Strategy Call
            </Button>
          ) : (
            <Button 
              size="lg"
              className="text-h3 px-8 py-4"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              }}
              onClick={() => window.open('mailto:support@company.com?subject=Strategy Consultation Request', '_self')}
            >
              📞 Book Strategy Consultation
            </Button>
          )}
          
          <Link to={`/action-plan/${latestAnalysis.id}`}>
            <Button 
              variant="outline" 
              size="lg"
              className="text-h3 px-8 py-4 border-2"
            >
              📋 View Detailed Action Plan
            </Button>
          </Link>
        </div>
        
        {isHighValue && (
          <div 
            className="mt-6 p-4 rounded-lg border"
            style={{
              background: '#fef2f2',
              borderColor: '#fecaca'
            }}
          >
            <p className="text-sm" style={{ color: '#991b1b' }}>
              ⚡ High-impact opportunity: Every month of delay = {formatCurrency((latestAnalysis.total_leak || 0)/12)} in continued losses
            </p>
          </div>
        )}
      </div>
    );
  };

  // Simplified Summary Cards
  const SimplifiedSummaryCards = () => {
    const totalRecoveryPotential = submissions.reduce((sum, analysis) => 
      sum + (analysis.recovery_potential_70 || 0), 0
    );
    
    const averageRecovery = submissions.length > 0 ? totalRecoveryPotential / submissions.length : 0;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="text-small text-muted-foreground mb-2">
              Companies Analyzed
            </div>
            <div className="text-h1 font-bold text-foreground">
              {submissions.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="text-small text-muted-foreground mb-2">
              Total Recovery Potential
            </div>
            <div className="text-h1 font-bold" style={{ color: '#059669' }}>
              {formatCurrency(totalRecoveryPotential)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="text-small text-muted-foreground mb-2">
              Average Opportunity
            </div>
            <div className="text-h1 font-bold text-primary">
              {formatCurrency(averageRecovery)}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Simplified Analysis History
  const SimplifiedAnalysisHistory = ({ previousAnalyses }: { previousAnalyses: Submission[] }) => {
    if (previousAnalyses.length === 0) {
      return (
        <div className="mb-12">
          <h2 className="text-h2 font-semibold mb-4">
            Your Analysis History
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-h3 mb-4">
                This is your first revenue analysis. Ready to analyze another company?
              </p>
              <Link to="/calculator">
                <Button className="bg-primary text-primary-foreground">
                  + New Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-h2 font-semibold">Previous Analyses</h2>
          <Link to="/calculator">
            <Button className="bg-primary text-primary-foreground">
              + New Assessment
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previousAnalyses.map(analysis => (
            <Card key={analysis.id} className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-h3 font-semibold text-foreground">
                    {analysis.company_name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {analysis.industry}
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <div className="text-h2 font-bold mb-1" style={{ color: '#059669' }}>
                    {formatCurrency(analysis.recovery_potential_70 || 0)}
                  </div>
                  <div className="text-small text-muted-foreground">
                    Recovery Potential
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/results/${analysis.id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full text-small">
                      View Results
                    </Button>
                  </Link>
                  {(analysis.recovery_potential_70 || 0) > 50000000 && (
                    <Button 
                      size="sm"
                      style={{ background: '#059669', color: 'white' }}
                      onClick={() => window.open('mailto:support@company.com?subject=Consultation Request', '_self')}
                    >
                      Book Call
                    </Button>
                  )}
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
          ))}
        </div>
      </div>
    );
  };

  // Next Steps Section
  const NextStepsSection = ({ highestValueAnalysis }: { highestValueAnalysis: Submission }) => (
    <div 
      className="rounded-2xl p-12 text-center"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      }}
    >
      <h2 className="text-h1 font-bold text-foreground mb-4">
        Ready to Recover Your Revenue?
      </h2>
      
      <p className="text-h3 text-muted-foreground mb-8 max-w-2xl mx-auto">
        You've identified significant revenue recovery opportunities. 
        Let's turn this analysis into implementation results.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="border-2 border-primary relative">
          <div 
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: '#3b82f6',
              color: 'white'
            }}
          >
            RECOMMENDED
          </div>
          
          <CardContent className="p-8">
            <h3 className="text-h2 font-semibold text-foreground mb-3">
              Strategy Consultation
            </h3>
            
            <p className="text-small text-muted-foreground mb-5 leading-relaxed">
              Get expert guidance to implement your {formatCurrency(highestValueAnalysis.recovery_potential_70 || 0)} 
              recovery opportunity with a personalized strategy session.
            </p>
            
            <Button 
              className="w-full mb-3"
              style={{ background: '#3b82f6', color: 'white' }}
              onClick={() => window.open('mailto:support@company.com?subject=Free Consultation Request', '_self')}
            >
              Book Free Consultation
            </Button>
            
            <div className="text-xs text-muted-foreground">
              Next available: Today or tomorrow
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-8">
            <h3 className="text-h2 font-semibold text-foreground mb-3">
              Implementation Guide
            </h3>
            
            <p className="text-small text-muted-foreground mb-5 leading-relaxed">
              Download our step-by-step implementation guide to start 
              recovering revenue independently with proven strategies.
            </p>
            
            <Button 
              variant="outline" 
              className="w-full mb-3 border-2"
              onClick={() => window.open('/implementation-guide.pdf', '_blank')}
            >
              Download Guide
            </Button>
            
            <div className="text-xs text-muted-foreground">
              Instant access • PDF format
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

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
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/80">
                <Calculator className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-h2 font-bold">Revenue Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-small text-muted-foreground">
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
        {submissions.length === 0 ? (
          <div className="text-center py-16">
            <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-h1 font-bold mb-4">Welcome to Your Revenue Dashboard</h1>
            <p className="text-h3 text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your first revenue leak analysis to discover hidden opportunities 
              and unlock your company's growth potential.
            </p>
            <Link to="/calculator">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 text-h3 px-8 py-4">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Assessment
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Section with Latest Analysis */}
            <HeroAnalysisSection latestAnalysis={latestAnalysis} />
            
            {/* Simplified Summary Cards */}
            <SimplifiedSummaryCards />
            
            {/* Analysis History */}
            <SimplifiedAnalysisHistory previousAnalyses={previousAnalyses} />
            
            {/* Next Steps Section */}
            <NextStepsSection highestValueAnalysis={latestAnalysis} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;