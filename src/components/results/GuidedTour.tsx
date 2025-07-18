
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft, ArrowRight, Target, Eye } from "lucide-react";

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedTour = ({ onComplete, onSkip }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      title: "Welcome to Your Revenue Analysis",
      content: "We've identified exactly where your company is losing revenue and how to recover it.",
      action: "Let's start",
      icon: Target
    },
    {
      title: "Your Revenue Opportunity",
      content: "The large number shows your total revenue at risk. Focus on this - it's your biggest opportunity.",
      action: "Got it",
      icon: Eye
    },
    {
      title: "Next Steps",
      content: "Click 'Get My Recovery Plan' to see exactly what actions to take first. This is where the real value begins.",
      action: "Show me",
      icon: ArrowRight
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
            <p className="text-muted-foreground">{currentStepData.content}</p>
          </div>

          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} className="flex items-center gap-2">
              {currentStepData.action}
              {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
