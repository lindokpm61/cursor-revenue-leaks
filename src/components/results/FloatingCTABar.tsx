
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Only show if explicitly visible and user has been engaged
  if (!isVisible || !context?.timeOnPage || context.timeOnPage < 60000) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-revenue-primary text-primary-foreground shadow-lg border-t transition-transform duration-300",
      isVisible ? 'translate-y-0' : 'translate-y-full'
    )}>
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {formatCurrency(totalLeak)} Opportunity
            </Badge>
            <span className="font-medium">
              Ready to unlock your revenue optimization strategy?
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Target className="h-4 w-4 mr-2" />
              Get Action Plan
            </Button>
            
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDismiss}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
