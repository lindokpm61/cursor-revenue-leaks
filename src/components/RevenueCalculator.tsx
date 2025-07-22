import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Calculator, TrendingUp, AlertTriangle, AlertCircle, Target, BarChart3 } from "lucide-react";
import { CompanyInfoStep } from "./calculator/CompanyInfoStep";
import { LeadGenerationStep } from "./calculator/LeadGenerationStep";
import { SelfServeStep } from "./calculator/SelfServeStep";
import { OperationsStep } from "./calculator/OperationsStep";
import { ResultsStep } from "./calculator/ResultsStep";
import { ResultsPreview } from "./calculator/ResultsPreview";
import { ExitIntentModal } from "./calculator/ExitIntentModal";
import { ProgressiveEmailCapture } from "./calculator/ProgressiveEmailCapture";
import { useCalculatorData } from "./calculator/useCalculatorData";
import { useExitIntent } from "@/hooks/useExitIntent";
import { useProgressiveEmailCapture } from "@/hooks/useProgressiveEmailCapture";
import { updateCalculatorProgress, trackEngagement, getTemporarySubmission } from "@/lib/submission";
import { 
  handleStep1Complete, 
  handleStep2Complete, 
  handleStep3Complete, 
  handleStep4Complete,
  isValidEmail 
} from "@/lib/calculatorHandlers";
import { useToast } from "@/hooks/use-toast";
import { useAbandonmentDetection } from "@/hooks/useAbandonmentDetection";
import { AbandonmentWarning } from "@/components/AbandonmentWarning";

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
  const [tempId, setTempId] = useState<string | null>(null);
  const { data, updateData, calculations } = useCalculatorData();
  const { toast } = useToast();
  
  // Exit intent detection
  const exitIntent = useExitIntent({
    threshold: 100, // Increase threshold to make it easier to trigger
    delay: 10000, // Reduce delay to 10 seconds for testing
    scrollThreshold: 30, // Reduce scroll threshold for testing
    cooldownPeriod: 300000 // 5 minutes cooldown
  });

  // Progressive email capture
  const emailCapture = useProgressiveEmailCapture(tempId, currentStep, {
    timeBasedDelay: 90000, // 1.5 minutes for time-based capture
    stepCaptureSteps: [2, 3], // Trigger after steps 2 and 3
    minimumValueThreshold: 25000 // $25k minimum for value-based triggers
  });

  // Real-time abandonment detection
  const abandonmentDetection = useAbandonmentDetection(tempId, currentStep, data, {
    inactivityTimeout: 240000, // 4 minutes for testing (normally 5 minutes)
    warningTimeout: 180000, // 3 minutes for testing (normally 4 minutes)
    minimumTimeOnPage: 20000, // 20 seconds for testing
    stepTimeouts: {
      1: 480000, // 8 minutes for step 1
      2: 360000, // 6 minutes for step 2
      3: 300000, // 5 minutes for step 3
      4: 240000, // 4 minutes for step 4
      5: 120000  // 2 minutes for step 5
    },
    criticalSteps: [2, 3, 4] // Enable abandonment recovery for these steps
  });

  // Integrate exit intent with progressive email capture
  useEffect(() => {
    if (exitIntent.isTriggered && !emailCapture.hasEmail && !emailCapture.isActive) {
      emailCapture.triggerExitIntent({
        companyName: data.companyInfo.companyName,
        estimatedValue: getEstimatedLeak()
      });
      exitIntent.resetTrigger(); // Reset exit intent since we're handling it with progressive capture
    }
  }, [exitIntent.isTriggered, emailCapture.hasEmail, emailCapture.isActive]);

  // Initialize calculator and load any existing temporary data
  useEffect(() => {
    const initializeCalculator = async () => {
      try {
        console.log('🔄 Initializing calculator...');
        
        // Force clear ALL invalid temp_id formats from localStorage immediately
        const currentTempId = localStorage.getItem('calculator_temp_id');
        const oldTempId = localStorage.getItem('temp_submission_id'); // Old key
        
        if (currentTempId && !currentTempId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          console.log('🧹 Clearing invalid temp_id from calculator_temp_id:', currentTempId);
          localStorage.removeItem('calculator_temp_id');
        }
        
        if (oldTempId) {
          console.log('🧹 Clearing old temp_id from temp_submission_id:', oldTempId);
          localStorage.removeItem('temp_submission_id');
        }
        
        // Track initial page view
        await trackEngagement('page_view');
        
        // Try to load existing temporary submission
        const existingSubmission = await getTemporarySubmission();
        console.log('📊 Existing submission found:', existingSubmission);
        
        if (existingSubmission) {
          setTempId(existingSubmission.temp_id);
          
          // TEMPORARY FIX: Always start fresh to prevent jumping to results
          // TODO: Remove this fix once the root cause is identified
          console.log('🔧 TEMP FIX: Starting fresh instead of restoring saved state');
          
          /* Commented out to force fresh start
          if (existingSubmission.calculator_data) {
            console.log('📋 Restoring calculator data:', existingSubmission.calculator_data);
            
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
              console.log('🎯 Restoring to step:', existingSubmission.current_step);
              setCurrentStep(existingSubmission.current_step);
            }
          }
          */
        } else {
          console.log('✨ No existing submission - starting fresh');
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
            
            // Update progressive email capture with the email from step 1
            if (data.companyInfo.email && !emailCapture.hasEmail) {
              emailCapture.handleEmailCaptured(data.companyInfo.email);
            }
            
            toast({
              title: "Company Information Saved",
              description: "Welcome! Let's analyze your lead generation metrics.",
            });
            break;
            
          case 2:
            console.log('Step 2 validation - data:', data.leadGeneration);
            await handleStep2Complete(data.leadGeneration, setCurrentStep);
            
            // Trigger progressive email capture after step 2 completion
            if (!emailCapture.hasEmail) {
              emailCapture.triggerStepCompletion(2, data.leadGeneration);
            }
            
            toast({
              title: "Lead Generation Data Saved",
              description: "Great! Now let's look at your self-serve metrics.",
            });
            break;
            
          case 3:
            await handleStep3Complete(data.selfServeMetrics, setCurrentStep);
            
            // Trigger progressive email capture after step 3 completion
            if (!emailCapture.hasEmail) {
              emailCapture.triggerStepCompletion(3, data.selfServeMetrics);
            }
            
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
            
            // Trigger value-based email capture when results are calculated
            if (!emailCapture.hasEmail && calculations.totalLeakage > 0) {
              emailCapture.triggerValueReveal(
                calculations.totalLeakage, 
                data.companyInfo.companyName
              );
            }
            
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

  // Helper function to check if we have valid data for preview
  const hasValidData = () => {
    return (data.companyInfo.companyName && data.companyInfo.email && 
           (data.leadGeneration.monthlyLeads > 0 || data.selfServeMetrics.monthlyFreeSignups > 0));
  };

  // Calculate estimated leak for preview
  const getEstimatedLeak = () => {
    if (!hasValidData()) return undefined;
    
    const arr = data.companyInfo.currentARR || 1000000; // Default 1M if not provided
    const estimatedLeak = arr * 0.2; // Rough 20% estimate for preview
    return estimatedLeak;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep data={data.companyInfo} onUpdate={(updates) => updateData('companyInfo', updates)} />;
      case 2:
        return <LeadGenerationStep data={data.leadGeneration} onUpdate={(updates) => updateData('leadGeneration', updates)} industry={data.companyInfo.industry} />;
      case 3:
        return <SelfServeStep data={data.selfServeMetrics} onUpdate={(updates) => updateData('selfServeMetrics', updates)} industry={data.companyInfo.industry} />;
      case 4:
        return <OperationsStep data={data.operationsData} onUpdate={(updates) => updateData('operationsData', updates)} industry={data.companyInfo.industry} />;
      case 5:
        // Always use the live calculations from useCalculatorData for consistency
        return <ResultsStep data={data} calculations={calculations} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] p-4">
      {/* Progressive Email Capture Modal */}
      <ProgressiveEmailCapture
        isOpen={emailCapture.isActive}
        onClose={emailCapture.handleCaptureDismissed}
        onSuccess={emailCapture.handleEmailCaptured}
        currentStep={currentStep}
        tempId={tempId}
        trigger={emailCapture.activeCapture || 'exit_intent'}
        context={emailCapture.captureContext}
      />
      
      {/* Abandonment Warning */}
      <AbandonmentWarning
        isVisible={abandonmentDetection.showWarning}
        onDismiss={abandonmentDetection.dismissWarning}
        onStayActive={() => {
          abandonmentDetection.dismissWarning();
          abandonmentDetection.recordActivity('click', { action: 'stay_active' });
        }}
        timeRemaining={abandonmentDetection.config.inactivityTimeout - (Date.now() - abandonmentDetection.lastActivity)}
        currentStep={currentStep}
      />

      {/* Legacy Exit Intent Modal - Only show if progressive capture is not active */}
      <ExitIntentModal
        isOpen={exitIntent.isTriggered && !emailCapture.isActive}
        onClose={exitIntent.resetTrigger}
        currentStep={currentStep}
        tempId={tempId}
        companyName={data.companyInfo.companyName}
        estimatedLeak={getEstimatedLeak()}
      />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-revenue-growth rounded-xl blur-sm opacity-60"></div>
              <div className="relative p-4 rounded-xl bg-gradient-to-r from-primary to-revenue-growth shadow-attention-glow">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-hero bg-gradient-to-r from-primary via-revenue-growth to-primary bg-clip-text text-transparent font-black tracking-tight">
                STRATEGIC REVENUE OPTIMIZER
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-small text-primary font-bold uppercase tracking-wider">OPPORTUNITY ASSESSMENT</span>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <p className="text-h3 text-muted-foreground max-w-2xl mx-auto text-center leading-relaxed">
            <span className="font-bold text-primary uppercase tracking-wide">UNLOCK YOUR REVENUE POTENTIAL</span><br/>
            Discover strategic opportunities to optimize your revenue performance - every insight drives growth
          </p>
          
          {/* Strategic indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-small">
            <div className="flex items-center gap-2 text-primary">
              <Target className="w-4 h-4" />
              <span className="font-semibold">Instant strategic insights</span>
            </div>
            <div className="flex items-center gap-2 text-revenue-growth">
              <BarChart3 className="w-4 h-4" />
              <span className="font-semibold">Growth opportunity plan</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">Essential for revenue optimization</span>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <Card className="mb-8 border-border/30 shadow-xl bg-gradient-to-r from-card via-card to-card/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-body font-semibold text-foreground">
                  Step {currentStep} of {steps.length}
                </span>
                {currentStep === 5 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-revenue-success/10 rounded-full">
                    <TrendingUp className="h-4 w-4 text-revenue-success" />
                    <span className="text-small font-medium text-revenue-success">Complete!</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-h3 font-bold text-primary">
                  {Math.round(progress)}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
            
            {/* Enhanced Progress Bar with Animation */}
            <div className="relative mb-6">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-revenue-primary to-accent rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                </div>
              </div>
              {currentStep < 5 && (
                <div className="absolute -top-1 -bottom-1" style={{ left: `${progress}%` }}>
                  <div className="w-5 h-5 bg-primary rounded-full shadow-attention-glow animate-attention-pulse border-2 border-background transform -translate-x-1/2"></div>
                </div>
              )}
            </div>
            
            {/* Enhanced Step Indicators */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        step.id <= currentStep
                          ? 'bg-gradient-to-r from-primary to-revenue-primary text-primary-foreground shadow-lg scale-110'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {step.id <= currentStep && step.id < currentStep ? (
                        <div className="text-primary-foreground">✓</div>
                      ) : (
                        step.id
                      )}
                      {step.id === currentStep && (
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                      )}
                    </div>
                    <span className={`text-xs text-center mt-2 max-w-20 transition-colors ${
                      step.id <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 rounded-full transition-colors duration-500 ${
                      step.id < currentStep 
                        ? 'bg-gradient-to-r from-primary to-revenue-primary' 
                        : 'bg-border'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Current Step Content */}
        <Card className="mb-8 border-border/30 shadow-2xl bg-gradient-to-br from-card via-card to-card/90 backdrop-blur-sm">
          <CardHeader className="border-b border-border/30 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  currentStep === 5 
                    ? 'bg-revenue-success/10 text-revenue-success' 
                    : 'bg-revenue-warning/10 text-revenue-warning'
                }`}>
                  {currentStep === 5 ? <TrendingUp className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                </div>
                <div>
                  <CardTitle className="text-h2 text-foreground">
                    {steps[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription className="text-body mt-1">
                    {steps[currentStep - 1].description}
                  </CardDescription>
                </div>
              </div>
              
              {/* Step time estimate */}
              {currentStep < 5 && (
                <div className="text-right">
                  <div className="text-small text-muted-foreground">
                    ⏱ ~1 min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    to complete
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Results Preview */}
        {currentStep < 5 && (
          <ResultsPreview
            completedSteps={currentStep - 1}
            totalSteps={4}
            hasValidData={hasValidData()}
            estimatedLeakValue={getEstimatedLeak()}
            topLeakCategory="Lead Response"
          />
        )}

        {/* Enhanced Navigation */}
        {currentStep < 5 && (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 touch-target hover:bg-muted/50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {/* Progress indicator for mobile */}
            <div className="hidden max-sm:flex items-center gap-1">
              {steps.slice(0, 4).map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step.id <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <Button
              onClick={() => {
                console.log('Continue button clicked, currentStep:', currentStep);
                console.log('Current data for step 2:', data.leadGeneration);
                nextStep();
              }}
              className="flex items-center gap-3 bg-gradient-to-r from-primary via-revenue-primary to-accent hover:opacity-90 shadow-attention-glow touch-target font-semibold text-body transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={currentStep === 1 && (!data.companyInfo.companyName?.trim() || !data.companyInfo.email?.trim())}
            >
              {currentStep === 4 ? (
                <>
                  <Calculator className="h-4 w-4" />
                  Calculate My Revenue Leaks
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-2 touch-target"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Edit Data
              </Button>
              
              <Button
                className="bg-gradient-to-r from-revenue-success to-accent text-white hover:opacity-90 shadow-lg touch-target font-semibold"
                onClick={() => {
                  const element = document.querySelector('[data-section="action-plan"]');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Growth Plan
              </Button>
            </div>
            
            {/* Success message */}
            <div className="bg-revenue-success/5 border border-revenue-success/20 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-small text-revenue-success font-medium">
                🎉 Analysis complete! Scroll down to see your personalized recommendations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
