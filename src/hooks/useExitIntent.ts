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
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is moving upward toward browser chrome
      if (e.clientY <= config.threshold && e.movementY < 0) {
        setState(prev => {
          if (!prev.isTriggered && prev.hasEngagement) {
            return { ...prev, isTriggered: true };
          }
          return prev;
        });
      }
    };

    // Track scroll for engagement
    const handleScroll = () => {
      updateScrollDepth();
    };

    // Add listeners
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
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