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
  Activity
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

  const UrgencyBanner = ({ recoveryPotential, engagementLevel }: { recoveryPotential: number, engagementLevel: string }) => {
    const currentARR = submission?.current_arr || 0;
    const significantOpportunity = recoveryPotential > Math.max(currentARR * 0.15, 500000); // 15% of ARR or $500K
    
    if (significantOpportunity && engagementLevel === 'high') {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div className="flex items-center gap-2">
                <span 
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#059669'
                  }}
                >
                  HIGH-IMPACT OPPORTUNITY
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-emerald-700 font-bold text-lg mb-1">
              Strong Implementation Intent Detected
            </h4>
            <p className="text-gray-600 text-sm">
              {formatCurrency(recoveryPotential)} opportunity • {checkedActions.length} actions tracked • Priority support available
            </p>
          </div>
        </div>
      );
    }
    
    if (engagementLevel === 'high') {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <strong className="text-emerald-700 font-bold">Ready to Take Action?</strong>
              <p className="text-sm text-gray-600 mt-1">
                Your engagement shows you're serious about implementation
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (significantOpportunity && engagementLevel === 'medium') {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <strong className="text-blue-700 font-bold">Significant Opportunity Identified</strong>
              <p className="text-sm text-gray-600 mt-1">
                {formatCurrency(recoveryPotential)} in potential recovery • Consider prioritizing implementation
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderSmartCTAs = () => {
    const engagementLevel = getEngagementLevel();
    const recoveryPotential = submission?.recovery_potential_70 || 0;
    
    // High engagement (70+ score or 2+ actions checked)
    if (engagementLevel === 'high') {
      return (
        <>
          <Card 
            className="border-2 rounded-xl h-full flex flex-col"
            style={{
              backgroundColor: 'white',
              borderColor: '#e5e7eb',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <CardContent className="p-6 text-center relative flex-1 flex flex-col">
              <div 
                className="absolute top-2 right-2 text-xs px-3 py-1 rounded-full font-bold"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#059669'
                }}
              >
                🎯 PRIORITY SUPPORT
              </div>
              <div className="flex-1 flex flex-col justify-center mt-6">
                <Phone className="h-10 w-10 mx-auto mb-4 text-emerald-600" />
                <h3 className="font-bold mb-3 text-lg text-gray-900 leading-tight">Ready to Accelerate Implementation?</h3>
                <p className="text-sm text-gray-600 mb-6 flex-grow">
                  You've shown strong implementation intent. Let's fast-track your {formatCurrency(recoveryPotential)} recovery.
                </p>
              </div>
              <div className="mt-auto">
                <Button 
                  className="w-full font-bold py-3 text-base mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.25)';
                  }}
                  onClick={() => handleCTAInteraction('consultation', 'Book Priority Strategy Call', 'urgent')}
                >
                  Book Priority Strategy Call
                </Button>
                <p className="text-xs text-emerald-600 font-medium">
                  ⏰ Next available: Today or tomorrow
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="rounded-xl h-full flex flex-col"
            style={{
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <CardContent className="p-6 text-center flex-1 flex flex-col">
              <div className="flex-1 flex flex-col justify-center">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-bold mb-2">Implementation Guide</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">Get step-by-step implementation instructions</p>
              </div>
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => handleCTAInteraction('guide', 'Download Implementation Guide', 'primary')}
              >
                Download Guide
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }
    
    // Default CTAs for medium/low engagement
    return (
      <>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-bold mb-2">Book Consultation</h3>
            <p className="text-sm text-muted-foreground mb-4">Discuss your implementation strategy</p>
            <Button 
              className="w-full"
              onClick={() => handleCTAInteraction('consultation', 'Book Consultation', 'primary')}
            >
              Book Strategy Call
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-bold mb-2">Implementation Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">Get detailed action steps</p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => handleCTAInteraction('guide', 'Download Guide', 'secondary')}
            >
              Download Guide
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-bold mb-2">Progress Updates</h3>
            <p className="text-sm text-muted-foreground mb-4">Get weekly implementation tips</p>
            <Button 
              className="w-full bg-revenue-success text-white"
              onClick={() => handleCTAInteraction('subscription', 'Subscribe to Updates', 'primary')}
            >
              Subscribe to Updates
            </Button>
          </CardContent>
        </Card>
      </>
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
            <h2 className="text-xl font-bold mb-2">Action Plan Not Found</h2>
            <p className="text-muted-foreground mb-6">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Enhanced Navigation with glassmorphism */}
      <nav className="sticky top-0 z-40 border-b border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to={`/results/${submission.id}`}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="transition-all duration-200 hover:scale-105 hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Results
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative p-2 rounded-lg bg-gradient-to-r from-primary to-primary/70 shadow-lg">
                  <Target className="h-6 w-6 text-primary-foreground" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Action Plan
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="backdrop-blur-sm bg-white/40 border-white/30 hover:bg-white/60 transition-all duration-200 hover:scale-105"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Hero Section with animations */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-2xl p-8 mb-12 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Trophy className="h-10 w-10 text-primary animate-pulse" />
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500 animate-bounce" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  {submission.company_name} Action Plan
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <p className="text-xl text-muted-foreground">
                  Personalized recovery roadmap • Generated {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-revenue-danger/20 bg-revenue-danger/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-revenue-danger">Total Revenue Leak</h3>
                {calculations.confidence.level === 'low' && (
                  <Badge variant="outline" className="text-xs">
                    Estimated
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold text-revenue-danger">
                {formatCurrency(calculations.total_leak)}
              </p>
              <p className="text-sm text-muted-foreground">
                Lost annually due to system gaps
              </p>
            </CardContent>
          </Card>

          <Card className="border-revenue-success/20 bg-revenue-success/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-revenue-success">Recovery Potential</h3>
                <Badge variant="outline" className="text-xs">70% Confidence</Badge>
              </div>
              <p className="text-3xl font-bold text-revenue-success">
                {formatCurrency(calculations.recovery_potential_70)}
              </p>
              <p className="text-sm text-muted-foreground">
                Recoverable with implementation
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-primary">Implementation ROI</h3>
                <Badge variant="secondary" className="text-xs">12 months</Badge>
              </div>
              <p className="text-3xl font-bold text-primary">
                {roi}%
              </p>
              <p className="text-sm text-muted-foreground">
                Expected revenue improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
          <div className="relative backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Implementation Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={checkedActions.length >= priorityActions.length * 0.7 ? "default" : "secondary"}
                  className="transition-all duration-200"
                >
                  {checkedActions.length} of {priorityActions.length}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  actions completed
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={(checkedActions.length / priorityActions.length) * 100} 
                className="w-full h-3 transition-all duration-500"
              />
              {checkedActions.length > 0 && (
                <div className="absolute top-0 right-0 flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 animate-pulse" />
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {Math.round((checkedActions.length / priorityActions.length) * 100)}% complete
            </div>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="actions">Priority Actions</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Lead Response Loss</span>
                      <span className="font-medium text-revenue-danger">
                        {formatCurrency(calculations.leadResponseLoss)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Failed Payment Loss</span>
                      <span className="font-medium text-revenue-danger">
                        {formatCurrency(calculations.failedPaymentLoss)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Self-Serve Gap</span>
                      <span className="font-medium text-revenue-danger">
                        {formatCurrency(calculations.selfServeGap)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Process Inefficiency</span>
                      <span className="font-medium text-revenue-danger">
                        {formatCurrency(calculations.processLoss)}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Annual Leak</span>
                        <span className="text-revenue-danger">
                          {formatCurrency(calculations.total_leak)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Quick Wins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {priorityActions.slice(0, 3).map((action, index) => (
                      <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={action.id}
                            checked={checkedActions.includes(action.id)}
                            onCheckedChange={(checked) => handleActionToggle(action.id, checked as boolean)}
                          />
                          <span className="text-sm font-medium">{action.title}</span>
                        </div>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {action.timeframe}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div className="text-center p-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Implementation Timeline</h3>
              <p className="text-muted-foreground">Timeline features coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="space-y-4">
              {priorityActions.map((action) => (
                <Card key={action.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={action.id}
                        checked={checkedActions.includes(action.id)}
                        onCheckedChange={(checked) => handleActionToggle(action.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      <Badge variant="outline">{action.timeframe}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="next-steps" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-revenue-success mt-0.5" />
                    <div>
                      <p className="font-medium">1. Review Priority Actions</p>
                      <p className="text-sm text-muted-foreground">Check off the actions you want to implement first</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">2. Schedule Implementation</p>
                      <p className="text-sm text-muted-foreground">Book a strategy call to discuss timeline and resources</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-revenue-warning mt-0.5" />
                    <div>
                      <p className="font-medium">3. Start with Quick Wins</p>
                      <p className="text-sm text-muted-foreground">Begin with the highest-impact, lowest-effort improvements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <UrgencyBanner 
                recoveryPotential={submission.total_leak || 0} 
                engagementLevel={getEngagementLevel()} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderSmartCTAs()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ActionPlan;