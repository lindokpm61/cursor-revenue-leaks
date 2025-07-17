import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  Phone,
  Trophy,
  Sparkles,
  Rocket,
  Star,
  ChevronRight,
  Play,
  ArrowRight,
  Timer,
  Users2,
  Lightbulb,
  TrendingDown,
  Eye,
  Share2,
  Copy,
  BarChart3,
  Activity,
  
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  calculateLeadResponseImpact,
  calculateFailedPaymentLoss,
  calculateSelfServeGap,
  calculateProcessInefficiency,
  validateRecoveryAssumptions,
  INDUSTRY_BENCHMARKS
} from "@/lib/calculator/enhancedCalculations";
import { calculateUnifiedResults, generateRealisticTimeline, UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";
import { 
  validateCalculationResults,
  getCalculationConfidenceLevel
} from "@/lib/calculator/validationHelpers";
import { ImplementationTimeline } from "@/components/calculator/results/ImplementationTimeline";
import { PriorityActions } from "@/components/calculator/results/PriorityActions";

const ActionPlan = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(15);
  const [checkedActions, setCheckedActions] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState("overview");
  const [sessionStartTime] = useState(Date.now());
  const [timeTrackers, setTimeTrackers] = useState<NodeJS.Timeout[]>([]);
  const [engagementScore, setEngagementScore] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
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
    
    // Load user profile
    loadUserProfile();
    
    // Set up engagement tracking when component mounts
    setupEngagementTracking();
  }, [id, user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }
      
      setUserProfile(profile);
      if (profile?.checked_actions && Array.isArray(profile.checked_actions)) {
        setCheckedActions(profile.checked_actions.filter((item): item is string => typeof item === 'string'));
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const setupEngagementTracking = () => {
    if (!user || !submission) return;
    
    // Track initial page view
    trackEngagementEvent('action_plan_viewed', {
      recovery_potential: submission.recovery_potential_70 || submission.total_leak,
      user_type: user.user_metadata?.role || 'standard'
    });
    
    // Set up time milestone trackers
    const timeTrackerIds = [
      setTimeout(() => trackEngagementEvent('time_spent_2min', {}), 120000), // 2 minutes
      setTimeout(() => trackEngagementEvent('time_spent_5min', {}), 300000)  // 5 minutes
    ];
    
    setTimeTrackers(timeTrackerIds);
    
    // Cleanup function for when component unmounts
    return () => {
      timeTrackerIds.forEach(clearTimeout);
      
      // Track session end with total time spent
      const totalTime = Date.now() - sessionStartTime;
      trackEngagementEvent('session_end', { 
        duration: totalTime,
        actions_checked: checkedActions.length,
        tabs_visited: [currentTab]
      });
    };
  };

  // Cleanup timeTrackers on unmount
  useEffect(() => {
    return () => {
      timeTrackers.forEach(clearTimeout);
      
      // Track session end
      if (user && submission) {
        const totalTime = Date.now() - sessionStartTime;
        trackEngagementEvent('session_end', { 
          duration: totalTime,
          actions_checked: checkedActions.length,
          final_tab: currentTab
        });
      }
    };
  }, []);

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
      console.log('Action Plan - Loaded submission:', data);
      // Load saved action progress
      await loadActionProgress(data.id);
      
      // Load user engagement score
      await loadEngagementScore();
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

  const loadEngagementScore = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('engagement_score')
        .eq('id', user?.id)
        .single();
      
      if (data?.engagement_score) {
        setEngagementScore(data.engagement_score);
      }
    } catch (error) {
      console.error('Error loading engagement score:', error);
    }
  };

  const loadActionProgress = async (submissionId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('checked_actions')
        .eq('id', user?.id)
        .single();
      
      if (data?.checked_actions && Array.isArray(data.checked_actions)) {
        setCheckedActions(data.checked_actions as string[]);
      }
    } catch (error) {
      console.error('Error loading action progress:', error);
    }
  };

  const handleActionToggle = async (actionId: string, isChecked: boolean) => {
    const newCheckedActions = isChecked
      ? [...checkedActions, actionId]
      : checkedActions.filter(id => id !== actionId);
    
    setCheckedActions(newCheckedActions);
    
    // Save to database
    await saveActionProgress(newCheckedActions);
    
    // Track engagement event with action interaction
    await trackEngagementEvent('action_interaction', {
      actionId,
      isChecked,
      actionTitle: priorityActions.find(a => a.id === actionId)?.title,
      recoveryPotential: priorityActions.find(a => a.id === actionId)?.impact,
      difficulty: priorityActions.find(a => a.id === actionId)?.difficulty,
      timeframe: priorityActions.find(a => a.id === actionId)?.timeframe,
      total_checked: newCheckedActions.length,
      completion_percentage: (newCheckedActions.length / priorityActions.length) * 100
    });
  };

  const saveActionProgress = async (checkedActionIds: string[]) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          checked_actions: checkedActionIds,
          actions_checked_count: checkedActionIds.length,
          last_analysis_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving action progress:', error);
    }
  };

  const trackEngagementEvent = async (eventType: string, eventData: any = {}) => {
    if (!user || !submission) return;
    
    try {
      // Create engagement event
      await supabase
        .from('user_engagement_events')
        .insert({
          user_id: user.id,
          submission_id: submission.id,
          event_type: eventType,
          event_data: {
            ...eventData,
            timestamp: new Date().toISOString(),
            page_url: window.location.pathname,
            user_agent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          }
        });
      
      // Update engagement score using the database function
      await supabase.rpc('update_engagement_score', {
        p_user_id: user.id,
        p_event_type: eventType
      });
      
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  };

  const handleTabChange = (tabValue: string) => {
    setCurrentTab(tabValue);
    
    // Track tab navigation
    trackEngagementEvent('tab_navigation', {
      from_tab: currentTab,
      to_tab: tabValue,
      time_since_load: Date.now() - sessionStartTime
    });
  };

  const handleCTAInteraction = (ctaType: string, ctaLabel: string, priority: string = 'primary') => {
    trackEngagementEvent('cta_interaction', {
      cta_type: ctaType,
      cta_label: ctaLabel,
      cta_priority: priority,
      engagement_score: engagementScore,
      actions_checked: checkedActions.length,
      recovery_potential: submission?.recovery_potential_70 || submission?.total_leak,
      engagement_level: getEngagementLevel()
    });
  };

  const handleExportPDF = async () => {
    try {
      // Track the export action
      await trackEngagementEvent('export_pdf', {
        recovery_potential: submission?.recovery_potential_70 || 0,
        actions_checked: checkedActions.length,
        engagement_level: getEngagementLevel()
      });

      // Create a simple PDF export using the browser's print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${submission?.company_name} Action Plan</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; }
                .action { margin: 10px 0; padding: 10px; background: #f5f5f5; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${submission?.company_name} Revenue Recovery Action Plan</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="section">
                <h2>Executive Summary</h2>
                <div class="metric">
                  <strong>Total Revenue Leak:</strong> ${formatCurrency(calculations.total_leak)}
                </div>
                <div class="metric">
                  <strong>Recovery Potential:</strong> ${formatCurrency(calculations.recovery_potential_70)}
                </div>
                <div class="metric">
                  <strong>Implementation ROI:</strong> ${calculateROI(submission)}%
                </div>
              </div>

              <div class="section">
                <h2>Priority Actions</h2>
                ${priorityActions.map(action => `
                  <div class="action">
                    <h3>${action.title}</h3>
                    <p><strong>Impact:</strong> ${formatCurrency(action.impact || 0)}</p>
                    <p><strong>Timeframe:</strong> ${action.timeframe}</p>
                    <p><strong>Difficulty:</strong> ${action.difficulty}</p>
                    <p>${action.description}</p>
                  </div>
                `).join('')}
              </div>

              <div class="section">
                <h2>Implementation Progress</h2>
                <p>Actions Completed: ${checkedActions.length} of ${priorityActions.length}</p>
                <p>Progress: ${Math.round((checkedActions.length / priorityActions.length) * 100)}%</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getEngagementLevel = () => {
    // Use actual engagement data from user profile if available
    const baseScore = userProfile?.engagement_score || 0;
    const actionScore = checkedActions.length * 15; // 15 points per action
    const timeScore = Math.min((Date.now() - sessionStartTime) / (1000 * 60 * 2) * 10, 20); // Up to 20 points for 2+ minutes
    const returnVisitScore = userProfile?.return_visits ? Math.min(userProfile.return_visits * 10, 30) : 0;
    
    const totalScore = baseScore + actionScore + timeScore + returnVisitScore;
    
    if (totalScore >= 70 || checkedActions.length >= 3) return 'high';
    if (totalScore >= 40 || checkedActions.length >= 2) return 'medium';
    return 'low';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);
  };

  const ProgressEncouragement = () => {
    const completionPercentage = Math.round((checkedActions.length / priorityActions.length) * 100);
    
    if (checkedActions.length === 0) {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Rocket className="h-6 w-6 text-blue-600" />
            <div>
              <strong className="text-blue-700 font-semibold">Ready to Begin Implementation</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Start by selecting your first action below to track your progress
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (completionPercentage < 100) {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-emerald-600" />
            <div>
              <strong className="text-emerald-700 font-semibold">
                Great Progress! {completionPercentage}% Complete
              </strong>
              <p className="text-sm text-muted-foreground mt-1">
                {checkedActions.length} of {priorityActions.length} actions tracked • Keep going!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-amber-600" />
          <div>
            <strong className="text-amber-700 font-semibold">All Actions Identified!</strong>
            <p className="text-sm text-muted-foreground mt-1">
              Ready for implementation support? Consider booking a strategy call
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderContextualCTAs = () => {
    const engagementLevel = getEngagementLevel();
    const recoveryPotential = submission?.recovery_potential_70 || 0;
    const completionPercentage = Math.round((checkedActions.length / priorityActions.length) * 100);
    
    // Show implementation support for users who are progressing
    if (completionPercentage >= 50 || engagementLevel === 'high') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Phone className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Implementation Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get expert guidance for your {formatCurrency(recoveryPotential)} recovery
              </p>
              <Button 
                className="w-full"
                onClick={() => handleCTAInteraction('consultation', 'Book Strategy Call', 'primary')}
              >
                Book Strategy Call
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Implementation Guide</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download step-by-step instructions
              </p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleCTAInteraction('guide', 'Download Guide', 'secondary')}
              >
                Download Guide
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Show gentle guidance for beginners
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <h4 className="font-medium mb-1">Implementation Guide</h4>
            <p className="text-xs text-muted-foreground mb-3">Step-by-step instructions</p>
            <Button 
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleCTAInteraction('guide', 'Download Guide', 'secondary')}
            >
              Download
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
            <h4 className="font-medium mb-1">Strategy Session</h4>
            <p className="text-xs text-muted-foreground mb-3">Discuss your approach</p>
            <Button 
              size="sm"
              className="w-full"
              onClick={() => handleCTAInteraction('consultation', 'Book Consultation', 'primary')}
            >
              Book Call
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <h4 className="font-medium mb-1">Updates</h4>
            <p className="text-xs text-muted-foreground mb-3">Weekly implementation tips</p>
            <Button 
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleCTAInteraction('subscription', 'Subscribe', 'secondary')}
            >
              Subscribe
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getEnhancedCalculations = (submission: Submission) => {
    // Use stored submission values directly to ensure consistency with Results page
    return {
      leadResponseLoss: submission.lead_response_loss || 0,
      failedPaymentLoss: submission.failed_payment_loss || 0,
      selfServeGap: submission.selfserve_gap_loss || 0,
      processLoss: submission.process_inefficiency_loss || 0,
      total_leak: submission.total_leak || 0,
      recovery_potential_70: submission.recovery_potential_70 || 0,
      confidence: {
        level: submission.lead_score ? (submission.lead_score > 70 ? 'high' : submission.lead_score > 40 ? 'medium' : 'low') : 'medium',
        factors: []
      }
    };
  };

  const calculateROI = (submission: Submission) => {
    // Use stored recovery potential directly
    const recoveryPotential = submission.recovery_potential_70 || 0;
    const currentARR = submission.current_arr || 0;
    
    // Calculate realistic ROI as percentage improvement over current ARR
    if (currentARR > 0 && recoveryPotential > 0) {
      return Math.round((recoveryPotential / currentARR) * 100);
    }
    
    return 0;
  };

  const getPriorityActions = (submission: Submission) => {
    // Use stored submission values for priority actions
    const actions = [];
    const currentARR = submission.current_arr || 0;
    
    // Lead Response Optimization
    if ((submission.lead_response_loss || 0) > currentARR * 0.01) {
      actions.push({
        id: 'lead-response',
        title: 'Optimize Lead Response Time',
        impact: submission.lead_response_loss || 0,
        timeframe: '2-4 weeks',
        difficulty: 'Medium',
        description: 'Implement automated lead routing and response systems',
        confidence: 'high'
      });
    }
    
    // Self-Serve Optimization
    if ((submission.selfserve_gap_loss || 0) > currentARR * 0.01) {
      actions.push({
        id: 'self-serve',
        title: 'Optimize Self-Serve Conversion',
        impact: submission.selfserve_gap_loss || 0,
        timeframe: '4-6 weeks',
        difficulty: 'Hard',
        description: 'Enhance onboarding flow and reduce conversion friction',
        confidence: 'high'
      });
    }
    
    // Payment Recovery
    if ((submission.failed_payment_loss || 0) > currentARR * 0.005) {
      actions.push({
        id: 'payment-recovery',
        title: 'Deploy Payment Recovery System',
        impact: submission.failed_payment_loss || 0,
        timeframe: '1-2 weeks',
        difficulty: 'Easy',
        description: 'Implement automated dunning management and payment retry logic',
        confidence: 'high'
      });
    }
    
    // Process Automation
    if ((submission.process_inefficiency_loss || 0) > currentARR * 0.005) {
      actions.push({
        id: 'automation',
        title: 'Automate Manual Processes',
        impact: submission.process_inefficiency_loss || 0,
        timeframe: '6-8 weeks',
        difficulty: 'Hard',
        description: 'Replace manual workflows with automated systems',
        confidence: 'medium'
      });
    }

    return actions.sort((a, b) => (b.impact || 0) - (a.impact || 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/80 to-primary/5">
        <div className="text-center relative">
          {/* Glassmorphism loading card */}
          <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground font-medium">Crafting your personalized action plan...</p>
            <div className="mt-4 flex items-center justify-center gap-1">
              <div className="h-1 w-8 bg-primary/30 rounded-full animate-pulse delay-0"></div>
              <div className="h-1 w-8 bg-primary/50 rounded-full animate-pulse delay-100"></div>
              <div className="h-1 w-8 bg-primary/70 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/80 to-destructive/5">
        <Card className="max-w-md mx-auto text-center backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-white/20 shadow-2xl">
          <CardContent className="p-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-destructive/10 rounded-full blur-xl"></div>
              <AlertTriangle className="relative h-16 w-16 text-destructive mx-auto animate-pulse" />
            </div>
            <h2 className="text-h2 font-bold mb-2">Action Plan Not Found</h2>
            <p className="text-body text-muted-foreground mb-6">
              The action plan you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link to="/dashboard">
              <Button 
                className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const priorityActions = getPriorityActions(submission);
  const roi = calculateROI(submission);
  const calculations = getEnhancedCalculations(submission);

  // Dynamic progress calculation
  const calculateImplementationProgress = (checkedActions: string[], totalActions: any[]) => {
    const baseProgress = 15; // Analysis completion
    const actionProgress = (checkedActions.length / totalActions.length) * 85;
    return Math.round(baseProgress + actionProgress);
  };

  const getProgressMessage = (checkedCount: number, totalCount: number) => {
    if (checkedCount === 0) return "Analysis Complete • Ready to Implement";
    if (checkedCount === 1) return "1 action started • Great start!";
    if (checkedCount < totalCount) return `${checkedCount} actions in progress • Building momentum!`;
    return "All actions identified • Ready for implementation strategy call";
  };

  const currentProgress = calculateImplementationProgress(checkedActions, priorityActions);
  const progressMessage = getProgressMessage(checkedActions.length, priorityActions.length);

  console.log('ActionPlan component rendering:', { submission, priorityActions, roi, calculations });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-accent/20">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/95 via-primary to-primary-dark">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link to={`/results/${submission.id}`}>
              <Button variant="ghost" size="sm" className="text-white/90 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {new Date().toLocaleDateString()}
                </Badge>
              </div>
              
              <h1 className="text-h1 font-bold text-white mb-4">
                {submission.company_name} Action Plan
              </h1>
              
              <p className="text-lg text-white/80 mb-6 max-w-2xl">
                Your personalized implementation roadmap to recover {formatCurrency(calculations.recovery_potential_70)} 
                in annual revenue through strategic optimizations.
              </p>

              {/* Progress Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-h3 font-semibold text-white">Implementation Progress</h3>
                  <span className="text-2xl font-bold text-white">{currentProgress}%</span>
                </div>
                <Progress value={currentProgress} className="h-3 mb-3 bg-white/20" />
                <p className="text-sm text-white/80">{progressMessage}</p>
              </div>
            </div>

            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-revenue-danger/20 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(calculations.total_leak)}
                </p>
                <p className="text-sm text-white/70">Annual Revenue Leak</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-revenue-success/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {formatCurrency(calculations.recovery_potential_70)}
                </p>
                <p className="text-sm text-white/70">Recovery Potential</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{roi}%</p>
                <p className="text-sm text-white/70">Implementation ROI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressEncouragement />

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Actions ({priorityActions.length})
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-white via-white/90 to-muted/30 shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-h3 flex items-center gap-3">
                    <div className="p-2 bg-revenue-danger/10 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-revenue-danger" />
                    </div>
                    Revenue Impact Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-body font-medium">Lead Response Loss</span>
                      <span className="text-h4 font-bold text-revenue-danger">
                        {formatCurrency(calculations.leadResponseLoss)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-body font-medium">Self-Serve Gap</span>
                      <span className="text-h4 font-bold text-revenue-danger">
                        {formatCurrency(calculations.selfServeGap)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-body font-medium">Process Inefficiency</span>
                      <span className="text-h4 font-bold text-revenue-danger">
                        {formatCurrency(calculations.processLoss)}
                      </span>
                    </div>
                    <div className="border-t-2 border-gradient-primary pt-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-revenue-danger/10 to-revenue-danger/5 rounded-lg">
                        <span className="text-h4 font-bold">Total Annual Leak</span>
                        <span className="text-h3 font-bold text-revenue-danger">
                          {formatCurrency(calculations.total_leak)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white via-white/90 to-primary/5 shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-h3 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {priorityActions.slice(0, 3).map((action) => (
                      <div key={action.id} className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 hover:from-primary/5 hover:to-primary/10 transition-all duration-200">
                        <Checkbox
                          id={action.id}
                          checked={checkedActions.includes(action.id)}
                          onCheckedChange={(checked) => handleActionToggle(action.id, checked as boolean)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-body font-semibold">{action.title}</span>
                        </div>
                        <Badge variant="outline" className="bg-white/80 border-primary/30 text-primary font-medium">
                          {action.timeframe}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6 mt-6">
            <PriorityActions 
              submission={submission}
              formatCurrency={formatCurrency}
              calculatorData={{
                companyInfo: {
                  currentARR: submission.current_arr || 0,
                  industry: submission.industry
                },
                leadGeneration: {
                  monthlyLeads: submission.monthly_leads || 0,
                  averageDealValue: submission.average_deal_value || 0,
                  leadResponseTime: submission.lead_response_time || 0
                },
                selfServe: {
                  monthlyFreeSignups: submission.monthly_free_signups || 0,
                  freeToLaidConversion: submission.free_to_paid_conversion || 0,
                  monthlyMRR: submission.monthly_mrr || 0,
                  failedPaymentRate: submission.failed_payment_rate || 0
                },
                operations: {
                  manualHours: submission.manual_hours || 0,
                  hourlyRate: submission.hourly_rate || 0
                }
              }}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-6">
            <ImplementationTimeline 
              submission={submission}
              formatCurrency={formatCurrency}
              validatedValues={{
                totalLeak: calculations.total_leak,
                leadResponseLoss: calculations.leadResponseLoss,
                selfServeLoss: calculations.selfServeGap,
                recoveryPotential70: calculations.recovery_potential_70,
                recoveryPotential85: calculations.recovery_potential_70 * 1.2
              }}
              calculatorData={{
                companyInfo: {
                  currentARR: submission.current_arr || 0,
                  industry: submission.industry
                },
                leadGeneration: {
                  monthlyLeads: submission.monthly_leads || 0,
                  averageDealValue: submission.average_deal_value || 0,
                  leadResponseTime: submission.lead_response_time || 0
                },
                selfServe: {
                  monthlyFreeSignups: submission.monthly_free_signups || 0,
                  freeToLaidConversion: submission.free_to_paid_conversion || 0,
                  monthlyMRR: submission.monthly_mrr || 0,
                  failedPaymentRate: submission.failed_payment_rate || 0
                },
                operations: {
                  manualHours: submission.manual_hours || 0,
                  hourlyRate: submission.hourly_rate || 0
                }
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Enhanced Strategic CTA Section */}
        <div className="mt-12">
          <Card className="bg-gradient-to-br from-primary/5 via-white to-accent/10 shadow-xl border border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-h2 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-lg">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                Ready to Implement?
              </CardTitle>
              <p className="text-body text-muted-foreground">
                Take the next step in your revenue recovery journey with expert guidance and proven strategies.
              </p>
            </CardHeader>
            <CardContent>
              {renderContextualCTAs()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActionPlan;