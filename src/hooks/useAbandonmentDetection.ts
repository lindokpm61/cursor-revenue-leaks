
import { useState, useEffect, useCallback, useRef } from 'react';
import { scheduleAbandonmentRecovery } from '@/lib/coreDataCapture';
import { trackEngagement } from '@/lib/submission/engagementTracking';

interface AbandonmentDetectionConfig {
  // Inactivity settings
  inactivityTimeout: number; // milliseconds before considering user inactive
  warningTimeout: number; // show warning before abandonment
  
  // Engagement thresholds
  minimumTimeOnPage: number; // minimum time before tracking abandonment
  minimumScrollDepth: number; // minimum scroll percentage for engagement
  minimumInteractions: number; // minimum interactions before tracking
  
  // Step-specific settings
  stepTimeouts: Record<number, number>; // custom timeouts per step
  criticalSteps: number[]; // steps where abandonment is more critical
}

interface AbandonmentState {
  isActive: boolean;
  timeOnPage: number;
  lastActivity: number;
  scrollDepth: number;
  interactionCount: number;
  currentStep: number;
  hasMinimumEngagement: boolean;
  showWarning: boolean;
  isAbandoned: boolean;
}

interface ActivityEvent {
  type: 'scroll' | 'click' | 'keypress' | 'focus' | 'step_change';
  timestamp: number;
  step: number;
  data?: any;
}

const defaultConfig: AbandonmentDetectionConfig = {
  inactivityTimeout: 300000, // 5 minutes
  warningTimeout: 240000, // 4 minutes (show warning 1 minute before abandonment)
  minimumTimeOnPage: 30000, // 30 seconds
  minimumScrollDepth: 20, // 20% scroll
  minimumInteractions: 3, // 3 interactions
  stepTimeouts: {
    1: 600000, // 10 minutes for step 1 (company info)
    2: 480000, // 8 minutes for step 2 (lead gen)
    3: 360000, // 6 minutes for step 3 (self-serve)
    4: 300000, // 5 minutes for step 4 (operations)
    5: 180000  // 3 minutes for step 5 (results)
  },
  criticalSteps: [2, 3, 4] // Steps where abandonment recovery is most important
};

export const useAbandonmentDetection = (
  tempId: string | null,
  currentStep: number,
  calculatorData: any,
  config: Partial<AbandonmentDetectionConfig> = {}
) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abandonmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityLogRef = useRef<ActivityEvent[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  
  const [state, setState] = useState<AbandonmentState>({
    isActive: true,
    timeOnPage: 0,
    lastActivity: Date.now(),
    scrollDepth: 0,
    interactionCount: 0,
    currentStep,
    hasMinimumEngagement: false,
    showWarning: false,
    isAbandoned: false
  });

  // Memoize the record activity function to prevent re-renders
  const recordActivity = useCallback((type: ActivityEvent['type'], data?: any) => {
    const timestamp = Date.now();
    const activity: ActivityEvent = {
      type,
      timestamp,
      step: currentStep,
      data
    };
    
    activityLogRef.current.push(activity);
    
    // Keep only last 50 activities
    if (activityLogRef.current.length > 50) {
      activityLogRef.current = activityLogRef.current.slice(-50);
    }
    
    setState(prev => ({
      ...prev,
      lastActivity: timestamp,
      interactionCount: prev.interactionCount + 1,
      showWarning: false // Reset warning on activity
    }));
  }, [currentStep]); // Only depend on currentStep

  // Memoize scroll depth update to prevent excessive re-renders
  const updateScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    setState(prev => {
      const newScrollDepth = Math.max(prev.scrollDepth, scrollPercent);
      // Only update if there's a significant change (>5%)
      if (newScrollDepth > prev.scrollDepth + 5) {
        recordActivity('scroll', { scrollPercent: newScrollDepth });
        return { ...prev, scrollDepth: newScrollDepth };
      }
      return prev;
    });
  }, [recordActivity]);

  // Memoize engagement status check
  const updateEngagementStatus = useCallback(() => {
    setState(prev => {
      const hasMinimumTime = prev.timeOnPage >= mergedConfig.minimumTimeOnPage;
      const hasMinimumScroll = prev.scrollDepth >= mergedConfig.minimumScrollDepth;
      const hasMinimumInteractions = prev.interactionCount >= mergedConfig.minimumInteractions;
      
      const newHasMinimumEngagement = hasMinimumTime && (hasMinimumScroll || hasMinimumInteractions);
      
      // Only update if engagement status actually changed
      if (newHasMinimumEngagement !== prev.hasMinimumEngagement) {
        return { ...prev, hasMinimumEngagement: newHasMinimumEngagement };
      }
      return prev;
    });
  }, [mergedConfig.minimumTimeOnPage, mergedConfig.minimumScrollDepth, mergedConfig.minimumInteractions]);

  // Handle abandonment with proper memoization
  const handleAbandonment = useCallback(async () => {
    if (state.isAbandoned || !tempId || !state.hasMinimumEngagement) return;
    
    setState(prev => ({ ...prev, isAbandoned: true, isActive: false }));
    
    try {
      // Track abandonment event
      await trackEngagement('calculator_abandoned', {
        step: currentStep,
        time_on_page: state.timeOnPage,
        interaction_count: state.interactionCount,
        scroll_depth: state.scrollDepth,
        activity_log: activityLogRef.current.slice(-10), // Last 10 activities
        abandonment_reason: 'inactivity_timeout'
      });

      // Schedule abandonment recovery if on critical step
      if (mergedConfig.criticalSteps.includes(currentStep)) {
        const recoveryData = {
          tempId,
          currentStep,
          calculatorData,
          abandonmentContext: {
            time_on_page: state.timeOnPage,
            interaction_count: state.interactionCount,
            scroll_depth: state.scrollDepth,
            last_activity: new Date(state.lastActivity).toISOString()
          }
        };
        
        await scheduleAbandonmentRecovery(tempId, recoveryData);
        
        console.log('🚨 Abandonment detected - recovery scheduled', {
          step: currentStep,
          tempId,
          hasMinimumEngagement: state.hasMinimumEngagement
        });
      }
      
    } catch (error) {
      console.error('Error handling abandonment:', error);
    }
  }, [tempId, currentStep, calculatorData, state.isAbandoned, state.hasMinimumEngagement, state.timeOnPage, state.interactionCount, state.scrollDepth, state.lastActivity, mergedConfig.criticalSteps]);

  // Reset abandonment timers with proper dependencies
  const resetAbandonmentTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    
    if (abandonmentTimeoutRef.current) {
      clearTimeout(abandonmentTimeoutRef.current);
      abandonmentTimeoutRef.current = null;
    }
    
    if (!state.isAbandoned && state.hasMinimumEngagement) {
      const stepTimeout = mergedConfig.stepTimeouts[currentStep] || mergedConfig.inactivityTimeout;
      
      // Set warning timer
      warningTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, showWarning: true }));
        
        trackEngagement('abandonment_warning_shown', {
          step: currentStep,
          time_on_page: Date.now() - startTimeRef.current,
          interaction_count: state.interactionCount
        });
      }, mergedConfig.warningTimeout);
      
      // Set abandonment timer
      abandonmentTimeoutRef.current = setTimeout(() => {
        handleAbandonment();
      }, stepTimeout);
    }
  }, [currentStep, state.isAbandoned, state.hasMinimumEngagement, state.interactionCount, mergedConfig.stepTimeouts, mergedConfig.inactivityTimeout, mergedConfig.warningTimeout, handleAbandonment]);

  // Time tracking with proper cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeOnPage: Date.now() - startTimeRef.current
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once

  // Step change tracking with proper dependencies
  useEffect(() => {
    setState(prev => ({ ...prev, currentStep }));
    recordActivity('step_change', { step: currentStep });
  }, [currentStep, recordActivity]);

  // Engagement tracking with debounced updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateEngagementStatus();
    }, 100); // Debounce updates

    return () => clearTimeout(timeoutId);
  }, [state.timeOnPage, state.scrollDepth, state.interactionCount, updateEngagementStatus]);

  // Reset timers when engagement status changes
  useEffect(() => {
    if (state.hasMinimumEngagement && state.isActive) {
      resetAbandonmentTimers();
    }
  }, [state.hasMinimumEngagement, state.isActive, resetAbandonmentTimers]);

  // Activity listeners with proper cleanup
  useEffect(() => {
    const handleClick = () => recordActivity('click');
    const handleKeyPress = () => recordActivity('keypress');
    const handleFocus = () => recordActivity('focus');
    const handleScroll = () => updateScrollDepth();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordActivity('focus', { visibility: 'hidden' });
      } else {
        recordActivity('focus', { visibility: 'visible' });
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeyPress);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordActivity, updateScrollDepth]); // Proper dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (abandonmentTimeoutRef.current) clearTimeout(abandonmentTimeoutRef.current);
    };
  }, []);

  // Manual abandonment trigger (for testing)
  const triggerAbandonment = useCallback(() => {
    handleAbandonment();
  }, [handleAbandonment]);

  // Dismiss warning
  const dismissWarning = useCallback(() => {
    setState(prev => ({ ...prev, showWarning: false }));
    recordActivity('click', { action: 'dismiss_warning' });
  }, [recordActivity]);

  // Resume tracking
  const resumeTracking = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isAbandoned: false, 
      isActive: true, 
      showWarning: false 
    }));
    recordActivity('focus', { action: 'resume_tracking' });
  }, [recordActivity]);

  return {
    // State
    ...state,
    
    // Activity log
    activityLog: activityLogRef.current,
    
    // Control methods
    recordActivity,
    triggerAbandonment,
    dismissWarning,
    resumeTracking,
    
    // Analytics
    getEngagementScore: () => {
      const timeScore = Math.min(state.timeOnPage / mergedConfig.minimumTimeOnPage, 1) * 30;
      const scrollScore = Math.min(state.scrollDepth / 100, 1) * 30;
      const interactionScore = Math.min(state.interactionCount / 10, 1) * 40;
      return Math.round(timeScore + scrollScore + interactionScore);
    },
    
    // Config for debugging
    config: mergedConfig
  };
};
