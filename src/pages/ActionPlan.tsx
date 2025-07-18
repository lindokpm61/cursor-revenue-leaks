
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Download, Share2 } from "lucide-react";

import { fetchSubmissionData } from "@/lib/submission/submissionDataFetcher";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCTAController } from "@/hooks/useCTAController";
import { FloatingCTABar } from "@/components/results/FloatingCTABar";
import { ActionPlanExitIntentModal } from "@/components/calculator/ActionPlanExitIntentModal";
import { ProgressiveEmailCapture } from "@/components/calculator/ProgressiveEmailCapture";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";

// Import sophisticated components
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { DecisionSupportPanel } from "@/components/results/DecisionSupportPanel";
import { ExecutiveSummary } from "@/components/calculator/results/ExecutiveSummary";
import { UserIntentSelector } from "@/components/results/UserIntentSelector";
import type { UserIntent } from "@/components/results/UserIntentSelector";

export default function ActionPlan() {
  const navigate = useNavigate();
  const params = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userIntent, setUserIntent] = useState<UserIntent>('plan-implementation');

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

  // Transform data for UnifiedResultsService and components
  const submissionData = useMemo(() => {
    if (!data || !data.calculator_data) return null;
    
    const unifiedCalcs = UnifiedResultsService.calculateResults({
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
    });
    
    // Return complete submission object with all required fields
    return {
      id: data.temp_id || submissionId,
      company_name: data.company_name || '',
      contact_email: data.email || '',
      industry: data.industry || data.calculator_data.companyInfo?.industry || '',
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
      user_id: data.converted_to_user_id || '',
      created_at: data.created_at || new Date().toISOString(),
      // Add calculated fields
      lead_response_loss: unifiedCalcs.leadResponseLoss,
      failed_payment_loss: unifiedCalcs.failedPaymentLoss,
      selfserve_gap_loss: unifiedCalcs.selfServeGap,
      process_inefficiency_loss: unifiedCalcs.processInefficiency,
      total_leak: unifiedCalcs.totalLoss,
      recovery_potential_70: unifiedCalcs.conservativeRecovery,
      recovery_potential_85: unifiedCalcs.optimisticRecovery,
      // Add missing required fields with defaults
      crm_opportunity_id: '',
      crm_person_id: '',
      phone: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      referrer: '',
      first_touch_url: '',
      last_touch_url: '',
      session_count: 1,
      page_views: 1,
      time_on_site: 0,
      form_submission_time: new Date().toISOString(),
      browser: '',
      device: '',
      os: '',
      country: '',
      region: '',
      city: '',
      // Add remaining required fields
      leak_percentage: Math.round((unifiedCalcs.totalLoss / Math.max(data.calculator_data.companyInfo?.currentARR || 1, 1)) * 100),
      n8n_triggered: false,
      smartlead_campaign_id: '',
      synced_to_self_hosted: false,
      updated_at: new Date().toISOString(),
      twenty_company_id: '',
      twenty_contact_id: ''
    };
  }, [data, submissionId]);

  // Calculate results using UnifiedResultsService
  const unifiedResults = useMemo(() => {
    if (!submissionData) return null;
    console.log("Calculating with submission data:", submissionData);
    return UnifiedResultsService.calculateResults(submissionData);
  }, [submissionData]);

  // Transform results for legacy components
  const legacyCalculations = useMemo(() => {
    if (!unifiedResults) return null;
    
    return {
      leadResponseLoss: unifiedResults.leadResponseLoss,
      failedPaymentLoss: unifiedResults.failedPaymentLoss,
      selfServeGap: unifiedResults.selfServeGap,
      processLoss: unifiedResults.processInefficiency,
      totalLeak: unifiedResults.totalLoss,
      totalLeakage: unifiedResults.totalLoss,
      potentialRecovery70: unifiedResults.conservativeRecovery,
      potentialRecovery85: unifiedResults.optimisticRecovery,
      recoveryPotential70: unifiedResults.conservativeRecovery,
      recoveryPotential85: unifiedResults.optimisticRecovery
    };
  }, [unifiedResults]);

  // Transform data for DecisionSupportPanel (expects submission format)
  const transformedSubmission = useMemo(() => {
    if (!submissionData || !unifiedResults) return null;
    
    return {
      id: submissionData.id,
      company_name: submissionData.company_name,
      contact_email: submissionData.contact_email,
      industry: submissionData.industry,
      current_arr: submissionData.current_arr,
      monthly_leads: submissionData.monthly_leads,
      monthly_free_signups: submissionData.monthly_free_signups,
      average_deal_value: submissionData.average_deal_value,
      lead_response_time: submissionData.lead_response_time,
      free_to_paid_conversion: submissionData.free_to_paid_conversion,
      monthly_mrr: submissionData.monthly_mrr,
      failed_payment_rate: submissionData.failed_payment_rate,
      manual_hours: submissionData.manual_hours,
      hourly_rate: submissionData.hourly_rate,
      user_id: submissionData.user_id,
      phone: submissionData.phone,
      utm_source: submissionData.utm_source,
      utm_medium: submissionData.utm_medium,
      utm_campaign: submissionData.utm_campaign,
      utm_term: submissionData.utm_term,
      utm_content: submissionData.utm_content,
      referrer: submissionData.referrer,
      first_touch_url: submissionData.first_touch_url,
      last_touch_url: submissionData.last_touch_url,
      session_count: submissionData.session_count,
      page_views: submissionData.page_views,
      time_on_site: submissionData.time_on_site,
      form_submission_time: submissionData.form_submission_time,
      browser: submissionData.browser,
      device: submissionData.device,
      os: submissionData.os,
      country: submissionData.country,
      region: submissionData.region,
      city: submissionData.city,
      lead_response_loss: unifiedResults.leadResponseLoss,
      failed_payment_loss: unifiedResults.failedPaymentLoss,
      selfserve_gap_loss: unifiedResults.selfServeGap,
      process_inefficiency_loss: unifiedResults.processInefficiency,
      total_leak: unifiedResults.totalLoss,
      recovery_potential_70: unifiedResults.conservativeRecovery,
      recovery_potential_85: unifiedResults.optimisticRecovery,
      lead_score: submissionData.lead_score,
      created_at: submissionData.created_at,
      crm_opportunity_id: submissionData.crm_opportunity_id,
      crm_person_id: submissionData.crm_person_id,
      leak_percentage: submissionData.leak_percentage,
      n8n_triggered: submissionData.n8n_triggered,
      smartlead_campaign_id: submissionData.smartlead_campaign_id,
      synced_to_self_hosted: submissionData.synced_to_self_hosted,
      updated_at: submissionData.updated_at,
      twenty_company_id: submissionData.twenty_company_id,
      twenty_contact_id: submissionData.twenty_contact_id
    };
  }, [submissionData, unifiedResults]);

  // Recovery data for CTAs
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
      enableProgressiveEmail: !userEmail,
      timeBasedDelay: 180000, // 3 minutes
    }
  );

  const handleBack = () => {
    navigate(`/results/${submissionId}`);
  };

  const handleExitIntentEmailSubmit = async (email: string) => {
    if (submissionId) {
      await ctaController.progressiveEmail.handleEmailCaptured(email);
      setUserEmail(email);
    }
  };

  const getTopPriorityAction = () => {
    if (!unifiedResults) return null;
    
    const priorities = [
      { name: "Lead Response Optimization", value: unifiedResults.leadResponseLoss },
      { name: "Self-Serve Optimization", value: unifiedResults.selfServeGap },
      { name: "Payment Recovery", value: unifiedResults.failedPaymentLoss },
      { name: "Process Automation", value: unifiedResults.processInefficiency }
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

  if (!legacyCalculations || !transformedSubmission) {
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
                  {transformedSubmission.company_name}
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
        <div className="flex items-center gap-4 mb-8">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Target className="h-3 w-3 mr-1" />
            Step 5 of 5
          </Badge>
          <div className="text-sm text-muted-foreground">
            Total Recovery Potential: {UnifiedResultsService.formatCurrency(unifiedResults.conservativeRecovery)}
          </div>
        </div>

        {/* User Intent Selector */}
        <div className="mb-8">
          <UserIntentSelector 
            selectedIntent={userIntent} 
            onIntentChange={setUserIntent}
          />
        </div>

        <div className="space-y-8">
          {/* Executive Summary */}
          <ExecutiveSummary 
            data={{
              companyInfo: {
                companyName: submissionData.company_name || '',
                currentARR: submissionData.current_arr || 0,
                industry: submissionData.industry || '',
                email: submissionData.contact_email || '',
                phone: submissionData.phone || ''
              },
              leadGeneration: {
                monthlyLeads: submissionData.monthly_leads || 0,
                averageDealValue: submissionData.average_deal_value || 0,
                leadResponseTimeHours: submissionData.lead_response_time || 0
              },
              selfServeMetrics: {
                monthlyFreeSignups: submissionData.monthly_free_signups || 0,
                freeToPaidConversionRate: submissionData.free_to_paid_conversion || 0,
                monthlyMRR: submissionData.monthly_mrr || 0
              },
              operationsData: {
                failedPaymentRate: submissionData.failed_payment_rate || 0,
                manualHoursPerWeek: submissionData.manual_hours || 0,
                hourlyRate: submissionData.hourly_rate || 0
              }
            }}
            calculations={legacyCalculations}
            formatCurrency={UnifiedResultsService.formatCurrency}
          />

          {/* Decision Support Panel */}
          <DecisionSupportPanel
            submission={transformedSubmission}
            userIntent={userIntent}
            formatCurrency={UnifiedResultsService.formatCurrency}
          />

          {/* Priority Actions */}
          <PriorityActions 
            submission={submissionData}
            formatCurrency={UnifiedResultsService.formatCurrency}
            calculatorData={submissionData}
          />

          {/* Implementation Timeline */}
          <ImplementationTimeline 
            submission={submissionData}
            formatCurrency={UnifiedResultsService.formatCurrency}
            calculatorData={submissionData}
          />

          {/* Next Steps Card */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Ready to Get Started?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Immediate Actions</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Download your personalized action plan</li>
                    <li>• Share with your leadership team</li>
                    <li>• Schedule implementation kickoff meeting</li>
                    <li>• Book a strategy consultation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Resources & Support</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Implementation playbook</li>
                    <li>• ROI tracking templates</li>
                    <li>• Expert consultation calls</li>
                    <li>• Progress monitoring tools</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button className="bg-gradient-to-r from-primary to-primary/80">
                  Schedule Strategy Call
                </Button>
                <Button variant="outline">
                  Download Full Report
                </Button>
                <Button variant="ghost">
                  Join Implementation Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
