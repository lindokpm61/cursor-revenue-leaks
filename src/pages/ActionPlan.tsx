import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Calculations } from "@/components/calculator/useCalculatorData";
import { calculateUnifiedResults, generateRealisticTimeline, UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";
import { CalculatorNavigation } from "@/components/calculator/CalculatorNavigation";
import { ActionPlan as ActionPlanComponent } from "@/components/calculator/results/ActionPlan";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getTemporarySubmission, saveTemporarySubmission } from "@/lib/submission/submissionStorage";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { useCTAController } from "@/hooks/useCTAController";
import { FloatingCTABar } from "@/components/results/FloatingCTABar";
import { ActionPlanExitIntentModal } from "@/components/calculator/ActionPlanExitIntentModal";
import { ProgressiveEmailCapture } from "@/components/calculator/ProgressiveEmailCapture";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";

export default function ActionPlan() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useLocalStorage('user_email', '');
  const [checkedActions, setCheckedActions] = useState<string[]>([]);

  const tempId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tempId');
    }
    return null;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (tempId) {
          const submission = await getTemporarySubmission(tempId);
          if (submission) {
            setData(submission);
            setCalculations(submission.calculations);
            setUserEmail(submission.email || '');
          } else {
            toast({
              title: "Error",
              description: "No data found for this session. Please start again.",
              variant: "destructive",
            });
            router.push('/');
          }
        } else {
          toast({
            title: "Error",
            description: "No session ID found. Please start again.",
            variant: "destructive",
          });
          router.push('/');
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tempId, router, toast, setUserEmail]);

  useEffect(() => {
    if (tempId && data) {
      saveTemporarySubmission(tempId, data);
    }
  }, [tempId, data]);

  const handleBack = useCallback(() => {
    trackEvent('calculator_navigation', { step: 5, action: 'back' });
    router.push(`/operations?tempId=${tempId}`);
  }, [router, tempId]);

  const handleCheckAction = (action: string) => {
    setCheckedActions(prev => {
      if (prev.includes(action)) {
        return prev.filter(a => a !== action);
      } else {
        return [...prev, action];
      }
    });
  };

  // Get unified results for consistent CTA data
  const unifiedResults = useMemo(() => {
    if (!data?.companyInfo?.currentARR) return null;
    
    const resultsService = new UnifiedResultsService();
    return resultsService.calculateResults({
      currentARR: data.companyInfo.currentARR,
      monthlyMRR: data.selfServe?.monthlyMRR || 0,
      monthlyLeads: data.leadGeneration?.monthlyLeads || 0,
      averageDealValue: data.leadGeneration?.averageDealValue || 0,
      leadResponseTime: data.leadGeneration?.leadResponseTime || 0,
      monthlyFreeSignups: data.selfServe?.monthlyFreeSignups || 0,
      freeToLaidConversion: data.selfServe?.freeToLaidConversion || 0,
      failedPaymentRate: data.selfServe?.failedPaymentRate || 0,
      manualHours: data.operations?.manualHours || 0,
      hourlyRate: data.operations?.hourlyRate || 0,
      industry: data.companyInfo?.industry
    });
  }, [data]);

  const recoveryData = useMemo(() => ({
    totalLeak: unifiedResults?.totalLoss || calculations?.totalLeak || 0,
    formatCurrency: (amount: number) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }), [unifiedResults, calculations]);

  // Initialize CTA controller
  const ctaController = useCTAController(
    tempId,
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
    if (tempId) {
      await ctaController.progressiveEmail.handleEmailCaptured(email);
      setUserEmail(email);
    }
  };

  // Get top priority action for personalized messaging
  const topPriorityAction = useMemo(() => {
    if (unifiedResults) {
      const priorities = [
        { name: "Lead Response Optimization", value: unifiedResults.actionRecoveryPotential.leadResponse },
        { name: "Self-Serve Optimization", value: unifiedResults.actionRecoveryPotential.selfServeOptimization },
        { name: "Payment Recovery", value: unifiedResults.actionRecoveryPotential.paymentRecovery },
        { name: "Process Automation", value: unifiedResults.actionRecoveryPotential.processAutomation }
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
        <CalculatorNavigation currentStep={5} onBack={handleBack} />

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
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ) : (
                <ActionPlanComponent calculations={calculations || {}} data={data} />
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
          onEmailSubmit={ctaController.progressiveEmail.handleEmailCaptured}
          trigger={ctaController.progressiveEmail.activeCapture}
          context={ctaController.progressiveEmail.captureContext}
          currentStep={5}
          tempId={tempId}
        />
      )}
    </div>
  );
}
