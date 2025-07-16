import { useState, useEffect, useCallback } from 'react';
import { experimentService, Experiment, ExperimentVariant } from '@/lib/experimentation/experimentService';

interface ExperimentContext {
  experimentId: string;
  variantId: string | null;
  isActive: boolean;
  variant?: ExperimentVariant;
}

export const useExperimentTracking = (experimentName?: string) => {
  const [experiments, setExperiments] = useState<ExperimentContext[]>([]);
  const [loading, setLoading] = useState(true);

  // Load active experiments and assign user to variants
  useEffect(() => {
    const initializeExperiments = async () => {
      try {
        const activeExperiments = await experimentService.getActiveExperiments();
        const experimentContexts: ExperimentContext[] = [];

        for (const experiment of activeExperiments) {
          // Check if experiment should be shown to user (traffic allocation)
          const shouldShow = await experimentService.shouldShowExperiment(experiment.id);
          
          if (shouldShow) {
            // Get or assign variant for this user
            let variantId = await experimentService.getUserVariant(experiment.id);
            
            if (!variantId) {
              variantId = await experimentService.assignVariant(experiment.id);
            }

            // Get variant details
            let variant: ExperimentVariant | undefined;
            if (variantId) {
              const variants = await experimentService.getExperimentVariants(experiment.id);
              variant = variants.find(v => v.id === variantId);
            }

            experimentContexts.push({
              experimentId: experiment.id,
              variantId,
              isActive: !!variantId,
              variant
            });
          }
        }

        setExperiments(experimentContexts);
      } catch (error) {
        console.error('Error initializing experiments:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeExperiments();
  }, []);

  // Get specific experiment context
  const getExperimentContext = useCallback((experimentId: string): ExperimentContext | null => {
    return experiments.find(exp => exp.experimentId === experimentId) || null;
  }, [experiments]);

  // Get experiment by name (if name provided)
  const getExperimentByName = useCallback((name: string): ExperimentContext | null => {
    // This would require storing experiment names - for now using ID
    console.warn('Getting experiment by name not implemented. Use experiment ID instead.');
    return null;
  }, []);

  // Track experiment event
  const trackEvent = useCallback(async (
    experimentId: string,
    eventType: string,
    eventData?: Record<string, any>,
    value?: number
  ) => {
    const context = getExperimentContext(experimentId);
    
    if (context?.variantId && context.isActive) {
      await experimentService.trackEvent(
        experimentId,
        context.variantId,
        eventType,
        eventData,
        value
      );
    }
  }, [getExperimentContext]);

  // Track conversion event (shorthand)
  const trackConversion = useCallback(async (
    experimentId: string,
    value?: number,
    eventData?: Record<string, any>
  ) => {
    await trackEvent(experimentId, 'conversion', eventData, value);
  }, [trackEvent]);

  // Check if user is in specific variant
  const isInVariant = useCallback((experimentId: string, variantName: string): boolean => {
    const context = getExperimentContext(experimentId);
    return context?.variant?.name === variantName && context.isActive;
  }, [getExperimentContext]);

  // Check if user is in control group
  const isInControl = useCallback((experimentId: string): boolean => {
    const context = getExperimentContext(experimentId);
    return context?.variant?.is_control === true && context.isActive;
  }, [getExperimentContext]);

  // Get variant configuration
  const getVariantConfig = useCallback((experimentId: string): Record<string, any> | null => {
    const context = getExperimentContext(experimentId);
    const config = context?.variant?.configuration;
    return config && typeof config === 'object' && !Array.isArray(config) ? config as Record<string, any> : null;
  }, [getExperimentContext]);

  return {
    experiments,
    loading,
    getExperimentContext,
    getExperimentByName,
    trackEvent,
    trackConversion,
    isInVariant,
    isInControl,
    getVariantConfig
  };
};