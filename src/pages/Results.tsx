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
  Info
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { IndustryBenchmarking } from "@/components/calculator/results/IndustryBenchmarking";
import { ExecutiveSummaryCard } from "@/components/results/ExecutiveSummaryCard";
import { SectionNavigation } from "@/components/results/SectionNavigation";
import { UserIntentSelector, type UserIntent } from "@/components/results/UserIntentSelector";
import { DecisionSupportPanel } from "@/components/results/DecisionSupportPanel";
import { TldrSummary } from "@/components/results/TldrSummary";
import { ProgressIndicator } from "@/components/results/ProgressIndicator";
import { ProgressiveNavigation } from "@/components/results/ProgressiveNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

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

  useEffect(() => {
    if (id) {
      loadSubmission(id);
    }
  }, [id]);

  const loadSubmission = async (submissionId: string) => {
    try {
      const { data, error } = await submissionService.getById(submissionId);
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Submission not found');
      }

      // Check if user has access to this submission
      if (data.user_id !== user?.id && user?.user_metadata?.role !== 'admin') {
        throw new Error('Access denied');
      }

      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: "Failed to load results. Please try again.",
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
    { id: 'technical-details', label: 'Details', readTime: '5 min' },
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
    if (!userIntent) return "15 min";
    
    switch (userIntent) {
      case "understand-problem": return "8 min";
      case "quick-wins": return "5 min";
      case "plan-implementation": return "12 min";
      case "compare-competitors": return "10 min";
      default: return "15 min";
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

  const leakageBreakdown = [
    {
      title: "Lead Response Loss",
      amount: submission.lead_response_loss || 0,
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
      amount: submission.selfserve_gap_loss || 0,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                  <Calculator className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Revenue Analysis Results</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
      </nav>

      {/* Section Navigation */}
      <SectionNavigation sections={sections} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-2">{submission.company_name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{submission.contact_email}</span>
              {submission.industry && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="capitalize">
                    {submission.industry}
                  </Badge>
                </>
              )}
              <span>•</span>
              <span>{new Date(submission.created_at!).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* MOBILE-FIRST PROGRESSIVE DISCLOSURE */}
        {isMobile ? (
          // Progressive Navigation for Mobile
          <>
            <ProgressiveNavigation 
              currentStep={progressiveStep}
              onStepChange={setProgressiveStep}
              totalSteps={4}
            />
            
            {/* Step-by-step content revelation */}
            {progressiveStep === 0 && (
              <section id="executive-summary" className="mb-12">
                <ExecutiveSummaryCard 
                  submission={submission} 
                  formatCurrency={formatCurrency} 
                  onGetActionPlan={() => setProgressiveStep(1)}
                />
              </section>
            )}

            {progressiveStep === 1 && (
              <section id="priority-actions" className="mb-12">
                <PriorityActions submission={submission} formatCurrency={formatCurrency} />
              </section>
            )}

            {progressiveStep === 2 && (
              <section id="timeline" className="mb-12">
                <ImplementationTimeline submission={submission} formatCurrency={formatCurrency} />
              </section>
            )}

            {progressiveStep === 3 && (
              <>
                <section id="benchmarking" className="mb-12">
                  <IndustryBenchmarking submission={submission} formatCurrency={formatCurrency} />
                </section>
                
                <Accordion type="multiple" className="space-y-6 mb-12">
                  <AccordionItem value="breakdown" className="border rounded-lg px-6">
                    <AccordionTrigger className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                          <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-h3 font-bold">Detailed Breakdown</h3>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="space-y-4">
                        {leakageBreakdown.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <div key={index} className="p-4 rounded-lg border border-border/50 bg-background/50">
                              <div className="flex items-center gap-3 mb-2">
                                <Icon className="h-5 w-5 text-primary" />
                                <span className="font-medium text-small">{item.title}</span>
                              </div>
                              <div className={`text-h3 font-bold ${getLeakageColor(item.amount)} mb-1`}>
                                {formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </>
        ) : (
          // Desktop: Existing Layout with Cognitive Load Optimization
          <>
            {/* LAYER 1: Always Visible */}
            {/* Executive Summary */}
            <section id="executive-summary" className="mb-12">
              <ExecutiveSummaryCard 
                submission={submission} 
                formatCurrency={formatCurrency} 
                onGetActionPlan={scrollToActions}
              />
            </section>

            {/* Revenue Overview - Essential Metrics */}
            <section id="revenue-overview" className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-revenue-danger/10 border-2 border-revenue-danger/20">
                  <AlertTriangle className="h-8 w-8 text-revenue-danger" />
                </div>
                <div>
                  <h2 className="text-h1 font-bold mb-2">Revenue Leak Overview</h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs font-bold px-3 py-1 bg-revenue-danger/10 border-revenue-danger/30 text-revenue-danger">
                      🚨 Essential
                    </Badge>
                    <span className="text-small text-muted-foreground">3 min read</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-8 bg-gradient-to-br from-background via-revenue-danger/5 to-revenue-warning/5 rounded-2xl border-2 border-revenue-danger/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
                <div className="text-center relative border-l-4 border-revenue-danger/30 pl-4">
                  <div className={`text-h1 font-bold mb-3 ${getLeakageColor(submission.total_leak || 0)} leading-none`}>
                    {formatCurrency(submission.total_leak || 0)}
                  </div>
                  <p className="text-small font-medium text-revenue-danger">🚨 Total Revenue Leak</p>
                </div>
                <div className="text-center relative border-l-4 border-revenue-success/30 pl-4">
                  <div className="text-h2 font-bold text-revenue-success mb-3 leading-none">
                    {formatCurrency(submission.recovery_potential_70 || 0)}
                  </div>
                  <p className="text-small font-medium text-revenue-success">✅ Recovery Potential (70%)</p>
                </div>
                <div className="text-center relative border-l-4 border-revenue-primary/30 pl-4">
                  <div className="text-h2 font-bold text-revenue-primary mb-3 leading-none">
                    {formatCurrency(submission.recovery_potential_85 || 0)}
                  </div>
                  <p className="text-small font-medium text-revenue-primary">🎯 Max Recovery (85%)</p>
                </div>
              </div>
            </section>

            <UserIntentSelector
              selectedIntent={userIntent}
              onIntentChange={setUserIntent}
              estimatedTime={getEstimatedReadTime()}
            />

            {/* Detailed Breakdown - Moved here */}
            <Accordion type="multiple" className="space-y-6 mb-12">
              <AccordionItem value="breakdown" className="border rounded-lg px-6">
                <AccordionTrigger className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <DollarSign className="h-6 w-6 text-blue-600" />
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
                    {/* Revenue Breakdown Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {leakageBreakdown.map((item, index) => {
                        const Icon = item.icon;
                        return (
                          <Card key={index} className="border-border/50 shadow-lg h-full">
                            <CardHeader className="pb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                  <Icon className="h-5 w-5 text-primary" />
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

                    {/* Technical Metrics & Operations */}
                    <Card className="border-border/50 shadow-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted/50 flex-shrink-0">
                            <Settings className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="font-semibold leading-tight">Technical Metrics & Operations</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              Operational data and system metrics
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Lead Generation
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Monthly Leads</span>
                                <span className="font-medium text-sm">{submission.monthly_leads || 0}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Avg Deal Value</span>
                                <span className="font-medium text-sm">{formatCurrency(submission.average_deal_value || 0)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Response Time</span>
                                <span className="font-medium text-sm">{submission.lead_response_time || 0}h</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Self-Serve Metrics
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Free Signups</span>
                                <span className="font-medium text-sm">{submission.monthly_free_signups || 0}/month</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                                <span className="font-medium text-sm">{submission.free_to_paid_conversion || 0}%</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Monthly MRR</span>
                                <span className="font-medium text-sm">{formatCurrency(submission.monthly_mrr || 0)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Operations
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Failed Payment Rate</span>
                                <span className="font-medium text-sm">{submission.failed_payment_rate || 0}%</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Manual Hours/Week</span>
                                <span className="font-medium text-sm">{submission.manual_hours || 0}h</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm text-muted-foreground">Hourly Rate</span>
                                <span className="font-medium text-sm">{formatCurrency(submission.hourly_rate || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {userIntent && (
              <TldrSummary 
                submission={submission}
                userIntent={userIntent}
                formatCurrency={formatCurrency}
                onExpandSection={handleExpandSection}
              />
            )}

            <ProgressIndicator sections={sections} />

            {/* Industry Benchmarking */}
            <section id="benchmarking" className="mb-12">
              <IndustryBenchmarking submission={submission} formatCurrency={formatCurrency} />
            </section>

            {/* Decision Support Panel - Intelligent Content Based on User Intent */}
            {userIntent && (
              <DecisionSupportPanel 
                submission={submission}
                userIntent={userIntent}
                formatCurrency={formatCurrency}
              />
            )}

            {/* Priority Actions */}
            <section id="priority-actions" className="mb-12">
              <PriorityActions submission={submission} formatCurrency={formatCurrency} />
            </section>

            {/* Implementation Timeline & ROI */}
            <section id="timeline" className="mb-12">
              <ImplementationTimeline submission={submission} formatCurrency={formatCurrency} />
            </section>


            {/* LAYER 3: On-Demand Content */}
            {(submission.twenty_contact_id || submission.n8n_triggered || submission.smartlead_campaign_id || submission.synced_to_self_hosted) && (
              <Accordion type="single" collapsible className="mb-8">
                <AccordionItem value="integrations" className="border rounded-lg px-6">
                  <AccordionTrigger className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted/50 border border-border">
                        <BarChart3 className="h-6 w-6 text-muted-foreground" />
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
        )}
      </div>
    </div>
  );
};

export default Results;