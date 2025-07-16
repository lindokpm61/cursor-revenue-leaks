import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AbandonmentWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
  onStayActive: () => void;
  timeRemaining: number;
  currentStep: number;
}

export const AbandonmentWarning: React.FC<AbandonmentWarningProps> = ({
  isVisible,
  onDismiss,
  onStayActive,
  timeRemaining,
  currentStep
}) => {
  if (!isVisible) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Still there?</h3>
                <p className="text-sm text-muted-foreground">
                  You'll be logged out in {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We noticed you've been inactive on step {currentStep}. Your progress will be saved, 
              but we want to make sure you don't lose your place in the revenue analysis.
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={onStayActive}
                className="flex-1"
              >
                Continue Working
              </Button>
              <Button 
                variant="outline" 
                onClick={onDismiss}
                className="flex-1"
              >
                I'll Be Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};