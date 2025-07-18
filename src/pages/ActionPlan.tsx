
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Target, Download, Share2, FileText, Calendar, Lightbulb } from "lucide-react";

import { fetchSubmissionData } from "@/lib/submission/submissionDataFetcher";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCTAController } from "@/hooks/useCTAController";
import { FloatingCTABar } from "@/components/results/FloatingCTABar";
import { ActionPlanExitIntentModal } from "@/components/calculator/ActionPlanExitIntentModal";
import { ProgressiveEmailCapture } from "@/components/calculator/ProgressiveEmailCapture";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";
import { ImplementationRoadmap } from "@/components/calculator/results/ImplementationRoadmap";

// Import enhanced components
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ExecutiveSummary } from "@/components/calculator/results/ExecutiveSummary";
import { UserIntentSelector } from "@/components/results/UserIntentSelector";
import { ComprehensiveSummary } from "@/components/results/ComprehensiveSummary";
import { ActionPlanTimeline } from "@/components/ActionPlanTimeline";
import { ActionPlanScenarioPlanning } from "@/components/ActionPlanScenarioPlanning";
import type { UserIntent } from "@/components/results/UserIntentSelector";

// Import calculation functions
import { 
  generateRealisticTimeline, 
  calculateRealisticInvestment,
  calculateRealisticROI,
  type UnifiedCalculationInputs 
} from "@/lib/calculator/unifiedCalculations";

// Import unified navigation
import { useAnalysisNavigation } from "@/hooks/useAnalysisNavigation";
import { AnalysisBreadcrumb } from "@/components/navigation/AnalysisBreadcrumb";
import { AnalysisProgress } from "@/components/navigation/AnalysisProgress";

export default function ActionPlan() {
  const params = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userIntent, setUserIntent] = useState<UserIntent>('understand-problem');
  const [activeTab, setActiveTab] = useState('priorities');

  const submissionId = params.id || null;
  
  // Use unified navigation
  const navigation = useAnalysisNavigation(submissionId, data?.company_name);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (submissionId && navigation.validateSubmissionId(submissionId)) {
          const submission = await fetchSubmissionData(submissionId);
          if (submission) {
            setData(submission);
            setUserEmail(submission.email || '');
            console.log("=== ACTION PLAN FETCH DEBUG ===");
            console.log("Raw submission data:", submission);
            console.log("Calculator data structure:", submission.calculator_data);
          } else {
            toast({
              title: "Error",
              description: "No data found for this submission. Please start again.",
              variant: "destructive",
            });
            navigation.navigateToDashboard();
          }
        } else {
          toast({
            title: "Error",
            description: "No submission ID found. Please start again.",
            variant: "destructive",
          });
          navigation.navigateToDashboard();
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
        navigation.navigateToDashboard();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submissionId, navigation, toast]);

  // FIXED: Corrected data transformation with proper field mapping
  const submissionData = useMemo(() => {
    if (!data || !data.calculator_data) return null;
    
    console.log("=== ACTION PLAN DATA TRANSFORMATION DEBUG ===");
    console.log("Original data:", data);
    console.log("Calculator data:", data.calculator_data);

    const calcData = data.calculator_data;
    const companyInfo = calcData.companyInfo || {};
    const leadGeneration = calcData.leadGeneration || {};
    const selfServe = calcData.selfServe || {};
    const operations = calcData.operations || {};

    console.log("=== EXTRACTED NESTED DATA ===");
    console.log("Company info:", companyInfo);
    console.log("Lead generation:", leadGeneration);
    console.log("Self serve:", selfServe);
    console.log("Operations:", operations);

    // CRITICAL FIX: Proper field mapping with fallbacks
    const transformedData = {
      id: data.temp_id || submissionId,
      company_name: data.company_name || companyInfo.companyName || '',
      contact_email: data.email || '',
      industry: data.industry || companyInfo.industry || '',
      // FIXED: Ensure these critical values are preserved
      current_arr: companyInfo.currentARR || 0,
      monthly_leads: leadGeneration.monthlyLeads || 0,
      average_deal_value: leadGeneration.averageDealValue || 0,
      lead_response_time: leadGeneration.leadResponseTime || leadGeneration.leadResponseTimeHours || 0,
      monthly_free_signups: selfServe.monthlyFreeSignups || 0,
      // CRITICAL FIX: Correct field name mapping
      free_to_paid_conversion: selfServe.freeToLaidConversion || selfServe.freeToPaidConversionRate || 0,
      monthly_mrr: selfServe.monthlyMRR || 0,
      failed_payment_rate: selfServe.failedPaymentRate || operations.failedPaymentRate || 0,
      manual_hours: operations.manualHours || operations.manualHoursPerWeek || 0,
      hourly_rate: operations.hourlyRate || 0,
      lead_score: data.lead_score || 50,
      user_id: data.converted_to_user_id || '',
      created_at: data.created_at || new Date().toISOString()
    };

    console.log("=== TRANSFORMED SUBMISSION DATA ===");
    console.log("Transformed data:", transformedData);
    console.log("Key values check:");
    console.log("- Current ARR:", transformedData.current_arr);
    console.log("- Monthly leads:", transformedData.monthly_leads);
    console.log("- Average deal value:", transformedData.average_deal_value);
    console.log("- Lead response time:", transformedData.lead_response_time);
    console.log("- Monthly signups:", transformedData.monthly_free_signups);
    console.log("- Conversion rate:", transformedData.free_to_paid_conversion);
    console.log("- Monthly MRR:", transformedData.monthly_mrr);
    console.log("- Failed payment rate:", transformedData.failed_payment_rate);
    console.log("- Manual hours:", transformedData.manual_hours);
    console.log("- Hourly rate:", transformedData.hourly_rate);

    // FIXED: Calculate unified results with proper data
    const unifiedCalcs = UnifiedResultsService.calculateResults(transformedData);
    
    console.log("=== UNIFIED CALCULATIONS RESULT ===");
    console.log("Unified calculations:", unifiedCalcs);
    console.log("Total loss:", unifiedCalcs.totalLoss);
    console.log("Recovery amounts:", {
      conservative: unifiedCalcs.conservativeRecovery,
      optimistic: unifiedCalcs.optimisticRecovery
    });
    
    return {
      ...transformedData,
      // Add the calculated results to submission for priority actions
      lead_response_loss: unifiedCalcs.leadResponseLoss,
      failed_payment_loss: unifiedCalcs.failedPaymentLoss,
      selfserve_gap_loss: unifiedCalcs.selfServeGap,
      process_inefficiency_loss: unifiedCalcs.processInefficiency,
      total_leak: unifiedCalcs.totalLoss,
      recovery_potential_70: unifiedCalcs.conservativeRecovery,
      recovery_potential_85: unifiedCalcs.optimisticRecovery,
      // Pass through for components
      leadResponseLoss: unifiedCalcs.leadResponseLoss,
      failedPaymentLoss: unifiedCalcs.failedPaymentLoss,
      selfServeGap: unifiedCalcs.selfServeGap,
      processInefficiency: unifiedCalcs.processInefficiency,
      totalLoss: unifiedCalcs.totalLoss,
      conservativeRecovery: unifiedCalcs.conservativeRecovery,
      optimisticRecovery: unifiedCalcs.optimisticRecovery
    };
  }, [data, submissionId]);

  // Generate timeline and investment calculations
  const { timeline, investment, roiData } = useMemo(() => {
    if (!submissionData) return { timeline: [], investment: null, roiData: null };

    console.log("=== TIMELINE GENERATION DEBUG ===");
    console.log("Input data for timeline:", submissionData);

    const inputs: UnifiedCalculationInputs = {
      currentARR: submissionData.current_arr,
      monthlyMRR: submissionData.monthly_mrr,
      monthlyLeads: submissionData.monthly_leads,
      averageDealValue: submissionData.average_deal_value,
      leadResponseTime: submissionData.lead_response_time,
      monthlyFreeSignups: submissionData.monthly_free_signups,
      freeToLaidConversion: submissionData.free_to_paid_conversion,
      failedPaymentRate: submissionData.failed_payment_rate,
      manualHours: submissionData.manual_hours,
      hourlyRate: submissionData.hourly_rate,
      industry: submissionData.industry
    };

    const timelinePhases = generateRealisticTimeline(
      {
        leadResponseLoss: submissionData.leadResponseLoss,
        selfServeGapLoss: submissionData.selfServeGap,
        processInefficiencyLoss: submissionData.processInefficiency,
        failedPaymentLoss: submissionData.failedPaymentLoss,
        totalLoss: submissionData.totalLoss,
        recovery70Percent: submissionData.conservativeRecovery,
        recovery85Percent: submissionData.optimisticRecovery,
        recoveryBestCase: submissionData.optimisticRecovery,
        actionSpecificRecovery: {
          leadResponse: submissionData.leadResponseLoss * 0.6,
          selfServe: submissionData.selfServeGap * 0.5,
          processAutomation: submissionData.processInefficiency * 0.7,
          paymentRecovery: submissionData.failedPaymentLoss * 0.8
        },
        implementationFactors: {},
        riskAdjustments: {},
        confidenceLevel: 'medium',
        confidenceBounds: { lower: 0, upper: 0 },
        recoveryTimeline: { year1: 0, year2: 0, year3: 0 }
      },
      inputs
    );

    const investmentCalc = calculateRealisticInvestment(timelinePhases, inputs);
    const roi = calculateRealisticROI(
      submissionData.conservativeRecovery,
      investmentCalc.totalAnnualInvestment,
      'medium'
    );

    return {
      timeline: timelinePhases,
      investment: investmentCalc,
      roiData: roi
    };
  }, [submissionData]);

  // Recovery data for CTAs
  const recoveryData = useMemo(() => ({
    totalLeak: submissionData?.totalLoss || 0,
    formatCurrency: (amount: number) => UnifiedResultsService.formatCurrency(amount)
  }), [submissionData]);

  // Initialize CTA controller
  const ctaController = useCTAController(
    submissionId,
    5, // Action plan is final step
    recoveryData,
    {
      enableFloatingBar: true,
      enableExitIntent: true,
      enableProgressiveEmail: !userEmail,
      timeBasedDelay: 180000, // 3 minutes
    }
  );

  const handleBack = () => {
    if (submissionId) {
      navigation.navigateToResults(submissionId);
    } else {
      navigation.navigateToDashboard();
    }
  };

  const handleExitIntentEmailSubmit = async (email: string) => {
    if (submissionId) {
      await ctaController.progressiveEmail.handleEmailCaptured(email);
      setUserEmail(email);
    }
  };

  // FIXED: Modified section expansion handler to prevent tab switching from Summary
  const handleExpandSection = (sectionId: string) => {
    // If we're currently in the Summary tab, don't switch to other tabs
    // Instead, provide contextual information within the Summary
    if (activeTab === 'summary') {
      console.log(`User requested to expand ${sectionId} section from Summary tab`);
      // Keep user in Summary tab - TldrSummary will handle the expansion internally
      // or we could scroll to a specific section within the Summary tab
      return;
    }
    
    // Only switch tabs if we're not in the Summary tab
    const sectionToTabMap = {
      'timeline': 'timeline',
      'breakdown': 'priorities',
      'priority-actions': 'priorities',
      'benchmarking': 'scenarios',
      'scenarios': 'scenarios'
    };
    
    const targetTab = sectionToTabMap[sectionId as keyof typeof sectionToTabMap] || 'priorities';
    setActiveTab(targetTab);
  };

  const getTopPriorityAction = () => {
    if (!submissionData) return null;
    
    const priorities = [
      { name: "Lead Response Optimization", value: submissionData.leadResponseLoss || 0 },
      { name: "Self-Serve Optimization", value: submissionData.selfServeGap || 0 },
      { name: "Payment Recovery", value: submissionData.failedPaymentLoss || 0 },
      { name: "Process Automation", value: submissionData.processInefficiency || 0 }
    ];
    
    return priorities.sort((a, b) => b.value - a.value)[0]?.name;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="bg-white border-b">
          <div className="container mx-auto py-4 px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
              <h1 className="text-2xl font-semibold text-gray-800">
                Strategic Action Plan
              </h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto mt-8 px-4">
          <div className="flex items-center gap-4 mb-6">
            <Badge variant="outline">Step 5 of 5</Badge>
            <Skeleton className="h-6 w-48" />
          </div>

          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-primary/20">
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!submissionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="bg-white border-b">
          <div className="container mx-auto py-4 px-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
              <h1 className="text-2xl font-semibold text-gray-800">
                Strategic Action Plan
              </h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto mt-8 px-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">
                Unable to generate action plan. Please try again or contact support.
              </p>
              <Button variant="outline" onClick={handleBack} className="mt-4">
                Return to Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Strategic Action Plan
                </h1>
                <p className="text-sm text-muted-foreground">
                  {submissionData.company_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {/* Navigation Context */}
        <div className="mb-8 space-y-4">
          <AnalysisBreadcrumb items={navigation.breadcrumbs} />
          <AnalysisProgress 
            current={navigation.progressInfo.current}
            total={navigation.progressInfo.total}
            percentage={navigation.progressInfo.percentage}
            label={`Total Recovery Potential: ${UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)}`}
          />
        </div>

        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="priorities" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Strategic Action Priorities
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Implementation Roadmap
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Scenarios
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <ActionPlanTimeline
                phases={timeline}
                totalRecovery={submissionData.conservativeRecovery}
                totalInvestment={investment?.implementationCost || 0}
                paybackMonths={investment?.paybackMonths || 12}
                formatCurrency={UnifiedResultsService.formatCurrency}
                confidenceLevel="medium"
              />
            </TabsContent>

            <TabsContent value="priorities">
              <PriorityActions 
                submission={submissionData as any}
                formatCurrency={UnifiedResultsService.formatCurrency}
                calculatorData={submissionData}
              />
            </TabsContent>

            <TabsContent value="roadmap">
              <ImplementationRoadmap
                phases={timeline}
                totalRecovery={submissionData.conservativeRecovery}
                totalInvestment={investment?.implementationCost || 0}
                formatCurrency={UnifiedResultsService.formatCurrency}
              />
            </TabsContent>

            <TabsContent value="scenarios">
              <ActionPlanScenarioPlanning
                baseRecovery={submissionData.conservativeRecovery}
                baseInvestment={investment?.implementationCost || 0}
                formatCurrency={UnifiedResultsService.formatCurrency}
              />
            </TabsContent>

            <TabsContent value="summary">
              <ComprehensiveSummary
                submission={submissionData as any}
                formatCurrency={UnifiedResultsService.formatCurrency}
                onExpandSection={handleExpandSection}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <FloatingCTABar
        totalLeak={recoveryData.totalLeak}
        formatCurrency={recoveryData.formatCurrency}
        isVisible={ctaController.activeCTA === 'floating_bar'}
        onDismiss={ctaController.dismissCTA}
        context={{
          timeOnPage: ctaController.timeOnPage,
          scrollDepth: ctaController.scrollDepth,
          engagementScore: ctaController.engagementScore
        }}
      />

      <ActionPlanExitIntentModal
        isOpen={ctaController.activeCTA === 'exit_intent'}
        onClose={ctaController.dismissCTA}
        recoveryAmount={recoveryData.totalLeak}
        formatCurrency={recoveryData.formatCurrency}
        onEmailSubmit={handleExitIntentEmailSubmit}
        checkedActionsCount={0}
        topPriorityAction={getTopPriorityAction()}
      />

      {ctaController.progressiveEmail.isActive && !userEmail && (
        <ProgressiveEmailCapture
          isOpen={ctaController.activeCTA === 'progressive_email'}
          onClose={ctaController.dismissCTA}
          onSuccess={ctaController.progressiveEmail.handleEmailCaptured}
          trigger={ctaController.progressiveEmail.activeCapture}
          context={ctaController.progressiveEmail.captureContext}
          currentStep={5}
          tempId={submissionId}
        />
      )}
    </div>
  );
}
