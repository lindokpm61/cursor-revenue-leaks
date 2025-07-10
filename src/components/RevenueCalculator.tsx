import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Calculator, TrendingUp, AlertTriangle } from "lucide-react";
import { CompanyInfoStep } from "./calculator/CompanyInfoStep";
import { LeadGenerationStep } from "./calculator/LeadGenerationStep";
import { SelfServeStep } from "./calculator/SelfServeStep";
import { OperationsStep } from "./calculator/OperationsStep";
import { ResultsStep } from "./calculator/ResultsStep";
import { useCalculatorData } from "./calculator/useCalculatorData";
import { updateCalculatorProgress, trackEngagement, getTemporarySubmission } from "@/lib/submission";
import { 
  handleStep1Complete, 
  handleStep2Complete, 
  handleStep3Complete, 
  handleStep4Complete,
  isValidEmail 
} from "@/lib/calculatorHandlers";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Company Info", description: "Basic company information" },
  { id: 2, title: "Lead Generation", description: "Lead generation metrics" },
  { id: 3, title: "Self-Serve Metrics", description: "Free-to-paid conversion data" },
  { id: 4, title: "Operations", description: "Operational efficiency metrics" },
  { id: 5, title: "Results", description: "Revenue leak analysis" }
];

export const RevenueCalculator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [calculationResults, setCalculationResults] = useState<any>(null);
  const { data, updateData, calculations } = useCalculatorData();
  const { toast } = useToast();

  // Initialize calculator and load any existing temporary data
  useEffect(() => {
    const initializeCalculator = async () => {
      try {
        // Track initial page view
        await trackEngagement('page_view');
        
        // Try to load existing temporary submission
        const existingSubmission = await getTemporarySubmission();
        if (existingSubmission && existingSubmission.calculator_data) {
          // Restore data from temporary submission
          const savedData = existingSubmission.calculator_data as Record<string, any>;
          if (savedData.step_1) {
            updateData('companyInfo', savedData.step_1);
          }
          if (savedData.step_2) {
            updateData('leadGeneration', savedData.step_2);
          }
          if (savedData.step_3) {
            updateData('selfServeMetrics', savedData.step_3);
          }
          if (savedData.step_4) {
            updateData('operationsData', savedData.step_4);
          }
          
          // Set current step to where user left off
          if (existingSubmission.current_step) {
            setCurrentStep(existingSubmission.current_step);
          }
        }
      } catch (error) {
        console.error('Error initializing calculator:', error);
      }
    };

    initializeCalculator();
  }, []);

  const nextStep = async () => {
    if (currentStep < steps.length) {
      try {
        // Validate and handle step completion based on current step
        switch (currentStep) {
          case 1:
            // Validate step 1 data
            if (!data.companyInfo.companyName?.trim() || !data.companyInfo.email?.trim()) {
              toast({
                title: "Required Fields Missing",
                description: "Please enter your company name and email address.",
                variant: "destructive",
              });
              return;
            }
            
            if (!isValidEmail(data.companyInfo.email)) {
              toast({
                title: "Invalid Email",
                description: "Please provide a valid business email address.",
                variant: "destructive",
              });
              return;
            }
            
            await handleStep1Complete(data.companyInfo, setCurrentStep);
            toast({
              title: "Company Information Saved",
              description: "Welcome! Let's analyze your lead generation metrics.",
            });
            break;
            
          case 2:
            await handleStep2Complete(data.leadGeneration, setCurrentStep);
            toast({
              title: "Lead Generation Data Saved",
              description: "Great! Now let's look at your self-serve metrics.",
            });
            break;
            
          case 3:
            await handleStep3Complete(data.selfServeMetrics, setCurrentStep);
            toast({
              title: "Self-Serve Metrics Saved",
              description: "Excellent! Finally, let's capture your operations data.",
            });
            break;
            
          case 4:
            await handleStep4Complete(
              data.operationsData, 
              setCurrentStep, 
              (results) => setCalculationResults(results)
            );
            toast({
              title: "Analysis Complete!",
              description: "Your revenue leak analysis is ready. Check out your results below.",
            });
            break;
            
          default:
            setCurrentStep(currentStep + 1);
        }
        
        await trackEngagement('tab_navigation');
      } catch (error: any) {
        console.error('Error in step completion:', error);
        toast({
          title: "Error",
          description: error.message || "An error occurred while saving your data. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCurrentStepData = () => {
    switch (currentStep) {
      case 1:
        return data.companyInfo;
      case 2:
        return data.leadGeneration;
      case 3:
        return data.selfServeMetrics;
      case 4:
        return data.operationsData;
      default:
        return {};
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep data={data.companyInfo} onUpdate={(updates) => updateData('companyInfo', updates)} />;
      case 2:
        return <LeadGenerationStep data={data.leadGeneration} onUpdate={(updates) => updateData('leadGeneration', updates)} />;
      case 3:
        return <SelfServeStep data={data.selfServeMetrics} onUpdate={(updates) => updateData('selfServeMetrics', updates)} />;
      case 4:
        return <OperationsStep data={data.operationsData} onUpdate={(updates) => updateData('operationsData', updates)} />;
      case 5:
        // Always use the live calculations from useCalculatorData for consistency
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
              disabled={currentStep === 1 && (!data.companyInfo.companyName?.trim() || !data.companyInfo.email?.trim())}
            >
              {currentStep === 4 ? 'Calculate Results' : 'Next'}
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