import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Share2
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
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
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Lead Score</div>
              <div className={`text-2xl font-bold ${getLeadScoreColor(submission.lead_score || 0)}`}>
                {submission.lead_score || 0}/100
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="mb-8 border-revenue-danger/20 bg-gradient-to-r from-background to-revenue-danger/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-revenue-danger" />
              <div>
                <CardTitle className="text-2xl text-revenue-danger">
                  Revenue Leak Analysis
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Annual revenue impact and recovery opportunities
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(submission.current_arr || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Current ARR</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${getLeakageColor(submission.total_leak || 0)}`}>
                  {formatCurrency(submission.total_leak || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Revenue Leak</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-revenue-success mb-2">
                  {formatCurrency(submission.recovery_potential_70 || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Recovery Potential (70%)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-revenue-primary mb-2">
                  {formatCurrency(submission.recovery_potential_85 || 0)}
                </div>
                <p className="text-sm text-muted-foreground">Max Recovery (85%)</p>
              </div>
            </div>
            
            {submission.leak_percentage && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Revenue Leak Percentage</span>
                  <span className="font-medium">{submission.leak_percentage}%</span>
                </div>
                <Progress value={Math.min(submission.leak_percentage, 100)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leakage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {leakageBreakdown.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getLeakageColor(item.amount)}`}>
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
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

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lead Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Leads</span>
                <span className="font-medium">{submission.monthly_leads || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Deal Value</span>
                <span className="font-medium">{formatCurrency(submission.average_deal_value || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="font-medium">{submission.lead_response_time || 0}h</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Self-Serve Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Free Signups</span>
                <span className="font-medium">{submission.monthly_free_signups || 0}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-medium">{submission.free_to_paid_conversion || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly MRR</span>
                <span className="font-medium">{formatCurrency(submission.monthly_mrr || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Failed Payment Rate</span>
                <span className="font-medium">{submission.failed_payment_rate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Manual Hours/Week</span>
                <span className="font-medium">{submission.manual_hours || 0}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">{formatCurrency(submission.hourly_rate || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Actions */}
        <PriorityActions submission={submission} formatCurrency={formatCurrency} />

        {/* Integration Status */}
        {(submission.twenty_contact_id || submission.n8n_triggered || submission.smartlead_campaign_id || submission.synced_to_self_hosted) && (
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Integration Status
              </CardTitle>
              <CardDescription>
                External system integration and sync status
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Results;