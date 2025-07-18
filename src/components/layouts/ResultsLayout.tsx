
import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  ArrowLeft, 
  Target,
  Download,
  Share2,
  BarChart3,
  CheckCircle,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { EnhancedExportCTA } from "@/components/results/EnhancedExportCTA";
import type { Submission } from "@/lib/supabase";

interface ResultsLayoutProps {
  children: ReactNode;
  submission: Submission;
  pageType: "results" | "action-plan";
  totalLeak?: number;
  formatCurrency: (amount: number) => string;
}

export const ResultsLayout = ({ 
  children, 
  submission, 
  pageType, 
  totalLeak,
  formatCurrency 
}: ResultsLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGetActionPlan = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your action plan.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/action-plan/${submission?.id}`);
  };

  const handleBookCall = () => {
    window.open('https://calendly.com/your-calendar', '_blank');
  };

  const getCurrentPageTitle = () => {
    switch (pageType) {
      case "results":
        return "Revenue Analysis Results";
      case "action-plan":
        return "Implementation Action Plan";
      default:
        return "Analysis";
    }
  };

  const getProgressStep = () => {
    switch (pageType) {
      case "results":
        return { step: 1, label: "Analysis Complete", total: 3 };
      case "action-plan":
        return { step: 2, label: "Planning Phase", total: 3 };
      default:
        return { step: 1, label: "Analysis", total: 3 };
    }
  };

  const progress = getProgressStep();

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar - Context & Actions */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-semibold">{submission.company_name}</h1>
                  <p className="text-sm md:text-base text-muted-foreground">{getCurrentPageTitle()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {pageType === "results" && (
                <Button onClick={handleGetActionPlan} className="hidden sm:flex">
                  <Target className="h-4 w-4 mr-2" />
                  Get Action Plan
                </Button>
              )}
              
              {pageType === "action-plan" && (
                <Link to={`/results/${submission.id}`}>
                  <Button variant="outline" className="hidden sm:flex">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                </Link>
              )}

              <Button variant="gradient" onClick={handleBookCall} className="hidden md:flex">
                <Calendar className="h-4 w-4 mr-2" />
                Book Expert Call
              </Button>

              <EnhancedExportCTA />
            </div>
          </div>

          {/* Secondary Bar - Breadcrumbs & Progress */}
          <div className="flex items-center justify-between py-3 border-t">
            <div className="flex items-center gap-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/results/${submission.id}`}>Results</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pageType === "action-plan" && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Action Plan</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Context Info */}
              <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>ARR:</span>
                  <Badge variant="outline">{formatCurrency(submission.current_arr || 0)}</Badge>
                </div>
                {totalLeak && (
                  <div className="flex items-center gap-2">
                    <span>Opportunity:</span>
                    <Badge variant="destructive">{formatCurrency(totalLeak)}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  {Array.from({ length: progress.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < progress.step ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">{progress.label}</span>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex sm:hidden gap-2 pb-3">
            {pageType === "results" && (
              <Button onClick={handleGetActionPlan} size="sm" className="flex-1">
                <Target className="h-4 w-4 mr-2" />
                Get Action Plan
              </Button>
            )}
            
            {pageType === "action-plan" && (
              <Link to={`/results/${submission.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Results
                </Button>
              </Link>
            )}

            <Button variant="gradient" onClick={handleBookCall} size="sm" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Book Call
            </Button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
