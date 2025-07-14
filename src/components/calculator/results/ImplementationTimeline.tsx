import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  ChevronDown,
  AlertTriangle
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { validateCalculationResults, getCalculationConfidenceLevel } from '@/lib/calculator/validationHelpers';

interface ImplementationTimelineProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  validatedValues?: {
    totalLeak: number;
    leadResponseLoss: number;
    selfServeLoss: number;
    recoveryPotential70: number;
    recoveryPotential85: number;
  };
}

interface TimelinePhase {
  phase: string;
  months: string;
  title: string;
  description: string;
  recovery: number;
  difficulty: 'Easy' | 'Medium' | 'Medium-Hard';
  actions: string[];
  cumulativeRecovery: number;
  roiPercentage: number;
}

export const ImplementationTimeline = ({ submission, formatCurrency, validatedValues }: ImplementationTimelineProps) => {
  const [isContentOpen, setIsContentOpen] = useState(false);

  const calculateTimelinePhases = (): TimelinePhase[] => {
    const currentARR = submission.current_arr || 0;
    const threshold = currentARR * 0.01; // 1% ARR threshold

    // Calculate actual losses for each category
    const leadResponseLoss = submission.lead_response_loss || 0;
    const selfServeLoss = submission.selfserve_gap_loss || 0;
    const processLoss = submission.process_inefficiency_loss || 0;
    const paymentLoss = submission.failed_payment_loss || 0;

    // Create potential phases based on significant losses
    const potentialPhases = [];

    // Lead Response Phase (Phase 1 - Quick Wins)
    if (leadResponseLoss > threshold) {
      potentialPhases.push({
        type: 'lead_response',
        title: "Lead Response Optimization",
        description: "Immediate response time improvements and lead capture optimization",
        recovery: Math.min(leadResponseLoss * 0.7, currentARR * 0.15),
        difficulty: "Easy" as const,
        months: "Month 1-2",
        actions: [
          "Implement lead response automation",
          "Set up notification systems", 
          "Deploy lead scoring system",
          "Train response team"
        ]
      });
    }

    // Self-Serve Phase (Phase 2)
    if (selfServeLoss > threshold) {
      potentialPhases.push({
        type: 'self_serve',
        title: "Self-Serve Optimization",
        description: "Conversion rate improvements and onboarding optimization",
        recovery: Math.min(selfServeLoss * 0.6, currentARR * 0.20),
        difficulty: "Medium" as const,
        months: "Month 3-4",
        actions: [
          "Optimize onboarding flow",
          "Implement conversion tracking",
          "A/B test pricing pages",
          "Deploy in-app guidance"
        ]
      });
    }

    // Process Automation Phase (Phase 3)
    if (processLoss > threshold) {
      potentialPhases.push({
        type: 'process_automation',
        title: "Process Automation",
        description: "Advanced automation and manual process elimination",
        recovery: Math.min(processLoss * 0.7, currentARR * 0.25),
        difficulty: "Medium-Hard" as const,
        months: "Month 5-6",
        actions: [
          "Deploy workflow automation",
          "Eliminate manual processes",
          "Implement advanced analytics",
          "Optimize resource allocation"
        ]
      });
    }

    // Payment Recovery Phase (if significant)
    if (paymentLoss > threshold) {
      potentialPhases.push({
        type: 'payment_recovery',
        title: "Payment Recovery System", 
        description: "Payment failure reduction and retry logic optimization",
        recovery: Math.min(paymentLoss * 0.5, currentARR * 0.08),
        difficulty: "Medium" as const,
        months: "Month 4-5",
        actions: [
          "Implement payment retry logic",
          "Add multiple payment methods",
          "Deploy dunning management",
          "Optimize payment flows"
        ]
      });
    }

    // Sort by recovery potential and take top 3
    potentialPhases.sort((a, b) => b.recovery - a.recovery);
    const selectedPhases = potentialPhases.slice(0, 3);

    // Convert to timeline phases with proper numbering
    const phases: TimelinePhase[] = selectedPhases.map((phase, index) => ({
      phase: (index + 1).toString(),
      months: index === 0 ? "Month 1-2" : index === 1 ? "Month 3-4" : "Month 5-6",
      title: phase.title,
      description: phase.description,
      recovery: phase.recovery,
      difficulty: phase.difficulty,
      actions: phase.actions,
      cumulativeRecovery: 0,
      roiPercentage: 0
    }));

    // If no significant phases found, provide default timeline
    if (phases.length === 0) {
      phases.push({
        phase: "1",
        months: "Month 1-6",
        title: "General Optimization",
        description: "Incremental improvements across all business areas",
        recovery: Math.max(leadResponseLoss, selfServeLoss, processLoss) * 0.3,
        difficulty: "Easy",
        actions: [
          "Audit current processes",
          "Identify quick wins",
          "Implement basic improvements",
          "Monitor and optimize"
        ],
        cumulativeRecovery: 0,
        roiPercentage: 0
      });
    }

    // Scale investment based on company size
    const totalInvestment = Math.min(50000 + (currentARR * 0.02), 200000);

    // Calculate cumulative recovery and ROI
    let cumulative = 0;
    phases.forEach((phase, index) => {
      cumulative += phase.recovery;
      phase.cumulativeRecovery = cumulative;
      phase.roiPercentage = ((cumulative - totalInvestment) / totalInvestment) * 100;
    });

    return phases;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-revenue-success bg-revenue-success/10';
      case 'Medium': return 'text-revenue-warning bg-revenue-warning/10';
      case 'Medium-Hard': return 'text-revenue-danger bg-revenue-danger/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const phases = calculateTimelinePhases();
  const totalRecovery = phases[phases.length - 1]?.cumulativeRecovery || 0;
  const totalLeak = validatedValues ? validatedValues.totalLeak : (submission.total_leak || 1);
  const currentARR = submission.current_arr || 0;
  
  // Cap recovery percentage based on realistic expectations
  const maxRecoveryPercentage = currentARR < 1000000 ? 25 : currentARR < 10000000 ? 40 : 60;
  const recoveryPercentage = Math.min((totalRecovery / totalLeak) * 100, maxRecoveryPercentage);
  
  const confidenceLevel = getCalculationConfidenceLevel({
    currentARR: submission.current_arr || 0,
    monthlyLeads: submission.monthly_leads || 0,
    monthlyFreeSignups: submission.monthly_free_signups || 0,
    totalLeak: submission.total_leak || 0
  });

  // Chart data for cumulative recovery - monthly intervals for 6 months
  const chartData = [
    { month: 'Current', recovery: 0, cumulative: 0 },
    { month: 'Month 1', recovery: phases[0]?.recovery * 0.5 || 0, cumulative: phases[0]?.recovery * 0.5 || 0 },
    { month: 'Month 2', recovery: phases[0]?.recovery * 0.5 || 0, cumulative: phases[0]?.cumulativeRecovery || 0 },
    { month: 'Month 3', recovery: phases[1]?.recovery * 0.5 || 0, cumulative: (phases[0]?.cumulativeRecovery || 0) + (phases[1]?.recovery * 0.5 || 0) },
    { month: 'Month 4', recovery: phases[1]?.recovery * 0.5 || 0, cumulative: phases[1]?.cumulativeRecovery || 0 },
    { month: 'Month 5', recovery: phases[2]?.recovery * 0.5 || 0, cumulative: (phases[1]?.cumulativeRecovery || 0) + (phases[2]?.recovery * 0.5 || 0) },
    { month: 'Month 6', recovery: phases[2]?.recovery * 0.5 || 0, cumulative: phases[2]?.cumulativeRecovery || 0 }
  ];

  const milestones = [
    {
      day: "30-day mark",
      title: "First Improvements Visible", 
      description: "Lead response metrics show improvement",
      icon: CheckCircle,
      progress: 25
    },
    {
      day: "90-day mark",
      title: "Major Systems Optimized",
      description: "Conversion rates stabilize at new levels",
      icon: Target,
      progress: 65
    },
    {
      day: "180-day mark", 
      title: "Full Automation Implemented",
      description: "All manual processes eliminated",
      icon: TrendingUp,
      progress: 100
    }
  ];

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Implementation Timeline & ROI</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Month-by-month revenue recovery plan with {Math.round(recoveryPercentage)}% leak recovery potential
                  {confidenceLevel.level !== 'high' && (
                    <span className="text-revenue-warning"> • {confidenceLevel.level} confidence estimates</span>
                  )}
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4 flex-shrink-0">
                <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-8 pt-6">
              {/* Recovery Summary */}
              {confidenceLevel.level === 'low' && (
                <div className="flex items-center gap-2 p-3 bg-revenue-warning/10 border border-revenue-warning/20 rounded-lg mb-4">
                  <AlertTriangle className="h-4 w-4 text-revenue-warning" />
                  <p className="text-sm text-muted-foreground">
                    Timeline estimates have low confidence due to limited data. Consider these as directional guidance.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-background to-primary/5 rounded-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-revenue-primary mb-1">
                    {formatCurrency(totalRecovery)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total 6-Month Recovery</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-revenue-success mb-1">
                    {Math.round(recoveryPercentage)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Of Revenue Leak Recovered</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-revenue-warning mb-1">
                    {phases[phases.length - 1]?.roiPercentage > 0 ? '+' : ''}{Math.round(phases[phases.length - 1]?.roiPercentage || 0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">6-Month ROI</p>
                </div>
              </div>

              {/* Cumulative Recovery Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cumulative Revenue Recovery
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Recovery']}
                        labelFormatter={(label) => `Timeline: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary)/0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Implementation Phases */}
              <div>
                <h3 className="text-lg font-semibold mb-6">Implementation Phases</h3>
                <div className="space-y-6">
                  {phases.map((phase, index) => (
                    <Card key={phase.phase} className="border-border/30">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          {/* Header section with phase number and title */}
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
                              {phase.phase}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                <h4 className="text-lg sm:text-xl font-semibold leading-tight">{phase.title}</h4>
                                <Badge className={getDifficultyColor(phase.difficulty)}>
                                  {phase.difficulty}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{phase.months}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{phase.description}</p>
                            </div>
                          </div>
                          
                          {/* Recovery potential - mobile optimized */}
                          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                            <div className="text-center sm:text-left">
                              <div className="text-xl sm:text-2xl font-bold text-revenue-primary mb-1">
                                {formatCurrency(phase.recovery)}
                              </div>
                              <p className="text-sm text-muted-foreground">Recovery Potential</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium mb-3">Key Actions:</h5>
                            <ul className="space-y-2">
                              {phase.actions.map((action, actionIndex) => (
                                <li key={actionIndex} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>Cumulative Recovery</span>
                                <span className="font-medium">{formatCurrency(phase.cumulativeRecovery)}</span>
                              </div>
                              <Progress 
                                value={(phase.cumulativeRecovery / totalRecovery) * 100} 
                                className="h-2"
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>ROI by this phase</span>
                                <span className={`font-medium ${phase.roiPercentage > 0 ? 'text-revenue-success' : 'text-revenue-warning'}`}>
                                  {phase.roiPercentage > 0 ? '+' : ''}{Math.round(phase.roiPercentage)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Milestones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {milestones.map((milestone, index) => {
                    const Icon = milestone.icon;
                    return (
                      <Card key={index} className="border-border/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-primary">{milestone.day}</div>
                              <h4 className="font-semibold">{milestone.title}</h4>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {milestone.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{milestone.progress}%</span>
                            </div>
                            <Progress value={milestone.progress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};