
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, AlertTriangle, Clock, TrendingUp, Download } from "lucide-react";
import { Calculations } from "../useCalculatorData";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";
import { BlurOverlay } from "@/components/ui/blur-overlay";

interface ActionPlanProps {
  calculations: Calculations;
  data?: any;
}

// Simple timeline phase interface for this component
interface SimpleTimelinePhase {
  id: string;
  title: string;
  description: string;
  startMonth: number;
  endMonth: number;
  difficulty: 'easy' | 'medium' | 'hard';
  recoveryPotential: number;
  actions: Array<{ title: string; weeks: number; owner: string }>;
}

// Helper function to generate realistic timeline phases using UnifiedResultsService
const generateSimpleTimeline = (unifiedResults: any, inputs: any): SimpleTimelinePhase[] => {
  const phases: SimpleTimelinePhase[] = [];
  const currentARR = inputs.current_arr || 0;
  
  // Use more relaxed thresholds
  const threshold = Math.max(currentARR * 0.003, 15000);

  // Phase 1: Lead Response (if above threshold)
  if (unifiedResults.leadResponseLoss > threshold) {
    phases.push({
      id: 'lead-response',
      title: 'Lead Response Optimization',
      description: 'Implement automated response systems to stop lead bleeding',
      startMonth: 1,
      endMonth: 3,
      difficulty: 'easy',
      recoveryPotential: unifiedResults.leadResponseLoss * 0.65,
      actions: [
        { title: 'Audit current response processes', weeks: 2, owner: 'Sales Ops' },
        { title: 'Implement lead automation tools', weeks: 3, owner: 'Marketing' },
        { title: 'Configure notification systems', weeks: 2, owner: 'Sales Ops' },
        { title: 'Train response team', weeks: 2, owner: 'Sales Management' }
      ]
    });
  }

  // Phase 2: Self-Serve Gap (if above threshold)
  if (unifiedResults.selfServeGap > threshold) {
    phases.push({
      id: 'self-serve',
      title: 'Self-Serve Optimization',
      description: 'Immediate onboarding fixes to stop conversion bleeding',
      startMonth: 2,
      endMonth: 5,
      difficulty: 'medium',
      recoveryPotential: unifiedResults.selfServeGap * 0.55,
      actions: [
        { title: 'Analyze conversion funnel', weeks: 2, owner: 'Product' },
        { title: 'Optimize onboarding flow', weeks: 4, owner: 'Product' },
        { title: 'A/B test pricing pages', weeks: 3, owner: 'Marketing' },
        { title: 'Deploy in-app guidance', weeks: 3, owner: 'Product' }
      ]
    });
  }

  // Phase 3: Payment Recovery (if above threshold)
  if (unifiedResults.failedPaymentLoss > threshold) {
    phases.push({
      id: 'payment-recovery',
      title: 'Payment Recovery System',
      description: 'Critical payment system fixes to stop revenue bleeding',
      startMonth: 3,
      endMonth: 6,
      difficulty: 'medium',
      recoveryPotential: unifiedResults.failedPaymentLoss * 0.70,
      actions: [
        { title: 'Analyze payment failure patterns', weeks: 2, owner: 'Finance' },
        { title: 'Implement payment retry logic', weeks: 4, owner: 'Engineering' },
        { title: 'Add alternative payment methods', weeks: 3, owner: 'Product' },
        { title: 'Deploy dunning management', weeks: 2, owner: 'Finance' }
      ]
    });
  }

  // Phase 4: Process Automation (if above threshold)
  if (unifiedResults.processInefficiency > threshold) {
    phases.push({
      id: 'process-automation',
      title: 'Process Automation',
      description: 'Emergency automation to stop manual process bleeding',
      startMonth: 4,
      endMonth: 8,
      difficulty: 'hard',
      recoveryPotential: unifiedResults.processInefficiency * 0.75,
      actions: [
        { title: 'Map current workflows', weeks: 2, owner: 'Operations' },
        { title: 'Identify automation opportunities', weeks: 2, owner: 'Operations' },
        { title: 'Configure automation tools', weeks: 4, owner: 'Operations' },
        { title: 'Train team on new processes', weeks: 3, owner: 'Operations' }
      ]
    });
  }

  return phases.sort((a, b) => a.startMonth - b.startMonth);
};

// Helper function to calculate realistic investment
const calculateSimpleInvestment = (phases: SimpleTimelinePhase[], currentARR: number) => {
  const baseInvestment = Math.min(Math.max(15000, currentARR * 0.003), 35000);
  const phaseMultiplier = phases.length;
  const complexityFactor = phases.some(p => p.difficulty === 'hard') ? 1.3 : 1.1;
  
  const implementationCost = baseInvestment * phaseMultiplier * complexityFactor;
  const ongoingCost = implementationCost * 0.15;
  const totalAnnualInvestment = (implementationCost / 2.5) + ongoingCost;
  
  const totalRecovery = phases.reduce((sum, phase) => sum + phase.recoveryPotential, 0);
  const paybackMonths = totalRecovery > 0 ? Math.min(Math.ceil(implementationCost / (totalRecovery / 12)), 24) : 24;
  
  return {
    implementationCost,
    ongoingCost,
    totalAnnualInvestment,
    paybackMonths
  };
};

export const ActionPlan = ({ calculations, data }: ActionPlanProps) => {
  // Calculate unified results if data is available
  let unifiedResults = null;
  let timeline: SimpleTimelinePhase[] = [];
  
  if (data?.calculator_data) {
    const submissionData: SubmissionData = {
      id: data.temp_id || '',
      company_name: data.company_name || '',
      contact_email: data.email || '',
      industry: data.industry || data.calculator_data.companyInfo?.industry,
      current_arr: data.calculator_data.companyInfo?.currentARR || 0,
      monthly_leads: data.calculator_data.leadGeneration?.monthlyLeads || 0,
      average_deal_value: data.calculator_data.leadGeneration?.averageDealValue || 0,
      lead_response_time: data.calculator_data.leadGeneration?.leadResponseTime || 0,
      monthly_free_signups: data.calculator_data.selfServe?.monthlyFreeSignups || 0,
      free_to_paid_conversion: data.calculator_data.selfServe?.freeToPaidConversion || 0,
      monthly_mrr: data.calculator_data.selfServe?.monthlyMRR || 0,
      failed_payment_rate: data.calculator_data.selfServe?.failedPaymentRate || 0,
      manual_hours: data.calculator_data.operations?.manualHours || 0,
      hourly_rate: data.calculator_data.operations?.hourlyRate || 0,
      lead_score: data.lead_score || 50,
      user_id: data.converted_to_user_id,
      created_at: data.created_at || new Date().toISOString()
    };
    
    console.log("ActionPlan component - calculating with submission data:", submissionData);
    unifiedResults = UnifiedResultsService.calculateResults(submissionData);
    
    // Generate simple timeline using unified results
    timeline = generateSimpleTimeline(unifiedResults, submissionData);
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTopPriority = () => {
    if (unifiedResults) {
      const priorities = [
        { name: "Lead Response Optimization", value: unifiedResults.leadResponseLoss || 0 },
        { name: "Self-Serve Optimization", value: unifiedResults.selfServeGap || 0 },
        { name: "Payment Recovery", value: unifiedResults.failedPaymentLoss || 0 },
        { name: "Process Automation", value: unifiedResults.processInefficiency || 0 }
      ];
      
      return priorities.sort((a, b) => b.value - a.value)[0];
    }
    
    // Fallback to legacy logic
    if (calculations.leadResponseLoss > calculations.failedPaymentLoss && 
        calculations.leadResponseLoss > calculations.selfServeGap && 
        calculations.leadResponseLoss > calculations.processLoss) {
      return { name: "Lead Response Optimization", value: calculations.leadResponseLoss };
    } else if (calculations.failedPaymentLoss > calculations.selfServeGap && 
               calculations.failedPaymentLoss > calculations.processLoss) {
      return { name: "Payment Recovery Systems", value: calculations.failedPaymentLoss };
    } else if (calculations.selfServeGap > calculations.processLoss) {
      return { name: "Self-Serve Conversion", value: calculations.selfServeGap };
    } else {
      return { name: "Process Automation", value: calculations.processLoss };
    }
  };

  const topPriority = getTopPriority();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="text-h2">Strategic Growth Plan</span>
        </CardTitle>
        {unifiedResults?.lossPercentageOfARR && unifiedResults.lossPercentageOfARR < 5 && (
          <div className="flex items-center gap-2 text-small text-orange-600 mt-2">
            <AlertTriangle className="h-4 w-4" />
            Low confidence estimates - use as directional guidance
          </div>
        )}
      </CardHeader>
      <CardContent>
        {timeline && timeline.length > 0 ? (
          <div className="space-y-6">
            {/* Priority Focus */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-h3 text-foreground">🎯 Top Growth Priority</span>
              </div>
              <p className="text-body font-medium text-primary">{topPriority.name}</p>
              <p className="text-small text-muted-foreground">
                Growth potential: {UnifiedResultsService.formatCurrency(topPriority.value)}
              </p>
            </div>

            {/* Overview Timeline - SHOW WHAT */}
            <div className="relative">
              <h4 className="text-h3 text-foreground mb-4">Optimization Overview</h4>
              <div className="space-y-4">
                {timeline.map((phase, index) => (
                  <div key={phase.id} className="border rounded-lg p-4 bg-background">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-small font-medium text-primary">
                            {index + 1}
                          </div>
                          <h5 className="text-h3 text-foreground">{phase.title}</h5>
                          <Badge className={getDifficultyColor(phase.difficulty)}>
                            {phase.difficulty}
                          </Badge>
                        </div>
                        <p className="text-body text-muted-foreground mb-2">{phase.description}</p>
                        <div className="flex items-center gap-4 text-small">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Months {phase.startMonth}-{phase.endMonth}
                          </span>
                          <span className="font-medium text-primary">
                            {UnifiedResultsService.formatCurrency(phase.recoveryPotential)} growth potential
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Key Focus Areas - Show direction without details */}
                    <div className="mt-3 space-y-2">
                      <h6 className="text-small font-medium">Key Focus Areas:</h6>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {phase.actions.slice(0, 2).map((action, actionIndex) => (
                          <li key={actionIndex} className="text-small text-muted-foreground">
                            • {action.title} ({action.owner})
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Strategic focus includes {phase.actions.length} specific implementation actions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Details - BLUR THE HOW */}
            <BlurOverlay 
              title="Get Detailed Implementation Plan"
              description="Access step-by-step execution roadmap, timelines, responsibilities, and risk mitigation strategies"
              ctaText="Book Implementation Strategy Call"
              onUnlock={() => window.open('https://cal.com/rev-calculator/revenuecalculator-strategy-session', '_blank')}
              blurLevel="medium"
            >
              <div className="p-6 bg-muted/20 rounded-xl border">
                <h4 className="text-lg font-semibold text-foreground mb-4">Detailed Implementation Roadmap</h4>
                <div className="space-y-6">
                  {timeline.map((phase, index) => (
                    <div key={phase.id} className="border-l-2 border-primary/20 pl-4">
                      <h5 className="font-medium text-foreground mb-2">
                        Phase {index + 1}: {phase.title}
                      </h5>
                      <div className="space-y-2">
                        {phase.actions.map((action, actionIndex) => (
                          <div key={actionIndex} className="flex items-center justify-between p-2 bg-background/50 rounded">
                            <span className="text-sm text-muted-foreground">
                              Week {actionIndex * 2 + 1}-{actionIndex * 2 + action.weeks}: {action.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {action.owner}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Risk Level: {phase.difficulty} • Dependencies mapped • Resource requirements calculated
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-background rounded">
                    <div className="font-medium text-sm">Change Management</div>
                    <div className="text-xs text-muted-foreground">Team training protocols</div>
                  </div>
                  <div className="p-3 bg-background rounded">
                    <div className="font-medium text-sm">Quality Assurance</div>
                    <div className="text-xs text-muted-foreground">Testing & validation steps</div>
                  </div>
                  <div className="p-3 bg-background rounded">
                    <div className="font-medium text-sm">Performance Tracking</div>
                    <div className="text-xs text-muted-foreground">KPI monitoring dashboards</div>
                  </div>
                </div>
              </div>
            </BlurOverlay>

            {/* Investment ROI Summary - Show impact, blur detailed analysis */}
            {(() => {
              const currentARR = data?.calculator_data?.companyInfo?.currentARR || 0;
              const investment = calculateSimpleInvestment(timeline, currentARR);
              const totalRecovery = timeline.reduce((sum, phase) => sum + phase.recoveryPotential, 0);
              
              return (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-h3 text-green-800">🚀 Growth Impact Summary</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-small">
                    <div>
                      <div className="text-h3 text-gray-800">Implementation Investment</div>
                      <div className="text-body text-gray-600">{UnifiedResultsService.formatCurrency(investment.implementationCost)}</div>
                    </div>
                    <div>
                      <div className="text-h3 text-gray-800">Annual Growth Potential</div>
                      <div className="text-body text-green-600">{UnifiedResultsService.formatCurrency(totalRecovery)}</div>
                    </div>
                    <div>
                      <div className="text-h3 text-gray-800">Strategic Timeline</div>
                      <div className="text-body text-gray-600">{investment.paybackMonths} month payback</div>
                    </div>
                    <div>
                      <div className="text-h3 text-gray-800">Growth Multiplier</div>
                      <div className="text-body text-green-600">
                        {Math.round(totalRecovery / investment.implementationCost * 10) / 10}x ROI
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Complete financial analysis and risk assessment available in strategy consultation
                    </p>
                  </div>
                </div>
              );
            })()}

          </div>
        ) : (
          // Fallback to static plan
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-h3 text-foreground">Strategic Focus Areas</h4>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>• Lead response optimization systems</li>
                <li>• Payment recovery automation</li>
                <li>• Conversion flow enhancement</li>
                <li>• Process efficiency improvement</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-h3 text-foreground">Expected Timeline</h4>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>• Quick wins in 30-60 days</li>
                <li>• Strategic improvements in 3-6 months</li>
                <li>• Full optimization in 6-12 months</li>
                <li>• Ongoing performance enhancement</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
