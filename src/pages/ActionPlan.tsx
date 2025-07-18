
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  ArrowLeft, 
  AlertTriangle,
  Target,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { ResultsLayout } from "@/components/layouts/ResultsLayout";

const ActionPlan = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("priorities");
  const { user } = useAuth();
  const { toast } = useToast();

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
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load action plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-body text-muted-foreground">Loading your action plan...</p>
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
            <h2 className="text-h1 mb-2">Action Plan Not Found</h2>
            <p className="text-body text-muted-foreground mb-6">
              The requested action plan could not be found or you don't have access to it.
            </p>
            <Link to="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
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

  // Calculate unified results
  const calculations = UnifiedResultsService.calculateResults(submissionData);
  const formatCurrency = UnifiedResultsService.formatCurrency;

  const tabs = [
    { id: 'priorities', label: 'Priority Actions', icon: Target },
    { id: 'timeline', label: 'Implementation Timeline', icon: Clock },
    { id: 'impact', label: 'Expected Impact', icon: DollarSign }
  ];

  return (
    <ResultsLayout 
      submission={submission} 
      pageType="action-plan"
      totalLeak={calculations.totalLoss}
      formatCurrency={formatCurrency}
    >
      {/* Action Plan Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-primary/5 to-revenue-primary/5 p-6 rounded-xl border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Implementation Action Plan
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Your personalized roadmap to recover {formatCurrency(calculations.totalLoss)} in annual revenue
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-revenue-success" />
                  <span className="text-sm">Analysis Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm">Action Plan Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">6-12 Month Timeline</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content Sections */}
      {activeTab === 'priorities' && (
        <div className="space-y-8">
          <PriorityActions 
            submission={submission}
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-8">
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
      )}

      {activeTab === 'impact' && (
        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Expected Recovery Impact</h2>
                  <p className="text-muted-foreground">
                    Projected revenue recovery over 12 months with systematic implementation
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-revenue-success/10 rounded-xl border border-revenue-success/20">
                    <div className="text-3xl font-bold text-revenue-success mb-2">
                      {formatCurrency(calculations.conservativeRecovery)}
                    </div>
                    <div className="text-sm font-medium text-revenue-success mb-1">
                      Conservative Recovery (40-60%)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on industry benchmarks and category-specific potential
                    </div>
                  </div>
                  
                  <div className="p-6 bg-primary/10 rounded-xl border border-primary/20">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {formatCurrency(calculations.optimisticRecovery)}
                    </div>
                    <div className="text-sm font-medium text-primary mb-1">
                      Optimistic Recovery (55-75%)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      With optimal execution and dedicated resources
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Recovery estimates are based on your specific metrics and industry best practices. 
                    Actual results may vary based on execution quality and market conditions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ResultsLayout>
  );
};

export default ActionPlan;
