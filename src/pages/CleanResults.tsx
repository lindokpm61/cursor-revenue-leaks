
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
import { SaveSummaryButton } from "@/components/results/SaveSummaryButton";
import { useAnalysisNavigation } from "@/hooks/useAnalysisNavigation";
import { AnalysisBreadcrumb } from "@/components/navigation/AnalysisBreadcrumb";
import { AnalysisProgress } from "@/components/navigation/AnalysisProgress";
import { ExecutiveFirstSummary } from "@/components/results/ExecutiveFirstSummary";
import { MobileNavigationMenu } from "@/components/navigation/MobileNavigationMenu";

const CleanResults = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
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
    { id: 'overview', label: 'Strategic Overview', icon: Target },
    { id: 'breakdown', label: 'Revenue Analysis', icon: DollarSign },
    { id: 'benchmarking', label: 'Performance Insights', icon: TrendingUp },
    { id: 'actions', label: 'Priority Actions', icon: CheckCircle },
    { id: 'timeline', label: 'Implementation Plan', icon: BarChart3 }
  ];

  // Get current section label for display
  const currentSectionLabel = sections.find(s => s.id === activeSection)?.label || 'Strategic Overview';

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Mobile-First Header - Optimized for Mobile */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={navigation.navigateToDashboard} className="p-2 flex-shrink-0 touch-target">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="p-1.5 rounded-md bg-primary text-primary-foreground flex-shrink-0">
                  <Calculator className="h-3.5 w-3.5" />
                </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold truncate leading-tight text-primary">{submission.company_name}</h1>
            <p className="text-xs text-primary hidden sm:block">📊 STRATEGIC ANALYSIS COMPLETE</p>
          </div>
              </div>
            </div>
            
            {/* Mobile Navigation Menu - Right Side */}
            <MobileNavigationMenu
              sections={sections}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              currentSectionLabel={currentSectionLabel}
            />

            {/* Desktop Export CTA */}
            <div className="hidden sm:block">
              <EnhancedExportCTA />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile-Optimized Progress Indicator */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Target className="h-3 w-3 mr-1" />
              OPPORTUNITIES IDENTIFIED
            </Badge>
            <div className="flex items-center gap-2">
              {/* Current Section Indicator - Mobile Only */}
              <span className="text-xs text-muted-foreground sm:hidden">
                {currentSectionLabel}
              </span>
              <span className="text-xs text-primary font-medium">
                {formatCurrency(calculations.totalLoss)} OPPORTUNITY POTENTIAL
              </span>
            </div>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full w-full"></div>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <div className="mb-6 sm:mb-8 hidden sm:block">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <UnifiedStrategicAnalysis
            calculations={calculations}
            companyName={submission.company_name}
            formatCurrency={formatCurrency}
            onGetActionPlan={handleGetActionPlan}
            onQuickWins={() => setActiveSection('actions')}
            onBookCall={() => window.open('https://calendly.com/strategy-session', '_blank')}
          />
        )}

        {activeSection === 'breakdown' && (
          <UnifiedRevenueCharts
            calculations={calculations}
            formatCurrency={formatCurrency}
          />
        )}

        {activeSection === 'benchmarking' && (
          <IndustryBenchmarking 
            submission={submission}
            formatCurrency={formatCurrency}
            calculations={calculations}
          />
        )}

        {activeSection === 'actions' && (
          <div className="space-y-8" id="actions-section">
            <PriorityActions 
              submission={submission}
              formatCurrency={formatCurrency}
              calculations={calculations}
            />
          </div>
        )}

        {activeSection === 'timeline' && (
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
      </div>

      {/* Floating CTA Bar */}
      <FloatingCTABar 
        totalLeak={calculations.totalLoss} 
        formatCurrency={formatCurrency} 
      />
    </div>
  );
};

export default CleanResults;
