import React, { useEffect } from 'react';
import { useExperiments } from './ExperimentProvider';
import Index from '@/pages/Index';
import Landing from '@/pages/Landing';

export const LandingPageABTest: React.FC = () => {
  const { experiments, loading, trackEvent, isInVariant, isInControl } = useExperiments();
  
  const experimentId = 'landing_page_test';

  useEffect(() => {
    // Track page view for the experiment
    const trackPageView = async () => {
      if (!loading) {
        const variant = isInControl(experimentId) ? 'control' : 
                      isInVariant(experimentId, 'Variant B - Comprehensive') ? 'variant_b' : 'control';
        
        await trackEvent(experimentId, 'page_view', { 
          variant,
          timestamp: Date.now(),
          url: window.location.href 
        });
      }
    };

    trackPageView();
  }, [loading, experimentId, trackEvent, isInControl, isInVariant]);

  // Track calculator starts for conversion measurement
  const trackCalculatorStart = async () => {
    await trackEvent(experimentId, 'calculator_start', { 
      timestamp: Date.now(),
      conversion_step: 'primary_cta'
    });
  };

  if (loading) {
    // Show streamlined version while loading
    return <Index />;
  }

  // Determine which variant to show
  if (isInVariant(experimentId, 'Variant B - Comprehensive')) {
    // Show comprehensive Landing.tsx
    return <Landing />;
  }

  // Default to control (streamlined Index.tsx)
  return <Index />;
};