import { useState } from "react";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { EnhancedLandingHero } from "@/components/EnhancedLandingHero";
import { CalculatorErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);

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
      <EnhancedLandingHero onStartCalculator={() => setShowCalculator(true)} />
    </div>
  );
};

export default Index;
