import { useState } from "react";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { EnhancedLandingHero } from "@/components/EnhancedLandingHero";
import { CalculatorErrorBoundary } from "@/components/ErrorBoundary";
import { useExperiments } from "@/components/experiments/ExperimentProvider";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const { trackEvent } = useExperiments();

  const handleStartCalculator = async () => {
    // Track conversion for A/B test
    await trackEvent('landing_page_test', 'calculator_start', { 
      variant: 'control',
      timestamp: Date.now() 
    });
    setShowCalculator(true);
  };

  if (showCalculator) {
    return (
      <div className="min-h-screen bg-background">
        <CalculatorErrorBoundary>
          <RevenueCalculator />
        </CalculatorErrorBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <EnhancedLandingHero onStartCalculator={handleStartCalculator} />
    </div>
  );
};

export default Index;
