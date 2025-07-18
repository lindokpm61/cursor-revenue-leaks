import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Calendar, Lightbulb, FileText, BarChart3 } from "lucide-react";

import { fetchSubmissionData } from "@/lib/submission/submissionDataFetcher";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";

// Import unified components
import { UnifiedHeader } from "@/components/navigation/UnifiedHeader";
import { UnifiedCTA } from "@/components/ui/unified-cta";
import { ContentSection } from "@/components/ui/content-section";

// Import existing specialized components
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ComprehensiveSummary } from "@/components/results/ComprehensiveSummary";
import { ActionPlanTimeline } from "@/components/ActionPlanTimeline";
import { ActionPlanScenarioPlanning } from "@/components/ActionPlanScenarioPlanning";
import { ImplementationRoadmap } from "@/components/calculator/results/ImplementationRoadmap";

// Import calculation functions
import { 
  generateRealisticTimeline, 
  calculateRealisticInvestment,
  calculateRealisticROI,
  type UnifiedCalculationInputs 
} from "@/lib/calculator/unifiedCalculations";

// Import unified navigation
import { useAnalysisNavigation } from "@/hooks/useAnalysisNavigation";

export default function ActionPlan() {
  const params = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  }, [submissionId, toast]);

  const submissionData = useMemo(() => {
    if (!data || !data.calculator_data) return null;
    
    const calcData = data.calculator_data;
    const companyInfo = calcData.companyInfo || {};
    const leadGeneration = calcData.leadGeneration || {};
    const selfServe = calcData.selfServe || {};
    const operations = calcData.operations || {};

    const transformedData = {
      id: data.temp_id || submissionId,
      company_name: data.company_name || companyInfo.companyName || '',
      contact_email: data.email || '',
      industry: data.industry || companyInfo.industry || '',
      current_arr: companyInfo.currentARR || 0,
      monthly_leads: leadGeneration.monthlyLeads || 0,
      average_deal_value: leadGeneration.averageDealValue || 0,
      lead_response_time: leadGeneration.leadResponseTime || leadGeneration.leadResponseTimeHours || 0,
      monthly_free_signups: selfServe.monthlyFreeSignups || 0,
      free_to_paid_conversion: selfServe.freeToLaidConversion || selfServe.freeToPaidConversionRate || 0,
      monthly_mrr: selfServe.monthlyMRR || 0,
      failed_payment_rate: selfServe.failedPaymentRate || operations.failedPaymentRate || 0,
      manual_hours: operations.manualHours || operations.manualHoursPerWeek || 0,
      hourly_rate: operations.hourlyRate || 0,
      lead_score: data.lead_score || 50,
      user_id: data.converted_to_user_id || '',
      created_at: data.created_at || new Date().toISOString()
    };

    const unifiedCalcs = UnifiedResultsService.calculateResults(transformedData);
    
    return {
      ...transformedData,
      lead_response_loss: unifiedCalcs.leadResponseLoss,
      failed_payment_loss: unifiedCalcs.failedPaymentLoss,
      selfserve_gap_loss: unifiedCalcs.selfServeGap,
      process_inefficiency_loss: unifiedCalcs.processInefficiency,
      total_leak: unifiedCalcs.totalLoss,
      recovery_potential_70: unifiedCalcs.conservativeRecovery,
      recovery_potential_85: unifiedCalcs.optimisticRecovery,
      leadResponseLoss: unifiedCalcs.leadResponseLoss,
      failedPaymentLoss: unifiedCalcs.failedPaymentLoss,
      selfServeGap: unifiedCalcs.selfServeGap,
      processInefficiency: unifiedCalcs.processInefficiency,
      totalLoss: unifiedCalcs.totalLoss,
      conservativeRecovery: unifiedCalcs.conservativeRecovery,
      optimisticRecovery: unifiedCalcs.optimisticRecovery
    };
  }, [data, submissionId]);

  const { timeline, investment, roiData } = useMemo(() => {
    if (!submissionData) return { timeline: [], investment: null, roiData: null };

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

  const handleBookCall = () => {
    toast({
      title: "Booking System",
      description: "Redirecting to calendar booking...",
    });
  };

  const handleExportPlan = () => {
    toast({
      title: "Export Started",
      description: "Your action plan is being prepared for download.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="Loading Action Plan..."
          context="action-plan"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-4 pt-6">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-full" />
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
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="Action Plan Unavailable"
          backTo={`/results/${submissionId}`}
          context="action-plan"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <p className="text-destructive">
                Unable to generate action plan. Please try again or contact support.
              </p>
              <UnifiedCTA
                variant="secondary"
                context="action-plan"
                onPrimaryAction={() => navigation.navigateToResults(submissionId)}
                className="mt-4"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'priorities', label: 'Priorities', icon: Target },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'roadmap', label: 'Roadmap', icon: BarChart3 },
    { id: 'scenarios', label: 'Scenarios', icon: Lightbulb },
    { id: 'summary', label: 'Summary', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader 
        title="Strategic Action Plan"
        subtitle={submissionData.company_name}
        backTo={`/results/${submissionId}`}
        context="action-plan"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero CTA Section */}
        <ContentSection 
          title="Implementation Ready"
          badge={`${UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)} Recovery Plan`}
          badgeVariant="outline"
          priority="high"
          className="mb-8"
        >
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-6">
              Your personalized roadmap to recover {UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)} 
              in revenue through strategic improvements.
            </p>
            
            <UnifiedCTA
              variant="primary"
              context="action-plan"
              data={{
                totalLeak: submissionData.totalLoss,
                recovery: submissionData.conservativeRecovery,
                formatCurrency: UnifiedResultsService.formatCurrency
              }}
              onPrimaryAction={handleBookCall}
              onSecondaryAction={handleExportPlan}
            />
          </div>
        </ContentSection>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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

          <TabsContent value="priorities">
            <PriorityActions 
              submission={submissionData as any}
              formatCurrency={UnifiedResultsService.formatCurrency}
              calculatorData={submissionData}
            />
          </TabsContent>

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
              onExpandSection={(sectionId) => {
                const sectionToTabMap = {
                  'timeline': 'timeline',
                  'priorities': 'priorities',
                  'scenarios': 'scenarios'
                };
                const targetTab = sectionToTabMap[sectionId as keyof typeof sectionToTabMap] || 'priorities';
                setActiveTab(targetTab);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
