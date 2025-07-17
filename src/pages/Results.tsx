import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  ArrowLeft, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  Download,
  Share2,
  ArrowUp,
  CheckCircle,
  Zap,
  DollarSign
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { IndustryBenchmarking } from "@/components/calculator/results/IndustryBenchmarking";
import { validateCalculationResults } from "@/lib/calculator/validationHelpers";
import { useIsMobile } from "@/hooks/use-mobile";

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadSubmission(id);
    }
  }, [id]);

  const loadSubmission = async (submissionId: string) => {
    try {
      if (!submissionId || submissionId === ':id' || submissionId.includes(':')) {
        throw new Error('Invalid submission ID format');
      }
      
      const { data, error } = await submissionService.getById(submissionId);
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Submission not found');
      }

      if (data.user_id !== user?.id && user?.user_metadata?.role !== 'admin') {
        throw new Error(`Access denied. Submission belongs to user ${data.user_id}, current user is ${user?.id}`);
      }

      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleGetActionPlan = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your action plan.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/action-plan/${submission?.id}`);
  };

  const handleQuickWins = () => {
    setActiveSection('actions');
    // Scroll to actions section
    const element = document.getElementById('actions-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-body text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <AlertTriangle className="h-12 w-12 text-revenue-warning mx-auto mb-4" />
            <h2 className="text-h1 mb-2">Results Not Found</h2>
            <p className="text-body text-muted-foreground mb-6">
              The requested results could not be found or you don't have access to them.
            </p>
            <Link to="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate key metrics
  const totalLeak = submission.total_leak || 0;
  const recovery70 = submission.recovery_potential_70 || 0;
  const recovery85 = submission.recovery_potential_85 || 0;
  const leadScore = submission.lead_score || 0;

  const leakageBreakdown = [
    {
      title: "Lead Response Loss",
      amount: submission.lead_response_loss || 0,
      icon: Users,
      description: "Lost revenue from slow lead response times",
      color: "text-revenue-warning"
    },
    {
      title: "Failed Payment Loss", 
      amount: submission.failed_payment_loss || 0,
      icon: CreditCard,
      description: "Revenue lost due to payment failures",
      color: "text-revenue-danger"
    },
    {
      title: "Self-Serve Gap",
      amount: submission.selfserve_gap_loss || 0,
      icon: Target,
      description: "Missed opportunities in self-service conversion",
      color: "text-revenue-primary"
    },
    {
      title: "Process Inefficiency",
      amount: submission.process_inefficiency_loss || 0,
      icon: Settings,
      description: "Losses from manual processes and inefficiencies",
      color: "text-muted-foreground"
    }
  ];

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'breakdown', label: 'Revenue Breakdown', icon: DollarSign },
    { id: 'benchmarking', label: 'Industry Benchmarks', icon: TrendingUp },
    { id: 'actions', label: 'Action Plan', icon: Target },
    { id: 'timeline', label: 'Implementation', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-semibold">{submission.company_name}</h1>
                  <p className="text-sm md:text-base text-muted-foreground">Revenue Analysis Results</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-primary/5 to-revenue-primary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">Revenue Recovery Opportunity</h2>
                  <div className="text-2xl md:text-3xl lg:text-4xl text-revenue-warning font-bold flex items-center justify-center gap-3">
                    <ArrowUp className="h-8 w-8" />
                    {formatCurrency(totalLeak)}
                  </div>
                  <p className="text-lg md:text-xl text-muted-foreground mt-2">
                    Annual revenue opportunity identified
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="p-6 rounded-xl bg-background/50 border">
                    <div className="text-2xl md:text-3xl lg:text-4xl text-revenue-success font-bold mb-2">
                       {formatCurrency(recovery70)}
                     </div>
                     <div className="text-sm font-semibold text-muted-foreground">
                       Conservative Recovery (70%)
                     </div>
                  </div>
                  <div className="p-6 rounded-xl bg-background/50 border">
                    <div className="text-2xl md:text-3xl lg:text-4xl text-revenue-primary font-bold mb-2">
                       {formatCurrency(recovery85)}
                     </div>
                     <div className="text-sm font-semibold text-muted-foreground">
                       Optimistic Recovery (85%)
                     </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button size="lg" className="mr-4" onClick={handleGetActionPlan}>
                    <Target className="h-5 w-5 mr-2" />
                    Get Action Plan
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleQuickWins}>
                    <Zap className="h-5 w-5 mr-2" />
                    Quick Wins
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analysis Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4">
                     <div className="text-xl md:text-2xl font-bold text-foreground mb-2">
                       {formatCurrency(submission.current_arr || 0)}
                     </div>
                     <div className="text-sm text-muted-foreground">Current ARR</div>
                  </div>
                  <div className="text-center p-4">
                     <div className="text-xl md:text-2xl font-bold text-revenue-warning mb-2">
                       {((totalLeak / (submission.current_arr || 1)) * 100).toFixed(1)}%
                     </div>
                     <div className="text-sm text-muted-foreground">Revenue at Risk</div>
                  </div>
                  <div className="text-center p-4">
                     <div className="text-xl md:text-2xl font-bold text-revenue-success mb-2">
                       {submission.monthly_leads || 0}
                     </div>
                     <div className="text-sm text-muted-foreground">Monthly Leads</div>
                  </div>
                  <div className="text-center p-4">
                     <div className="text-xl md:text-2xl font-bold text-primary mb-2">
                       {leadScore}/100
                     </div>
                     <div className="text-sm text-muted-foreground">Lead Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'breakdown' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Leakage Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {leakageBreakdown.map((item, index) => {
                    const Icon = item.icon;
                    const percentage = totalLeak > 0 ? (item.amount / totalLeak) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-muted">
                            <Icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          <div>
                            <h3 className="text-h3 font-semibold">{item.title}</h3>
                            <p className="text-body text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-h3 font-bold">{formatCurrency(item.amount)}</div>
                          <div className="text-small text-muted-foreground">{percentage.toFixed(1)}% of total</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'benchmarking' && (
          <IndustryBenchmarking 
            submission={submission} 
            formatCurrency={formatCurrency}
          />
        )}

        {activeSection === 'actions' && (
          <div id="actions-section">
            <PriorityActions 
              submission={submission} 
              formatCurrency={formatCurrency}
            />
          </div>
        )}

        {activeSection === 'timeline' && (
          <ImplementationTimeline 
            submission={submission} 
            formatCurrency={formatCurrency}
            validatedValues={{
              totalLeak,
              leadResponseLoss: submission.lead_response_loss || 0,
              selfServeLoss: submission.selfserve_gap_loss || 0,
              recoveryPotential70: recovery70,
              recoveryPotential85: recovery85
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Results;