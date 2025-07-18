
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Phone, X, MessageSquare, TrendingUp } from "lucide-react";

interface FloatingCTABarProps {
  totalLeak: number;
  formatCurrency: (amount: number) => string;
  isVisible?: boolean;
  onDismiss?: () => void;
  context?: {
    timeOnPage?: number;
    scrollDepth?: number;
    engagementScore?: number;
  };
}

export const FloatingCTABar = ({ 
  totalLeak, 
  formatCurrency, 
  isVisible = false,
  onDismiss,
  context 
}: FloatingCTABarProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!isVisible || isDismissed || totalLeak <= 0) return null;

  // Calculate urgency messaging based on recovery amount
  const getUrgencyMessage = () => {
    if (totalLeak >= 1000000) {
      return "High-value opportunity detected";
    } else if (totalLeak >= 500000) {
      return "Significant recovery potential identified";
    } else {
      return "Revenue recovery opportunity available";
    }
  };

  // Get contextual messaging based on engagement
  const getEngagementMessage = () => {
    if (context?.engagementScore && context.engagementScore >= 70) {
      return "Ready to discuss your specific situation?";
    } else if (context?.timeOnPage && context.timeOnPage >= 180000) {
      return "Spent some time reviewing? Let's talk next steps.";
    } else {
      return "Ready to start recovering revenue?";
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    💰 {getUrgencyMessage()}: {formatCurrency(totalLeak)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getEngagementMessage()}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" className="flex-1 sm:flex-none">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Strategy Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Phone className="h-4 w-4 mr-2" />
                  Talk to Expert
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get Custom Quote
                </Button>
              </div>
              {context?.engagementScore && context.engagementScore >= 80 && (
                <div className="mt-2 text-xs text-primary font-medium">
                  🔥 High engagement detected - priority consultation available
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="ml-2 p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
