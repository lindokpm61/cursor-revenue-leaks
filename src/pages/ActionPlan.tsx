import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Calendar, Zap, FileText, Activity, TrendingUp, CheckCircle } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState('overview');

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
      freeToPaidConversion: submissionData.free_to_paid_conversion,
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

  const handleGetStarted = () => {
    toast({
      title: "💚 Expert Consultation",
      description: "Connecting you with our implementation team...",
      variant: "default",
    });
  };

  const handleExportPlan = () => {
    toast({
      title: "📋 Recovery Plan Export",
      description: "Your strategic action plan is being prepared...",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="Loading Strategic Action Plan..."
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
          title="Strategic Action Plan Unavailable"
          backTo={`/results/${submissionId}`}
          context="action-plan"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Plan Unavailable</h2>
              <p className="text-muted-foreground mb-4">
                Unable to generate strategic action plan. Please try again.
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

  const dailyRecovery = submissionData.conservativeRecovery / 365;
  const monthlyRecovery = submissionData.conservativeRecovery / 12;

  const tabs = [
    { id: 'overview', label: 'Recovery Overview', icon: Target },
    { id: 'priorities', label: 'Priority Actions', icon: Zap },
    { id: 'timeline', label: 'Implementation', icon: Calendar },
    { id: 'scenarios', label: 'Planning', icon: Activity },
    { id: 'summary', label: 'Full Summary', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader 
        title="Strategic Revenue Recovery Plan"
        subtitle={`${submissionData.company_name} • Professional Implementation Guide`}
        backTo={`/results/${submissionId}`}
        context="action-plan"
        data={{
          recovery: submissionData.conservativeRecovery,
          formatCurrency: UnifiedResultsService.formatCurrency
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Recovery Summary */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">
                {UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)} Recovery Opportunity
              </h2>
              <p className="text-muted-foreground mb-6">
                Your personalized implementation plan to capture this revenue potential
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <UnifiedCTA
                  variant="primary"
                  context="action-plan"
                  data={{
                    totalLeak: submissionData.totalLoss,
                    recovery: submissionData.conservativeRecovery,
                    formatCurrency: UnifiedResultsService.formatCurrency
                  }}
                  onPrimaryAction={handleGetStarted}
                />
                <UnifiedCTA
                  variant="secondary"
                  context="action-plan"
                  onSecondaryAction={handleExportPlan}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Action Plan Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Target className="h-5 w-5" />
                  Recovery Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Key Opportunities</h3>
                    <div className="space-y-3">
                      <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                        <div className="font-medium text-green-800">Lead Response Optimization</div>
                        <div className="text-sm text-green-700">{UnifiedResultsService.formatCurrency(submissionData.leadResponseLoss)} potential</div>
                      </div>
                      <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="font-medium text-blue-800">Self-Serve Improvements</div>
                        <div className="text-sm text-blue-700">{UnifiedResultsService.formatCurrency(submissionData.selfServeGap)} potential</div>
                      </div>
                      <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
                        <div className="font-medium text-amber-800">Process Automation</div>
                        <div className="text-sm text-amber-700">{UnifiedResultsService.formatCurrency(submissionData.processInefficiency)} potential</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Implementation Roadmap</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-600">1</div>
                        <div>
                          <div className="font-medium">Quick Wins (Weeks 1-4)</div>
                          <div className="text-sm text-muted-foreground">Immediate impact opportunities</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">2</div>
                        <div>
                          <div className="font-medium">Core Improvements (Months 2-3)</div>
                          <div className="text-sm text-muted-foreground">System optimizations</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-600">3</div>
                        <div>
                          <div className="font-medium">Advanced Features (Months 4-6)</div>
                          <div className="text-sm text-muted-foreground">Long-term strategic gains</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="priorities">
            <PriorityActions 
              submission={submissionData as any}
              formatCurrency={UnifiedResultsService.formatCurrency}
              calculatorData={submissionData}
              variant="standard"
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
                const targetTab = sectionToTabMap[sectionId as keyof typeof sectionToTabMap] || 'overview';
                setActiveTab(targetTab);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Professional Success Footer */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200 p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-green-800 mb-2">
              🎯 Ready to Capture This Revenue?
            </h3>
            <p className="text-green-700 mb-4">
              Your recovery potential: {UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)} annually
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleGetStarted}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 font-medium shadow-md hover:shadow-lg transition-all"
              >
                💚 Start Implementation
              </button>
              <button 
                onClick={handleExportPlan}
                className="px-6 py-3 border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-all"
              >
                📋 Export Full Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
