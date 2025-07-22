import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Target,
  TrendingDown,
  Activity,
  Calendar,
  FileText,
  ArrowDown,
  Users,
  CreditCard,
  Settings,
  DollarSign,
  Clock,
  Zap
} from "lucide-react";

import { submissionService, type Submission } from "@/lib/supabase";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Import unified components
import { UnifiedHeader } from "@/components/navigation/UnifiedHeader";
import { UnifiedCTA } from "@/components/ui/unified-cta";
import { ContentSection } from "@/components/ui/content-section";

// Import existing specialized components
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { IndustryBenchmarking } from "@/components/calculator/results/IndustryBenchmarking";
import { DetailedBreakdown } from "@/components/calculator/results/DetailedBreakdown";
import { RevenueCharts } from "@/components/calculator/results/RevenueCharts";
import { HeroRevenueChart } from "@/components/results/HeroRevenueChart";
import { SaveSummaryButton } from "@/components/results/SaveSummaryButton";
import { ExecutiveFirstSummary } from "@/components/results/ExecutiveFirstSummary";
import { UnifiedStrategicAnalysis } from "@/components/results/UnifiedStrategicAnalysis";

import { useIsMobile } from "@/hooks/use-mobile";
import { type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";
import { type CalculatorData, type Calculations } from "@/components/calculator/useCalculatorData";

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("strategic");
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const calculatorData: CalculatorData = useMemo(() => {
    if (!submission) return {} as CalculatorData;
    
    return {
      companyInfo: {
        companyName: submission.company_name,
        email: submission.contact_email,
        phone: submission.phone || '',
        industry: submission.industry || 'Software & Technology',
        currentARR: submission.current_arr || 0
      },
      leadGeneration: {
        monthlyLeads: submission.monthly_leads || 0,
        averageDealValue: submission.average_deal_value || 0,
        leadResponseTimeHours: submission.lead_response_time || 24
      },
      selfServeMetrics: {
        monthlyFreeSignups: submission.monthly_free_signups || 0,
        freeToPaidConversionRate: submission.free_to_paid_conversion || 0,
        monthlyMRR: submission.monthly_mrr || 0
      },
      operationsData: {
        failedPaymentRate: submission.failed_payment_rate || 0,
        manualHoursPerWeek: submission.manual_hours || 0,
        hourlyRate: submission.hourly_rate || 0
      }
    };
  }, [submission]);

  const submissionData: SubmissionData = useMemo(() => {
    if (!submission) return {} as SubmissionData;
    
    return {
      id: submission.id,
      company_name: submission.company_name,
      contact_email: submission.contact_email,
      industry: submission.industry,
      current_arr: submission.current_arr || 0,
      monthly_leads: submission.monthly_leads || 0,
      average_deal_value: submission.average_deal_value || 0,
      lead_response_time: submission.lead_response_time || 24,
      monthly_free_signups: submission.monthly_free_signups || 0,
      free_to_paid_conversion: submission.free_to_paid_conversion || 0,
      monthly_mrr: submission.monthly_mrr || 0,
      failed_payment_rate: submission.failed_payment_rate || 0,
      manual_hours: submission.manual_hours || 0,
      hourly_rate: submission.hourly_rate || 0,
      lead_score: submission.lead_score || 0,
      user_id: submission.user_id,
      created_at: submission.created_at
    };
  }, [submission]);

  const unifiedCalculations = useMemo(() => {
    console.log('=== RESULTS PAGE DEBUG ===');
    console.log('submissionData being passed to UnifiedResultsService:', submissionData);
    const result = UnifiedResultsService.calculateResults(submissionData);
    console.log('UnifiedResultsService result:', result);
    return result;
  }, [submissionData]);

  const calculations: Calculations = useMemo(() => ({
    leadResponseLoss: unifiedCalculations.leadResponseLoss,
    failedPaymentLoss: unifiedCalculations.failedPaymentLoss,
    selfServeGap: unifiedCalculations.selfServeGap,
    processLoss: unifiedCalculations.processInefficiency,
    totalLeakage: unifiedCalculations.totalLoss,
    potentialRecovery70: unifiedCalculations.conservativeRecovery,
    potentialRecovery85: unifiedCalculations.optimisticRecovery,
    totalLeak: unifiedCalculations.totalLoss,
    recoveryPotential70: unifiedCalculations.conservativeRecovery,
    recoveryPotential85: unifiedCalculations.optimisticRecovery,
  }), [unifiedCalculations]);

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
        description: "Please log in to access your strategic growth plan.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/action-plan/${submission?.id}`);
  };

  const handleQuickWins = () => {
    setActiveTab("recovery");
  };

  const handleBookCall = () => {
    console.log('Book strategy call clicked from Results page');
    // Updated to use a proper Calendly URL - replace with your actual Calendly link
    window.open('https://calendly.com/revenuecalculator/strategy-session', '_blank');
    
    toast({
      title: "Strategic Consultation Booking",
      description: "Opening calendar to schedule your strategy session",
    });
  };

  const handleDownloadReport = () => {
    toast({
      title: "Strategic Analysis Download",
      description: "Your revenue optimization assessment is being prepared.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="Loading Strategic Analysis..."
          context="results"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Activity className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
              <p className="text-body text-muted-foreground">Analyzing your revenue opportunities...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="Strategic Analysis Not Found"
          backTo="/dashboard"
          context="results"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-h1 mb-2">Strategic Analysis Not Found</h2>
              <p className="text-body text-muted-foreground mb-6">
                The requested strategic analysis could not be found or you don't have access to it.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Back to Strategic Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalLeak = calculations.totalLeakage;
  const recovery70 = calculations.potentialRecovery70;
  const recovery85 = calculations.potentialRecovery85;
  const dailyLoss = totalLeak / 365;
  const weeklyLoss = totalLeak / 52;

  const tabs = [
    { id: 'strategic', label: 'Strategic Overview', icon: Target },
    { id: 'breakdown', label: 'Revenue Analysis', icon: TrendingDown },
    { id: 'actions', label: 'Priority Actions', icon: Zap },
    { id: 'recovery', label: 'Implementation', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader 
        title={submission.company_name}
        subtitle="Strategic Revenue Analysis"
        backTo="/dashboard"
        context="results"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Strategic Analysis */}
        <UnifiedStrategicAnalysis
          calculations={unifiedCalculations}
          companyName={submission.company_name}
          formatCurrency={(amount) => new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: amount >= 1000000 ? 'compact' : 'standard',
            compactDisplay: 'short'
          }).format(amount)}
          onGetActionPlan={handleGetActionPlan}
          onQuickWins={handleQuickWins}
          onBookCall={handleBookCall}
        />

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-primary/5 border border-primary/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="strategic">
            <ContentSection title="Strategic Revenue Analysis">
              <HeroRevenueChart
                secureRevenue={unifiedCalculations.performanceMetrics.secureRevenue}
                revenueAtRisk={unifiedCalculations.performanceMetrics.revenueAtRisk}
                recoveryPotential={unifiedCalculations.conservativeRecovery}
                formatCurrency={formatCurrency}
              />
            </ContentSection>
          </TabsContent>

          <TabsContent value="breakdown">
            <div className="space-y-6">
              <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4">
                <h3 className="text-lg font-bold text-primary mb-2">📊 REVENUE ANALYSIS REPORT</h3>
                <p className="text-sm text-primary/80">
                  Comprehensive analysis of revenue optimization opportunities across all systems
                </p>
              </div>
              
              <RevenueCharts
                data={calculatorData}
                calculations={calculations}
                formatCurrency={formatCurrency}
                confidenceFactors={{
                  companySize: submission.current_arr && submission.current_arr > 10000000 ? 'enterprise' :
                               submission.current_arr && submission.current_arr > 1000000 ? 'scaleup' : 'startup',
                  currentMaturity: submission.lead_score && submission.lead_score > 75 ? 'advanced' :
                                   submission.lead_score && submission.lead_score > 45 ? 'intermediate' : 'basic',
                  changeManagementCapability: submission.current_arr && submission.current_arr > 5000000 ? 'high' : 'medium',
                  resourceAvailable: true
                } as ConfidenceFactors}
              />
              
              <DetailedBreakdown
                data={calculatorData}
                calculations={calculations}
                formatCurrency={formatCurrency}
              />
            </div>
          </TabsContent>

          <TabsContent value="actions">
            <div className="space-y-6">
              <div className="bg-revenue-growth/10 border-2 border-revenue-growth/20 rounded-xl p-4">
                <h3 className="text-lg font-bold text-revenue-growth mb-2">🎯 STRATEGIC GROWTH PLAN</h3>
                <p className="text-sm text-revenue-growth/80">
                  Priority actions to maximize revenue optimization opportunities
                </p>
              </div>
              
              <PriorityActions 
                submission={submission}
                formatCurrency={formatCurrency}
              />
            </div>
          </TabsContent>

          <TabsContent value="recovery">
            <div className="space-y-6">
              <div className="bg-revenue-success/10 border-2 border-revenue-success/20 rounded-xl p-4">
                <h3 className="text-lg font-bold text-revenue-success mb-2">🚀 IMPLEMENTATION ROADMAP</h3>
                <p className="text-sm text-revenue-success/80">
                  Step-by-step strategic implementation timeline for revenue growth
                </p>
              </div>
              
              <ImplementationTimeline 
                submission={submission}
                formatCurrency={formatCurrency}
                validatedValues={{
                  totalLeak,
                  leadResponseLoss: calculations.leadResponseLoss,
                  selfServeLoss: calculations.selfServeGap,
                  recoveryPotential70: recovery70,
                  recoveryPotential85: recovery85
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Strategic Action Footer */}
        <div className="mt-8 bg-gradient-to-r from-primary/10 to-revenue-growth/10 rounded-xl border-2 border-primary/20 p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-2">
              UNLOCK YOUR REVENUE POTENTIAL
            </h3>
            <p className="text-primary/80 mb-4">
              Capture {formatCurrency(recovery70)} in strategic revenue opportunities
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleGetActionPlan}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Target className="h-4 w-4 mr-2" />
                GET STRATEGIC GROWTH PLAN
              </Button>
              <Button 
                onClick={handleBookCall}
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Calendar className="h-4 w-4 mr-2" />
                BOOK STRATEGY CONSULTATION - Free 30min
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
