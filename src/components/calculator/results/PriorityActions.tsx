
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

  // Convert PriorityAction to ActionItem format with crisis language
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
            '🚨 EMERGENCY: Audit current lead hemorrhaging workflow',
            '⚡ IMMEDIATE: Set up emergency lead triage system',
            '📱 URGENT: Configure instant crisis response alerts',
            '📊 CRITICAL: Implement bleeding tracking dashboard',
            '👥 ESSENTIAL: Train team on 1-hour emergency SLA',
            '🔄 VITAL: Set up automatic escalation for missed leads',
            '💉 LIFESAVING: Deploy automated follow-up sequences',
            '📈 ONGOING: Monitor and stop bleeding weekly'
          ];
          dependencies = [
            'Emergency CRM system with crisis automation',
            'Crisis response team training',
            'Lead bleeding scoring model',
            'Emergency notification systems'
          ];
          whyItMatters = `💥 REVENUE CRISIS: Every hour of delay costs you ${formatCurrency(dailyLoss/24)} and makes you 7x less likely to stop the bleeding. This is your most critical hemorrhaging point.`;
          complexity = 'High Crisis Priority - immediate emergency response required';
          break;

        case 'selfserve-optimization':
          implementationSteps = [
            '🔍 EMERGENCY: Map user journey bleeding points',
            '📉 CRITICAL: Analyze conversion hemorrhaging funnel',
            '🧪 URGENT: A/B test emergency conversion fixes',
            '🚀 VITAL: Deploy emergency user guidance system',
            '⚡ IMMEDIATE: Optimize trial bleeding experience',
            '🎯 ESSENTIAL: Add emergency progress indicators',
            '📚 CRITICAL: Create emergency self-service resources',
            '💰 ONGOING: Test and stop pricing page bleeding'
          ];
          dependencies = [
            'Emergency UX crisis team',
            'Crisis testing and analytics tools',
            'User bleeding feedback systems',
            'Emergency development resources'
          ];
          whyItMatters = `🩸 CONVERSION CRISIS: Your conversion is bleeding ${formatCurrency(dailyLoss)} daily. Every 1% improvement stops significant revenue hemorrhaging.`;
          complexity = 'Critical Crisis - requires immediate emergency development';
          break;

        case 'process-automation':
          implementationSteps = [
            '📋 EMERGENCY: Map all manual bleeding processes',
            '🔴 CRITICAL: Identify emergency automation opportunities',
            '🛠️ URGENT: Deploy crisis workflow automation',
            '📄 VITAL: Create emergency standardized procedures',
            '🔔 IMMEDIATE: Set up emergency automated alerts',
            '👥 ESSENTIAL: Train team on crisis automation',
            '📊 CRITICAL: Monitor emergency efficiency gains',
            '🔄 ONGOING: Scale automation to stop all bleeding'
          ];
          dependencies = [
            'Emergency automation platform',
            'Crisis process training',
            'Emergency integration capabilities',
            'Crisis documentation systems'
          ];
          whyItMatters = `⚙️ EFFICIENCY CRISIS: Manual processes are bleeding ${formatCurrency(dailyLoss)} daily. Automation stops this hemorrhaging within 30 days.`;
          complexity = 'Medium Crisis - emergency implementation required';
          break;

        case 'payment-recovery':
          implementationSteps = [
            '🆘 EMERGENCY: Implement smart payment crisis recovery',
            '📧 CRITICAL: Set up emergency dunning sequences',
            '📱 URGENT: Add payment failure emergency alerts',
            '💳 VITAL: Configure multiple emergency payment methods',
            '⏸️ IMMEDIATE: Implement account pause crisis options',
            '🔄 ESSENTIAL: Set up emergency win-back campaigns',
            '📈 CRITICAL: Monitor crisis recovery rates',
            '🎯 ONGOING: Add proactive payment crisis monitoring'
          ];
          dependencies = [
            'Emergency payment processor',
            'Crisis email automation',
            'Emergency customer success team',
            'Crisis billing integrations'
          ];
          whyItMatters = `💸 PAYMENT CRISIS: Failed payments are bleeding ${formatCurrency(dailyLoss)} daily. Emergency recovery systems can stop 80% of this hemorrhaging.`;
          complexity = 'Low Crisis - mostly emergency configuration';
          break;
      }

      // Calculate current/target metrics with crisis context
      let currentMetric = '';
      let targetMetric = '';
      let currentProgress = 50;
      let targetProgress = 85;

      switch (action.id) {
        case 'lead-response':
          currentMetric = `⚠️ ${submission.lead_response_time || 0}h bleeding response time`;
          targetMetric = '✅ < 1h emergency response (crisis stopped)';
          currentProgress = Math.max(0, Math.min(100, 100 - ((submission.lead_response_time || 0) - 1.0) * 20));
          targetProgress = 95;
          break;
        case 'selfserve-optimization':
          const targetConversion = Math.min(15, (submission.free_to_paid_conversion || 0) * 2.5);
          currentMetric = `🩸 ${submission.free_to_paid_conversion || 0}% bleeding conversion`;
          targetMetric = `🚀 ${targetConversion.toFixed(1)}% emergency recovery rate`;
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
        title: `🚨 ${action.title.replace('Optimization', 'Emergency Recovery')}`,
        description: action.description.replace('Optimize', 'STOP BLEEDING in').replace('Improve', 'EMERGENCY FIX for'),
        currentMetric,
        targetMetric,
        potentialRecovery: action.recoveryAmount,
        difficulty: action.effort as 'Easy' | 'Medium' | 'Hard',
        timeframe: action.timeframe.replace('weeks', 'weeks (EMERGENCY)'),
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
              <CardTitle className="text-2xl text-destructive">🚨 EMERGENCY INTERVENTION PRIORITIES</CardTitle>
              <p className="text-destructive/80 mt-1">
                No critical bleeding detected. Continue crisis monitoring.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/20 shadow-lg">
      <CardHeader>
        <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-destructive to-destructive/80 animate-pulse">
                <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl text-destructive">🚨 EMERGENCY INTERVENTION PRIORITIES</CardTitle>
                <p className="text-destructive/80 mt-1">
                  Critical bleeding points requiring immediate emergency response
                </p>
              </div>
            </div>
            <Collapsible asChild>
              <Button variant="ghost" size="sm" className="ml-4 text-destructive hover:bg-destructive/10">
                <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? 'rotate-180' : ''}`} />
              </Button>
            </Collapsible>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-8 pt-6">
              {/* Crisis Alert */}
              <div className="bg-gradient-to-r from-destructive/20 to-destructive/10 border-2 border-destructive/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-destructive animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-destructive text-lg">⏰ REVENUE BLEEDING IN PROGRESS</h3>
                    <p className="text-destructive/80">Every moment of delay increases your financial hemorrhaging</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-destructive">Daily Bleeding:</span>
                    <div className="text-destructive font-bold">{formatCurrency(totalDailyLoss)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-destructive">Emergency Actions:</span>
                    <div className="text-destructive font-bold">{actions.length} critical</div>
                  </div>
                  <div>
                    <span className="font-medium text-destructive">Crisis Window:</span>
                    <div className="text-destructive font-bold">72 hours</div>
                  </div>
                  <div>
                    <span className="font-medium text-destructive">Recovery Rate:</span>
                    <div className="text-destructive font-bold">85% if immediate</div>
                  </div>
                </div>
              </div>

              {/* Emergency Priority Sections */}
              {urgentActions.length > 0 && (
                <PriorityActionSection
                  title="🚨 CRITICAL EMERGENCY (Stop Bleeding NOW)"
                  actions={urgentActions}
                  formatCurrency={formatCurrency}
                  sectionType="urgent"
                />
              )}

              {mediumActions.length > 0 && (
                <PriorityActionSection
                  title="⚠️ SECONDARY EMERGENCY (Crisis Stabilization)"
                  actions={mediumActions}
                  formatCurrency={formatCurrency}
                  sectionType="medium"
                />
              )}

              {/* Emergency CTA Section */}
              {actions.length > 0 && (
                <div className="mt-8 bg-gradient-to-r from-destructive/10 to-destructive/5 border-2 border-destructive/20 rounded-lg p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-destructive mb-2">
                      🩸 STOP THE BLEEDING NOW
                    </h3>
                    <p className="text-destructive/80 mb-4">
                      Your business is hemorrhaging {formatCurrency(totalDailyLoss)} daily. 
                      Every hour of delay costs you {formatCurrency(totalDailyLoss/24)}.
                    </p>
                    <StrategicCTASection
                      totalLeak={unifiedCalculations.totalLoss}
                      recovery70={unifiedCalculations.conservativeRecovery}
                      leadScore={submission.lead_score || 0}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};
