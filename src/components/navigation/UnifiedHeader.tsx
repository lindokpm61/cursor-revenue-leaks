
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, User, AlertTriangle, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface UnifiedHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  context?: 'calculator' | 'results' | 'action-plan' | 'dashboard';
  data?: any;
}

export const UnifiedHeader = ({
  title,
  subtitle,
  backTo,
  showProgress,
  currentStep,
  totalSteps,
  context = 'dashboard',
  data
}: UnifiedHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const getContextIcon = () => {
    switch (context) {
      case 'action-plan':
        return AlertTriangle;
      case 'calculator':
      case 'results':
        return Calculator;
      default:
        return User;
    }
  };

  const ContextIcon = getContextIcon();

  // Crisis theme for action-plan context
  const isCrisisContext = context === 'action-plan';
  
  const headerClasses = isCrisisContext 
    ? "bg-gradient-to-r from-destructive/15 to-red-500/10 border-b-2 border-destructive/30 shadow-lg shadow-destructive/20 sticky top-0 z-40"
    : "bg-card border-b sticky top-0 z-40";

  const iconClasses = isCrisisContext
    ? "p-2 rounded-lg bg-destructive/20 border border-destructive/30 animate-pulse"
    : "p-2 rounded-lg bg-primary/10";

  const iconColorClasses = isCrisisContext
    ? "h-5 w-5 text-destructive"
    : "h-5 w-5 text-primary";

  return (
    <header className={headerClasses}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {backTo && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className={isCrisisContext ? "text-destructive hover:bg-destructive/10" : ""}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className={iconClasses}>
                <ContextIcon className={iconColorClasses} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className={`text-lg md:text-xl font-semibold ${isCrisisContext ? 'text-destructive' : ''}`}>
                    {title}
                  </h1>
                  {isCrisisContext && (
                    <Badge variant="destructive" className="animate-pulse bg-destructive/90">
                      CRISIS ACTIVE
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className={`text-sm ${isCrisisContext ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                    {subtitle}
                  </p>
                )}
                {isCrisisContext && data && (
                  <div className="flex items-center gap-2 mt-1">
                    <Activity className="h-3 w-3 text-destructive animate-pulse" />
                    <span className="text-xs text-destructive/80 font-medium">
                      Emergency Protocol Active
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showProgress && currentStep && totalSteps && (
              <Badge variant={isCrisisContext ? "destructive" : "outline"}>
                Step {currentStep} of {totalSteps}
              </Badge>
            )}
            
            {user && (
              <Link to="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={isCrisisContext ? "text-destructive hover:bg-destructive/10" : ""}
                >
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>

        {showProgress && currentStep && totalSteps && (
          <div className="pb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCrisisContext 
                    ? 'bg-gradient-to-r from-destructive to-red-500' 
                    : 'bg-gradient-to-r from-primary to-revenue-primary'
                }`}
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
