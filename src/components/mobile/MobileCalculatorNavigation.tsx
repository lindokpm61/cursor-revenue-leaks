import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileCalculatorNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  canProceed: boolean;
  isLoading?: boolean;
}

export const MobileCalculatorNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  canProceed,
  isLoading = false
}: MobileCalculatorNavigationProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const progress = (currentStep / totalSteps) * 100;

  return (
    <Card className="sticky bottom-0 left-0 right-0 z-20 rounded-none border-x-0 border-b-0 bg-background/95 backdrop-blur-sm">
      <div className="p-4 space-y-3">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onPrevious}
            disabled={currentStep === 1 || isLoading}
            className="flex-1 touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button
            size="lg"
            onClick={onNext}
            disabled={!canProceed || isLoading}
            className="flex-1 touch-manipulation"
          >
            {isLoading ? (
              "Loading..."
            ) : currentStep === totalSteps ? (
              "Complete"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Swipe hint */}
        {currentStep === 1 && (
          <div className="text-center text-xs text-muted-foreground">
            💡 Tip: You can swipe left/right to navigate between steps
          </div>
        )}
      </div>
    </Card>
  );
};