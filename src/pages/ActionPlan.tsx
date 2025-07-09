import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  ArrowLeft, 
  TrendingUp, 
  Target,
  Clock,
  CheckCircle,
  Download,
  Calendar,
  Users,
  Zap,
  AlertTriangle,
  BookOpen,
  Phone
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const ActionPlan = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(15);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate(`/login`);
      return;
    }
    
    if (id) {
      loadSubmission(id);
    }
  }, [id, user]);

  const loadSubmission = async (submissionId: string) => {
    try {
      const { data, error } = await submissionService.getById(submissionId);
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Submission not found');
      }

      // Check access permissions
      if (data.user_id !== user?.id && user?.user_metadata?.role !== 'admin') {
        throw new Error('Access denied');
      }

      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load action plan.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);
  };

  const calculateROI = (submission: Submission) => {
    if (!submission.total_leak || !submission.recovery_potential_70) return 0;
    const implementationCost = submission.recovery_potential_70 * 0.15; // Assume 15% implementation cost
    return Math.round(((submission.recovery_potential_70 - implementationCost) / implementationCost) * 100);
  };

  const getPriorityActions = (submission: Submission) => {
    const actions = [];
    
    if (submission.lead_response_loss && submission.lead_response_loss > 0) {
      actions.push({
        id: 'lead-response',
        title: 'Implement Automated Lead Response',
        impact: submission.lead_response_loss,
        timeframe: '2-4 weeks',
        difficulty: 'Medium',
        description: 'Set up automated lead response systems to capture leads within minutes'
      });
    }
    
    if (submission.failed_payment_loss && submission.failed_payment_loss > 0) {
      actions.push({
        id: 'payment-recovery',
        title: 'Deploy Payment Recovery System',
        impact: submission.failed_payment_loss,
        timeframe: '1-2 weeks',
        difficulty: 'Easy',
        description: 'Implement automated dunning management and payment retry logic'
      });
    }
    
    if (submission.selfserve_gap_loss && submission.selfserve_gap_loss > 0) {
      actions.push({
        id: 'self-serve',
        title: 'Optimize Self-Serve Conversion',
        impact: submission.selfserve_gap_loss,
        timeframe: '4-6 weeks',
        difficulty: 'Hard',
        description: 'Enhance onboarding flow and reduce conversion friction'
      });
    }
    
    if (submission.process_inefficiency_loss && submission.process_inefficiency_loss > 0) {
      actions.push({
        id: 'automation',
        title: 'Automate Manual Processes',
        impact: submission.process_inefficiency_loss,
        timeframe: '6-8 weeks',
        difficulty: 'Hard',
        description: 'Replace manual workflows with automated systems'
      });
    }

    return actions.sort((a, b) => (b.impact || 0) - (a.impact || 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your action plan...</p>
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
            <h2 className="text-xl font-semibold mb-2">Action Plan Not Found</h2>
            <p className="text-muted-foreground mb-6">
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

  const priorityActions = getPriorityActions(submission);
  const roi = calculateROI(submission);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to={`/results/${submission.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Results
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Action Plan</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/5 via-revenue-primary/5 to-revenue-success/5 rounded-2xl p-8 mb-12 border border-primary/20">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">{submission.company_name} Action Plan</h1>
            <p className="text-xl text-muted-foreground">
              Personalized recovery roadmap • Generated {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-revenue-danger/20 bg-revenue-danger/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-revenue-danger mb-2">Total Revenue Leak</h3>
                <p className="text-3xl font-bold text-revenue-danger">
                  {formatCurrency(submission.total_leak || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Annual opportunity cost</p>
              </CardContent>
            </Card>
            
            <Card className="border-revenue-success/20 bg-revenue-success/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-revenue-success mb-2">Recovery Potential</h3>
                <p className="text-3xl font-bold text-revenue-success">
                  {formatCurrency(submission.recovery_potential_70 || 0)}
                </p>
                <p className="text-sm text-muted-foreground">70% achievable in 6 months</p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">ROI Potential</h3>
                <p className="text-3xl font-bold text-primary">{roi}%</p>
                <p className="text-sm text-muted-foreground">Return on implementation</p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-background/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Implementation Progress</h4>
                <span className="text-sm text-muted-foreground">{progress}% Complete</span>
              </div>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-muted-foreground">Analysis Complete • Ready to Implement</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="actions">Priority Actions</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Quick Wins vs Long-term */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-revenue-warning" />
                    Quick Wins (0-30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-revenue-success/10 border border-revenue-success/20">
                      <CheckCircle className="h-4 w-4 text-revenue-success" />
                      <span className="text-sm">Set up automated lead response alerts</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-revenue-success/10 border border-revenue-success/20">
                      <CheckCircle className="h-4 w-4 text-revenue-success" />
                      <span className="text-sm">Implement basic payment retry logic</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-revenue-success/10 border border-revenue-success/20">
                      <CheckCircle className="h-4 w-4 text-revenue-success" />
                      <span className="text-sm">Audit current manual processes</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Expected recovery: <span className="font-semibold text-revenue-success">
                        {formatCurrency((submission.recovery_potential_70 || 0) * 0.3)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Strategic Initiatives (3-6 months)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm">Advanced lead scoring and qualification</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm">Predictive churn prevention system</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm">Complete process automation suite</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Expected recovery: <span className="font-semibold text-primary">
                        {formatCurrency((submission.recovery_potential_70 || 0) * 0.7)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { phase: "Phase 1", duration: "Weeks 1-8", focus: "Foundation & Quick Wins", color: "revenue-warning" },
                { phase: "Phase 2", duration: "Weeks 9-16", focus: "System Integration", color: "primary" },
                { phase: "Phase 3", duration: "Weeks 17-24", focus: "Optimization & Scale", color: "revenue-success" }
              ].map((phase, index) => (
                <Card key={phase.phase} className={`border-${phase.color}/20 bg-${phase.color}/5`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`bg-${phase.color}/10 rounded-full p-3`}>
                        <span className="text-2xl">⭐</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{phase.phase}</CardTitle>
                        <p className="text-sm text-muted-foreground">{phase.duration}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-3">{phase.focus}</h4>
                    <div className="space-y-2">
                      {priorityActions.slice(index, index + 2).map(action => (
                        <div key={action.id} className="text-sm p-2 rounded bg-background/50">
                          {action.title}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Expected Recovery: <span className={`font-semibold text-${phase.color}`}>
                          {formatCurrency((submission.recovery_potential_70 || 0) / 3)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-8">
            <div className="space-y-6">
              {priorityActions.map((action, index) => (
                <Card key={action.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <CardTitle className="text-xl">{action.title}</CardTitle>
                          <p className="text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-revenue-success">
                          {formatCurrency(action.impact || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Recovery Potential</p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {action.timeframe}
                      </Badge>
                      <Badge variant="outline">
                        Difficulty: {action.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="next-steps" className="space-y-8">
            <div className="bg-gradient-to-r from-primary to-revenue-primary rounded-xl p-8 text-primary-foreground">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Implement?</h2>
                <p className="text-xl mb-8 opacity-90">
                  Get expert guidance to maximize your {formatCurrency(submission.recovery_potential_70 || 0)} recovery potential
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-background text-foreground">
                    <CardContent className="p-6 text-center">
                      <Phone className="h-8 w-8 mx-auto mb-3 text-revenue-primary" />
                      <h3 className="font-bold mb-2">Strategy Call</h3>
                      <p className="text-sm text-muted-foreground mb-4">Get personalized implementation guidance</p>
                      <Button className="w-full bg-revenue-primary text-primary-foreground">
                        Book Free Consultation
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background text-foreground">
                    <CardContent className="p-6 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h3 className="font-bold mb-2">Implementation Guide</h3>
                      <p className="text-sm text-muted-foreground mb-4">Download detailed step-by-step guide</p>
                      <Button variant="outline" className="w-full">
                        Download Guide
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background text-foreground">
                    <CardContent className="p-6 text-center">
                      <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="font-bold mb-2">Progress Updates</h3>
                      <p className="text-sm text-muted-foreground mb-4">Get weekly implementation tips</p>
                      <Button variant="secondary" className="w-full">
                        Subscribe to Updates
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ActionPlan;