import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import { CompanyInfoStep } from "./calculator/CompanyInfoStep";
import { LeadMetricsStep } from "./calculator/LeadMetricsStep";
import { ConversionDataStep } from "./calculator/ConversionDataStep";
import { OperationsDataStep } from "./calculator/OperationsDataStep";
import { ResultsStep } from "./calculator/ResultsStep";
import { useCalculatorData } from "./calculator/useCalculatorData";

const steps = [
  { id: 1, title: "Company Info", description: "Basic company information" },
  { id: 2, title: "Lead Metrics", description: "Lead generation and qualification" },
  { id: 3, title: "Conversion Data", description: "Sales conversion metrics" },
  { id: 4, title: "Operations", description: "Customer success and retention" },
  { id: 5, title: "Results", description: "Revenue leak analysis" }
];

export const RevenueCalculator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { data, updateData, calculations } = useCalculatorData();

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep data={data.companyInfo} onUpdate={(updates) => updateData('companyInfo', updates)} />;
      case 2:
        return <LeadMetricsStep data={data.leadMetrics} onUpdate={(updates) => updateData('leadMetrics', updates)} />;
      case 3:
        return <ConversionDataStep data={data.conversionData} onUpdate={(updates) => updateData('conversionData', updates)} />;
      case 4:
        return <OperationsDataStep data={data.operationsData} onUpdate={(updates) => updateData('operationsData', updates)} />;
      case 5:
        return <ResultsStep data={data} calculations={calculations} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
              <Calculator className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-revenue-primary bg-clip-text text-transparent">
              SaaS Revenue Leak Calculator
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Identify and quantify revenue leaks in your sales funnel to maximize growth potential
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 border-border/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of {steps.length}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step.id <= currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.id}
                    </div>
                    <span className="text-xs text-center mt-2 max-w-20">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-px bg-border mx-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card className="mb-8 border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-2xl flex items-center gap-3">
              {steps[currentStep - 1].title}
              {currentStep === 5 && <TrendingUp className="h-6 w-6 text-revenue-success" />}
              {currentStep < 5 && <AlertTriangle className="h-6 w-6 text-revenue-warning" />}
            </CardTitle>
            <CardDescription className="text-lg">
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={nextStep}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-revenue-primary hover:opacity-90"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-2 mx-auto"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Edit Data
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};