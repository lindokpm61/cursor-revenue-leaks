import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Calendar, Zap, FileText, Activity, Clock } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState('emergency');

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

  const handleStopBleeding = () => {
    toast({
      title: "🚨 EMERGENCY CONSULTATION",
      description: "Connecting you to crisis intervention team...",
      variant: "destructive",
    });
  };

  const handleExportProtocol = () => {
    toast({
      title: "📋 CRISIS PROTOCOL EXPORT",
      description: "Your emergency recovery protocol is being prepared...",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="⚠️ Loading Emergency Protocol..."
          context="action-plan"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-destructive/20">
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
          title="🚨 Emergency Protocol Unavailable"
          backTo={`/results/${submissionId}`}
          context="action-plan"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto text-center border-destructive/20">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-destructive mb-2">CRISIS PROTOCOL UNAVAILABLE</h2>
              <p className="text-destructive/80 mb-4">
                Unable to generate emergency recovery protocol. Revenue bleeding continues.
              </p>
              <UnifiedCTA
                variant="secondary"
                context="action-plan"
                onPrimaryAction={() => navigation.navigateToResults(submissionId)}
                className="mt-4 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const dailyLoss = submissionData.totalLoss / 365;
  const weeklyLoss = submissionData.totalLoss / 52;

  const tabs = [
    { id: 'emergency', label: 'Emergency Triage', icon: AlertTriangle },
    { id: 'bleeding', label: 'Stop Bleeding', icon: Zap },
    { id: 'stabilization', label: 'Stabilization', icon: Activity },
    { id: 'recovery', label: 'Recovery Protocol', icon: Calendar },
    { id: 'monitoring', label: 'Crisis Monitoring', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader 
        title="🚨 Emergency Revenue Recovery Protocol"
        subtitle={`${submissionData.company_name} • CRISIS INTERVENTION REQUIRED`}
        backTo={`/results/${submissionId}`}
        context="action-plan"
        data={{
          dailyLoss,
          totalLoss: submissionData.totalLoss,
          recovery: submissionData.conservativeRecovery
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Crisis Alert Banner */}
        <div className="mb-8 bg-gradient-to-r from-destructive/20 to-destructive/10 border-2 border-destructive/30 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-destructive/20 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-destructive">FINANCIAL EMERGENCY IN PROGRESS</h2>
              <p className="text-destructive/80 text-lg">
                {UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)} recovery protocol activated
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <Clock className="h-4 w-4 text-destructive" />
              <div>
                <span className="font-medium text-destructive">Bleeding Rate:</span>
                <div className="text-destructive/80">{UnifiedResultsService.formatCurrency(dailyLoss)}/day</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <Zap className="h-4 w-4 text-destructive" />
              <div>
                <span className="font-medium text-destructive">Weekly Loss:</span>
                <div className="text-destructive/80">{UnifiedResultsService.formatCurrency(weeklyLoss)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <Activity className="h-4 w-4 text-destructive" />
              <div>
                <span className="font-medium text-destructive">Crisis Status:</span>
                <div className="text-destructive/80">IMMEDIATE ACTION REQUIRED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency CTA Section */}
        <ContentSection 
          title="🚨 STOP THE BLEEDING NOW"
          badge={`${UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)} Emergency Recovery`}
          badgeVariant="destructive"
          priority="high"
          className="mb-8 border-destructive/20"
        >
          <div className="text-center">
            <p className="text-lg text-destructive/80 mb-6">
              Your business is hemorrhaging {UnifiedResultsService.formatCurrency(submissionData.conservativeRecovery)} 
              annually. Every moment of delay costs {UnifiedResultsService.formatCurrency(dailyLoss)} per day.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <UnifiedCTA
                variant="primary"
                context="action-plan"
                data={{
                  totalLeak: submissionData.totalLoss,
                  recovery: submissionData.conservativeRecovery,
                  formatCurrency: UnifiedResultsService.formatCurrency
                }}
                onPrimaryAction={handleStopBleeding}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              />
              <UnifiedCTA
                variant="secondary"
                context="action-plan"
                onSecondaryAction={handleExportProtocol}
                className="border-destructive/20 text-destructive hover:bg-destructive/10"
              />
            </div>
          </div>
        </ContentSection>

        {/* Crisis Protocol Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-destructive/5 border-2 border-destructive/20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex items-center gap-2 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="emergency">
            <PriorityActions 
              submission={submissionData as any}
              formatCurrency={UnifiedResultsService.formatCurrency}
              calculatorData={submissionData}
              variant="competitive"
            />
          </TabsContent>

          <TabsContent value="bleeding">
            <ActionPlanTimeline
              phases={timeline}
              totalRecovery={submissionData.conservativeRecovery}
              totalInvestment={investment?.implementationCost || 0}
              paybackMonths={investment?.paybackMonths || 12}
              formatCurrency={UnifiedResultsService.formatCurrency}
              confidenceLevel="medium"
            />
          </TabsContent>

          <TabsContent value="stabilization">
            <ImplementationRoadmap
              phases={timeline}
              totalRecovery={submissionData.conservativeRecovery}
              totalInvestment={investment?.implementationCost || 0}
              formatCurrency={UnifiedResultsService.formatCurrency}
            />
          </TabsContent>

          <TabsContent value="recovery">
            <ActionPlanScenarioPlanning
              baseRecovery={submissionData.conservativeRecovery}
              baseInvestment={investment?.implementationCost || 0}
              formatCurrency={UnifiedResultsService.formatCurrency}
            />
          </TabsContent>

          <TabsContent value="monitoring">
            <ComprehensiveSummary
              submission={submissionData as any}
              formatCurrency={UnifiedResultsService.formatCurrency}
              onExpandSection={(sectionId) => {
                const sectionToTabMap = {
                  'timeline': 'bleeding',
                  'priorities': 'emergency',
                  'scenarios': 'recovery'
                };
                const targetTab = sectionToTabMap[sectionId as keyof typeof sectionToTabMap] || 'emergency';
                setActiveTab(targetTab);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Emergency Footer */}
        <div className="mt-8 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl border-2 border-destructive/20 p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-destructive mb-2">
              ⏰ TIME-SENSITIVE CRISIS
            </h3>
            <p className="text-destructive/80 mb-4">
              Revenue bleeding continues: {UnifiedResultsService.formatCurrency(dailyLoss)} lost daily
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleStopBleeding}
                className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 font-medium"
              >
                🚨 EMERGENCY CONSULTATION
              </button>
              <button 
                onClick={handleExportProtocol}
                className="px-6 py-3 border-2 border-destructive/20 text-destructive rounded-lg hover:bg-destructive/10 font-medium"
              >
                📋 EXPORT CRISIS PROTOCOL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
