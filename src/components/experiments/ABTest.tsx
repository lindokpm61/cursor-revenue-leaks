import React, { useEffect, useState } from 'react';
import { useExperiments } from './ExperimentProvider';

interface ABTestProps {
  experimentId: string;
  children: {
    control: React.ReactNode;
    [variantName: string]: React.ReactNode;
  };
  fallback?: React.ReactNode;
}

export const ABTest: React.FC<ABTestProps> = ({ 
  experimentId, 
  children, 
  fallback 
}) => {
  const { experiments, loading, getVariantConfig, isInControl } = useExperiments();
  const [currentVariant, setCurrentVariant] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && experiments.length > 0) {
      const experiment = experiments.find(exp => exp.experimentId === experimentId);
      if (experiment?.variant?.name) {
        setCurrentVariant(experiment.variant.name.toLowerCase());
      } else if (isInControl(experimentId)) {
        setCurrentVariant('control');
      }
    }
  }, [experiments, loading, experimentId, isInControl]);

  if (loading) {
    return fallback ? <>{fallback}</> : <>{children.control}</>;
  }

  if (!currentVariant || !children[currentVariant]) {
    return <>{children.control}</>;
  }

  return <>{children[currentVariant]}</>;
};

interface ConditionalRenderProps {
  experimentId: string;
  variantName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  experimentId,
  variantName,
  children,
  fallback
}) => {
  const { isInVariant, loading } = useExperiments();

  if (loading) {
    return fallback ? <>{fallback}</> : null;
  }

  if (isInVariant(experimentId, variantName)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

interface ExperimentTrackerProps {
  experimentId: string;
  eventType: string;
  eventData?: Record<string, any>;
  value?: number;
  children: (trackEvent: () => void) => React.ReactNode;
}

export const ExperimentTracker: React.FC<ExperimentTrackerProps> = ({
  experimentId,
  eventType,
  eventData,
  value,
  children
}) => {
  const { trackEvent } = useExperiments();

  const handleTrackEvent = () => {
    trackEvent(experimentId, eventType, eventData, value);
  };

  return <>{children(handleTrackEvent)}</>;
};