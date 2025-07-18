
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { ActionPlan as ActionPlanComponent } from "@/components/calculator/results/ActionPlan";
import { fetchSubmissionData } from "@/lib/submission/submissionDataFetcher";
import { saveTemporarySubmission } from "@/lib/submission/submissionStorage";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { useCTAController } from "@/hooks/useCTAController";
import { FloatingCTABar } from "@/components/results/FloatingCTABar";
import { ActionPlanExitIntentModal } from "@/components/calculator/ActionPlanExitIntentModal";
import { ProgressiveEmailCapture } from "@/components/calculator/ProgressiveEmailCapture";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";

export default function ActionPlan() {
  const navigate = useNavigate();
  const params = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [checkedActions, setCheckedActions] = useState<string[]>([]);

  const submissionId = params.id || null;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (submissionId) {
          const submission = await fetchSubmissionData(submissionId);
          if (submission) {
            setData(submission);
            setUserEmail(submission.email || '');
            console.log("Fetched submission data:", submission);
          } else {
            toast({
              title: "Error",
              description: "No data found for this submission. Please start again.",
              variant: "destructive",
            });
            navigate('/');
          }
        } else {
          toast({
            title: "Error",
            description: "No submission ID found. Please start again.",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submissionId, navigate, toast]);

  useEffect(() => {
    if (submissionId && data) {
      saveTemporarySubmission(data);
    }
  }, [submissionId, data]);

  const handleBack = useCallback(() => {
    navigate(`/operations?tempId=${submissionId}`);
  }, [navigate, submissionId]);

  const handleCheckAction = (action: string) => {
    setCheckedActions(prev => {
      if (prev.includes(action)) {
        return prev.filter(a => a !== action);
      } else {
        return [...prev, action];
      }
    });
  };

  // Map the nested calculator_data to the flat structure expected by UnifiedResultsService
  const flattenedSubmissionData = useMemo(() => {
    if (!data || !data.calculator_data) return null;
    
    return {
      id: data.temp_id || submissionId,
      company_name: data.company_name || '',
      contact_email: data.email || '',
      industry: data.industry || data.calculator_data.companyInfo?.industry,
      current_arr: data.calculator_data.companyInfo?.currentARR || 0,
      monthly_leads: data.calculator_data.leadGeneration?.monthlyLeads || 0,
      average_deal_value: data.calculator_data.leadGeneration?.averageDealValue || 0,
      lead_response_time: data.calculator_data.leadGeneration?.leadResponseTime || 0,
      monthly_free_signups: data.calculator_data.selfServe?.monthlyFreeSignups || 0,
      free_to_paid_conversion: data.calculator_data.selfServe?.freeToLaidConversion || 0,
      monthly_mrr: data.calculator_data.selfServe?.monthlyMRR || 0,
      failed_payment_rate: data.calculator_data.selfServe?.failedPaymentRate || 0,
      manual_hours: data.calculator_data.operations?.manualHours || 0,
      hourly_rate: data.calculator_data.operations?.hourlyRate || 0,
      lead_score: data.lead_score || 50,
      user_id: data.converted_to_user_id,
      created_at: data.created_at || new Date().toISOString()
    };
  }, [data, submissionId]);

  // Calculate results using the UnifiedResultsService
  const unifiedResults = useMemo(() => {
    if (!flattenedSubmissionData) return null;
    console.log("Calculating with flattened data:", flattenedSubmissionData);
    return UnifiedResultsService.calculateResults(flattenedSubmissionData);
  }, [flattenedSubmissionData]);

  // Derive recovery data for CTAs
  const recoveryData = useMemo(() => ({
    totalLeak: unifiedResults?.totalLoss || 0,
    formatCurrency: (amount: number) => UnifiedResultsService.formatCurrency(amount)
  }), [unifiedResults]);

  // Initialize CTA controller
  const ctaController = useCTAController(
    submissionId,
    5, // Action plan is final step
    recoveryData,
    {
      enableFloatingBar: true,
      enableExitIntent: true,
      enableProgressiveEmail: !userEmail, // Only if no email captured
      timeBasedDelay: 180000, // 3 minutes
    }
  );

  // Handle email submission for exit intent modal
  const handleExitIntentEmailSubmit = async (email: string) => {
    if (submissionId) {
      await ctaController.progressiveEmail.handleEmailCaptured(email);
      setUserEmail(email);
    }
  };

  // Get top priority action for personalized messaging
  const topPriorityAction = useMemo(() => {
    if (unifiedResults) {
      const priorities = [
        { name: "Lead Response Optimization", value: unifiedResults.leadResponseLoss },
        { name: "Self-Serve Optimization", value: unifiedResults.selfServeGap },
        { name: "Payment Recovery", value: unifiedResults.failedPaymentLoss },
        { name: "Process Automation", value: unifiedResults.processInefficiency }
      ];
      return priorities.sort((a, b) => b.value - a.value)[0]?.name;
    }
    return null;
  }, [unifiedResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="bg-white border-b">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            SaaS Revenue Leak Calculator
          </h1>
        </div>
      </header>

      <div className="container mx-auto mt-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="outline">Step 5 of 5</Badge>
          <h2 className="text-lg font-semibold">Strategic Action Plan</h2>
        </div>

        <main className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {isLoading ? (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Strategic Action Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-5 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ) : (
                <ActionPlanComponent 
                  calculations={{
                    leadResponseLoss: unifiedResults?.leadResponseLoss || 0,
                    failedPaymentLoss: unifiedResults?.failedPaymentLoss || 0,
                    selfServeGap: unifiedResults?.selfServeGap || 0,
                    processLoss: unifiedResults?.processInefficiency || 0,
                    totalLeak: unifiedResults?.totalLoss || 0,
                    totalLeakage: unifiedResults?.totalLoss || 0,
                    potentialRecovery70: unifiedResults?.conservativeRecovery || 0,
                    potentialRecovery85: unifiedResults?.optimisticRecovery || 0,
                    recoveryPotential70: unifiedResults?.conservativeRecovery || 0,
                    recoveryPotential85: unifiedResults?.optimisticRecovery || 0
                  }} 
                  data={data} 
                />
              )}
            </div>

            <div>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">Step 5</Badge>
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ready to take action? Here are some resources to help you
                    get started.
                  </p>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Download our free guide to revenue recovery
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Schedule a consultation with our experts
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Join our community forum for peer support
                      </a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* CTA Components */}
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
        checkedActionsCount={checkedActions.length}
        topPriorityAction={topPriorityAction}
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
