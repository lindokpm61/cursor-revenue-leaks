
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

import { useIsMobile } from "@/hooks/use-mobile";
import { type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";
import { type CalculatorData, type Calculations } from "@/components/calculator/useCalculatorData";

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("crisis");
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
        description: "Please log in to access your emergency action plan.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/action-plan/${submission?.id}`);
  };

  const handleDownloadReport = () => {
    toast({
      title: "Crisis Report Download",
      description: "Your revenue crisis assessment is being prepared.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedHeader 
          title="Loading Crisis Assessment..."
          context="results"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Activity className="h-12 w-12 animate-pulse text-destructive mx-auto mb-4" />
              <p className="text-body text-muted-foreground">Analyzing your revenue crisis...</p>
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
          title="Crisis Assessment Not Found"
          backTo="/dashboard"
          context="results"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-h1 mb-2">Crisis Assessment Not Found</h2>
              <p className="text-body text-muted-foreground mb-6">
                The requested crisis assessment could not be found or you don't have access to it.
              </p>
              <Button onClick={() => navigate("/dashboard")} variant="destructive">
                Back to Crisis Dashboard
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
    { id: 'crisis', label: 'Crisis Overview', icon: AlertTriangle },
    { id: 'damage', label: 'Damage Report', icon: TrendingDown },
    { id: 'emergency', label: 'Emergency Response', icon: Target },
    { id: 'recovery', label: 'Recovery Protocol', icon: Activity }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader 
        title={submission.company_name}
        subtitle="Revenue Crisis Assessment"
        backTo="/dashboard"
        context="results"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Crisis Alert Banner */}
        <div className="mb-6 bg-gradient-to-r from-destructive/10 via-destructive/5 to-destructive/10 border-2 border-destructive/20 rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-destructive/20 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-destructive">CRITICAL: Revenue Hemorrhaging Detected</h3>
              <p className="text-sm text-destructive/80">Immediate intervention required to stop financial bleeding</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">
                Daily loss: {formatCurrency(dailyLoss)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">
                Weekly loss: {formatCurrency(weeklyLoss)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">
                Status: Critical intervention needed
              </span>
            </div>
          </div>
        </div>

        {/* Executive-First Summary */}
        <ExecutiveFirstSummary
          submission={submission}
          formatCurrency={formatCurrency}
          onGetActionPlan={handleGetActionPlan}
          onViewFullAnalysis={() => setActiveTab("damage")}
        />

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-destructive/5 border border-destructive/20">
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

          <TabsContent value="crisis">
            <div className="bg-white rounded-2xl border-2 border-destructive/20 overflow-hidden">
              <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 p-6 border-b-2 border-destructive/20">
                <h3 className="text-xl font-bold text-destructive mb-2">Revenue Crisis Status Report</h3>
                <p className="text-destructive/80">Financial emergency assessment and immediate threat analysis</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="p-3 rounded-full bg-blue-100 w-fit mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-2">
                      {formatCurrency(submission.current_arr || 0)}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">Current ARR</div>
                    <div className="text-xs text-slate-500 mt-1">Before crisis intervention</div>
                  </div>
                  
                  <div className="text-center p-6 bg-red-50 rounded-xl border-2 border-red-200">
                    <div className="p-3 rounded-full bg-red-100 w-fit mx-auto mb-3 animate-pulse">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      {formatCurrency(totalLeak)}
                    </div>
                    <div className="text-sm text-red-700 font-medium">Revenue Hemorrhaging</div>
                    <div className="text-xs text-red-600 mt-1">
                      {submission.current_arr ? `${((totalLeak / submission.current_arr) * 100).toFixed(1)}% of ARR bleeding` : 'Critical emergency'}
                    </div>
                  </div>
                  
                  <div className="text-center p-6 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="p-3 rounded-full bg-amber-100 w-fit mx-auto mb-3">
                      <Target className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600 mb-2">
                      {formatCurrency(recovery70)}
                    </div>
                    <div className="text-sm text-amber-700 font-medium">Emergency Recovery</div>
                    <div className="text-xs text-amber-600 mt-1">IF you act immediately</div>
                  </div>
                  
                  <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
                    <div className="p-3 rounded-full bg-red-100 w-fit mx-auto mb-3">
                      <Clock className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600 mb-2">
                      {Math.round((recovery70 / Math.max(totalLeak, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-red-700 font-medium">Crisis Recovery Rate</div>
                    <div className="text-xs text-red-600 mt-1">Time-sensitive window</div>
                  </div>
                </div>
                
                {/* Crisis Indicators */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-200">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Crisis Severity Assessment
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700">Revenue Bleeding Rate</span>
                        <span className="text-sm font-medium text-red-900 bg-red-200 px-2 py-1 rounded">Critical</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700">Financial Emergency Level</span>
                        <span className="text-sm font-medium text-red-900 bg-red-200 px-2 py-1 rounded">High Alert</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700">Intervention Urgency</span>
                        <span className="text-sm font-medium text-red-900 bg-red-200 px-2 py-1 rounded">Immediate</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Emergency Response Priority
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700">Lead Response Crisis</span>
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">CRITICAL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700">Payment Recovery Emergency</span>
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">HIGH</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700">Process Bleeding</span>
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">MEDIUM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time-Sensitive Warning */}
                <div className="mt-8 p-6 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl border-2 border-destructive/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-6 w-6 text-destructive animate-pulse" />
                    <div>
                      <h4 className="font-bold text-destructive">TIME-SENSITIVE CRISIS</h4>
                      <p className="text-sm text-destructive/80">Revenue bleeding continues while you read this report</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-destructive">Money lost today:</span>
                        <span className="font-bold text-destructive">{formatCurrency(dailyLoss)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-destructive">Money lost this week:</span>
                        <span className="font-bold text-destructive">{formatCurrency(weeklyLoss)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-destructive">Days since crisis detected:</span>
                        <span className="font-bold text-destructive">1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-destructive">Emergency window:</span>
                        <span className="font-bold text-destructive">72 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="damage">
            <div className="space-y-6">
              <div className="bg-destructive/5 border-2 border-destructive/20 rounded-xl p-4">
                <h3 className="text-lg font-bold text-destructive mb-2">⚠️ DAMAGE ASSESSMENT REPORT</h3>
                <p className="text-sm text-destructive/80">
                  Critical analysis of revenue hemorrhaging across all systems
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

          <TabsContent value="emergency">
            <div className="space-y-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-amber-800 mb-2">🚨 EMERGENCY RESPONSE PLAN</h3>
                <p className="text-sm text-amber-700">
                  Immediate actions required to stop revenue bleeding
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
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-green-800 mb-2">🏥 RECOVERY PROTOCOL</h3>
                <p className="text-sm text-green-700">
                  Step-by-step crisis recovery implementation timeline
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

        {/* Crisis Action Footer */}
        <div className="mt-8 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl border-2 border-destructive/20 p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-destructive mb-2">
              STOP THE BLEEDING NOW
            </h3>
            <p className="text-destructive/80 mb-4">
              Every moment of delay costs your business {formatCurrency(dailyLoss)} daily
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleGetActionPlan}
                size="lg"
                className="bg-destructive hover:bg-destructive/90"
              >
                <Target className="h-4 w-4 mr-2" />
                GET EMERGENCY ACTION PLAN
              </Button>
              <Button 
                onClick={() => window.open('https://calendly.com/crisis-intervention', '_blank')}
                variant="outline"
                size="lg"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Calendar className="h-4 w-4 mr-2" />
                SCHEDULE CRISIS INTERVENTION
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
