import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Target,
  TrendingUp,
  Calendar,
  CheckCircle
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProgressiveStep {
  id: string;
  title: string;
  description: string;
  readTime: string;
  completed?: boolean;
  icon: typeof Target;
}

interface ProgressiveNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  totalSteps: number;
  className?: string;
}

const steps: ProgressiveStep[] = [
  {
    id: "summary",
    title: "Problem Summary",
    description: "Your biggest revenue challenges",
    readTime: "30 sec",
    icon: Target
  },
  {
    id: "solution",
    title: "Primary Solution",
    description: "Your highest-impact action",
    readTime: "60 sec", 
    icon: TrendingUp
  },
  {
    id: "plan",
    title: "Implementation Plan",
    description: "Step-by-step roadmap",
    readTime: "90 sec",
    icon: Calendar
  },
  {
    id: "analysis",
    title: "Complete Analysis",
    description: "Full detailed breakdown",
    readTime: "5+ min",
    icon: CheckCircle
  }
];

export const ProgressiveNavigation = ({ 
  currentStep, 
  onStepChange, 
  totalSteps, 
  className = "" 
}: ProgressiveNavigationProps) => {
  const isMobile = useIsMobile();
  const [pathPreference, setPathPreference] = useState<"quick" | "deep" | null>(null);

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handlePathSelection = (path: "quick" | "deep") => {
    setPathPreference(path);
    if (path === "quick") {
      // Jump to priority actions for quick path
      onStepChange(1);
    } else {
      // Start from beginning for deep dive
      onStepChange(0);
    }
  };

  // Path selection for first-time users
  if (pathPreference === null && currentStep === 0) {
    return (
      <Card className={`mb-8 bg-gradient-to-r from-primary/5 to-revenue-primary/5 border-primary/20 ${className}`}>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-h2 font-bold mb-3">Choose Your Path</h3>
            <p className="text-body text-muted-foreground">
              How much time do you have to review your results?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button
              variant="outline"
              className="h-auto p-6 text-left border-2 hover:border-revenue-success/50 hover:bg-revenue-success/5 transition-all duration-200"
              onClick={() => handlePathSelection("quick")}
            >
              <div className="w-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-revenue-success/10">
                    <Target className="h-5 w-5 text-revenue-success" />
                  </div>
                  <div>
                    <div className="font-bold text-h3">Quick Path</div>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      2 min
                    </Badge>
                  </div>
                </div>
                <p className="text-small text-muted-foreground">
                  Get the essentials: your biggest problem and the top action to take
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-6 text-left border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              onClick={() => handlePathSelection("deep")}
            >
              <div className="w-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-h3">Deep Dive</div>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      15 min
                    </Badge>
                  </div>
                </div>
                <p className="text-small text-muted-foreground">
                  Complete analysis with detailed breakdowns and implementation guidance
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 bg-gradient-to-r from-background to-primary/5 border-primary/20 ${className}`}>
      <CardContent className="p-4 sm:p-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
            <Badge variant="secondary" className="text-xs hidden sm:flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {pathPreference === "quick" ? "Quick Path" : "Deep Dive"}
            </Badge>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{Math.round(progress)}% Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2 mb-4 sm:mb-6" />

        {/* Current Step Info */}
        {currentStepData && (
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <currentStepData.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-h3 mb-1">{currentStepData.title}</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <p className="text-xs sm:text-small text-muted-foreground">{currentStepData.description}</p>
                <Badge variant="outline" className="text-xs w-fit">
                  <Clock className="h-3 w-3 mr-1" />
                  {currentStepData.readTime}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="text-muted-foreground hover:text-foreground px-2 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPathPreference(null)}
              className="text-muted-foreground hover:text-foreground text-xs px-2 sm:px-3"
            >
              Change Path
            </Button>
          </div>

          <Button
            variant={currentStep === totalSteps - 1 ? "default" : "ghost"}
            size="sm"
            onClick={handleNext}
            disabled={currentStep === totalSteps - 1}
            className={`px-2 sm:px-3 ${currentStep === totalSteps - 1 ? "bg-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {currentStep === totalSteps - 1 ? "Complete" : "Next"}
            <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
          </Button>
        </div>

        {/* Step Dots (Mobile) */}
        {isMobile && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <button
                key={index}
                onClick={() => onStepChange(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentStep 
                    ? "bg-primary w-6" 
                    : index < currentStep 
                      ? "bg-revenue-success" 
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};