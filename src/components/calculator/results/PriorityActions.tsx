
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Clock, 
  Zap, 
  CreditCard, 
  Settings,
  Target,
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
  calculations?: any;
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
  dailyLoss: number;
}

export const PriorityActions = ({ submission, formatCurrency, calculatorData, variant = 'standard' }: PriorityActionsProps) => {
  const [isContentOpen, setIsContentOpen] = useState(true);

  // Calculate unified results for accurate CTA values
  const unifiedCalculations = UnifiedResultsService.calculateResults(submission);

  // Use centralized priority calculations
  const priorityActions = calculatePriorityActions(submission);

  // Convert PriorityAction to ActionItem format with strategic language
  const getActionItems = (): ActionItem[] => {
    return priorityActions.map((action: PriorityAction) => {
      // Map icons for emergency context
      const iconMap: Record<string, any> = {
        'lead-response': AlertTriangle,
        'selfserve-optimization': Zap, 
        'process-automation': Settings,
        'payment-recovery': CreditCard
      };

      // Calculate daily loss for each action
      const dailyLoss = action.recoveryAmount / 365;

      // Enhanced implementation steps with crisis language
      let implementationSteps: string[] = [];
      let dependencies: string[] = [];
      let whyItMatters = '';
      let complexity = '';

      switch (action.id) {
        case 'lead-response':
          implementationSteps = [
            '🔍 ANALYZE: Review current lead response workflow',
            '⚡ OPTIMIZE: Set up automated lead triage system',
            '📱 ENHANCE: Configure instant response alerts',
            '📊 TRACK: Implement response tracking dashboard',
            '👥 TRAIN: Train team on 1-hour response SLA',
            '🔄 AUTOMATE: Set up automatic escalation workflows',
            '💡 DEPLOY: Deploy automated follow-up sequences',
            '📈 MONITOR: Monitor and optimize performance weekly'
          ];
          dependencies = [
            'Advanced CRM system with automation',
            'Team training and development',
            'Lead scoring optimization model',
            'Automated notification systems'
          ];
          whyItMatters = `🎯 STRATEGIC OPPORTUNITY: Every hour of improvement captures ${formatCurrency(dailyLoss/24)} and increases conversion likelihood by 7x. This is your highest-impact opportunity area.`;
          complexity = 'High Strategic Priority - systematic implementation approach required';
          break;

        case 'selfserve-optimization':
          implementationSteps = [
            '🔍 ANALYZE: Map user journey optimization points',
            '📉 RESEARCH: Analyze conversion funnel performance',
            '🧪 TEST: A/B test conversion improvements',
            '🚀 DEPLOY: Implement user guidance system',
            '⚡ OPTIMIZE: Enhance trial experience',
            '🎯 IMPROVE: Add progress indicators',
            '📚 CREATE: Develop self-service resources',
            '💰 ITERATE: Test and optimize pricing page'
          ];
          dependencies = [
            'UX optimization team',
            'Testing and analytics tools',
            'User feedback systems',
            'Development resources'
          ];
          whyItMatters = `📈 CONVERSION OPPORTUNITY: Your conversion optimization can capture ${formatCurrency(dailyLoss)} daily. Every 1% improvement unlocks significant revenue growth.`;
          complexity = 'Strategic Priority - requires systematic development approach';
          break;

        case 'process-automation':
          implementationSteps = [
            '📋 ANALYZE: Map all manual processes',
            '🔍 IDENTIFY: Identify automation opportunities',
            '🛠️ DEVELOP: Deploy workflow automation',
            '📄 CREATE: Create standardized procedures',
            '🔔 SETUP: Set up automated alerts',
            '👥 TRAIN: Train team on automation',
            '📊 MONITOR: Monitor efficiency gains',
            '🔄 SCALE: Scale automation across processes'
          ];
          dependencies = [
            'Automation platform',
            'Process training',
            'Integration capabilities',
            'Documentation systems'
          ];
          whyItMatters = `⚙️ EFFICIENCY OPPORTUNITY: Manual processes are costing ${formatCurrency(dailyLoss)} daily. Automation captures this value within 30 days.`;
          complexity = 'Medium Priority - systematic implementation required';
          break;

        case 'payment-recovery':
          implementationSteps = [
            '💳 SETUP: Implement smart payment recovery',
            '📧 CONFIGURE: Set up dunning sequences',
            '📱 ADD: Add payment failure alerts',
            '💳 ENABLE: Configure multiple payment methods',
            '⏸️ IMPLEMENT: Implement account pause options',
            '🔄 SETUP: Set up win-back campaigns',
            '📈 MONITOR: Monitor recovery rates',
            '🎯 ADD: Add proactive payment monitoring'
          ];
          dependencies = [
            'Payment processor',
            'Email automation',
            'Customer success team',
            'Billing integrations'
          ];
          whyItMatters = `💸 PAYMENT OPPORTUNITY: Failed payments are costing ${formatCurrency(dailyLoss)} daily. Recovery systems can capture 80% of this value.`;
          complexity = 'Low Priority - mostly configuration required';
          break;
      }

      // Calculate current/target metrics with crisis context
      let currentMetric = '';
      let targetMetric = '';
      let currentProgress = 50;
      let targetProgress = 85;

      switch (action.id) {
        case 'lead-response':
          currentMetric = `📊 ${submission.lead_response_time || 0}h current response time`;
          targetMetric = '✅ < 1h optimized response (strategic target)';
          currentProgress = Math.max(0, Math.min(100, 100 - ((submission.lead_response_time || 0) - 1.0) * 20));
          targetProgress = 95;
          break;
        case 'selfserve-optimization':
          const targetConversion = Math.min(15, (submission.free_to_paid_conversion || 0) * 2.5);
          currentMetric = `📈 ${submission.free_to_paid_conversion || 0}% current conversion`;
          targetMetric = `🚀 ${targetConversion.toFixed(1)}% strategic target rate`;
          currentProgress = ((submission.free_to_paid_conversion || 0) / targetConversion) * 100;
          targetProgress = 90;
          break;
        case 'process-automation':
          const targetHours = Math.max(5, (submission.manual_hours || 0) * 0.2);
          currentMetric = `⚙️ ${submission.manual_hours || 0}h/week bleeding processes`;
          targetMetric = `⚡ ${targetHours}h/week (crisis automated)`;
          currentProgress = Math.max(0, 100 - (((submission.manual_hours || 0) / 40) * 100));
          targetProgress = 80;
          break;
        case 'payment-recovery':
          const targetFailure = Math.max(0.8, (submission.failed_payment_rate || 0) * 0.25);
          currentMetric = `💸 ${submission.failed_payment_rate || 0}% payment bleeding`;
          targetMetric = `💰 ${targetFailure.toFixed(1)}% emergency recovery`;
          currentProgress = Math.max(0, 100 - (((submission.failed_payment_rate || 0) - 0.8) * 15));
          targetProgress = 92;
          break;
      }

      return {
        id: action.id,
        title: `🎯 ${action.title.replace('Optimization', 'Strategic Enhancement')}`,
        description: action.description.replace('Optimize', 'STRATEGICALLY IMPROVE').replace('Improve', 'SYSTEMATICALLY ENHANCE'),
        currentMetric,
        targetMetric,
        potentialRecovery: action.recoveryAmount,
        difficulty: action.effort as 'Easy' | 'Medium' | 'Hard',
        timeframe: action.timeframe.replace('weeks', 'weeks (STRATEGIC)'),
        icon: iconMap[action.id] || AlertTriangle,
        priority: action.urgency === 'Critical' || action.urgency === 'High' ? 'urgent' : 'medium',
        currentProgress,
        targetProgress,
        confidence: action.confidence.toLowerCase() as 'high' | 'medium' | 'low',
        explanation: action.description,
        implementationSteps,
        dependencies,
        whyItMatters,
        complexity,
        paybackPeriod: action.paybackPeriod,
        dailyLoss
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
            description: `${action.description} • COMPETITORS ARE GAINING WHILE YOU BLEED`
          })),
          medium: mediumActions.map(action => ({
            ...action,
            description: `${action.description} • INDUSTRY EMERGENCY STANDARD`
          }))
        };
      default:
        return { urgent: urgentActions, medium: mediumActions };
    }
  };

  const { urgent: urgentActions, medium: mediumActions } = getFilteredActions();

  // Calculate total daily bleeding
  const totalDailyLoss = actions.reduce((sum, action) => sum + action.dailyLoss, 0);

  if (actions.length === 0) {
    return (
      <Card className="border-destructive/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-destructive to-destructive/80">
              <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl text-primary">🎯 STRATEGIC OPTIMIZATION PRIORITIES</CardTitle>
              <p className="text-primary/80 mt-1">
                No critical opportunities detected. Continue strategic monitoring.
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
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-blue-500">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl text-primary">🎯 STRATEGIC OPTIMIZATION PRIORITIES</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Key opportunity areas for strategic revenue enhancement
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-4">
                <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-8 pt-6">
              {/* Strategic Opportunity Alert */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-primary text-lg">⏰ STRATEGIC IMPLEMENTATION ROADMAP</h3>
                    <p className="text-muted-foreground">Systematic approach for maximum revenue optimization</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Monthly Opportunity:</span>
                    <div className="text-primary font-bold">{formatCurrency(totalDailyLoss * 30)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Strategic Actions:</span>
                    <div className="text-primary font-bold">{actions.length} prioritized</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Implementation Window:</span>
                    <div className="text-primary font-bold">3-6 months</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Expected ROI:</span>
                    <div className="text-primary font-bold">300-500%</div>
                  </div>
                </div>
              </div>

              {/* Priority Actions with Blur Overlay */}
              <div className="relative min-h-[400px]">
                {/* Priority Sections Content */}
                <div className="space-y-6">
                  {urgentActions.length > 0 && (
                    <PriorityActionSection
                      title="🎯 HIGH PRIORITY (Maximum Impact Opportunities)"
                      actions={urgentActions}
                      formatCurrency={formatCurrency}
                      sectionType="urgent"
                    />
                  )}

                  {mediumActions.length > 0 && (
                    <PriorityActionSection
                      title="📈 MEDIUM PRIORITY (Strategic Growth Initiatives)"
                      actions={mediumActions}
                      formatCurrency={formatCurrency}
                      sectionType="medium"
                    />
                  )}
                </div>

                {/* Professional Consultation Overlay */}
                <div className="absolute inset-0 bg-background/90 backdrop-blur-md rounded-lg flex items-center justify-center z-10 border border-border/50">
                  <div className="text-center p-8 max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      Strategic Implementation Plan Available
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Get your detailed action plan with prioritized steps, implementation timelines, and ROI projections.
                    </p>
                    <StrategicCTASection
                      totalLeak={unifiedCalculations.totalLoss}
                      recovery70={unifiedCalculations.conservativeRecovery}
                      leadScore={submission.lead_score || 0}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};
