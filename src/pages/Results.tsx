import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DollarSign,
  Calendar
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { IndustryBenchmarking } from "@/components/calculator/results/IndustryBenchmarking";
import { HeroRevenueChart } from "@/components/results/HeroRevenueChart";
import { LeakagePieChart } from "@/components/results/LeakagePieChart";
import { RecoveryComparisonChart } from "@/components/results/RecoveryComparisonChart";
import { StrategicCTASection } from "@/components/results/StrategicCTASection";
import { SectionCTA } from "@/components/results/SectionCTAs";
import { FloatingCTABar } from "@/components/results/FloatingCTABar";
import { EnhancedExportCTA } from "@/components/results/EnhancedExportCTA";
import { validateCalculationResults } from "@/lib/calculator/validationHelpers";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";

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

  // Derive confidence factors from submission data
  const confidenceFactors: ConfidenceFactors = {
    companySize: submission.current_arr && submission.current_arr > 10000000 ? 'enterprise' :
                 submission.current_arr && submission.current_arr > 1000000 ? 'scaleup' : 'startup',
    currentMaturity: submission.lead_score && submission.lead_score > 75 ? 'advanced' :
                     submission.lead_score && submission.lead_score > 45 ? 'intermediate' : 'basic',
    changeManagementCapability: submission.current_arr && submission.current_arr > 5000000 ? 'high' : 'medium',
    resourceAvailable: true
  };

  const leakageBreakdown = [
    {
      category: "leadResponseLoss",
      title: "Lead Response Loss",
      amount: submission.lead_response_loss || 0,
      percentage: totalLeak > 0 ? ((submission.lead_response_loss || 0) / totalLeak) * 100 : 0,
      icon: Users,
      description: "Lost revenue from slow lead response times",
      color: "text-revenue-warning"
    },
    {
      category: "failedPaymentLoss",
      title: "Failed Payment Loss", 
      amount: submission.failed_payment_loss || 0,
      percentage: totalLeak > 0 ? ((submission.failed_payment_loss || 0) / totalLeak) * 100 : 0,
      icon: CreditCard,
      description: "Revenue lost due to payment failures",
      color: "text-revenue-danger"
    },
    {
      category: "selfServeGap",
      title: "Self-Serve Gap",
      amount: submission.selfserve_gap_loss || 0,
      percentage: totalLeak > 0 ? ((submission.selfserve_gap_loss || 0) / totalLeak) * 100 : 0,
      icon: Target,
      description: "Missed opportunities in self-service conversion",
      color: "text-revenue-primary"
    },
    {
      category: "processInefficiency",
      title: "Process Inefficiency",
      amount: submission.process_inefficiency_loss || 0,
      percentage: totalLeak > 0 ? ((submission.process_inefficiency_loss || 0) / totalLeak) * 100 : 0,
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
            <EnhancedExportCTA />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Two Card Layout */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main Hero Card */}
            <Card className="lg:col-span-3 bg-gradient-to-r from-primary/5 to-revenue-primary/5 border-primary/20">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                      Revenue Recovery Opportunity
                    </h2>
                    <div className="text-2xl md:text-3xl lg:text-4xl text-revenue-warning font-bold flex items-center gap-3 mb-3">
                      <ArrowUp className="h-8 w-8" />
                      {formatCurrency(totalLeak)}
                    </div>
                    <p className="text-lg text-muted-foreground">
                      Annual revenue opportunity identified
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-background/50 border">
                      <div className="text-xl md:text-2xl text-revenue-success font-bold mb-1">
                        {formatCurrency(recovery70)}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Conservative Recovery (40-60%)
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-1">
                        Based on category-specific potential
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background/50 border">
                      <div className="text-xl md:text-2xl text-revenue-primary font-bold mb-1">
                        {formatCurrency(recovery85)}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Optimistic Recovery (55-75%)
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-1">
                        With optimal execution and resources
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button onClick={handleGetActionPlan} className="flex-1">
                      <Target className="h-4 w-4 mr-2" />
                      Get Action Plan
                    </Button>
                    <Button variant="outline" onClick={handleQuickWins} className="flex-1">
                      <Zap className="h-4 w-4 mr-2" />
                      Quick Wins
                    </Button>
                    <Button variant="gradient" className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Expert Call
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart Card */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                <CardDescription className="text-sm">
                  Current revenue composition and recovery potential
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <HeroRevenueChart
                  secureRevenue={submission.current_arr ? submission.current_arr - totalLeak : 0}
                  revenueAtRisk={totalLeak}
                  recoveryPotential={recovery70}
                  formatCurrency={formatCurrency}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Strategic CTA Section */}
        <div className="mb-8">
          <StrategicCTASection 
            totalLeak={totalLeak}
            recovery70={recovery70}
            leadScore={leadScore}
            formatCurrency={formatCurrency}
          />
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
                  Strategic Performance Overview
                </CardTitle>
                <CardDescription>
                  Your competitive position and strategic advantage opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Performance Zone Indicator */}
                  <div className="bg-gradient-to-r from-revenue-danger/10 via-revenue-warning/10 to-revenue-success/10 p-6 rounded-xl border">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold mb-2">Performance Zone Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Position relative to industry averages and best-in-class targets
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-revenue-danger/10 rounded-lg border border-revenue-danger/20">
                        <div className="text-xl font-bold text-revenue-danger mb-1">
                          {formatCurrency(totalLeak)}
                        </div>
                        <div className="text-sm font-medium text-revenue-danger">
                          Below Industry Average
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Current revenue at risk
                        </div>
                      </div>
                      <div className="text-center p-4 bg-revenue-warning/10 rounded-lg border border-revenue-warning/20">
                        <div className="text-xl font-bold text-revenue-warning mb-1">
                          {formatCurrency(recovery70)}
                        </div>
                        <div className="text-sm font-medium text-revenue-warning">
                          Industry Average Target
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Conservative recovery to industry norms
                        </div>
                      </div>
                      <div className="text-center p-4 bg-revenue-success/10 rounded-lg border border-revenue-success/20">
                        <div className="text-xl font-bold text-revenue-success mb-1">
                          {formatCurrency(recovery85)}
                        </div>
                        <div className="text-sm font-medium text-revenue-success">
                          Best-in-Class Opportunity
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Strategic advantage through superior performance
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Competitive Positioning Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-foreground mb-2">
                        {formatCurrency(submission.current_arr || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Current ARR</div>
                      <div className="text-xs text-revenue-warning mt-1">
                        {((totalLeak / (submission.current_arr || 1)) * 100).toFixed(1)}% at risk
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-revenue-primary mb-2">
                        {Math.round((recovery85 / Math.max(totalLeak, 1)) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Strategic Advantage Potential</div>
                      <div className="text-xs text-revenue-success mt-1">
                        Best-in-class recovery rate
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-revenue-success mb-2">
                        {submission.monthly_leads || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Monthly Leads</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Lead response optimization target: 1.5h
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-primary mb-2">
                        {formatCurrency(submission.average_deal_value || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Deal Value</div>
                      <div className="text-xs text-revenue-primary mt-1">
                        Conversion rate upside: +50-100%
                      </div>
                    </div>
                  </div>

                  {/* Strategic Urgency Alert */}
                  <div className="bg-gradient-to-r from-revenue-primary/10 to-revenue-success/10 p-6 rounded-xl border border-revenue-primary/20">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-revenue-primary text-primary-foreground">
                        <Target className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-revenue-primary mb-2">
                          Strategic Competitive Opportunity
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Your analysis shows significant potential to not just reach industry averages, but to establish 
                          market-leading performance that creates sustainable competitive advantage.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-foreground">Time to Competitive Advantage:</div>
                            <div className="text-revenue-primary">6-12 months with aggressive execution</div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">Market Position Opportunity:</div>
                            <div className="text-revenue-primary">Top 15% performance tier achievable</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'breakdown' && (
          <div className="space-y-8">
            {/* Key Metrics Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-revenue-warning mb-2">
                    {formatCurrency(totalLeak)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Revenue at Risk</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-revenue-success mb-2">
                    {formatCurrency(recovery70)}
                  </div>
                  <p className="text-sm text-muted-foreground">Conservative Recovery</p>
                  <p className="text-xs text-muted-foreground/70">Category-specific rates applied</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-revenue-primary mb-2">
                    {formatCurrency(recovery85)}
                  </div>
                  <p className="text-sm text-muted-foreground">Optimistic Recovery</p>
                  <p className="text-xs text-muted-foreground/70">With strong execution capability</p>
                </CardContent>
              </Card>
            </div>

            {/* Section CTA */}
            <SectionCTA type="breakdown" totalLeak={totalLeak} formatCurrency={formatCurrency} />

            {/* Charts Layout - Equal Height */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Leakage Breakdown Chart */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Leakage by Category</CardTitle>
                  <CardDescription className="text-sm">
                    Breakdown of revenue losses across different operational areas
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center">
                  {(() => {
                    const chartData = leakageBreakdown
                      .filter(item => item.amount > 0)
                      .map(item => ({
                        category: item.title,
                        amount: item.amount,
                        percentage: item.percentage
                      }));
                    
                    return chartData.length > 0 ? (
                      <LeakagePieChart 
                        leakageData={chartData}
                        formatCurrency={formatCurrency}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No revenue leakage data available for this analysis.
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Recovery Comparison Chart */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Recovery Potential Comparison</CardTitle>
                  <CardDescription className="text-sm">
                    Compare current losses with different recovery scenarios
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex flex-col justify-center">
                  <RecoveryComparisonChart
                    leakageData={leakageBreakdown}
                    formatCurrency={formatCurrency}
                    confidenceFactors={confidenceFactors}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Detailed Revenue Leakage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {leakageBreakdown.map((item, index) => {
                    const Icon = item.icon;
                    
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
                          <div className="text-small text-muted-foreground">{item.percentage.toFixed(1)}% of total</div>
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
          <div className="space-y-8">
            <IndustryBenchmarking 
              submission={submission}
              formatCurrency={formatCurrency}
            />
            <SectionCTA type="benchmarking" totalLeak={totalLeak} formatCurrency={formatCurrency} />
          </div>
        )}

        {activeSection === 'actions' && (
          <div className="space-y-8" id="actions-section">
            <PriorityActions 
              submission={submission}
              formatCurrency={formatCurrency}
            />
            <SectionCTA type="actions" totalLeak={totalLeak} formatCurrency={formatCurrency} />
          </div>
        )}

        {activeSection === 'timeline' && (
          <div className="space-y-8">
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
            <SectionCTA type="timeline" totalLeak={totalLeak} formatCurrency={formatCurrency} />
          </div>
        )}
      </div>

      {/* Floating CTA Bar */}
      <FloatingCTABar totalLeak={totalLeak} formatCurrency={formatCurrency} />
    </div>
  );
};

export default Results;