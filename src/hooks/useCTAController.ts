
import { useState, useEffect, useCallback } from 'react';
import { useExitIntent } from './useExitIntent';
import { useProgressiveEmailCapture } from './useProgressiveEmailCapture';

export type CTAType = 'floating_bar' | 'exit_intent' | 'progressive_email' | 'time_based' | 'engagement_based';

interface CTAState {
  activeCTA: CTAType | null;
  priority: number;
  context?: any;
}

interface CTAControllerConfig {
  enableFloatingBar: boolean;
  enableExitIntent: boolean;
  enableProgressiveEmail: boolean;
  enableTimeBased: boolean;
  timeBasedDelay: number; // milliseconds
  engagementThreshold: number; // scroll percentage + time combination
}

const defaultConfig: CTAControllerConfig = {
  enableFloatingBar: true,
  enableExitIntent: true,
  enableProgressiveEmail: true,
  enableTimeBased: true,
  timeBasedDelay: 180000, // 3 minutes
  engagementThreshold: 60 // 60% scroll + 2min time
};

export const useCTAController = (
  tempId: string | null,
  currentStep: number,
  recoveryData: { totalLeak: number; formatCurrency: (amount: number) => string },
  config: Partial<CTAControllerConfig> = {}
) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const [ctaState, setCTAState] = useState<CTAState>({ activeCTA: null, priority: 0 });
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize hooks
  const exitIntent = useExitIntent({
    threshold: 50,
    delay: 30000,
    scrollThreshold: 25
  });

  const progressiveEmail = useProgressiveEmailCapture(tempId, currentStep, {
    timeBasedCapture: mergedConfig.enableProgressiveEmail,
    exitIntentCapture: mergedConfig.enableExitIntent,
    timeBasedDelay: mergedConfig.timeBasedDelay,
    minimumValueThreshold: 50000
  });

  // Track time on page
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeOnPage(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScrollDepth = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollDepth(Math.max(scrollDepth, currentScrollDepth));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollDepth]);

  // Track user interaction
  useEffect(() => {
    const handleInteraction = () => setHasInteracted(true);
    
    ['click', 'keydown', 'touchstart', 'mousemove'].forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      ['click', 'keydown', 'touchstart', 'mousemove'].forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  // CTA priority logic
  const triggerCTA = useCallback((type: CTAType, priority: number, context?: any) => {
    if (priority > ctaState.priority) {
      setCTAState({ activeCTA: type, priority, context });
      return true;
    }
    return false;
  }, [ctaState.priority]);

  const dismissCTA = useCallback(() => {
    setCTAState({ activeCTA: null, priority: 0 });
  }, []);

  // Exit intent trigger
  useEffect(() => {
    if (exitIntent.isTriggered && mergedConfig.enableExitIntent && !progressiveEmail.hasEmail) {
      triggerCTA('exit_intent', 90, { recoveryAmount: recoveryData.totalLeak });
    }
  }, [exitIntent.isTriggered, mergedConfig.enableExitIntent, progressiveEmail.hasEmail, triggerCTA, recoveryData.totalLeak]);

  // Progressive email trigger
  useEffect(() => {
    if (progressiveEmail.isActive) {
      triggerCTA('progressive_email', 85, { 
        trigger: progressiveEmail.activeCapture,
        context: progressiveEmail.captureContext 
      });
    }
  }, [progressiveEmail.isActive, progressiveEmail.activeCapture, progressiveEmail.captureContext, triggerCTA]);

  // Time-based CTA trigger
  useEffect(() => {
    if (
      mergedConfig.enableTimeBased &&
      timeOnPage >= mergedConfig.timeBasedDelay &&
      !progressiveEmail.hasEmail &&
      hasInteracted &&
      scrollDepth >= 30
    ) {
      triggerCTA('time_based', 70, { 
        timeOnPage,
        scrollDepth,
        recoveryAmount: recoveryData.totalLeak 
      });
    }
  }, [timeOnPage, mergedConfig.enableTimeBased, mergedConfig.timeBasedDelay, progressiveEmail.hasEmail, hasInteracted, scrollDepth, triggerCTA, recoveryData.totalLeak]);

  // Floating bar trigger (lower priority)
  useEffect(() => {
    if (
      mergedConfig.enableFloatingBar &&
      scrollDepth >= 40 &&
      timeOnPage >= 60000 && // 1 minute
      !progressiveEmail.hasEmail
    ) {
      triggerCTA('floating_bar', 50, { 
        scrollDepth,
        timeOnPage,
        recoveryAmount: recoveryData.totalLeak 
      });
    }
  }, [scrollDepth, timeOnPage, mergedConfig.enableFloatingBar, progressiveEmail.hasEmail, triggerCTA, recoveryData.totalLeak]);

  return {
    // State
    activeCTA: ctaState.activeCTA,
    ctaContext: ctaState.context,
    timeOnPage,
    scrollDepth,
    hasInteracted,

    // Controls
    triggerCTA,
    dismissCTA,

    // Hook states
    exitIntent,
    progressiveEmail,

    // Engagement metrics
    isHighEngagement: scrollDepth >= 60 && timeOnPage >= 120000, // 60% scroll + 2min
    engagementScore: Math.min(100, Math.round((scrollDepth * 0.6) + (Math.min(timeOnPage / 1000, 300) * 0.4)))
  };
};
