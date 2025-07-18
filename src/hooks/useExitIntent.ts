
import { useState, useEffect, useCallback, useRef } from 'react';

interface ExitIntentConfig {
  threshold: number; // pixels from top to trigger
  delay: number; // minimum time on page before trigger (ms)
  scrollThreshold: number; // minimum scroll percentage
  cooldownPeriod: number; // time to wait after dismissal before re-triggering (ms)
}

interface ExitIntentState {
  isTriggered: boolean;
  hasEngagement: boolean;
  timeOnPage: number;
  scrollDepth: number;
  isDismissed: boolean;
  dismissedAt: number | null;
}

export const useExitIntent = (config: ExitIntentConfig = {
  threshold: 50,
  delay: 30000, // 30 seconds
  scrollThreshold: 50, // 50%
  cooldownPeriod: 300000 // 5 minutes cooldown
}) => {
  const [state, setState] = useState<ExitIntentState>({
    isTriggered: false,
    hasEngagement: false,
    timeOnPage: 0,
    scrollDepth: 0,
    isDismissed: false,
    dismissedAt: null
  });

  const [startTime] = useState(Date.now());
  const lastTriggerTime = useRef<number>(0);

  // Check if we're in cooldown period
  const isInCooldown = useCallback(() => {
    if (!state.dismissedAt) return false;
    return Date.now() - state.dismissedAt < config.cooldownPeriod;
  }, [state.dismissedAt, config.cooldownPeriod]);

  // Track scroll depth
  const updateScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    setState(prev => ({
      ...prev,
      scrollDepth: Math.max(prev.scrollDepth, scrollPercent)
    }));
  }, []);

  // Track time on page
  useEffect(() => {
    const interval = setInterval(() => {
      const timeOnPage = Date.now() - startTime;
      setState(prev => ({
        ...prev,
        timeOnPage,
        hasEngagement: timeOnPage >= config.delay && prev.scrollDepth >= config.scrollThreshold
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, config.delay, config.scrollThreshold]);

  // Exit intent detection with improved logic
  useEffect(() => {
    const handleMouseOut = (e: MouseEvent) => {
      const now = Date.now();
      
      setState(currentState => {
        console.log('Exit intent detection:', {
          clientY: e.clientY,
          threshold: config.threshold,
          hasEngagement: currentState.hasEngagement,
          isTriggered: currentState.isTriggered,
          isDismissed: currentState.isDismissed,
          isInCooldown: isInCooldown(),
          timeSinceLastTrigger: now - lastTriggerTime.current,
          relatedTarget: e.relatedTarget
        });
        
        // Prevent rapid re-triggering (minimum 10 seconds between triggers)
        if (now - lastTriggerTime.current < 10000) {
          console.log('Exit intent blocked: too soon since last trigger');
          return currentState;
        }

        // Check if mouse is leaving the document (going to browser chrome)
        if (!e.relatedTarget && e.clientY <= config.threshold) {
          console.log('Exit intent conditions met - mouse left viewport');
          
          // Don't trigger if already triggered, dismissed, or in cooldown
          if (currentState.isTriggered || currentState.isDismissed || isInCooldown()) {
            console.log('Exit intent blocked:', { 
              isTriggered: currentState.isTriggered, 
              isDismissed: currentState.isDismissed,
              isInCooldown: isInCooldown()
            });
            return currentState;
          }

          // Don't trigger if user hasn't engaged enough
          if (!currentState.hasEngagement) {
            console.log('Exit intent blocked: insufficient engagement');
            return currentState;
          }

          console.log('Triggering exit intent modal');
          lastTriggerTime.current = now;
          return { ...currentState, isTriggered: true };
        }
        
        return currentState;
      });
    };

    // Handle escape key
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isTriggered) {
        console.log('Escape key pressed - dismissing exit intent');
        markAsDismissed();
      }
    };

    // Track scroll for engagement
    const handleScroll = () => {
      updateScrollDepth();
    };

    // Add listeners
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [config.threshold, updateScrollDepth, state.isTriggered, state.isDismissed, isInCooldown]);

  const resetTrigger = useCallback(() => {
    console.log('Resetting exit intent trigger');
    setState(prev => ({ ...prev, isTriggered: false }));
  }, []);

  const markAsDismissed = useCallback(() => {
    console.log('Marking exit intent as dismissed with cooldown');
    setState(prev => ({ 
      ...prev, 
      isTriggered: false, 
      isDismissed: true, 
      dismissedAt: Date.now() 
    }));
    
    // Store dismissal in session storage
    sessionStorage.setItem('exitIntentDismissed', Date.now().toString());
  }, []);

  // Check session storage on mount
  useEffect(() => {
    const dismissedTime = sessionStorage.getItem('exitIntentDismissed');
    if (dismissedTime) {
      const dismissedAt = parseInt(dismissedTime);
      const timeSinceDismissal = Date.now() - dismissedAt;
      
      if (timeSinceDismissal < config.cooldownPeriod) {
        console.log('Exit intent still in cooldown from previous session');
        setState(prev => ({ 
          ...prev, 
          isDismissed: true, 
          dismissedAt 
        }));
      } else {
        // Clear expired dismissal
        sessionStorage.removeItem('exitIntentDismissed');
      }
    }
  }, [config.cooldownPeriod]);

  return {
    ...state,
    resetTrigger,
    markAsDismissed,
    isInCooldown: isInCooldown()
  };
};
