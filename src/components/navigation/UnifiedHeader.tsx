
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, User, Target, Activity, TrendingUp } from "lucide-react";
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
        return Target;
      case 'calculator':
      case 'results':
        return Calculator;
      default:
        return User;
    }
  };

  const ContextIcon = getContextIcon();

  // Solution theme for action-plan context
  const isSolutionContext = context === 'action-plan';
  
  const headerClasses = isSolutionContext 
    ? "bg-gradient-to-r from-green-50 to-blue-50 border-b-2 border-green-200 shadow-sm sticky top-0 z-40"
    : "bg-card border-b sticky top-0 z-40";

  const iconClasses = isSolutionContext
    ? "p-2 rounded-lg bg-green-100 border border-green-200"
    : "p-2 rounded-lg bg-primary/10";

  const iconColorClasses = isSolutionContext
    ? "h-5 w-5 text-green-600"
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
                className={isSolutionContext ? "text-green-700 hover:bg-green-100" : ""}
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
                  <h1 className={`text-lg md:text-xl font-semibold ${isSolutionContext ? 'text-green-800' : ''}`}>
                    {title}
                  </h1>
                  {isSolutionContext && data?.recovery && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {data.formatCurrency ? data.formatCurrency(data.recovery) : `$${data.recovery?.toLocaleString()}`} Recovery Plan
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className={`text-sm ${isSolutionContext ? 'text-green-700' : 'text-muted-foreground'}`}>
                    {subtitle}
                  </p>
                )}
                {isSolutionContext && data && (
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      Strategic Recovery Protocol
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showProgress && currentStep && totalSteps && (
              <Badge variant={isSolutionContext ? "outline" : "outline"} 
                     className={isSolutionContext ? "border-green-300 text-green-700" : ""}>
                Step {currentStep} of {totalSteps}
              </Badge>
            )}
            
            {user && (
              <Link to="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={isSolutionContext ? "text-green-700 hover:bg-green-100" : ""}
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
                  isSolutionContext 
                    ? 'bg-gradient-to-r from-green-500 to-blue-500' 
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
