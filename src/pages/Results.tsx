import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BarChart3 } from "lucide-react";

import { submissionService, type Submission } from "@/lib/supabase";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Import new simplified components
import { SimplifiedHero } from "@/components/results/SimplifiedHero";
import { ProgressiveAnalysis } from "@/components/results/ProgressiveAnalysis";
import { GuidedTour } from "@/components/results/GuidedTour";

// Import existing specialized components for detailed view
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { DetailedBreakdown } from "@/components/calculator/results/DetailedBreakdown";
import { RevenueCharts } from "@/components/calculator/results/RevenueCharts";

import { useIsMobile } from "@/hooks/use-mobile";
import { type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";
import { type CalculatorData, type Calculations } from "@/components/calculator/useCalculatorData";

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuidedTour, setShowGuidedTour] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
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

  const handleShowDetails = () => {
    setViewMode('detailed');
  };

  const handleTourComplete = () => {
    setShowGuidedTour(false);
  };

  const handleTourSkip = () => {
    setShowGuidedTour(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  return (
    <div className="min-h-screen bg-background">
      {/* Guided Tour */}
      {showGuidedTour && (
        <GuidedTour
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {viewMode === 'simple' ? (
          <>
            {/* Simplified Hero Section */}
            <SimplifiedHero
              companyName={submission.company_name}
              totalLeak={totalLeak}
              recovery70={recovery70}
              formatCurrency={formatCurrency}
              onGetActionPlan={handleGetActionPlan}
              onShowDetails={handleShowDetails}
            />
          </>
        ) : (
          <>
            {/* Back to Simple View Button */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setViewMode('simple')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Summary
              </Button>
            </div>

            {/* Progressive Analysis with Full Details */}
            <ProgressiveAnalysis
              data={calculatorData}
              calculations={calculations}
              formatCurrency={formatCurrency}
            >
              <div className="space-y-8">
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

                <PriorityActions 
                  submission={submission}
                  formatCurrency={formatCurrency}
                />

                <ImplementationTimeline 
                  submission={submission}
                  formatCurrency={formatCurrency}
                  validatedValues={{
                    totalLeak,
                    leadResponseLoss: calculations.leadResponseLoss,
                    selfServeLoss: calculations.selfServeGap,
                    recoveryPotential70: recovery70,
                    recoveryPotential85: calculations.potentialRecovery85
                  }}
                />
              </div>
            </ProgressiveAnalysis>
          </>
        )}
      </div>
    </div>
  );
};

export default Results;
