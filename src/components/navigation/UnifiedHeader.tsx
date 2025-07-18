
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, User } from "lucide-react";
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
}

export const UnifiedHeader = ({
  title,
  subtitle,
  backTo,
  showProgress,
  currentStep,
  totalSteps,
  context = 'dashboard'
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
      case 'calculator':
      case 'results':
      case 'action-plan':
        return Calculator;
      default:
        return User;
    }
  };

  const ContextIcon = getContextIcon();

  return (
    <header className="bg-card border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {backTo && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ContextIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showProgress && currentStep && totalSteps && (
              <Badge variant="outline">
                Step {currentStep} of {totalSteps}
              </Badge>
            )}
            
            {user && (
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
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
                className="bg-gradient-to-r from-primary to-revenue-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
