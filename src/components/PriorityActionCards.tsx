
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, DollarSign, Users, Zap, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calculateUnifiedResults, type UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";

interface PriorityActionCardsProps {
  latestAnalysis: {
    id: string;
    company_name: string;
    current_arr: number | null;
    monthly_mrr: number | null;
    monthly_leads: number | null;
    average_deal_value: number | null;
    lead_response_time: number | null;
    monthly_free_signups: number | null;
    free_to_paid_conversion: number | null;
    failed_payment_rate: number | null;
    manual_hours: number | null;
    hourly_rate: number | null;
    industry: string | null;
  };
  formatCurrency: (amount: number) => string;
}

export const PriorityActionCards = ({ latestAnalysis, formatCurrency }: PriorityActionCardsProps) => {
  const navigate = useNavigate();

  const calculationInputs: UnifiedCalculationInputs = {
    currentARR: Number(latestAnalysis.current_arr || 0),
    monthlyMRR: Number(latestAnalysis.monthly_mrr || 0),
    monthlyLeads: Number(latestAnalysis.monthly_leads || 0),
    averageDealValue: Number(latestAnalysis.average_deal_value || 0),
    leadResponseTime: Number(latestAnalysis.lead_response_time || 24),
    monthlyFreeSignups: Number(latestAnalysis.monthly_free_signups || 0),
    freeToLaidConversion: Number(latestAnalysis.free_to_paid_conversion || 0),
    failedPaymentRate: Number(latestAnalysis.failed_payment_rate || 0),
    manualHours: Number(latestAnalysis.manual_hours || 0),
    hourlyRate: Number(latestAnalysis.hourly_rate || 0),
    industry: latestAnalysis.industry || ''
  };

  const calculations = calculateUnifiedResults(calculationInputs);
  
  // Determine top priorities based on calculations
  const priorities = [
    {
      id: 'detailed-analysis',
      title: 'Review Complete Analysis',
      description: 'Get detailed breakdown of all revenue leaks and opportunities',
      impact: 'Full Understanding',
      timeframe: '5 minutes',
      effort: 'Low',
      icon: TrendingUp,
      color: 'primary',
      action: () => navigate(`/results/${latestAnalysis.id}`),
      buttonText: 'View Full Analysis',
      priority: 1
    },
    {
      id: 'action-plan',
      title: 'Get Implementation Roadmap',
      description: 'Step-by-step plan to recover your revenue opportunities',
      impact: formatCurrency(calculations.recovery70Percent),
      timeframe: '30-90 days',
      effort: 'Medium',
      icon: Target,
      color: 'success',
      action: () => navigate(`/action-plan/${latestAnalysis.id}`),
      buttonText: 'Get Action Plan',
      priority: 2
    },
    {
      id: 'consultation',
      title: 'Strategy Consultation',
      description: 'Expert guidance to accelerate your revenue recovery',
      impact: 'Accelerated Results',
      timeframe: '30 minutes',
      effort: 'Low',
      icon: Users,
      color: 'default',
      action: () => window.open('https://calendly.com/your-calendar', '_blank'),
      buttonText: 'Book Call',
      priority: calculations.totalLoss > 1000000 ? 1 : 3
    }
  ].sort((a, b) => a.priority - b.priority);

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-foreground">Your Next Steps</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Based on your analysis, here are the most impactful actions you can take right now, 
          ordered by priority and potential impact.
        </p>
      </div>

      <div className="grid gap-4">
        {priorities.map((priority, index) => {
          const IconComponent = priority.icon;
          return (
            <Card 
              key={priority.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                index === 0 ? 'border-primary/50 bg-gradient-to-r from-background to-primary/5' : 'hover:border-primary/20'
              }`}
            >
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-bl-lg">
                  Recommended
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    priority.color === 'primary' ? 'bg-primary/10' :
                    priority.color === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-muted'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      priority.color === 'primary' ? 'text-primary' :
                      priority.color === 'success' ? 'text-green-600 dark:text-green-400' :
                      'text-muted-foreground'
                    }`} />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {priority.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {priority.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {priority.impact}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {priority.timeframe}
                      </Badge>
                      <Badge className={`text-xs ${getEffortColor(priority.effort)}`}>
                        <Zap className="h-3 w-3 mr-1" />
                        {priority.effort} Effort
                      </Badge>
                    </div>
                    
                    <Button 
                      onClick={priority.action}
                      variant={index === 0 ? "default" : "outline"}
                      className={`w-full sm:w-auto ${
                        index === 0 ? 'bg-primary hover:bg-primary/90' : 'hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      {priority.buttonText}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
