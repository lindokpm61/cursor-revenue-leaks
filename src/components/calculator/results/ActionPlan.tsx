
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, AlertTriangle, Clock, TrendingUp, Download } from "lucide-react";
import { Calculations } from "../useCalculatorData";
import { UnifiedResultsService, type SubmissionData } from "@/lib/results/UnifiedResultsService";

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

            {/* Timeline Phases */}
            <div className="relative">
              <h4 className="text-h3 text-foreground mb-4">Optimization Timeline</h4>
              <div className="space-y-4">
                {timeline.slice(0, 1).map((phase, index) => (
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
                    
                    {/* Actions List - Show only first 2 actions */}
                    <div className="mt-3 space-y-2">
                      <h6 className="text-small font-medium">Key Actions:</h6>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {phase.actions.slice(0, 2).map((action, actionIndex) => (
                          <li key={actionIndex} className="text-small text-muted-foreground">
                            • {action.title} ({action.weeks}w, {action.owner})
                          </li>
                        ))}
                      </ul>
                      
                      {/* Premium Content Blur */}
                      {phase.actions.length > 2 && (
                        <div className="relative mt-2">
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 blur-sm opacity-50">
                            {phase.actions.slice(2).map((action, actionIndex) => (
                              <li key={actionIndex + 2} className="text-small text-muted-foreground">
                                • {action.title} ({action.weeks}w, {action.owner})
                              </li>
                            ))}
                          </ul>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                              Unlock {phase.actions.length - 2} More Actions
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Additional Phases - Blurred */}
                {timeline.length > 1 && (
                  <div className="relative">
                    <div className="space-y-4 blur-sm opacity-60">
                      {timeline.slice(1).map((phase, index) => (
                        <div key={phase.id} className="border rounded-lg p-4 bg-muted/30">
                          <div className="h-6 bg-muted rounded mb-3"></div>
                          <div className="h-4 bg-muted/70 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg p-6 shadow-lg text-center max-w-md">
                        <h3 className="text-lg font-semibold text-foreground mb-2">🚀 Complete Growth Strategy</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Unlock {timeline.length - 1} additional optimization phases with detailed implementation guides and resource planning.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button className="bg-gradient-to-r from-primary to-primary-accent text-primary-foreground hover:from-primary/90 hover:to-primary-accent/90">
                            Unlock Full Strategy
                          </Button>
                          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                            Schedule Demo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Investment ROI Summary with Blur */}
            {timeline.length > 0 && (() => {
              const currentARR = data?.calculator_data?.companyInfo?.currentARR || 0;
              const investment = calculateSimpleInvestment(timeline, currentARR);
              const totalRecovery = timeline.reduce((sum, phase) => sum + phase.recoveryPotential, 0);
              
              return (
                <div className="relative">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-h3 text-green-800">🚀 Growth ROI Summary</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-small">
                      <div>
                        <div className="text-h3 text-gray-800">Total Investment</div>
                        <div className="text-body text-gray-600">{UnifiedResultsService.formatCurrency(investment.implementationCost)}</div>
                      </div>
                      <div>
                        <div className="text-h3 text-gray-800">Annual Growth</div>
                        <div className="text-body text-green-600">{UnifiedResultsService.formatCurrency(totalRecovery)}</div>
                      </div>
                      <div className="blur-sm">
                        <div className="text-h3 text-gray-800">Payback Period</div>
                        <div className="text-body text-gray-600">{investment.paybackMonths} months</div>
                      </div>
                      <div className="blur-sm">
                        <div className="text-h3 text-gray-800">Year 1 ROI</div>
                        <div className="text-body text-green-600">
                          {Math.round(((totalRecovery - investment.totalAnnualInvestment) / investment.totalAnnualInvestment) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Premium ROI CTA Overlay */}
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                    <div className="bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg p-4 shadow-lg text-center">
                      <p className="text-sm font-medium text-foreground mb-2">See Complete ROI Analysis</p>
                      <Button size="sm" className="bg-gradient-to-r from-primary to-primary-accent text-primary-foreground">
                        Unlock Full Metrics
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Implementation Notes with CTA */}
            <div className="p-4 bg-gradient-to-r from-primary/10 via-primary-accent/10 to-primary/10 border border-primary/20 rounded-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h6 className="text-h3 text-foreground mb-2">🎯 Ready to Execute Your Growth Plan?</h6>
                  <ul className="text-small text-muted-foreground space-y-1">
                    <li>• High growth potential detected - prioritize quick wins first</li>
                    <li>• Phased approach recommended for sustainable growth</li>
                    <li>• Monitor KPIs closely during optimization</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <Button className="bg-gradient-to-r from-primary to-primary-accent text-primary-foreground hover:from-primary/90 hover:to-primary-accent/90">
                    <Download className="h-4 w-4 mr-2" />
                    Get Full Strategy
                  </Button>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Expert Consultation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Fallback to static plan
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-h3 text-foreground">Quick Wins (0-60 days)</h4>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>• Implement automated lead response system</li>
                <li>• Set up failed payment recovery workflows</li>
                <li>• Review and optimize onboarding flow</li>
                <li>• Automate most time-consuming manual tasks</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-h3 text-foreground">Long-term Impact (3-8 months)</h4>
              <ul className="space-y-2 text-body text-muted-foreground">
                <li>• Advanced lead scoring and qualification</li>
                <li>• Predictive churn prevention</li>
                <li>• Self-serve optimization program</li>
                <li>• Complete process automation suite</li>
              </ul>
            </div>
            
            <div className="md:col-span-2 mt-6 p-4 bg-background rounded-lg border">
              <p className="text-body font-medium text-foreground mb-2">
                💡 Priority Focus: {topPriority.name}
              </p>
              <p className="text-small text-muted-foreground">
                This area represents your largest revenue leak and should be addressed first for maximum impact.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
