
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, DollarSign, Users, Zap, Target, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";

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
    created_at: string | null;
    contact_email: string | null;
    user_id?: string | null;
  };
  formatCurrency: (amount: number) => string;
}

export const PriorityActionCards = ({ latestAnalysis, formatCurrency }: PriorityActionCardsProps) => {
  const navigate = useNavigate();

  console.log('=== PRIORITY ACTION CARDS DEBUG ===');
  console.log('latestAnalysis prop:', latestAnalysis);

  // Transform to SubmissionData format for UnifiedResultsService
  const submissionData: SubmissionData = {
    id: latestAnalysis.id,
    company_name: latestAnalysis.company_name || '',
    contact_email: latestAnalysis.contact_email || '',
    industry: latestAnalysis.industry || '',
    current_arr: Number(latestAnalysis.current_arr || 0),
    monthly_leads: Number(latestAnalysis.monthly_leads || 0),
    average_deal_value: Number(latestAnalysis.average_deal_value || 0),
    lead_response_time: Number(latestAnalysis.lead_response_time || 24),
    monthly_free_signups: Number(latestAnalysis.monthly_free_signups || 0),
    free_to_paid_conversion: Number(latestAnalysis.free_to_paid_conversion || 0),
    monthly_mrr: Number(latestAnalysis.monthly_mrr || 0),
    failed_payment_rate: Number(latestAnalysis.failed_payment_rate || 0),
    manual_hours: Number(latestAnalysis.manual_hours || 0),
    hourly_rate: Number(latestAnalysis.hourly_rate || 0),
    lead_score: 0,
    user_id: latestAnalysis.user_id,
    created_at: latestAnalysis.created_at || new Date().toISOString()
  };

  console.log('Transformed submissionData for UnifiedResultsService:', submissionData);

  const calculations = UnifiedResultsService.calculateResults(submissionData);
  console.log('UnifiedResultsService calculations in PriorityActionCards:', calculations);
  
  // Strategic priority actions based on calculations
  const priorities = [
    {
      id: 'strategic-assessment',
      title: 'Complete Strategic Assessment',
      description: 'Full analysis of revenue optimization opportunities and growth initiatives',
      impact: 'Growth Analysis',
      timeframe: 'Immediate',
      effort: 'Low',
      icon: BarChart3,
      color: 'primary',
      action: () => navigate(`/results/${latestAnalysis.id}`),
      buttonText: 'View Strategic Report',
      priority: 1
    },
    {
      id: 'implementation-plan',
      title: 'Strategic Implementation Plan',
      description: 'Step-by-step roadmap to capture identified revenue opportunities',
      impact: formatCurrency(calculations.conservativeRecovery),
      timeframe: '6-12 months',
      effort: 'Medium',
      icon: Target,
      color: 'success',
      action: () => navigate(`/action-plan/${latestAnalysis.id}`),
      buttonText: 'Get Implementation Plan',
      priority: 2
    },
    {
      id: 'strategy-consultation',
      title: 'Strategy Review Session',
      description: 'Expert consultation to optimize implementation approach',
      impact: 'Strategic Guidance',
      timeframe: 'Within 1 week',
      effort: 'Low',
      icon: Users,
      color: 'primary',
      action: () => window.open('https://cal.com/rev-calculator/revenuecalculator-strategy-session', '_blank'),
      buttonText: 'Book Strategy Session',
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
        <h2 className="text-2xl font-bold text-primary">Strategic Action Priorities</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your revenue optimization roadmap prioritized by impact potential and 
          strategic value to accelerate growth.
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
                  PRIORITY
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
                        <TrendingUp className="h-3 w-3 mr-1" />
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
