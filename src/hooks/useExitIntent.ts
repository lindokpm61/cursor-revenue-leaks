import { useState, useEffect, useCallback } from 'react';

interface ExitIntentConfig {
  threshold: number; // pixels from top to trigger
  delay: number; // minimum time on page before trigger (ms)
  scrollThreshold: number; // minimum scroll percentage
}

interface ExitIntentState {
  isTriggered: boolean;
  hasEngagement: boolean;
  timeOnPage: number;
  scrollDepth: number;
}

export const useExitIntent = (config: ExitIntentConfig = {
  threshold: 50,
  delay: 30000, // 30 seconds
  scrollThreshold: 50 // 50%
}) => {
  const [state, setState] = useState<ExitIntentState>({
    isTriggered: false,
    hasEngagement: false,
    timeOnPage: 0,
    scrollDepth: 0
  });

  const [startTime] = useState(Date.now());

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

  // Exit intent detection
  useEffect(() => {
    const handleMouseOut = (e: MouseEvent) => {
      setState(currentState => {
        console.log('Mouse out detected:', {
          clientY: e.clientY,
          movementY: e.movementY,
          threshold: config.threshold,
          hasEngagement: currentState.hasEngagement,
          isTriggered: currentState.isTriggered,
          toElement: e.relatedTarget
        });
        
        // Check if mouse is leaving the document (going to browser chrome)
        if (!e.relatedTarget && e.clientY <= config.threshold) {
          console.log('Exit intent conditions met - mouse left viewport');
          if (!currentState.isTriggered && currentState.hasEngagement) {
            console.log('Triggering exit intent modal');
            return { ...currentState, isTriggered: true };
          }
          console.log('Exit intent not triggered:', { 
            isTriggered: currentState.isTriggered, 
            hasEngagement: currentState.hasEngagement 
          });
        }
        return currentState;
      });
    };

    // Track scroll for engagement
    const handleScroll = () => {
      updateScrollDepth();
    };

    // Add listeners
    document.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [config.threshold, updateScrollDepth]);

  const resetTrigger = useCallback(() => {
    setState(prev => ({ ...prev, isTriggered: false }));
  }, []);

  return {
    ...state,
    resetTrigger
  };
};