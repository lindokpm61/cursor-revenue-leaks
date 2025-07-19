
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  ArrowLeft, 
  AlertTriangle, 
  Target,
  BarChart3,
  DollarSign,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";
import { UnifiedStrategicAnalysis } from "@/components/results/UnifiedStrategicAnalysis";
import { UnifiedRevenueCharts } from "@/components/results/UnifiedRevenueCharts";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { IndustryBenchmarking } from "@/components/calculator/results/IndustryBenchmarking";
import { EnhancedExportCTA } from "@/components/results/EnhancedExportCTA";
import { FloatingCTABar } from "@/components/results/FloatingCTABar";
import { useAnalysisNavigation } from "@/hooks/useAnalysisNavigation";
import { AnalysisBreadcrumb } from "@/components/navigation/AnalysisBreadcrumb";
import { AnalysisProgress } from "@/components/navigation/AnalysisProgress";

// Import new simplified components
import { SimplifiedHero } from "@/components/results/SimplifiedHero";
import { ProgressiveAnalysis } from "@/components/results/ProgressiveAnalysis";
import { GuidedTour } from "@/components/results/GuidedTour";

const CleanResults = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuidedTour, setShowGuidedTour] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [activeSection, setActiveSection] = useState<string>("overview");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use unified navigation
  const navigation = useAnalysisNavigation(id, submission?.company_name);

  useEffect(() => {
    if (id) {
      loadSubmission(id);
    }
  }, [id]);

  const loadSubmission = async (submissionId: string) => {
    try {
      if (!navigation.validateSubmissionId(submissionId)) {
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

      // DEBUG: Log raw submission data
      console.log('=== RAW SUBMISSION DATA ===');
      console.log('Raw submission from database:', data);
      console.log('Legacy total_leak from DB:', data.total_leak);
      console.log('Legacy recovery_potential_70 from DB:', data.recovery_potential_70);

      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    if (id) {
      navigation.navigateToActionPlan(id);
    }
  };

  const handleQuickWins = () => {
    setActiveSection('actions');
    const element = document.getElementById('actions-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookCall = () => {
    navigation.openExternalLink('https://calendly.com/your-calendar');
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-body text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <AlertTriangle className="h-12 w-12 text-revenue-warning mx-auto mb-4" />
            <h2 className="text-h1 mb-2">Results Not Found</h2>
            <p className="text-body text-muted-foreground mb-6">
              The requested results could not be found or you don't have access to them.
            </p>
            <Button onClick={navigation.navigateToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert submission to the format expected by UnifiedResultsService
  const submissionData: SubmissionData = {
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

  // DEBUG: Log submission data transformation
  console.log('=== SUBMISSION DATA TRANSFORMATION ===');
  console.log('Transformed submissionData:', submissionData);

  // Calculate unified results
  const calculations = UnifiedResultsService.calculateResults(submissionData);
  
  // DEBUG: Log UnifiedResultsService calculations
  console.log('=== UNIFIED RESULTS SERVICE CALCULATIONS ===');
  console.log('UnifiedResultsService calculations:', calculations);
  console.log('Total Loss from UnifiedService:', calculations.totalLoss);
  console.log('Conservative Recovery from UnifiedService:', calculations.conservativeRecovery);
  console.log('Optimistic Recovery from UnifiedService:', calculations.optimisticRecovery);
  
  const formatCurrency = UnifiedResultsService.formatCurrency;

  // DEBUG: Test formatCurrency function
  console.log('=== FORMAT CURRENCY TEST ===');
  console.log('formatCurrency(calculations.totalLoss):', formatCurrency(calculations.totalLoss));
  console.log('formatCurrency(1230000):', formatCurrency(1230000));

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'breakdown', label: 'Revenue Analysis', icon: DollarSign },
    { id: 'benchmarking', label: 'Industry Benchmarks', icon: TrendingUp },
    { id: 'actions', label: 'Action Plan', icon: Target },
    { id: 'timeline', label: 'Implementation', icon: CheckCircle }
  ];

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
              totalLeak={calculations.totalLoss}
              recovery70={calculations.conservativeRecovery}
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
              data={{
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
              }}
              calculations={{
                leadResponseLoss: calculations.leadResponseLoss,
                failedPaymentLoss: calculations.failedPaymentLoss,
                selfServeGap: calculations.selfServeGap,
                processLoss: calculations.processInefficiency,
                totalLeakage: calculations.totalLoss,
                potentialRecovery70: calculations.conservativeRecovery,
                potentialRecovery85: calculations.optimisticRecovery,
                totalLeak: calculations.totalLoss,
                recoveryPotential70: calculations.conservativeRecovery,
                recoveryPotential85: calculations.optimisticRecovery,
              }}
              formatCurrency={formatCurrency}
            >
              <div className="space-y-8">
                <UnifiedRevenueCharts
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
                    totalLeak: calculations.totalLoss,
                    leadResponseLoss: calculations.leadResponseLoss,
                    selfServeLoss: calculations.selfServeGap,
                    recoveryPotential70: calculations.conservativeRecovery,
                    recoveryPotential85: calculations.optimisticRecovery
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

export default CleanResults;
