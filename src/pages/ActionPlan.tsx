import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { StrategicCTASection } from "@/components/results/StrategicCTASection";
import { FloatingCTABar } from "@/components/results/FloatingCTABar";
import { 
  Calculator, 
  ArrowLeft, 
  TrendingUp, 
  Target,
  Clock,
  CheckCircle,
  FileDown,
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
  CheckSquare,
  DollarSign,
  Building,
  Shield,
  Layers
} from "lucide-react";
import { submissionService, type Submission } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  calculateUnifiedResults, 
  generateRealisticTimeline, 
  calculateRealisticInvestment,
  calculateRealisticROI,
  type UnifiedCalculationInputs,
  type UnifiedCalculationResults,
  type TimelinePhase
} from "@/lib/calculator/unifiedCalculations";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';
import { 
  getCalculationConfidenceLevel
} from "@/lib/calculator/validationHelpers";

const ActionPlan = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedActions, setCheckedActions] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState("overview");
  const [sessionStartTime] = useState(Date.now());
  const [timeTrackers, setTimeTrackers] = useState<NodeJS.Timeout[]>([]);
  const [engagementScore, setEngagementScore] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Enhanced calculations state
  const [unifiedResults, setUnifiedResults] = useState<UnifiedCalculationResults | null>(null);
  const [timeline, setTimeline] = useState<TimelinePhase[]>([]);
  const [priorityActions, setPriorityActions] = useState<any[]>([]);
  const [investment, setInvestment] = useState<any>(null);
  const [roiData, setRoiData] = useState<any>(null);
  
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

  // Enhanced calculations effect
  useEffect(() => {
    if (submission) {
      calculateEnhancedResults();
    }
  }, [submission]);

  const mapSubmissionToUnifiedInputs = (submission: Submission): UnifiedCalculationInputs => {
    return {
      currentARR: submission.current_arr || 0,
      monthlyMRR: submission.monthly_mrr || 0,
      monthlyLeads: submission.monthly_leads || 0,
      averageDealValue: submission.average_deal_value || 5000,
      leadResponseTime: submission.lead_response_time || 24,
      monthlyFreeSignups: submission.monthly_free_signups || 0,
      freeToLaidConversion: submission.free_to_paid_conversion || 2,
      failedPaymentRate: submission.failed_payment_rate || 5,
      manualHours: submission.manual_hours || 10,
      hourlyRate: submission.hourly_rate || 75,
      industry: submission.industry
    };
  };

  const calculateEnhancedResults = () => {
    if (!submission) return;

    try {
      const inputs = mapSubmissionToUnifiedInputs(submission);
      const results = calculateUnifiedResults(inputs);
      const timelineData = generateRealisticTimeline(results, inputs);
      const investmentData = calculateRealisticInvestment(timelineData, inputs);
      const roiCalculation = calculateRealisticROI(
        results.recovery70Percent, 
        investmentData.totalAnnualInvestment,
        results.confidenceLevel
      );

      setUnifiedResults(results);
      setTimeline(timelineData);
      setInvestment(investmentData);
      setRoiData(roiCalculation);

      // Generate priority actions from enhanced calculations
      const enhancedActions = generatePriorityActions(results, timelineData);
      setPriorityActions(enhancedActions);
      
      // Clean up stale checked actions when priority actions change
      if (checkedActions.length > 0) {
        const cleanedActions = cleanupStaleActions(checkedActions, enhancedActions);
        if (cleanedActions.length !== checkedActions.length) {
          setCheckedActions(cleanedActions);
          syncCleanedActionsToDatabase(cleanedActions);
        }
      }

      console.log('Enhanced Action Plan calculations:', {
        results,
        timeline: timelineData,
        investment: investmentData,
        roi: roiCalculation,
        actions: enhancedActions
      });
    } catch (error) {
      console.error('Error calculating enhanced results:', error);
      // Fallback to legacy calculations if enhanced fails
      const fallbackActions = getLegacyPriorityActions(submission);
      setPriorityActions(fallbackActions);
    }
  };

  const generatePriorityActions = (results: UnifiedCalculationResults, timeline: TimelinePhase[]) => {
    const actions = [];
    const { actionSpecificRecovery } = results;

    // Generate actions based on recovery potential and timeline phases
    if (actionSpecificRecovery.leadResponse > 10000) {
      actions.push({
        id: 'lead-response',
        title: 'Optimize Lead Response System',
        impact: actionSpecificRecovery.leadResponse,
        timeframe: '2-4 weeks',
        difficulty: 'Medium',
        description: 'Implement automated lead routing, instant notifications, and response tracking to reduce time-to-contact.',
        confidence: results.confidenceLevel,
        category: 'Quick Win',
        implementation: {
          effort: 'Medium',
          cost: investment ? Math.round(investment.implementationCost * 0.25) : 25000,
          prerequisites: ['CRM audit', 'Team training']
        }
      });
    }

    if (actionSpecificRecovery.selfServe > 15000) {
      actions.push({
        id: 'self-serve',
        title: 'Enhance Self-Serve Conversion',
        impact: actionSpecificRecovery.selfServe,
        timeframe: '4-8 weeks',
        difficulty: 'Hard',
        description: 'Redesign onboarding flow, implement progressive profiling, and add in-app guidance systems.',
        confidence: results.confidenceLevel,
        category: 'Growth Driver',
        implementation: {
          effort: 'High',
          cost: investment ? Math.round(investment.implementationCost * 0.35) : 40000,
          prerequisites: ['User research', 'A/B testing framework']
        }
      });
    }

    if (actionSpecificRecovery.paymentRecovery > 8000) {
      actions.push({
        id: 'payment-recovery',
        title: 'Deploy Smart Payment Recovery',
        impact: actionSpecificRecovery.paymentRecovery,
        timeframe: '1-3 weeks',
        difficulty: 'Easy',
        description: 'Implement intelligent retry logic, dunning management, and alternative payment methods.',
        confidence: results.confidenceLevel,
        category: 'Quick Win',
        implementation: {
          effort: 'Low',
          cost: investment ? Math.round(investment.implementationCost * 0.15) : 15000,
          prerequisites: ['Payment gateway integration']
        }
      });
    }

    if (actionSpecificRecovery.processAutomation > 12000) {
      actions.push({
        id: 'automation',
        title: 'Automate Critical Processes',
        impact: actionSpecificRecovery.processAutomation,
        timeframe: '6-12 weeks',
        difficulty: 'Hard',
        description: 'Replace manual workflows with automated systems for reporting, data entry, and customer communications.',
        confidence: results.confidenceLevel,
        category: 'Efficiency',
        implementation: {
          effort: 'High',
          cost: investment ? Math.round(investment.implementationCost * 0.25) : 30000,
          prerequisites: ['Process mapping', 'Tool selection']
        }
      });
    }

    return actions
      .sort((a, b) => (b.impact || 0) - (a.impact || 0))
      .slice(0, 6); // Limit to top 6 actions
  };

  const getLegacyPriorityActions = (submission: Submission) => {
    // Fallback to stored values if enhanced calculations fail
    const actions = [];
    const currentARR = submission.current_arr || 0;
    
    if ((submission.lead_response_loss || 0) > currentARR * 0.01) {
      actions.push({
        id: 'lead-response',
        title: 'Optimize Lead Response Time',
        impact: submission.lead_response_loss || 0,
        timeframe: '2-4 weeks',
        difficulty: 'Medium',
        description: 'Implement automated lead routing and response systems',
        confidence: 'medium',
        category: 'Quick Win'
      });
    }
    
    if ((submission.selfserve_gap_loss || 0) > currentARR * 0.01) {
      actions.push({
        id: 'self-serve',
        title: 'Optimize Self-Serve Conversion',
        impact: submission.selfserve_gap_loss || 0,
        timeframe: '4-6 weeks',
        difficulty: 'Hard',
        description: 'Enhance onboarding flow and reduce conversion friction',
        confidence: 'medium',
        category: 'Growth Driver'
      });
    }
    
    if ((submission.failed_payment_loss || 0) > currentARR * 0.005) {
      actions.push({
        id: 'payment-recovery',
        title: 'Deploy Payment Recovery System',
        impact: submission.failed_payment_loss || 0,
        timeframe: '1-2 weeks',
        difficulty: 'Easy',
        description: 'Implement automated dunning management and payment retry logic',
        confidence: 'high',
        category: 'Quick Win'
      });
    }
    
    if ((submission.process_inefficiency_loss || 0) > currentARR * 0.005) {
      actions.push({
        id: 'automation',
        title: 'Automate Manual Processes',
        impact: submission.process_inefficiency_loss || 0,
        timeframe: '6-8 weeks',
        difficulty: 'Hard',
        description: 'Replace manual workflows with automated systems',
        confidence: 'medium',
        category: 'Efficiency'
      });
    }

    return actions.sort((a, b) => (b.impact || 0) - (a.impact || 0));
  };

  const cleanupStaleActions = (checkedActions: string[], priorityActions: any[]) => {
    const validActionIds = new Set(priorityActions.map(action => action.id));
    return checkedActions.filter(actionId => validActionIds.has(actionId));
  };

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
      
      // Load checked actions but don't set them yet - wait for priority actions to be generated
      if (profile?.checked_actions && Array.isArray(profile.checked_actions)) {
        const rawCheckedActions = profile.checked_actions.filter((item): item is string => typeof item === 'string');
        
        // If we have priority actions already, clean up immediately
        if (priorityActions.length > 0) {
          const cleanedActions = cleanupStaleActions(rawCheckedActions, priorityActions);
          setCheckedActions(cleanedActions);
          
          // Update database with cleaned actions if there were changes
          if (cleanedActions.length !== rawCheckedActions.length) {
            await syncCleanedActionsToDatabase(cleanedActions);
          }
        } else {
          // Store temporarily until priority actions are available
          setCheckedActions(rawCheckedActions);
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const syncCleanedActionsToDatabase = async (cleanedActions: string[]) => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_profiles')
        .update({ checked_actions: cleanedActions })
        .eq('id', user.id);
        
      console.log('Cleaned stale actions from database');
    } catch (error) {
      console.error('Failed to sync cleaned actions:', error);
    }
  };

  const setupEngagementTracking = () => {
    if (!user || !submission) return;
    
    // Track initial page view
    trackEngagementEvent('action_plan_viewed', {
      recovery_potential: unifiedResults?.recovery70Percent || submission.total_leak,
      user_type: user.user_metadata?.role || 'standard',
      confidence_level: unifiedResults?.confidenceLevel || 'medium'
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

  const handleActionToggle = async (actionId: string, isChecked: boolean) => {
    // Validate that the action exists in current priority actions
    const actionExists = priorityActions.some(action => action.id === actionId);
    if (!actionExists) {
      console.warn(`Action ${actionId} not found in current priority actions. Skipping toggle.`);
      return;
    }
    
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
          last_action_plan_visit: new Date().toISOString(),
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
      recovery_potential: unifiedResults?.recovery70Percent || submission?.total_leak,
      engagement_level: getEngagementLevel()
    });
  };

  const handleExportPDF = async () => {
    try {
      // Track the export action
      await trackEngagementEvent('export_pdf', {
        recovery_potential: unifiedResults?.recovery70Percent || 0,
        actions_checked: checkedActions.length,
        engagement_level: getEngagementLevel()
      });

      // Create a comprehensive PDF export using the browser's print functionality
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${submission?.company_name} Action Plan</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .section { margin-bottom: 30px; }
                .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ccc; border-radius: 8px; }
                .action { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                .timeline-phase { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; }
                .confidence { color: #28a745; font-weight: bold; }
                .warning { color: #dc3545; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${submission?.company_name} Revenue Recovery Action Plan</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
                <p class="confidence">Confidence Level: ${unifiedResults?.confidenceLevel?.toUpperCase() || 'MEDIUM'}</p>
              </div>
              
              <div class="section">
                <h2>Executive Summary</h2>
                <div class="metric">
                  <strong>Total Revenue Leak:</strong> ${formatCurrency(unifiedResults?.totalLoss || submission?.total_leak || 0)}
                </div>
                <div class="metric">
                  <strong>Recovery Potential (Conservative):</strong> ${formatCurrency(unifiedResults?.recovery70Percent || 0)}
                </div>
                <div class="metric">
                  <strong>Implementation ROI:</strong> ${roiData?.confidenceAdjustedROI ? Math.round(roiData.confidenceAdjustedROI) : 0}%
                </div>
                <div class="metric">
                  <strong>Payback Period:</strong> ${investment?.paybackMonths ? Math.round(investment.paybackMonths) : 'TBD'} months
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
                    <p><strong>Category:</strong> ${action.category || 'General'}</p>
                    <p>${action.description}</p>
                  </div>
                `).join('')}
              </div>

              ${timeline.length > 0 ? `
                <div class="section">
                  <h2>Implementation Timeline</h2>
                  ${timeline.map(phase => `
                    <div class="timeline-phase">
                      <h4>${phase.title} (Months ${phase.startMonth}-${phase.endMonth})</h4>
                      <p>${phase.description}</p>
                      <p><strong>Recovery Potential:</strong> ${formatCurrency(phase.recoveryPotential)}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <div class="section">
                <h2>Implementation Progress</h2>
                <p>Actions Completed: ${checkedActions.length} of ${priorityActions.length}</p>
                <p>Progress: ${Math.round((checkedActions.length / priorityActions.length) * 100)}%</p>
              </div>

              ${unifiedResults?.confidenceLevel === 'low' ? `
                <div class="section warning">
                  <h3>⚠️ Important Notes</h3>
                  <p>This analysis has lower confidence due to limited data or high complexity factors. Use as directional guidance and consider additional validation.</p>
                </div>
              ` : ''}
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort?.toLowerCase()) {
      case 'low': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Quick Win': return <Zap className="h-4 w-4" />;
      case 'Growth Driver': return <TrendingUp className="h-4 w-4" />;
      case 'Efficiency': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Chart data generators
  const generateRecoveryChartData = () => {
    if (!timeline.length) return [];
    
    const data = [{ month: 'Current', cumulative: 0 }];
    let cumulativeTotal = 0;
    
    // Generate 12 months of data based on timeline phases
    for (let month = 1; month <= 12; month++) {
      let monthlyRecovery = 0;
      
      timeline.forEach(phase => {
        if (month >= phase.startMonth && month <= phase.endMonth) {
          const phaseProgress = (month - phase.startMonth + 1) / (phase.endMonth - phase.startMonth + 1);
          const totalPhaseMonths = phase.endMonth - phase.startMonth + 1;
          
          // Realistic ramp-up curve
          let monthlyContribution: number;
          if (phaseProgress <= 0.3) {
            monthlyContribution = (phase.recoveryPotential * 0.2) / (totalPhaseMonths * 0.3);
          } else if (phaseProgress <= 0.8) {
            monthlyContribution = (phase.recoveryPotential * 0.7) / (totalPhaseMonths * 0.5);
          } else {
            monthlyContribution = (phase.recoveryPotential * 0.1) / (totalPhaseMonths * 0.2);
          }
          
          monthlyRecovery += monthlyContribution;
        }
      });
      
      cumulativeTotal += monthlyRecovery;
      data.push({
        month: `Month ${month}`,
        cumulative: cumulativeTotal
      });
    }
    
    return data;
  };

  const generateInvestmentAnalysisData = () => {
    if (!timeline.length || !investment) return [];
    
    // Calculate phase-specific investment based on characteristics
    const phaseInvestments = timeline.map(phase => {
      // Base cost multipliers based on difficulty and duration
      const difficultyMultiplier = {
        'easy': 0.7,
        'medium': 1.0,
        'hard': 1.5
      }[phase.difficulty] || 1.0;
      
      // Duration factor (longer phases cost more)
      const durationMonths = phase.endMonth - phase.startMonth + 1;
      const durationMultiplier = Math.max(0.5, durationMonths / 3);
      
      // Action complexity factor
      const actionCount = phase.actions?.length || 3;
      const complexityMultiplier = Math.max(0.8, actionCount / 5);
      
      // Calculate relative cost weight
      const costWeight = difficultyMultiplier * durationMultiplier * complexityMultiplier;
      
      return { phase, costWeight };
    });
    
    // Calculate total weight and distribute investment proportionally
    const totalWeight = phaseInvestments.reduce((sum, item) => sum + item.costWeight, 0);
    
    return phaseInvestments.map(({ phase, costWeight }, index) => {
      const phaseInvestment = (investment.implementationCost * costWeight) / totalWeight;
      return {
        phase: `Phase ${index + 1}`,
        investment: Math.round(phaseInvestment),
        recovery: phase.recoveryPotential
      };
    });
  };

  const generateROIProgressionData = () => {
    if (!timeline.length || !investment) return [];
    
    const data = [];
    let cumulativeRecovery = 0;
    const totalInvestment = investment.totalAnnualInvestment;
    
    for (let month = 1; month <= 12; month++) {
      // Calculate monthly recovery based on timeline phases
      let monthlyRecovery = 0;
      timeline.forEach(phase => {
        if (month >= phase.startMonth && month <= phase.endMonth) {
          const monthsInPhase = phase.endMonth - phase.startMonth + 1;
          monthlyRecovery += phase.recoveryPotential / monthsInPhase;
        }
      });
      
      cumulativeRecovery += monthlyRecovery;
      const roi = totalInvestment > 0 ? ((cumulativeRecovery - totalInvestment) / totalInvestment) * 100 : 0;
      
      data.push({
        month: `M${month}`,
        roi: Math.max(roi, -100) // Cap at -100% for visualization
      });
    }
    
    return data;
  };

  const ProgressEncouragement = () => {
    const completionPercentage = Math.round((checkedActions.length / priorityActions.length) * 100);
    
    if (checkedActions.length === 0) {
      return (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Rocket className="h-6 w-6 text-primary" />
            <div>
              <strong className="text-primary font-semibold">Ready to Begin Implementation</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Start with the highest-impact actions to see immediate results
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (completionPercentage < 100) {
      return (
        <div className="mb-6 p-4 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-success" />
            <div>
              <strong className="text-success font-semibold">
                Excellent Progress! {completionPercentage}% Complete
              </strong>
              <p className="text-sm text-muted-foreground mt-1">
                {checkedActions.length} of {priorityActions.length} actions identified • Recovery potential: {formatCurrency(unifiedResults?.recovery70Percent || 0)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6 p-4 bg-warning/5 border border-warning/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-warning" />
          <div>
            <strong className="text-warning font-semibold">All Actions Identified!</strong>
            <p className="text-sm text-muted-foreground mt-1">
              Ready for implementation strategy? Consider expert guidance for maximum success
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/80 to-primary/5">
        <div className="text-center relative">
          {/* Glassmorphism loading card */}
          <div className="backdrop-blur-sm bg-background/70 rounded-2xl p-8 border border-border shadow-2xl">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <Calculator className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground font-medium">Calculating your enhanced action plan...</p>
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
        <Card className="max-w-md mx-auto text-center backdrop-blur-sm bg-background/90 border shadow-2xl">
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

  const actionsChecked = checkedActions.length;
  const completionPercentage = Math.round((actionsChecked / priorityActions.length) * 100);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Compact Hero Section */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Link to={`/results/${submission.id}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Results
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-h1 font-bold">Enhanced Action Plan</h1>
                    <p className="text-sm text-muted-foreground">{submission?.company_name}</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4">
                  Your data-driven roadmap to recover{" "}
                  <span className="font-semibold text-success">
                    {formatCurrency(unifiedResults?.recovery70Percent || submission?.total_leak || 0)}
                  </span>{" "}
                  in annual revenue with {unifiedResults?.confidenceLevel || 'medium'} confidence.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm">
                      <span className="font-semibold">{Math.round(roiData?.confidenceAdjustedROI || 0)}%</span> ROI
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">{investment?.paybackMonths ? Math.round(investment.paybackMonths) : 'TBD'} month payback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-secondary" />
                    <span className="text-sm">
                      {actionsChecked}/{priorityActions.length} actions completed
                    </span>
                  </div>
                  {unifiedResults?.confidenceLevel && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-warning" />
                      <span className="text-sm capitalize">{unifiedResults.confidenceLevel} confidence</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {Math.round(completionPercentage)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                </Card>
                
                <Button 
                  onClick={handleExportPDF}
                  className="bg-primary hover:bg-primary/90"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProgressEncouragement />

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="actions">
              Actions ({priorityActions.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Revenue Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    </div>
                    Enhanced Revenue Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Lead Response Loss</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(unifiedResults?.leadResponseLoss || submission?.lead_response_loss || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Self-Serve Gap</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(unifiedResults?.selfServeGapLoss || submission?.selfserve_gap_loss || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Payment Failures</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(unifiedResults?.failedPaymentLoss || submission?.failed_payment_loss || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Process Inefficiency</span>
                      <span className="font-bold text-destructive">
                        {formatCurrency(unifiedResults?.processInefficiencyLoss || submission?.process_inefficiency_loss || 0)}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-lg">
                        <span className="font-bold">Total Annual Leak</span>
                        <span className="text-lg font-bold text-destructive">
                          {formatCurrency(unifiedResults?.totalLoss || submission?.total_leak || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Recovery Potential */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Target className="h-5 w-5 text-success" />
                    </div>
                    Recovery Scenarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg border border-success/20">
                      <div>
                        <span className="font-medium">Conservative (70%)</span>
                        <p className="text-xs text-muted-foreground">High confidence</p>
                      </div>
                      <span className="font-bold text-success">
                        {formatCurrency(unifiedResults?.recovery70Percent || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warning/5 rounded-lg border border-warning/20">
                      <div>
                        <span className="font-medium">Optimistic (85%)</span>
                        <p className="text-xs text-muted-foreground">Strong execution</p>
                      </div>
                      <span className="font-bold text-warning">
                        {formatCurrency(unifiedResults?.recovery85Percent || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div>
                        <span className="font-medium">Best Case</span>
                        <p className="text-xs text-muted-foreground">Perfect conditions</p>
                      </div>
                      <span className="font-bold text-primary">
                        {formatCurrency(unifiedResults?.recoveryBestCase || 0)}
                      </span>
                    </div>
                  </div>
                  
                  {unifiedResults?.confidenceBounds && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Confidence Range:</strong> {formatCurrency(unifiedResults.confidenceBounds.lower)} - {formatCurrency(unifiedResults.confidenceBounds.upper)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Investment Analysis */}
              {investment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <DollarSign className="h-5 w-5 text-warning" />
                      </div>
                      Investment Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">Implementation Cost</span>
                        <span className="font-bold">
                          {formatCurrency(investment.implementationCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">Annual Ongoing</span>
                        <span className="font-bold">
                          {formatCurrency(investment.ongoingCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">Payback Period</span>
                        <span className="font-bold">
                          {Math.round(investment.paybackMonths)} months
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ROI Analysis */}
              {roiData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      ROI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">Baseline ROI</span>
                        <span className="font-bold">
                          {Math.round(roiData.roi)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="font-medium">Confidence-Adjusted ROI</span>
                        <span className="font-bold text-primary">
                          {Math.round(roiData.confidenceAdjustedROI)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">Return Category</span>
                        <Badge variant="secondary">
                          {roiData.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6 mt-6">
            <div className="space-y-4">
              {priorityActions.map((action, index) => (
                <Card key={action.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id={action.id}
                        checked={checkedActions.includes(action.id)}
                        onCheckedChange={(checked) => handleActionToggle(action.id, checked as boolean)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(action.category)}
                                <h3 className="font-semibold text-lg">{action.title}</h3>
                              </div>
                              <Badge className={getDifficultyColor(action.difficulty)}>
                                {action.difficulty}
                              </Badge>
                              <Badge variant="outline">
                                {action.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{action.description}</p>
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-success">
                              {formatCurrency(action.impact || 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">recovery potential</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{action.timeframe}</span>
                          </div>
                          {action.implementation && (
                            <>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Est. Cost: {formatCurrency(action.implementation.cost)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <Badge className={getEffortColor(action.implementation.effort)}>
                                  {action.implementation.effort} effort
                                </Badge>
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <Badge className={getConfidenceColor(action.confidence)}>
                              {action.confidence} confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-6">
            {timeline.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-success mb-1">
                        {timeline.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Implementation Phases</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {Math.max(...timeline.map(p => p.endMonth))}
                      </div>
                      <div className="text-sm text-muted-foreground">Months to Complete</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-warning mb-1">
                        {formatCurrency(timeline.reduce((sum, p) => sum + p.recoveryPotential, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Recovery</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-destructive mb-1">
                        {investment ? Math.round(investment.paybackMonths) : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Month Payback</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Recovery Timeline Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      Cumulative Recovery Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateRecoveryChartData()}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false}
                            tickLine={false}
                            className="text-xs"
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            className="text-xs"
                            tickFormatter={(value) => formatCurrency(value)}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: number) => [formatCurrency(value), 'Cumulative Recovery']}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            stroke="hsl(var(--success))"
                            fill="hsl(var(--success)/0.2)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Investment vs Recovery Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-warning" />
                        </div>
                        Investment vs Recovery
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={generateInvestmentAnalysisData()}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="phase" 
                              axisLine={false}
                              tickLine={false}
                              className="text-xs"
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              className="text-xs"
                              tickFormatter={(value) => formatCurrency(value)}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                              formatter={(value: number, name: string) => [
                                formatCurrency(value), 
                                name === 'investment' ? 'Investment' : 'Recovery'
                              ]}
                            />
                            <Bar 
                              dataKey="investment" 
                              fill="hsl(var(--destructive)/0.7)" 
                              name="investment"
                            />
                            <Bar 
                              dataKey="recovery" 
                              fill="hsl(var(--success)/0.7)" 
                              name="recovery"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        ROI Progression
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={generateROIProgressionData()}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="month" 
                              axisLine={false}
                              tickLine={false}
                              className="text-xs"
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              className="text-xs"
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                              formatter={(value: number) => [`${Math.round(value)}%`, 'ROI']}
                            />
                            <Line
                              type="monotone"
                              dataKey="roi"
                              stroke="hsl(var(--primary))"
                              strokeWidth={3}
                              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Implementation Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-secondary" />
                      </div>
                      Implementation Phases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timeline.map((phase, index) => (
                        <Card key={phase.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                    {index + 1}
                                  </div>
                                  <h3 className="font-semibold text-lg">{phase.title}</h3>
                                  <Badge className={getDifficultyColor(phase.difficulty)}>
                                    {phase.difficulty}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground mb-3">{phase.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Months {phase.startMonth}-{phase.endMonth}
                                  </span>
                                  <span className="font-medium text-success">
                                    {formatCurrency(phase.recoveryPotential)} recovery
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions List */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Key Implementation Actions:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {phase.actions.map((action, actionIndex) => (
                                  <div key={actionIndex} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                      {actionIndex + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{action.title}</p>
                                      <p className="text-xs text-muted-foreground">{action.weeks}w • {action.owner}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Timeline Under Development</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're analyzing your specific situation to create a detailed implementation timeline. 
                  Check back soon or contact us for personalized guidance.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Strategic CTA Section */}
        <div className="mt-12">
          <StrategicCTASection
            totalLeak={unifiedResults?.totalLoss || submission?.total_leak || 0}
            recovery70={unifiedResults?.recovery70Percent || submission?.recovery_potential_70 || 0}
            leadScore={submission?.lead_score || 50}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      {/* Enhanced Floating CTA */}
      <FloatingCTABar
        totalLeak={unifiedResults?.totalLoss || submission?.total_leak || 0}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default ActionPlan;