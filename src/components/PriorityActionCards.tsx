
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, DollarSign, Users, Zap, Target, TrendingDown, AlertTriangle } from "lucide-react";
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
  
  // Determine top emergency actions based on calculations
  const priorities = [
    {
      id: 'emergency-assessment',
      title: 'Full Crisis Assessment',
      description: 'Complete analysis of all revenue bleeding points and emergency fixes',
      impact: 'Stop the Bleeding',
      timeframe: 'Immediate',
      effort: 'Low',
      icon: AlertTriangle,
      color: 'destructive',
      action: () => navigate(`/results/${latestAnalysis.id}`),
      buttonText: 'View Crisis Report',
      priority: 1
    },
    {
      id: 'emergency-plan',
      title: 'Emergency Action Plan',
      description: 'Step-by-step crisis intervention to stop revenue hemorrhaging',
      impact: formatCurrency(calculations.conservativeRecovery),
      timeframe: '24-48 hours',
      effort: 'Medium',
      icon: Target,
      color: 'warning',
      action: () => navigate(`/action-plan/${latestAnalysis.id}`),
      buttonText: 'Get Emergency Plan',
      priority: 2
    },
    {
      id: 'crisis-consultation',
      title: 'Crisis Intervention Call',
      description: 'Emergency consultation to stop critical revenue bleeding',
      impact: 'Immediate Damage Control',
      timeframe: 'Within 2 hours',
      effort: 'Low',
      icon: Users,
      color: 'destructive',
      action: () => window.open('https://calendly.com/your-calendar', '_blank'),
      buttonText: 'Emergency Call',
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
        <h2 className="text-2xl font-bold text-destructive">Emergency Response Required</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your revenue is actively bleeding. These emergency actions are ordered by urgency 
          and potential to stop the financial hemorrhaging.
        </p>
      </div>

      <div className="grid gap-4">
        {priorities.map((priority, index) => {
          const IconComponent = priority.icon;
          return (
            <Card 
              key={priority.id} 
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                index === 0 ? 'border-destructive/50 bg-gradient-to-r from-background to-destructive/5' : 'hover:border-destructive/20'
              }`}
            >
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs font-medium px-2 py-1 rounded-bl-lg animate-pulse">
                  CRITICAL
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    priority.color === 'destructive' ? 'bg-destructive/10' :
                    priority.color === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                    'bg-muted'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      priority.color === 'destructive' ? 'text-destructive' :
                      priority.color === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
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
                        <TrendingDown className="h-3 w-3 mr-1" />
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
                        index === 0 ? 'bg-destructive hover:bg-destructive/90' : 'hover:bg-destructive hover:text-destructive-foreground'
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
