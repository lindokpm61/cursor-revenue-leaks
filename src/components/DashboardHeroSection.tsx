import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, TrendingUp } from "lucide-react";

interface DashboardHeroSectionProps {
  latestAnalysis: {
    id: string;
    company_name: string;
    created_at: string | null;
    total_leak: number | null;
    recovery_potential_70: number | null;
    current_arr: number | null;
  };
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  calculateROI: (submission: any) => number;
}

export const DashboardHeroSection = ({ 
  latestAnalysis, 
  formatCurrency, 
  formatDate,
  calculateROI 
}: DashboardHeroSectionProps) => {
  const navigate = useNavigate();

  const handleViewResults = () => {
    navigate(`/results/${latestAnalysis.id}`);
  };

  const handleViewActionPlan = () => {
    navigate(`/action-plan/${latestAnalysis.id}`);
  };

  const handleBookCall = () => {
    window.open('https://calendly.com/your-calendar', '_blank');
  };

  return (
    <div 
      className="rounded-2xl p-8 md:p-12 mb-8 text-center bg-gradient-to-br from-background to-muted/20"
    >
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
        Your Revenue Recovery Opportunity
      </h1>
      
      <p className="text-lg md:text-xl text-muted-foreground mb-8">
        Analysis for {latestAnalysis.company_name} • Generated {formatDate(latestAnalysis.created_at || '')}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 max-w-4xl mx-auto">
        <div className="p-4 md:p-6 rounded-xl border bg-destructive/5 border-destructive/20">
          <div className="text-sm font-semibold mb-2 text-destructive/80">
            Annual Revenue Leak
          </div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-destructive">
            {formatCurrency(latestAnalysis.total_leak || 0)}
          </div>
        </div>
        
        <div className="p-4 md:p-6 rounded-xl border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
          <div className="text-sm font-semibold mb-2 text-green-700 dark:text-green-300">
            Recovery Potential
          </div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(latestAnalysis.recovery_potential_70 || 0)}
          </div>
        </div>
        
        <div className="p-4 md:p-6 rounded-xl border bg-primary/5 border-primary/20">
          <div className="text-sm font-semibold mb-2 text-primary/80">
            ROI Potential
          </div>
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
            {calculateROI(latestAnalysis)}%
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-2xl mx-auto">
        <Button 
          onClick={handleViewResults}
          size="lg"
          className="w-full sm:w-auto"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          View Full Results
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleViewActionPlan}
          size="lg"
          className="w-full sm:w-auto"
        >
          View Action Plan
        </Button>
        
        <Button 
          variant="secondary"
          onClick={handleBookCall}
          size="lg"
          className="w-full sm:w-auto"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Strategy Call
        </Button>
      </div>
    </div>
  );
};