import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Target,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  ArrowUp,
  Users,
  CreditCard,
  Settings,
  DollarSign
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

import { useIsMobile } from "@/hooks/use-mobile";
import { type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";
import { type CalculatorData, type Calculations } from "@/components/calculator/useCalculatorData";

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
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
    return UnifiedResultsService.calculateResults(submissionData);
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
        description: "Please log in to access your action plan.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/action-plan/${submission?.id}`);
  };

  const handleDownloadReport = () => {
    toast({
      title: "Download Started",
      description: "Your comprehensive report is being prepared.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="Loading Analysis..."
          context="results"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-body text-muted-foreground">Loading your results...</p>
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
          title="Results Not Found"
          backTo="/dashboard"
          context="results"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-revenue-warning mx-auto mb-4" />
              <h2 className="text-h1 mb-2">Results Not Found</h2>
              <p className="text-body text-muted-foreground mb-6">
                The requested results could not be found or you don't have access to them.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'breakdown', label: 'Analysis', icon: DollarSign },
    { id: 'actions', label: 'Action Plan', icon: Target },
    { id: 'timeline', label: 'Implementation', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader 
        title={submission.company_name}
        subtitle="Revenue Recovery Analysis"
        backTo="/dashboard"
        context="results"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Simplified Hero Section */}
        <ContentSection 
          title="Revenue Recovery Opportunity"
          badge={`${((totalLeak / (submission.current_arr || 1)) * 100).toFixed(1)}% of ARR at Risk`}
          badgeVariant="destructive"
          priority="high"
          className="mb-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="text-3xl md:text-4xl text-revenue-warning font-bold flex items-center gap-3 mb-2">
                  <ArrowUp className="h-8 w-8" />
                  {formatCurrency(totalLeak)}
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Annual revenue opportunity identified
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-revenue-success/5 border border-revenue-success/20">
                  <div className="text-xl font-bold text-revenue-success mb-1">
                    {formatCurrency(recovery70)}
                  </div>
                  <div className="text-sm font-medium text-revenue-success/80">
                    Conservative Recovery
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="text-xl font-bold text-primary mb-1">
                    {formatCurrency(recovery85)}
                  </div>
                  <div className="text-sm font-medium text-primary/80">
                    Optimistic Recovery
                  </div>
                </div>
              </div>

              <UnifiedCTA
                variant="primary"
                context="results"
                data={{
                  totalLeak,
                  recovery: recovery70,
                  formatCurrency
                }}
                onPrimaryAction={handleGetActionPlan}
                onSecondaryAction={handleDownloadReport}
              />
            </div>

            <div>
              <HeroRevenueChart
                secureRevenue={submission.current_arr ? submission.current_arr - totalLeak : 0}
                revenueAtRisk={totalLeak}
                recoveryPotential={recovery70}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </ContentSection>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview">
            <ContentSection 
              title="Strategic Performance Overview"
              description="Your competitive position and improvement opportunities"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-foreground mb-2">
                    {formatCurrency(submission.current_arr || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Current ARR</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-revenue-danger mb-2">
                    {formatCurrency(totalLeak)}
                  </div>
                  <div className="text-sm text-muted-foreground">Revenue at Risk</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-revenue-success mb-2">
                    {formatCurrency(recovery70)}
                  </div>
                  <div className="text-sm text-muted-foreground">Recovery Potential</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {Math.round((recovery70 / Math.max(totalLeak, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Recovery Rate</div>
                </div>
              </div>
            </ContentSection>
          </TabsContent>

          <TabsContent value="breakdown">
            <div className="space-y-6">
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
            <PriorityActions 
              submission={submission}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="timeline">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Results;
