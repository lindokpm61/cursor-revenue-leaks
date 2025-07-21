
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calculator, Target, Download, ChevronRight, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ActionPlan as ActionPlanComponent } from "@/components/calculator/results/ActionPlan";
import { ActionPlanTimeline } from "@/components/ActionPlanTimeline";
import { ActionPlanScenarioPlanning } from "@/components/ActionPlanScenarioPlanning";
import { useCalculatorData } from "@/components/calculator/useCalculatorData";
import { UnifiedHeader } from "@/components/navigation/UnifiedHeader";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";

const ActionPlan = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  const { data, calculations } = useCalculatorData();

  useEffect(() => {
    if (id) {
      loadSubmission();
    }
  }, [id]);

  const loadSubmission = async () => {
    if (!id) return;

    try {
      const { data: submissionData, error } = await submissionService.getById(id);

      if (error) {
        console.error('Error loading submission:', error);
        toast({
          title: "Error",
          description: "Failed to load action plan data",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      if (!submissionData) {
        toast({
          title: "Not Found",
          description: "Action plan not found",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setSubmission(submissionData);
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: "Failed to load action plan data",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-body text-muted-foreground">Loading action plan...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-h1 text-foreground mb-4">Action Plan Not Found</h1>
          <p className="text-body text-muted-foreground mb-6">
            The requested action plan could not be found.
          </p>
          <Link to="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Transform submission data for components using UnifiedResultsService format
  const transformedData = {
    ...submission,
    calculator_data: {
      companyInfo: {
        industry: submission.industry,
        currentARR: submission.current_arr || 0
      },
      leadGeneration: {
        monthlyLeads: submission.monthly_leads || 0,
        averageDealValue: submission.average_deal_value || 0,
        leadResponseTime: submission.lead_response_time || 0
      },
      selfServe: {
        monthlyFreeSignups: submission.monthly_free_signups || 0,
        freeToPaidConversion: submission.free_to_paid_conversion || 0,
        monthlyMRR: submission.monthly_mrr || 0,
        failedPaymentRate: submission.failed_payment_rate || 0
      },
      operations: {
        manualHours: submission.manual_hours || 0,
        hourlyRate: submission.hourly_rate || 0
      }
    }
  };

  // Calculate unified results using UnifiedResultsService
  const submissionDataForResults: SubmissionData = {
    id: submission.id || '',
    company_name: submission.company_name || '',
    contact_email: submission.contact_email || '',
    industry: submission.industry || transformedData.calculator_data.companyInfo?.industry,
    current_arr: submission.current_arr || 0,
    monthly_leads: submission.monthly_leads || 0,
    average_deal_value: submission.average_deal_value || 0,
    lead_response_time: submission.lead_response_time || 0,
    monthly_free_signups: submission.monthly_free_signups || 0,
    free_to_paid_conversion: submission.free_to_paid_conversion || 0,
    monthly_mrr: submission.monthly_mrr || 0,
    failed_payment_rate: submission.failed_payment_rate || 0,
    manual_hours: submission.manual_hours || 0,
    hourly_rate: submission.hourly_rate || 0,
    lead_score: submission.lead_score || 50,
    user_id: submission.user_id,
    created_at: submission.created_at || new Date().toISOString()
  };

  const unifiedResults = UnifiedResultsService.calculateResults(submissionDataForResults);

  console.log('=== ACTION PLAN DEBUG - UNIFIED RESULTS ===');
  console.log('Self-serve gap from UnifiedResultsService:', unifiedResults.selfServeGap);
  console.log('Total loss:', unifiedResults.totalLoss);
  console.log('Input data check:', {
    monthlyFreeSignups: submission.monthly_free_signups,
    freeToPaidConversion: submission.free_to_paid_conversion,
    industry: submission.industry
  });

  // Simple timeline generation using unified results
  const generateSimpleTimeline = () => {
    const phases = [];
    const currentARR = submissionDataForResults.current_arr;
    const threshold = Math.max(currentARR * 0.003, 15000);

    if (unifiedResults.leadResponseLoss > threshold) {
      phases.push({
        id: 'lead-response',
        title: 'Lead Response Optimization',
        description: 'Implement automated response systems',
        startMonth: 1,
        endMonth: 3,
        difficulty: 'easy' as const,
        recoveryPotential: unifiedResults.leadResponseLoss * 0.65,
        actions: [
          { title: 'Audit current response processes', weeks: 2, owner: 'Sales Ops' },
          { title: 'Implement lead automation tools', weeks: 3, owner: 'Marketing' }
        ]
      });
    }

    if (unifiedResults.selfServeGap > threshold) {
      phases.push({
        id: 'self-serve',
        title: 'Self-Serve Optimization',
        description: 'Optimize onboarding and conversion flow',
        startMonth: 2,
        endMonth: 5,
        difficulty: 'medium' as const,
        recoveryPotential: unifiedResults.selfServeGap * 0.55,
        actions: [
          { title: 'Analyze conversion funnel', weeks: 2, owner: 'Product' },
          { title: 'Optimize onboarding flow', weeks: 4, owner: 'Product' }
        ]
      });
    }

    if (unifiedResults.failedPaymentLoss > threshold) {
      phases.push({
        id: 'payment-recovery',
        title: 'Payment Recovery System',
        description: 'Implement payment retry and recovery systems',
        startMonth: 3,
        endMonth: 6,
        difficulty: 'medium' as const,
        recoveryPotential: unifiedResults.failedPaymentLoss * 0.70,
        actions: [
          { title: 'Analyze payment failure patterns', weeks: 2, owner: 'Finance' },
          { title: 'Implement payment retry logic', weeks: 4, owner: 'Engineering' }
        ]
      });
    }

    if (unifiedResults.processInefficiency > threshold) {
      phases.push({
        id: 'process-automation',
        title: 'Process Automation',
        description: 'Automate manual processes and workflows',
        startMonth: 4,
        endMonth: 8,
        difficulty: 'hard' as const,
        recoveryPotential: unifiedResults.processInefficiency * 0.75,
        actions: [
          { title: 'Map current workflows', weeks: 2, owner: 'Operations' },
          { title: 'Configure automation tools', weeks: 4, owner: 'Operations' }
        ]
      });
    }

    return phases;
  };

  const timeline = generateSimpleTimeline();
  const totalRecovery = timeline.reduce((sum, phase) => sum + phase.recoveryPotential, 0);

  // Simple investment calculation
  const calculateInvestment = () => {
    const baseInvestment = Math.min(Math.max(15000, (submission.current_arr || 0) * 0.003), 35000);
    const phaseMultiplier = timeline.length;
    const complexityFactor = timeline.some(p => p.difficulty === 'hard') ? 1.3 : 1.1;
    
    const implementationCost = baseInvestment * phaseMultiplier * complexityFactor;
    const ongoingCost = implementationCost * 0.15;
    const totalAnnualInvestment = (implementationCost / 2.5) + ongoingCost;
    
    return {
      implementationCost,
      ongoingCost,
      totalAnnualInvestment,
      paybackMonths: totalRecovery > 0 ? Math.min(Math.ceil(implementationCost / (totalRecovery / 12)), 24) : 24
    };
  };

  const investment = calculateInvestment();

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader 
        title="Strategic Action Plan"
        subtitle={`Implementation roadmap for ${submission.company_name}`}
        backTo={`/results/${id}`}
        context="action-plan"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-small text-muted-foreground mb-6">
          <Link to="/dashboard" className="hover:text-primary">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/results/${id}`} className="hover:text-primary">
            Results
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Action Plan</span>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-h1 text-foreground mb-2">Strategic Action Plan</h1>
              <p className="text-body text-muted-foreground">
                Implementation roadmap for {submission.company_name}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link to={`/results/${id}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Results
                </Button>
              </Link>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="h-4 w-4 mr-2" />
                Export Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Tabbed Action Plan Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Strategic Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Implementation Timeline
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Scenario Planning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ActionPlanComponent 
              calculations={calculations} 
              data={transformedData}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <ActionPlanTimeline
              phases={timeline}
              totalRecovery={unifiedResults.conservativeRecovery}
              totalInvestment={investment.implementationCost}
              paybackMonths={investment.paybackMonths}
              formatCurrency={UnifiedResultsService.formatCurrency}
              confidenceLevel="medium"
            />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <ActionPlanScenarioPlanning
              baseRecovery={unifiedResults.conservativeRecovery}
              baseInvestment={investment.implementationCost}
              formatCurrency={UnifiedResultsService.formatCurrency}
            />
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <div>
              <h3 className="text-h3 text-foreground mb-1">Need Help Implementing?</h3>
              <p className="text-small text-muted-foreground">
                Our team can help you execute this strategic plan effectively.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/contact">
                  <Target className="h-4 w-4 mr-2" />
                  Schedule Consultation
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/results/${id}`}>
                  View Full Analysis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionPlan;
