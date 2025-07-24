
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
        <div className="flex items-center justify-between min-h-[60px] py-2">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {backTo && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className={`shrink-0 ${isSolutionContext ? "text-green-700 hover:bg-green-100" : ""}`}
              >
                <ArrowLeft className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Back</span>
              </Button>
            )}
            
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <div className={`${iconClasses} shrink-0`}>
                <ContextIcon className={iconColorClasses} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`text-h3 md:text-h2 font-semibold truncate ${isSolutionContext ? 'text-green-800' : ''}`}>
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-small truncate ${isSolutionContext ? 'text-green-700' : 'text-muted-foreground'}`}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {showProgress && currentStep && totalSteps && (
              <Badge 
                variant={isSolutionContext ? "outline" : "outline"} 
                className={`hidden sm:inline-flex ${isSolutionContext ? "border-green-300 text-green-700" : ""}`}
              >
                {currentStep}/{totalSteps}
              </Badge>
            )}
            
            {user && (
              <Link to="/dashboard">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`shrink-0 ${isSolutionContext ? "text-green-700 hover:bg-green-100" : ""}`}
                >
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Dashboard</span>
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
