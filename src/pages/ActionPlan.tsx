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
  Phone
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
      recovery_potential: submission.total_leak,
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
      recovery_potential: submission?.total_leak,
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
      maximumFractionDigits: 0,
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
                <BookOpen className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                <h3 className="font-bold mb-3 text-lg text-gray-900 leading-tight">Implementation Guide</h3>
                <p className="text-sm text-gray-600 mb-6 flex-grow">Download detailed step-by-step guide</p>
              </div>
              <div className="mt-auto">
                <Button 
                  className="w-full"
                  style={{
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: '16px 24px'
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
                  onClick={() => handleCTAInteraction('download', 'Download Guide', 'secondary')}
                >
                  Download Guide
                </Button>
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
                <Users className="h-10 w-10 mx-auto mb-4 text-gray-600" />
                <h3 className="font-bold mb-3 text-lg text-gray-900 leading-tight">Progress Updates</h3>
                <p className="text-sm text-gray-600 mb-6 flex-grow">Get weekly implementation tips</p>
              </div>
              <div className="mt-auto">
                <Button 
                  className="w-full"
                  style={{
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: '16px 24px'
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
                  onClick={() => handleCTAInteraction('subscription', 'Subscribe to Updates', 'tertiary')}
                >
                  Subscribe to Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      );
    }
    
    // Medium engagement (40-69 score or 1 action checked)
    if (engagementLevel === 'medium') {
      return (
        <>
          <Card className="bg-background text-foreground relative">
            <CardContent className="p-6 text-center">
              <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-bold">
                RECOMMENDED
              </div>
              <Phone className="h-8 w-8 mx-auto mb-3 text-revenue-primary" />
              <h3 className="font-bold mb-2">Strategy Call</h3>
              <p className="text-sm text-muted-foreground mb-4">Get personalized implementation guidance</p>
              <Button 
                className="w-full bg-revenue-primary text-primary-foreground"
                onClick={() => handleCTAInteraction('consultation', 'Book Free Consultation', 'primary')}
              >
                Get Started Today
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-background text-foreground relative">
            <CardContent className="p-6 text-center">
              <div className="absolute top-2 right-2 bg-revenue-success text-white text-xs px-2 py-1 rounded-full font-bold">
                MOST POPULAR
              </div>
              <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-bold mb-2">Implementation Guide</h3>
              <p className="text-sm text-muted-foreground mb-4">Download detailed step-by-step guide</p>
              <Button 
                variant="outline" 
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleCTAInteraction('download', 'Download Guide', 'primary')}
              >
                Download Guide
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-background text-foreground">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-bold mb-2">Progress Updates</h3>
              <p className="text-sm text-muted-foreground mb-4">Get weekly implementation tips</p>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => handleCTAInteraction('subscription', 'Subscribe to Updates', 'secondary')}
              >
                Subscribe to Updates
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }
    
    // Low engagement - nurture focus
    return (
      <>
        <Card className="bg-background text-foreground relative">
          <CardContent className="p-6 text-center">
            <div className="absolute top-2 right-2 bg-revenue-success text-white text-xs px-2 py-1 rounded-full font-bold">
              START HERE
            </div>
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-bold mb-2">Implementation Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">Download detailed step-by-step guide</p>
            <Button 
              className="w-full bg-primary text-primary-foreground"
              onClick={() => handleCTAInteraction('download', 'Download Guide', 'primary')}
            >
              Get Your Guide
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-background text-foreground">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 mx-auto mb-3 text-revenue-primary" />
            <h3 className="font-bold mb-2">Strategy Call</h3>
            <p className="text-sm text-muted-foreground mb-4">Get personalized implementation guidance</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleCTAInteraction('consultation', 'Book Free Consultation', 'secondary')}
            >
              Book Free Consultation
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-background text-foreground relative">
          <CardContent className="p-6 text-center">
            <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-bold">
              STAY INFORMED
            </div>
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
    // Use unified calculations first
    const inputs: UnifiedCalculationInputs = {
      currentARR: submission.current_arr || 0,
      monthlyMRR: submission.monthly_mrr || 0,
      monthlyLeads: submission.monthly_leads || 0,
      averageDealValue: submission.average_deal_value || 0,
      leadResponseTime: submission.lead_response_time || 0,
      monthlyFreeSignups: submission.monthly_free_signups || 0,
      freeToLaidConversion: submission.free_to_paid_conversion || 0,
      failedPaymentRate: submission.failed_payment_rate || 0,
      manualHours: submission.manual_hours || 0,
      hourlyRate: submission.hourly_rate || 0,
      industry: submission.industry
    };

    const unifiedResults = calculateUnifiedResults(inputs);
    
    // If we have good data quality, use unified results
    if (unifiedResults.confidence !== 'low') {
      return {
        leadResponseLoss: unifiedResults.leadResponseLoss,
        failedPaymentLoss: unifiedResults.failedPaymentLoss,
        selfServeGap: unifiedResults.selfServeGapLoss,
        processLoss: unifiedResults.processInefficiencyLoss,
        total_leak: unifiedResults.totalLeak,
        recovery_potential_70: unifiedResults.conservativeRecovery,
        confidence: {
          level: unifiedResults.confidence,
          score: unifiedResults.confidence === 'high' ? 85 : unifiedResults.confidence === 'medium' ? 65 : 45,
          factors: unifiedResults.bounds.warningFlags
        }
      };
    }

    // Fallback to legacy calculations for low confidence data
    const leadResponseLoss = submission.monthly_leads && submission.average_deal_value && submission.lead_response_time
      ? calculateLeadResponseImpact(submission.lead_response_time, submission.average_deal_value) * submission.monthly_leads * 12
      : submission.lead_response_loss || 0;

    const failedPaymentLoss = submission.monthly_mrr && submission.failed_payment_rate
      ? calculateFailedPaymentLoss(submission.monthly_mrr, submission.failed_payment_rate)
      : submission.failed_payment_loss || 0;

    const selfServeGap = submission.monthly_free_signups && submission.free_to_paid_conversion && submission.monthly_mrr
      ? calculateSelfServeGap(submission.monthly_free_signups, submission.free_to_paid_conversion, submission.monthly_mrr, submission.industry || 'other')
      : submission.selfserve_gap_loss || 0;

    const processLoss = submission.manual_hours && submission.hourly_rate
      ? calculateProcessInefficiency(submission.manual_hours, submission.hourly_rate)
      : submission.process_inefficiency_loss || 0;

    const total_leak = leadResponseLoss + failedPaymentLoss + selfServeGap + processLoss;
    
    // Apply validation bounds with legacy system
    const validation = validateCalculationResults({
      leadResponseLoss,
      failedPaymentLoss,
      selfServeGap,
      processLoss,
      currentARR: submission.current_arr || 0,
      recoveryPotential70: total_leak * 0.7,
      recoveryPotential85: total_leak * 0.85
    });

    return {
      leadResponseLoss: validation.leadResponse.isValid ? leadResponseLoss : validation.leadResponse.adjustedValue || 0,
      failedPaymentLoss: failedPaymentLoss,
      selfServeGap: validation.selfServe.isValid ? selfServeGap : validation.selfServe.adjustedValue || 0,
      processLoss: processLoss,
      total_leak: validation.overall.isValid ? total_leak : validation.overall.adjustedValue || total_leak * 0.5,
      recovery_potential_70: validation.recovery.isValid ? total_leak * 0.7 : validation.recovery.adjustedValue || total_leak * 0.3,
      confidence: getCalculationConfidenceLevel({
        currentARR: submission.current_arr || 0,
        monthlyLeads: submission.monthly_leads || 0,
        monthlyFreeSignups: submission.monthly_free_signups || 0,
        totalLeak: total_leak
      })
    };
  };

  const calculateROI = (submission: Submission) => {
    // Get enhanced calculations with validation
    const calculations = getEnhancedCalculations(submission);
    const validatedRecovery = Math.min(calculations.recovery_potential_70, calculations.total_leak * 0.8);
    
    // Base implementation cost on company size and complexity
    const baseInvestment = submission.current_arr ? Math.max(25000, Math.min(150000, (submission.current_arr / 100))) : 50000;
    
    return Math.round((validatedRecovery / baseInvestment) * 100);
  };

  const getPriorityActions = (submission: Submission) => {
    const calculations = getEnhancedCalculations(submission);
    
    // Try to get realistic timeline first
    const inputs: UnifiedCalculationInputs = {
      currentARR: submission.current_arr || 0,
      monthlyMRR: submission.monthly_mrr || 0,
      monthlyLeads: submission.monthly_leads || 0,
      averageDealValue: submission.average_deal_value || 0,
      leadResponseTime: submission.lead_response_time || 0,
      monthlyFreeSignups: submission.monthly_free_signups || 0,
      freeToLaidConversion: submission.free_to_paid_conversion || 0,
      failedPaymentRate: submission.failed_payment_rate || 0,
      manualHours: submission.manual_hours || 0,
      hourlyRate: submission.hourly_rate || 0,
      industry: submission.industry
    };

    const unifiedResults = calculateUnifiedResults(inputs);
    const realisticTimeline = generateRealisticTimeline(unifiedResults, inputs);
    
    // If we have realistic timeline, use it
    if (realisticTimeline && realisticTimeline.length > 0) {
      return realisticTimeline.map((phase, index) => ({
        id: phase.id,
        title: phase.title,
        impact: phase.recoveryPotential,
        timeframe: `${phase.endMonth - phase.startMonth + 1} months (${phase.startMonth}-${phase.endMonth})`,
        difficulty: phase.difficulty.charAt(0).toUpperCase() + phase.difficulty.slice(1),
        description: phase.description,
        confidence: unifiedResults.confidence,
        actions: phase.actions
      }));
    }
    
    // Fallback to legacy action generation
    const actions = [];
    
    if (calculations.leadResponseLoss > (submission.current_arr || 0) * 0.01) {
      const impact = Math.min(calculations.leadResponseLoss, calculations.total_leak * 0.3);
      actions.push({
        id: 'lead-response',
        title: 'Optimize Lead Response Time',
        impact: impact,
        timeframe: calculations.confidence.level === 'high' ? '2-4 weeks' : '4-6 weeks',
        difficulty: 'Medium',
        description: 'Implement automated lead routing and response systems',
        confidence: calculations.confidence.level
      });
    }
    
    if (calculations.failedPaymentLoss > (submission.current_arr || 0) * 0.005) {
      const impact = Math.min(calculations.failedPaymentLoss, calculations.total_leak * 0.1);
      actions.push({
        id: 'payment-recovery',
        title: 'Deploy Payment Recovery System',
        impact: impact,
        timeframe: '1-2 weeks',
        difficulty: 'Easy',
        description: 'Implement automated dunning management and payment retry logic',
        confidence: calculations.confidence.level
      });
    }
    
    if (calculations.selfServeGap > (submission.current_arr || 0) * 0.02) {
      const impact = Math.min(calculations.selfServeGap, calculations.total_leak * 0.3);
      actions.push({
        id: 'self-serve',
        title: 'Optimize Self-Serve Conversion',
        impact: impact,
        timeframe: calculations.confidence.level === 'high' ? '4-6 weeks' : '6-8 weeks',
        difficulty: calculations.confidence.level === 'low' ? 'Very Hard' : 'Hard',
        description: 'Enhance onboarding flow and reduce conversion friction',
        confidence: calculations.confidence.level
      });
    }
    
    if (calculations.processLoss > (submission.current_arr || 0) * 0.01) {
      const impact = Math.min(calculations.processLoss, calculations.total_leak * 0.15);
      actions.push({
        id: 'automation',
        title: 'Automate Manual Processes',
        impact: impact,
        timeframe: '6-8 weeks',
        difficulty: 'Hard',
        description: 'Replace manual workflows with automated systems',
        confidence: calculations.confidence.level
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
                <p className="text-sm text-muted-foreground">Annual opportunity cost</p>
              </CardContent>
            </Card>
            
            <Card className="border-revenue-success/20 bg-revenue-success/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-revenue-success">Recovery Potential</h3>
                  <Badge variant="outline" className="text-xs">
                    {calculations.confidence.level === 'high' ? '70%' : calculations.confidence.level === 'medium' ? '50%' : '30%'} confidence
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-revenue-success">
                  {formatCurrency(calculations.recovery_potential_70)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {calculations.confidence.level === 'high' ? '70% achievable in 6 months' : 
                   calculations.confidence.level === 'medium' ? 'Conservative estimate' : 'Requires validation'}
                </p>
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
                <span className="text-sm text-muted-foreground">{currentProgress}% Complete</span>
              </div>
              <Progress value={currentProgress} className="mb-2 transition-all duration-500 ease-in-out" />
              <p className="text-sm text-muted-foreground transition-all duration-300 ease-in-out">
                {progressMessage}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" value={currentTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="actions">Priority Actions</TabsTrigger>
            <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Dynamic Action Plan based on unified calculations */}
            {(() => {
              const inputs: UnifiedCalculationInputs = {
                currentARR: submission.current_arr || 0,
                monthlyMRR: submission.monthly_mrr || 0,
                monthlyLeads: submission.monthly_leads || 0,
                averageDealValue: submission.average_deal_value || 0,
                leadResponseTime: submission.lead_response_time || 0,
                monthlyFreeSignups: submission.monthly_free_signups || 0,
                freeToLaidConversion: submission.free_to_paid_conversion || 0,
                failedPaymentRate: submission.failed_payment_rate || 0,
                manualHours: submission.manual_hours || 0,
                hourlyRate: submission.hourly_rate || 0,
                industry: submission.industry
              };
              
              const unifiedResults = calculateUnifiedResults(inputs);
              const realisticTimeline = generateRealisticTimeline(unifiedResults, inputs);
              
              // Show confidence warning if calculations are uncertain
              const showConfidenceWarning = unifiedResults.confidence === 'low' || unifiedResults.bounds.warningFlags.length > 0;
              
              return (
                <div className="space-y-8">
                  {/* Confidence Warning */}
                  {showConfidenceWarning && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-semibold text-yellow-800">Data Quality Advisory</h4>
                      </div>
                      <p className="text-sm text-yellow-700 mb-2">
                        {unifiedResults.confidence === 'low' 
                          ? 'Calculations based on limited data. These estimates should be used as directional guidance.'
                          : 'Some calculations have been adjusted for realistic bounds.'
                        }
                      </p>
                      {unifiedResults.bounds.warningFlags.length > 0 && (
                        <ul className="text-xs text-yellow-600 space-y-1">
                          {unifiedResults.bounds.warningFlags.map((flag, index) => (
                            <li key={index}>• {flag}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Priority Focus */}
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Target className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold text-primary">Strategic Priority Focus</h3>
                      </div>
                      {(() => {
                        const { actionRecoveryPotential } = unifiedResults;
                        const priorities = [
                          { name: "Lead Response Optimization", value: actionRecoveryPotential.leadResponse, id: "lead-response" },
                          { name: "Self-Serve Optimization", value: actionRecoveryPotential.selfServeOptimization, id: "self-serve" },
                          { name: "Payment Recovery", value: actionRecoveryPotential.paymentRecovery, id: "payment" },
                          { name: "Process Automation", value: actionRecoveryPotential.processAutomation, id: "automation" }
                        ];
                        
                        const topPriority = priorities.sort((a, b) => b.value - a.value)[0];
                        
                        return (
                          <div>
                            <p className="text-lg font-medium text-foreground mb-2">
                              🎯 {topPriority.name}
                            </p>
                            <p className="text-sm text-muted-foreground mb-3">
                              Recovery potential: {formatCurrency(topPriority.value)} • Represents your largest opportunity
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {priorities.map((priority) => (
                                <div key={priority.id} className={`p-3 rounded-lg border ${priority.id === topPriority.id ? 'bg-primary/10 border-primary/30' : 'bg-background border-border'}`}>
                                  <div className="font-medium">{formatCurrency(priority.value)}</div>
                                  <div className="text-xs text-muted-foreground">{priority.name}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Enhanced Timeline */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {realisticTimeline && realisticTimeline.length > 0 ? (
                      realisticTimeline.slice(0, 2).map((phase, index) => (
                        <Card key={phase.id} className={index === 0 ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              {index === 0 ? <Zap className="h-5 w-5 text-green-600" /> : <TrendingUp className="h-5 w-5 text-blue-600" />}
                              {phase.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Months {phase.startMonth}-{phase.endMonth} • {phase.difficulty} complexity
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{phase.description}</p>
                            
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Key Actions:</h5>
                              {phase.actions.slice(0, 3).map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center gap-2 text-sm p-2 rounded bg-background/50">
                                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  <span>{action.title} ({action.weeks}w)</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="pt-3 border-t">
                              <p className="text-sm text-muted-foreground">
                                Expected recovery: <span className={`font-semibold ${index === 0 ? 'text-green-600' : 'text-blue-600'}`}>
                                  {formatCurrency(phase.recoveryPotential)}
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      // Fallback to generic timeline
                      <>
                        <Card className="border-green-200 bg-green-50">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="h-5 w-5 text-green-600" />
                              Quick Wins (0-60 days)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Implement automated lead response</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Set up payment recovery workflows</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Optimize onboarding flow</span>
                              </div>
                            </div>
                            <div className="pt-4 border-t">
                              <p className="text-sm text-muted-foreground">
                                Expected recovery: <span className="font-semibold text-green-600">
                                  {formatCurrency(unifiedResults.conservativeRecovery * 0.4)}
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-blue-50">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                              Strategic Initiatives (3-8 months)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-blue-200">
                                <Target className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Advanced lead scoring and qualification</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-blue-200">
                                <Target className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Predictive churn prevention</span>
                              </div>
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 border border-blue-200">
                                <Target className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Complete process automation suite</span>
                              </div>
                            </div>
                            <div className="pt-4 border-t">
                              <p className="text-sm text-muted-foreground">
                                Expected recovery: <span className="font-semibold text-blue-600">
                                  {formatCurrency(unifiedResults.conservativeRecovery * 0.6)}
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
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
                          {formatCurrency(calculations.recovery_potential_70 / 3)}
                        </span>
                      </p>
                      {index === 0 && calculations.confidence.level === 'low' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ⚠️ Validate assumptions before major investments
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-8">
            <div className="space-y-6">
              {priorityActions.map((action, index) => {
                const isChecked = checkedActions.includes(action.id);
                return (
                  <Card 
                    key={action.id} 
                    className={`overflow-hidden transition-all duration-200 ${
                      isChecked 
                        ? 'bg-primary/5 border-primary/20 border-l-4 border-l-primary' 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-3 pt-1">
                            <Checkbox
                              id={`action-${action.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleActionToggle(action.id, checked as boolean)}
                              className="w-5 h-5"
                            />
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xl font-bold text-primary">#{index + 1}</span>
                            </div>
                          </div>
                          <label 
                            htmlFor={`action-${action.id}`} 
                            className={`cursor-pointer flex-1 ${isChecked ? 'opacity-75' : ''}`}
                          >
                            <CardTitle className="text-xl mb-2">{action.title}</CardTitle>
                            <p className="text-muted-foreground">{action.description}</p>
                          </label>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${isChecked ? 'text-primary' : 'text-revenue-success'}`}>
                            {formatCurrency(action.impact || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Recovery Potential</p>
                        </div>
                      </div>
                        <div className="flex gap-4 mt-4 ml-20">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {action.timeframe}
                        </Badge>
                        <Badge variant="outline">
                          Difficulty: {action.difficulty}
                        </Badge>
                        {action.confidence === 'low' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Validation Needed
                          </Badge>
                        )}
                        {isChecked && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
            
            {/* Progress Summary */}
            <Card className="bg-gradient-to-r from-primary/5 to-revenue-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Implementation Progress</h3>
                  <span className="text-2xl font-bold text-primary transition-all duration-300 ease-in-out">
                    {Math.round((checkedActions.length / priorityActions.length) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(checkedActions.length / priorityActions.length) * 100} 
                  className="mb-3 transition-all duration-500 ease-in-out"
                />
                <p className="text-sm text-muted-foreground transition-all duration-300 ease-in-out">
                  {checkedActions.length} of {priorityActions.length} priority actions completed
                  {checkedActions.length > 0 && checkedActions.length < priorityActions.length && " • Keep going!"}
                </p>
                {checkedActions.length === priorityActions.length && (
                  <div className="mt-4 p-3 bg-revenue-success/10 border border-revenue-success/20 rounded-lg animate-fade-in">
                    <p className="text-revenue-success font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Congratulations! You've completed all priority actions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="next-steps" className="space-y-8">
            <div 
              className="rounded-xl border"
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
                padding: '48px 32px',
                borderColor: '#e2e8f0'
              }}
            >
              <div className="max-w-4xl mx-auto text-center">
                <h2 
                  className="font-bold mb-2"
                  style={{
                    fontSize: '32px',
                    color: '#111827'
                  }}
                >
                  Ready to Implement?
                </h2>
                <p 
                  className="mb-8"
                  style={{
                    fontSize: '18px',
                    color: '#6b7280',
                    margin: '0 0 32px 0'
                  }}
                >
                  Get expert guidance to maximize your {formatCurrency(submission.recovery_potential_70 || 0)} recovery potential
                </p>
                
                <UrgencyBanner 
                  recoveryPotential={submission.total_leak || 0} 
                  engagementLevel={getEngagementLevel()} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderSmartCTAs()}
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