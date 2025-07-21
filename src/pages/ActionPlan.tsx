
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calculator, Target, Download, ChevronRight } from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ActionPlan as ActionPlanComponent } from "@/components/calculator/results/ActionPlan";
import { ActionPlanTimeline } from "@/components/ActionPlanTimeline";
import { ActionPlanScenarioPlanning } from "@/components/ActionPlanScenarioPlanning";
import { useCalculatorData } from "@/components/calculator/useCalculatorData";
import { generateRealisticTimeline, calculateRealisticInvestment, UnifiedCalculationInputs, calculateUnifiedResults } from "@/lib/calculator/unifiedCalculations";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";
import { UnifiedHeader } from "@/components/navigation/UnifiedHeader";

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

        {/* Action Plan Modules */}
        <div className="space-y-8">
          {(() => {
            // Calculate unified results and timeline for all modules
            if (!submission?.calculator_data) {
              return (
                <div className="text-center py-12">
                  <p className="text-body text-muted-foreground">
                    No calculation data available for this action plan.
                  </p>
                </div>
              );
            }

            const submissionData = {
              id: submission.temp_id || '',
              company_name: submission.company_name || '',
              contact_email: submission.email || '',
              industry: submission.industry || submission.calculator_data.companyInfo?.industry,
              current_arr: submission.calculator_data.companyInfo?.currentARR || 0,
              monthly_leads: submission.calculator_data.leadGeneration?.monthlyLeads || 0,
              average_deal_value: submission.calculator_data.leadGeneration?.averageDealValue || 0,
              lead_response_time: submission.calculator_data.leadGeneration?.leadResponseTime || 0,
              monthly_free_signups: submission.calculator_data.selfServe?.monthlyFreeSignups || 0,
              free_to_paid_conversion: submission.calculator_data.selfServe?.freeToLaidConversion || 0,
              monthly_mrr: submission.calculator_data.selfServe?.monthlyMRR || 0,
              failed_payment_rate: submission.calculator_data.selfServe?.failedPaymentRate || 0,
              manual_hours: submission.calculator_data.operations?.manualHours || 0,
              hourly_rate: submission.calculator_data.operations?.hourlyRate || 0,
              lead_score: submission.lead_score || 50,
              user_id: submission.converted_to_user_id,
              created_at: submission.created_at || new Date().toISOString()
            };

            // Use both calculation services for complete data
            const legacyResults = UnifiedResultsService.calculateResults(submissionData);
            
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

            // Calculate unified results
            const unifiedResults = calculateUnifiedResults(inputs);

            const timeline = generateRealisticTimeline(unifiedResults, inputs);

            const investment = calculateRealisticInvestment(timeline, inputs);

            return (
              <>
                {/* Strategic Overview */}
                <ActionPlanComponent 
                  calculations={calculations} 
                  data={submission}
                />

                {/* Interactive Timeline & Checklist */}
                <ActionPlanTimeline
                  phases={timeline}
                  totalRecovery={legacyResults.conservativeRecovery}
                  totalInvestment={investment.implementationCost}
                  paybackMonths={investment.paybackMonths}
                  formatCurrency={UnifiedResultsService.formatCurrency}
                  confidenceLevel={unifiedResults.confidenceLevel}
                />

                {/* Scenario Planning */}
                <ActionPlanScenarioPlanning
                  baseRecovery={legacyResults.conservativeRecovery}
                  baseInvestment={investment.implementationCost}
                  formatCurrency={UnifiedResultsService.formatCurrency}
                />
              </>
            );
          })()}
        </div>

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
