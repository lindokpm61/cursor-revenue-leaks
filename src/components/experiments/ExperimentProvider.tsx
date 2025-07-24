import React, { createContext, useContext, ReactNode } from 'react';
import { useExperimentTracking } from '@/hooks/useExperimentTracking';

interface ExperimentContextType {
  experiments: any[];
  loading: boolean;
  trackEvent: (experimentId: string, eventType: string, eventData?: Record<string, any>, value?: number) => Promise<void>;
  trackConversion: (experimentId: string, value?: number, eventData?: Record<string, any>) => Promise<void>;
  isInVariant: (experimentId: string, variantName: string) => boolean;
  isInControl: (experimentId: string) => boolean;
  getVariantConfig: (experimentId: string) => Record<string, any> | null;
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined);

interface ExperimentProviderProps {
  children: ReactNode;
}

export const ExperimentProvider: React.FC<ExperimentProviderProps> = ({ children }) => {
  const experimentTracking = useExperimentTracking();

  return (
    <ExperimentContext.Provider value={experimentTracking}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiments = () => {
  const context = useContext(ExperimentContext);
  if (context === undefined) {
    throw new Error('useExperiments must be used within an ExperimentProvider');
  }
  return context;
};