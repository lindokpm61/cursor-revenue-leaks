
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Download, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedCTAProps {
  variant: 'primary' | 'secondary' | 'tertiary';
  context: 'landing' | 'results' | 'action-plan' | 'dashboard';
  data?: {
    totalLeak?: number;
    recovery?: number;
    formatCurrency?: (amount: number) => string;
  };
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
}

export const UnifiedCTA = ({ 
  variant, 
  context, 
  data, 
  onPrimaryAction, 
  onSecondaryAction,
  className 
}: UnifiedCTAProps) => {
  const getPrimaryAction = () => {
    switch (context) {
      case 'landing':
        return {
          text: "Start Free Analysis",
          icon: Target,
          description: "Get your revenue recovery plan in 5 minutes"
        };
      case 'results':
        return {
          text: "Get Growth Plan",
          icon: Target,
          description: data?.formatCurrency ? `Secure ${data.formatCurrency(data.recovery || 0)} growth strategy` : "Get your strategic growth plan"
        };
      case 'action-plan':
        return {
          text: "Book Expert Call",
          icon: Calendar,
          description: "Get personalized implementation guidance"
        };
      case 'dashboard':
        return {
          text: "New Analysis",
          icon: Zap,
          description: "Analyze another revenue opportunity"
        };
      default:
        return {
          text: "Get Started",
          icon: ArrowRight,
          description: "Take the next step"
        };
    }
  };

  const getSecondaryAction = () => {
    switch (context) {
      case 'results':
        return {
          text: "Download Report",
          icon: Download
        };
      case 'action-plan':
        return {
          text: "Export Plan",
          icon: Download
        };
      default:
        return null;
    }
  };

  const primary = getPrimaryAction();
  const secondary = getSecondaryAction();
  const PrimaryIcon = primary.icon;
  const SecondaryIcon = secondary?.icon;

  if (variant === 'primary') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center space-y-2">
          <h3 className="text-h2">{primary.description}</h3>
          {data?.totalLeak && data.formatCurrency && (
            <Badge variant="outline" className="bg-revenue-warning/10 text-revenue-warning border-revenue-warning/20">
              {data.formatCurrency(data.totalLeak)} at risk
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={onPrimaryAction}
            size="lg"
            className="bg-gradient-to-r from-primary to-revenue-primary hover:opacity-90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            <PrimaryIcon className="h-5 w-5 mr-2" />
            {primary.text}
          </Button>
          
          {secondary && (
            <Button 
              onClick={onSecondaryAction}
              variant="outline"
              size="lg"
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <SecondaryIcon className="h-4 w-4 mr-2" />
              {secondary.text}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'secondary') {
    return (
      <Button 
        onClick={onPrimaryAction}
        variant="outline"
        className={cn("hover:bg-primary hover:text-primary-foreground", className)}
      >
        <PrimaryIcon className="h-4 w-4 mr-2" />
        {primary.text}
      </Button>
    );
  }

  return (
    <Button 
      onClick={onPrimaryAction}
      variant="ghost"
      size="sm"
      className={cn("text-primary hover:bg-primary/10", className)}
    >
      <PrimaryIcon className="h-4 w-4 mr-2" />
      {primary.text}
    </Button>
  );
};
