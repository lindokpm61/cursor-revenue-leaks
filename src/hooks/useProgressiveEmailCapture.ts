import { useState, useEffect, useCallback } from 'react';
import { getTemporarySubmission } from '@/lib/submission/submissionStorage';
import { trackEngagement } from '@/lib/submission/engagementTracking';

interface ProgressiveEmailCaptureConfig {
  stepCompletionCapture: boolean;
  timeBasedCapture: boolean;
  valueRevealCapture: boolean;
  exitIntentCapture: boolean;
  timeBasedDelay: number; // milliseconds
  stepCaptureSteps: number[]; // which steps to trigger on
  minimumValueThreshold: number; // minimum value to trigger value-based capture
}

interface ProgressiveEmailCaptureState {
  hasEmail: boolean;
  emailCaptured: string | null;
  captureShown: Set<string>;
  timeOnPage: number;
  canShowCapture: boolean;
}

interface CaptureContext {
  companyName?: string;
  estimatedValue?: number;
  stepData?: any;
}

const defaultConfig: ProgressiveEmailCaptureConfig = {
  stepCompletionCapture: true,
  timeBasedCapture: true,
  valueRevealCapture: true,
  exitIntentCapture: true,
  timeBasedDelay: 120000, // 2 minutes
  stepCaptureSteps: [2, 3], // Trigger after steps 2 and 3
  minimumValueThreshold: 50000 // $50k minimum for value-based triggers
};

export const useProgressiveEmailCapture = (
  tempId: string | null,
  currentStep: number,
  config: Partial<ProgressiveEmailCaptureConfig> = {}
) => {
  const mergedConfig = { ...defaultConfig, ...config };
  
  const [state, setState] = useState<ProgressiveEmailCaptureState>({
    hasEmail: false,
    emailCaptured: null,
    captureShown: new Set(),
    timeOnPage: 0,
    canShowCapture: false
  });

  const [activeCapture, setActiveCapture] = useState<{
    type: 'step_completion' | 'time_based' | 'value_reveal' | 'exit_intent' | null;
    context?: CaptureContext;
  }>({ type: null });

  // Initialize and check for existing email
  useEffect(() => {
    const initializeEmailCapture = async () => {
      if (!tempId) return;

      try {
        const submission = await getTemporarySubmission(tempId);
        if (submission?.email) {
          setState(prev => ({
            ...prev,
            hasEmail: true,
            emailCaptured: submission.email,
            canShowCapture: false
          }));
        } else {
          setState(prev => ({ ...prev, canShowCapture: true }));
        }
      } catch (error) {
        console.error('Error checking existing email:', error);
        setState(prev => ({ ...prev, canShowCapture: true }));
      }
    };

    initializeEmailCapture();
  }, [tempId]);

  // Time tracking for time-based capture
  useEffect(() => {
    if (!state.canShowCapture || state.hasEmail) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const timeOnPage = Date.now() - startTime;
      setState(prev => ({ ...prev, timeOnPage }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.canShowCapture, state.hasEmail]);

  // Time-based capture trigger
  useEffect(() => {
    if (
      mergedConfig.timeBasedCapture &&
      state.canShowCapture &&
      !state.hasEmail &&
      state.timeOnPage >= mergedConfig.timeBasedDelay &&
      !state.captureShown.has('time_based')
    ) {
      triggerCapture('time_based');
    }
  }, [state.timeOnPage, state.canShowCapture, state.hasEmail, state.captureShown, mergedConfig]);

  const triggerCapture = useCallback((
    type: 'step_completion' | 'time_based' | 'value_reveal' | 'exit_intent',
    context?: CaptureContext
  ) => {
    if (state.hasEmail || state.captureShown.has(type)) return false;

    // Check if this capture type is enabled
    switch (type) {
      case 'step_completion':
        if (!mergedConfig.stepCompletionCapture) return false;
        break;
      case 'time_based':
        if (!mergedConfig.timeBasedCapture) return false;
        break;
      case 'value_reveal':
        if (!mergedConfig.valueRevealCapture) return false;
        if (context?.estimatedValue && context.estimatedValue < mergedConfig.minimumValueThreshold) return false;
        break;
      case 'exit_intent':
        if (!mergedConfig.exitIntentCapture) return false;
        break;
    }

    setState(prev => ({
      ...prev,
      captureShown: new Set([...prev.captureShown, type])
    }));

    setActiveCapture({ type, context });

    // Track the trigger event
    trackEngagement('progressive_email_trigger', {
      trigger_type: type,
      step: currentStep,
      time_on_page: state.timeOnPage,
      context
    }).catch(error => console.error('Error tracking email trigger:', error));

    return true;
  }, [state.hasEmail, state.captureShown, state.timeOnPage, currentStep, mergedConfig]);

  // Step completion trigger
  const triggerStepCompletion = useCallback((step: number, stepData?: any) => {
    if (mergedConfig.stepCaptureSteps.includes(step)) {
      return triggerCapture('step_completion', { stepData });
    }
    return false;
  }, [triggerCapture, mergedConfig.stepCaptureSteps]);

  // Value reveal trigger
  const triggerValueReveal = useCallback((estimatedValue: number, companyName?: string) => {
    return triggerCapture('value_reveal', { estimatedValue, companyName });
  }, [triggerCapture]);

  // Exit intent trigger
  const triggerExitIntent = useCallback((context?: CaptureContext) => {
    return triggerCapture('exit_intent', context);
  }, [triggerCapture]);

  // Handle successful email capture
  const handleEmailCaptured = useCallback((email: string) => {
    setState(prev => ({
      ...prev,
      hasEmail: true,
      emailCaptured: email,
      canShowCapture: false
    }));
    setActiveCapture({ type: null });

    // Track successful capture
    trackEngagement('progressive_email_captured', {
      trigger_type: activeCapture.type,
      step: currentStep,
      time_on_page: state.timeOnPage,
      email_provided: true
    }).catch(error => console.error('Error tracking email capture:', error));
  }, [activeCapture.type, currentStep, state.timeOnPage]);

  // Handle capture dismissal
  const handleCaptureDismissed = useCallback(() => {
    // Track dismissal
    trackEngagement('progressive_email_dismissed', {
      trigger_type: activeCapture.type,
      step: currentStep,
      time_on_page: state.timeOnPage,
      email_provided: false
    }).catch(error => console.error('Error tracking email dismissal:', error));

    setActiveCapture({ type: null });
  }, [activeCapture.type, currentStep, state.timeOnPage]);

  // Reset capture for testing/debugging
  const resetCapture = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasEmail: false,
      emailCaptured: null,
      captureShown: new Set(),
      canShowCapture: true
    }));
    setActiveCapture({ type: null });
  }, []);

  return {
    // State
    hasEmail: state.hasEmail,
    emailCaptured: state.emailCaptured,
    isActive: activeCapture.type !== null,
    activeCapture: activeCapture.type,
    captureContext: activeCapture.context,
    timeOnPage: state.timeOnPage,
    canShowCapture: state.canShowCapture,

    // Triggers
    triggerStepCompletion,
    triggerValueReveal,
    triggerExitIntent,

    // Handlers
    handleEmailCaptured,
    handleCaptureDismissed,

    // Utilities
    resetCapture,
    
    // Config for debugging
    config: mergedConfig
  };
};