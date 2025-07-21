import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { EnhancedLandingHero } from "@/components/EnhancedLandingHero";
import { CalculatorErrorBoundary } from "@/components/ErrorBoundary";
import { useExperiments } from "@/components/experiments/ExperimentProvider";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const { trackEvent } = useExperiments();
  const location = useLocation();

  // Check if user came from dashboard and auto-start calculator
  useEffect(() => {
    // If user navigated from dashboard, automatically start the calculator
    if (location.state?.fromDashboard) {
      setShowCalculator(true);
    }
  }, [location.state]);

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
