import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Calculator, 
  ArrowLeft, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Target,
  PieChart,
  BarChart3,
  Users,
  Clock,
  CreditCard,
  Settings,
  Download,
  Share2,
  ChevronDown,
  Info,
  ArrowUp,
  CheckCircle,
  TrendingUp as GrowthIcon,
  BarChart,
  Zap,
  Eye
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { IndustryBenchmarking } from "@/components/calculator/results/IndustryBenchmarking";
import { EnhancedInsights } from "@/components/calculator/results/EnhancedInsights";
import { validateRecoveryAssumptions, INDUSTRY_BENCHMARKS } from "@/lib/calculator/enhancedCalculations";
import { validateCalculationResults } from "@/lib/calculator/validationHelpers";
import { ExecutiveSummaryCard } from "@/components/results/ExecutiveSummaryCard";
import { SectionNavigation } from "@/components/results/SectionNavigation";
import { UserIntentSelector, type UserIntent } from "@/components/results/UserIntentSelector";
import { DecisionSupportPanel } from "@/components/results/DecisionSupportPanel";
import { TldrSummary } from "@/components/results/TldrSummary";
import { ProgressIndicator } from "@/components/results/ProgressIndicator";
import { ProgressiveNavigation } from "@/components/results/ProgressiveNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContentSequence } from "@/hooks/useContentSequence";

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [userIntent, setUserIntent] = useState<UserIntent>(null);
  const [viewMode, setViewMode] = useState<"simple" | "detailed">("simple");
  const [progressiveStep, setProgressiveStep] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const contentSequence = useContentSequence(userIntent);

  useEffect(() => {
    if (id) {
      loadSubmission(id);
    }
  }, [id]);

  const loadSubmission = async (submissionId: string) => {
    try {
      // Check if submissionId is valid UUID format
      if (!submissionId || submissionId === ':id' || submissionId.includes(':')) {
        throw new Error('Invalid submission ID format');
      }
      
      console.log('Loading submission:', submissionId);
      console.log('Current user:', user?.id);
      console.log('User role:', user?.user_metadata?.role);
      
      const { data, error } = await submissionService.getById(submissionId);
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Submission not found');
      }

      console.log('Submission data:', { 
        submissionUserId: data.user_id, 
        currentUserId: user?.id,
        userRole: user?.user_metadata?.role 
      });

      // Check if user has access to this submission
      if (data.user_id !== user?.id && user?.user_metadata?.role !== 'admin') {
        throw new Error(`Access denied. Submission belongs to user ${data.user_id}, current user is ${user?.id}`);
      }

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getLeakageColor = (leakage: number) => {
    if (leakage >= 1000000) return "text-revenue-danger";
    if (leakage >= 500000) return "text-revenue-warning";
    return "text-revenue-success";
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return "text-revenue-danger";
    if (score >= 60) return "text-revenue-warning";
    return "text-revenue-success";
  };

  const sections = [
    { id: 'executive-summary', label: 'Summary', readTime: '2 min' },
    { id: 'revenue-overview', label: 'Revenue Overview', readTime: '3 min' },
    { id: 'benchmarking', label: 'Benchmarking', readTime: '4 min' },
    { id: 'priority-actions', label: 'Actions', readTime: '3 min' },
    { id: 'timeline', label: 'Timeline', readTime: '2 min' },
  ];

  const scrollToActions = () => {
    const element = document.getElementById('priority-actions');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExpandSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getEstimatedReadTime = () => {
    return contentSequence.getEstimatedReadTime();
  };

  // Component renderers for dynamic content sequencing
  const renderSection = (sectionId: string, variant?: string) => {
    const sectionVariant = variant || contentSequence.getContentVariant(sectionId);
    const isExpanded = contentSequence.isAccordionExpanded(sectionId);

    switch (sectionId) {
      case 'executive-summary':
        return (
          <section id="executive-summary" className="mb-12">
            <ExecutiveSummaryCard 
              submission={submission} 
              formatCurrency={formatCurrency} 
              onGetActionPlan={scrollToActions}
            />
          </section>
        );

      case 'revenue-overview':
        return (
          <section id="revenue-overview" className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-revenue-warning/10 border-2 border-revenue-warning/20">
                <GrowthIcon className="h-5 w-5 text-revenue-warning" />
              </div>
              <div>
                <h2 className="text-h1 font-bold mb-2">Revenue Optimization Opportunity</h2>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs font-bold px-3 py-1 bg-revenue-warning/10 border-revenue-warning/30 text-revenue-warning">
                    💡 Essential
                  </Badge>
                  <span className="text-small text-muted-foreground">3 min read</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-8 bg-gradient-to-br from-background via-revenue-warning/5 to-revenue-success/5 rounded-2xl border-2 border-revenue-warning/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
              <div className="text-center relative border-l-4 border-revenue-warning/30 pl-4">
                <div className={`text-2xl sm:text-3xl font-bold mb-3 ${getLeakageColor(validatedTotalLeak)} leading-none`}>
                  {formatCurrency(validatedTotalLeak)}
                </div>
                <p className="text-sm font-medium text-revenue-warning">💰 Opportunity Size</p>
              </div>
              <div className="text-center relative border-l-4 border-revenue-success/30 pl-4">
                <div className="text-2xl sm:text-3xl font-bold text-revenue-success mb-3 leading-none flex items-center justify-center gap-2">
                  <ArrowUp className="h-5 w-5" />
                  {formatCurrency(realisticRecovery70)}
                </div>
                <p className="text-sm font-medium text-revenue-success">✅ Recovery Potential (70%)</p>
              </div>
              <div className="text-center relative border-l-4 border-revenue-primary/30 pl-4">
                <div className="text-2xl sm:text-3xl font-bold text-revenue-primary mb-3 leading-none flex items-center justify-center gap-2">
                  <ArrowUp className="h-5 w-5" />
                  {formatCurrency(realisticRecovery85)}
                </div>
                <p className="text-sm font-medium text-revenue-primary">🎯 Max Recovery (85%)</p>
              </div>
            </div>

            {/* Detailed Breakdown - conditionally show based on variant */}
            {(sectionVariant === 'detailed' || isExpanded) && (
              <Accordion type="multiple" className="space-y-6" defaultValue={isExpanded ? ["breakdown"] : []}>
                <AccordionItem value="breakdown" className="border rounded-lg px-6">
                  <AccordionTrigger className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <BarChart className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-semibold">Detailed Revenue Breakdown</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">📊 Detailed</Badge>
                          <span className="text-small text-muted-foreground">5 min read</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {leakageBreakdown.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <Card key={index} className="border-border/50 shadow-lg h-full">
                              <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="font-semibold leading-tight">{item.title}</CardTitle>
                                    <CardDescription className="text-sm mt-1 line-clamp-2">
                                      {item.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className={`text-2xl font-bold ${getLeakageColor(item.amount)} mb-2`}>
                                  {formatCurrency(item.amount)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {submission.current_arr && submission.current_arr > 0 
                                    ? `${((item.amount / submission.current_arr) * 100).toFixed(1)}% of ARR`
                                    : 'N/A'
                                  }
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </section>
        );

      case 'enhanced-insights':
        const showCompetitiveFraming = sectionVariant === 'competitive';
        return (
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10 border-2 border-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-h1 font-bold mb-2">
                  {showCompetitiveFraming ? "Competitive Analysis & Insights" : "Enhanced Analytics & Insights"}
                </h2>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs font-bold px-3 py-1 bg-primary/10 border-primary/30 text-primary">
                    {showCompetitiveFraming ? "🏆 Competitive" : "🔬 Advanced Analysis"}
                  </Badge>
                  <span className="text-small text-muted-foreground">4 min read</span>
                </div>
              </div>
            </div>
            
            {enhancedBreakdown.validation.warnings.length > 0 && (
              <Card className="mb-6 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" />
                    Calculation Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Confidence Level:</span>
                      <Badge variant={
                        enhancedBreakdown.validation.confidenceLevel === 'high' ? 'default' : 
                        enhancedBreakdown.validation.confidenceLevel === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {enhancedBreakdown.validation.confidenceLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-orange-700">Important Notes:</p>
                      <ul className="text-sm space-y-1 text-orange-600">
                        {enhancedBreakdown.validation.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">•</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <EnhancedInsights breakdown={enhancedBreakdown} />
          </section>
        );

      case 'benchmarking':
        return (
          <section id="benchmarking" className="mb-12">
            <IndustryBenchmarking 
              submission={submission} 
              formatCurrency={formatCurrency}
              variant={sectionVariant as any}
            />
          </section>
        );

      case 'priority-actions':
        return (
          <section id="priority-actions" className="mb-12">
            <PriorityActions 
              submission={submission} 
              formatCurrency={formatCurrency}
              variant={sectionVariant as any}
            />
          </section>
        );

      case 'timeline':
        return (
          <section id="timeline" className="mb-12">
            <ImplementationTimeline 
              submission={submission} 
              formatCurrency={formatCurrency}
              validatedValues={{
                totalLeak: validatedTotalLeak,
                leadResponseLoss: validatedLeadLoss,
                selfServeLoss: validatedSelfServeLoss,
                recoveryPotential70: realisticRecovery70,
                recoveryPotential85: realisticRecovery85
              }}
              variant={sectionVariant as any}
            />
          </section>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your results...</p>
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
            <h2 className="text-xl font-semibold mb-2">Results Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The requested results could not be found or you don't have access to them.
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

  // Validate calculations and apply realistic bounds
  const validation = validateCalculationResults({
    leadResponseLoss: submission.lead_response_loss || 0,
    failedPaymentLoss: submission.failed_payment_loss || 0,
    selfServeGap: submission.selfserve_gap_loss || 0,
    processLoss: submission.process_inefficiency_loss || 0,
    currentARR: submission.current_arr || 0,
    recoveryPotential70: submission.recovery_potential_70 || 0,
    recoveryPotential85: submission.recovery_potential_85 || 0
  });

  // Use validated values
  const validatedLeadLoss = validation.leadResponse.adjustedValue || submission.lead_response_loss || 0;
  const validatedSelfServeLoss = validation.selfServe.adjustedValue || submission.selfserve_gap_loss || 0;
  const validatedTotalLeak = validatedLeadLoss + (submission.failed_payment_loss || 0) + validatedSelfServeLoss + (submission.process_inefficiency_loss || 0);
  
  // Realistic recovery potential
  const realisticRecovery70 = Math.min(
    submission.recovery_potential_70 || 0,
    validatedTotalLeak * 0.7,
    (submission.current_arr || 0) * 1.5 // Never more than 1.5x ARR for 70% recovery
  );

  const realisticRecovery85 = Math.min(
    submission.recovery_potential_85 || 0,
    validatedTotalLeak * 0.85,
    (submission.current_arr || 0) * 2 // Never more than 2x ARR for 85% recovery
  );

  const leakageBreakdown = [
    {
      title: "Lead Response Loss",
      amount: validatedLeadLoss,
      icon: Users,
      description: "Lost revenue from slow lead response times"
    },
    {
      title: "Failed Payment Loss", 
      amount: submission.failed_payment_loss || 0,
      icon: CreditCard,
      description: "Revenue lost due to payment failures"
    },
    {
      title: "Self-Serve Gap",
      amount: validatedSelfServeLoss,
      icon: Target,
      description: "Missed opportunities in self-service conversion"
    },
    {
      title: "Process Inefficiency",
      amount: submission.process_inefficiency_loss || 0,
      icon: Settings,
      description: "Losses from manual processes and inefficiencies"
    }
  ];

  // Validation and sanity checks
  const calculationValidation = (() => {
    const warnings: string[] = [];
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    
    // Add validation warnings
    if (!validation.overall.isValid) {
      warnings.push(...validation.overall.warnings);
    }
    
    // Determine confidence level based on data quality
    if ((submission.current_arr || 0) > 1000000 && (submission.monthly_leads || 0) > 200) {
      confidenceLevel = 'high';
    } else if ((submission.current_arr || 0) < 100000 || validatedTotalLeak > (submission.current_arr || 0) * 10) {
      confidenceLevel = 'low';
    }
    
    return { warnings, confidenceLevel };
  })();

  // Create enhanced insights breakdown for the results page
  const enhancedBreakdown = {
    leadResponse: {
      dealSizeTier: (submission.average_deal_value || 0) > 100000 ? 'Enterprise' : 
                   (submission.average_deal_value || 0) > 25000 ? 'Mid-Market' : 'SMB',
      conversionImpact: submission.lead_response_loss || 0,
      responseTimeHours: submission.lead_response_time || 0,
      effectiveness: Math.max(0.25, 1 - ((submission.lead_response_time || 0) * 0.15))
    },
    failedPayments: {
      recoverySystem: 'Basic System',
      recoveryRate: 0.35,
      actualLossAfterRecovery: (submission.failed_payment_loss || 0) * 0.65,
      monthlyImpact: (submission.failed_payment_loss || 0) / 12
    },
    selfServeGap: {
      industryBenchmark: INDUSTRY_BENCHMARKS[submission.industry as keyof typeof INDUSTRY_BENCHMARKS]?.conversionRate || 3.4,
      industryName: submission.industry || 'Other',
      gapPercentage: Math.max(0, (INDUSTRY_BENCHMARKS[submission.industry as keyof typeof INDUSTRY_BENCHMARKS]?.conversionRate || 3.4) - (submission.free_to_paid_conversion || 0)),
      currentConversion: submission.free_to_paid_conversion || 0,
      potentialARPU: (submission.monthly_mrr || 0) / Math.max(1, (submission.monthly_free_signups || 0) * (submission.free_to_paid_conversion || 1) / 100)
    },
    processInefficiency: {
      revenueGeneratingPotential: (submission.process_inefficiency_loss || 0) * 0.32,
      automationPotential: 0.7,
      weeklyHours: submission.manual_hours || 0,
      hourlyRate: submission.hourly_rate || 0
    },
    recoveryValidation: (() => {
      const validation = validateRecoveryAssumptions({
        currentARR: submission.current_arr || 0,
        grossRetention: 85,
        netRetention: 100,
        customerSatisfaction: 8,
        hasRevOps: true
      });
      return {
        canAchieve70: validation.canAchieve70,
        canAchieve85: validation.canAchieve85,
        limitations: validation.reasons
      };
    })(),
    validation: calculationValidation
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary flex-shrink-0">
                  <Calculator className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <span className="text-sm sm:text-xl font-bold leading-tight truncate">
                  Revenue Analysis Results
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="px-2 sm:px-3">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Export PDF</span>
              </Button>
              <Button variant="outline" size="sm" className="px-2 sm:px-3">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Section Navigation */}
      <SectionNavigation sections={sections} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-xl sm:text-3xl font-bold mb-2 break-words">{submission.company_name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
              <span className="break-all text-sm sm:text-base">{submission.contact_email}</span>
              {submission.industry && (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">•</span>
                  <Badge variant="outline" className="capitalize text-xs sm:text-sm w-fit">
                    {submission.industry}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">•</span>
                <span className="text-xs sm:text-base">{new Date(submission.created_at!).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* LAYER 1: Always Visible - Executive Summary and User Intent */}
        <>
            {/* Executive Summary - Always first */}
            {renderSection('executive-summary')}

            {/* User Intent Selector - After executive summary */}
            <UserIntentSelector
              selectedIntent={userIntent}
              onIntentChange={setUserIntent}
              estimatedTime={getEstimatedReadTime()}
            />

            {/* TLDR Summary - After intent selection */}
            {userIntent && (
              <TldrSummary 
                submission={submission}
                userIntent={userIntent}
                formatCurrency={formatCurrency}
                onExpandSection={handleExpandSection}
              />
            )}

            {/* LAYER 2: Intent-Based Content Sequence */}
            {userIntent ? (
              // Personalized content sequence based on user intent
              <>
                {contentSequence.getContentSequence().sections
                  .filter(section => section.id !== 'executive-summary') // Already rendered
                  .sort((a, b) => a.priority - b.priority)
                  .map(section => renderSection(section.id, section.variant))
                }
              </>
            ) : (
              // Default linear flow for exploring
              <>
                {renderSection('revenue-overview')}
                {renderSection('enhanced-insights')}
                {renderSection('benchmarking')}
                {renderSection('priority-actions')}
                {renderSection('timeline')}
              </>
            )}

            {/* Decision Support Panel - Intelligent Content Based on User Intent */}
            {userIntent && (
              <DecisionSupportPanel 
                submission={submission}
                userIntent={userIntent}
                formatCurrency={formatCurrency}
              />
            )}



            {/* LAYER 3: On-Demand Content */}
            {(submission.twenty_contact_id || submission.n8n_triggered || submission.smartlead_campaign_id || submission.synced_to_self_hosted) && (
              <Accordion type="single" collapsible className="mb-8">
                <AccordionItem value="integrations" className="border rounded-lg px-6">
                  <AccordionTrigger className="py-4">
                    <div className="flex items-center gap-4">
                       <div className="p-2 rounded-xl bg-muted/50 border border-border">
                         <BarChart3 className="h-4 w-4 text-muted-foreground" />
                       </div>
                      <div className="text-left">
                        <h3 className="text-h3 font-semibold text-muted-foreground">Integration Status</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-xs px-3 py-1 text-muted-foreground">🔧 Technical</Badge>
                          <span className="text-small text-muted-foreground">1 min read</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-muted-foreground mb-4">
                      External system integration and sync status
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {submission.twenty_contact_id && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-revenue-success rounded-full"></div>
                          <span className="text-sm">Twenty CRM Synced</span>
                        </div>
                      )}
                      {submission.n8n_triggered && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-revenue-success rounded-full"></div>
                          <span className="text-sm">N8N Workflow Triggered</span>
                        </div>
                      )}
                      {submission.smartlead_campaign_id && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-revenue-success rounded-full"></div>
                          <span className="text-sm">Smartlead Campaign Added</span>
                        </div>
                      )}
                      {submission.synced_to_self_hosted && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-revenue-success rounded-full"></div>
                          <span className="text-sm">Self-Hosted Synced</span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
        </>
      </div>
    </div>
  );
};

export default Results;