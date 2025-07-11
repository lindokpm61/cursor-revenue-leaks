import { RevenueCalculator } from "@/components/RevenueCalculator";
import { CalculatorErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <CalculatorErrorBoundary>
        <RevenueCalculator />
      </CalculatorErrorBoundary>
    </div>
  );
};

export default Index;
