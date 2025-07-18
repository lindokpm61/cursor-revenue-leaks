
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  CreditCard, 
  Settings,
  Zap,
  ChevronDown,
  Info
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { calculatePriorityActions, PriorityAction } from "@/lib/calculator/priorityCalculations";
import { StrategicCTASection } from "@/components/results/StrategicCTASection";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";
import { PriorityActionSection } from "./PriorityActionSection";

interface PriorityActionsProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  calculatorData?: any;
  variant?: 'condensed' | 'standard' | 'detailed' | 'competitive';
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  currentMetric: string;
  targetMetric: string;
  potentialRecovery: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeframe: string;
  icon: any;
  priority: 'urgent' | 'medium';
  currentProgress: number;
  targetProgress: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  implementationSteps: string[];
  dependencies: string[];
  whyItMatters: string;
  complexity: string;
  paybackPeriod: string;
}

export const PriorityActions = ({ submission, formatCurrency, calculatorData, variant = 'standard' }: PriorityActionsProps) => {
  const [isContentOpen, setIsContentOpen] = useState(variant === 'condensed' ? true : false);

  // Calculate unified results for accurate CTA values
  const unifiedCalculations = UnifiedResultsService.calculateResults(submission);

  // Use centralized priority calculations
  const priorityActions = calculatePriorityActions(submission);

  // Convert PriorityAction to ActionItem format with enhanced details
  const getActionItems = (): ActionItem[] => {
    return priorityActions.map((action: PriorityAction) => {
      // Map icons
      const iconMap: Record<string, any> = {
        'lead-response': Clock,
        'selfserve-optimization': Target, 
        'process-automation': Zap,
        'payment-recovery': CreditCard
      };

      // Enhanced implementation steps based on action type
      let implementationSteps: string[] = [];
      let dependencies: string[] = [];
      let whyItMatters = '';
      let complexity = '';

      switch (action.id) {
        case 'lead-response':
          implementationSteps = [
            'Audit current lead routing workflow and identify bottlenecks',
            'Set up automated lead assignment rules in CRM (round-robin or lead scoring)',
            'Configure instant email/SMS auto-responses for new leads',
            'Create response time tracking dashboard and alerts',
            'Train sales team on new 1-hour response SLA',
            'Implement escalation procedures for missed responses',
            'Set up automated follow-up sequences for unresponded leads',
            'Monitor and optimize response times weekly'
          ];
          dependencies = [
            'CRM system with automation capabilities',
            'Sales team training and buy-in',
            'Lead scoring model setup',
            'Integration with email/SMS providers'
          ];
          whyItMatters = 'Research shows that contacting leads within 1 hour makes you 7x more likely to qualify them. Every hour of delay reduces your odds of contact by 10x. This is your highest-impact opportunity.';
          complexity = 'Moderate - requires CRM configuration and process changes';
          break;

        case 'selfserve-optimization':
          implementationSteps = [
            'Conduct user journey mapping and identify friction points',
            'Analyze signup-to-activation conversion funnel',
            'A/B test simplified onboarding flows',
            'Implement in-app guidance and tooltips',
            'Optimize trial experience with quick wins',
            'Add progress indicators and achievement badges',
            'Create self-service support resources',
            'Test and optimize pricing page conversion'
          ];
          dependencies = [
            'Product/UX team collaboration',
            'Analytics and A/B testing tools',
            'Customer feedback and user research',
            'Development resources for implementation'
          ];
          whyItMatters = 'Self-serve optimization reduces customer acquisition costs and improves user experience. A 1% improvement in conversion can yield significant recurring revenue gains.';
          complexity = 'High - requires product development and UX optimization';
          break;

        case 'process-automation':
          implementationSteps = [
            'Map all manual processes and time spent',
            'Identify repetitive tasks suitable for automation',
            'Select and implement workflow automation tools',
            'Create templates and standardized procedures',
            'Set up automated reporting and notifications',
            'Train team on new automated workflows',
            'Monitor efficiency gains and adjust processes',
            'Scale automation to additional areas'
          ];
          dependencies = [
            'Workflow automation platform (Zapier, Make, etc.)',
            'Team training on new processes',
            'Integration capabilities with existing tools',
            'Process documentation and SOPs'
          ];
          whyItMatters = 'Automation eliminates human error, reduces operational costs, and frees up valuable team time for strategic work. ROI is typically realized within 30 days.';
          complexity = 'Low to Medium - implementation depends on existing tool stack';
          break;

        case 'payment-recovery':
          implementationSteps = [
            'Implement smart payment retry logic',
            'Set up automated dunning email sequences',
            'Add in-app payment failure notifications',
            'Configure multiple payment method options',
            'Implement account pause vs. cancellation options',
            'Set up win-back campaigns for churned customers',
            'Monitor recovery rates and optimize messaging',
            'Add proactive payment health monitoring'
          ];
          dependencies = [
            'Payment processor with retry capabilities',
            'Email automation platform',
            'Customer success team involvement',
            'Billing system integrations'
          ];
          whyItMatters = 'Failed payment recovery directly impacts revenue retention and reduces involuntary churn. Most failed payments are due to temporary issues and can be recovered with proper systems.';
          complexity = 'Low - mostly configuration of existing payment systems';
          break;
      }

      // Calculate current/target metrics and progress
      let currentMetric = '';
      let targetMetric = '';
      let currentProgress = 50;
      let targetProgress = 85;

      switch (action.id) {
        case 'lead-response':
          currentMetric = `${submission.lead_response_time || 0}h avg response time`;
          targetMetric = '< 1h response time (industry best practice)';
          currentProgress = Math.max(0, Math.min(100, 100 - ((submission.lead_response_time || 0) - 1.0) * 20));
          targetProgress = 95;
          break;
        case 'selfserve-optimization':
          const targetConversion = Math.min(15, (submission.free_to_paid_conversion || 0) * 2.5);
          currentMetric = `${submission.free_to_paid_conversion || 0}% trial-to-paid conversion`;
          targetMetric = `${targetConversion.toFixed(1)}% conversion (optimized funnel)`;
          currentProgress = ((submission.free_to_paid_conversion || 0) / targetConversion) * 100;
          targetProgress = 90;
          break;
        case 'process-automation':
          const targetHours = Math.max(5, (submission.manual_hours || 0) * 0.2);
          currentMetric = `${submission.manual_hours || 0}h/week manual processes`;
          targetMetric = `${targetHours}h/week (80% automated)`;
          currentProgress = Math.max(0, 100 - (((submission.manual_hours || 0) / 40) * 100));
          targetProgress = 80;
          break;
        case 'payment-recovery':
          const targetFailure = Math.max(0.8, (submission.failed_payment_rate || 0) * 0.25);
          currentMetric = `${submission.failed_payment_rate || 0}% payment failure rate`;
          targetMetric = `${targetFailure.toFixed(1)}% failure rate (optimized recovery)`;
          currentProgress = Math.max(0, 100 - (((submission.failed_payment_rate || 0) - 0.8) * 15));
          targetProgress = 92;
          break;
      }

      return {
        id: action.id,
        title: action.title,
        description: action.description,
        currentMetric,
        targetMetric,
        potentialRecovery: action.recoveryAmount,
        difficulty: action.effort as 'Easy' | 'Medium' | 'Hard',
        timeframe: action.timeframe,
        icon: iconMap[action.id] || Target,
        priority: action.urgency === 'Critical' || action.urgency === 'High' ? 'urgent' : 'medium',
        currentProgress,
        targetProgress,
        confidence: action.confidence.toLowerCase() as 'high' | 'medium' | 'low',
        explanation: action.description,
        implementationSteps,
        dependencies,
        whyItMatters,
        complexity,
        paybackPeriod: action.paybackPeriod
      };
    });
  };

  const actions = getActionItems();
  
  // Filter actions based on variant and priority
  const getFilteredActions = () => {
    const urgentActions = actions.filter(action => action.priority === 'urgent');
    const mediumActions = actions.filter(action => action.priority === 'medium');
    
    switch (variant) {
      case 'condensed':
        return {
          urgent: urgentActions.slice(0, 2),
          medium: mediumActions.slice(0, 1)
        };
      case 'competitive':
        return {
          urgent: urgentActions.map(action => ({
            ...action,
            description: `${action.description} • Competitive advantage opportunity`
          })),
          medium: mediumActions.map(action => ({
            ...action,
            description: `${action.description} • Industry benchmark alignment`
          }))
        };
      default:
        return { urgent: urgentActions, medium: mediumActions };
    }
  };

  const { urgent: urgentActions, medium: mediumActions } = getFilteredActions();

  // Determine overall confidence based on actions
  const overallConfidence = { level: actions.length > 2 ? 'high' : actions.length > 0 ? 'medium' : 'low' };
  
  if (actions.length === 0) {
    return (
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Strategic Action Priorities</CardTitle>
              <p className="text-muted-foreground mt-1">
                Your operations appear well-optimized. Continue monitoring key metrics.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Strategic Action Priorities</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Detailed implementation roadmap with specific tasks, timelines, and resource requirements
                </p>
              </div>
            </div>
            <Collapsible asChild>
              <Button variant="ghost" size="sm" className="ml-4">
                <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? 'rotate-180' : ''}`} />
              </Button>
            </Collapsible>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-8 pt-6">
              {overallConfidence.level === 'low' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Recommendations are based on available data. Consider these as directional guidance and validate with your specific business context and constraints.
                  </AlertDescription>
                </Alert>
              )}

              {/* Implementation Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">Implementation Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Total Actions:</span>
                    <div className="text-blue-900 font-bold">{actions.length} priorities</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Expected Recovery:</span>
                    <div className="text-green-600 font-bold">
                      {formatCurrency(actions.reduce((sum, a) => sum + a.potentialRecovery, 0))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Implementation Time:</span>
                    <div className="text-blue-900 font-bold">8-16 weeks total</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Success Probability:</span>
                    <div className="text-green-600 font-bold">
                      {overallConfidence.level === 'high' ? '85%' : overallConfidence.level === 'medium' ? '70%' : '55%'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority Action Sections */}
              {urgentActions.length > 0 && (
                <PriorityActionSection
                  title="URGENT PRIORITIES (Immediate Impact)"
                  actions={urgentActions}
                  formatCurrency={formatCurrency}
                  sectionType="urgent"
                />
              )}

              {mediumActions.length > 0 && (
                <PriorityActionSection
                  title="MEDIUM PRIORITIES (Strategic Improvements)"
                  actions={mediumActions}
                  formatCurrency={formatCurrency}
                  sectionType="medium"
                />
              )}

              {/* Strategic CTA Section */}
              {actions.length > 0 && (
                <div className="mt-8">
                  <StrategicCTASection
                    totalLeak={unifiedCalculations.totalLoss}
                    recovery70={unifiedCalculations.conservativeRecovery}
                    leadScore={submission.lead_score || 0}
                    formatCurrency={formatCurrency}
                  />
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};
