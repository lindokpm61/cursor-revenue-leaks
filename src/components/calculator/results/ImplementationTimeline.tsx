
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
import { calculateUnifiedResults, generateRealisticTimeline, UnifiedCalculationInputs } from '@/lib/calculator/unifiedCalculations';
import { UnifiedResultsService } from '@/lib/results/UnifiedResultsService';

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
  calculatorData?: any;
  variant?: 'condensed' | 'standard' | 'detailed' | 'competitive';
}

interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  startMonth: number;
  endMonth: number;
  difficulty: 'easy' | 'medium' | 'hard';
  recoveryPotential: number;
  actions: Array<{ title: string; weeks: number; owner: string }>;
}

export const ImplementationTimeline = ({ submission, formatCurrency, validatedValues, calculatorData, variant = 'standard' }: ImplementationTimelineProps) => {
  const [isContentOpen, setIsContentOpen] = useState(variant === 'condensed' ? false : variant === 'detailed' ? true : false);

  // Use unified calculations consistently
  const unifiedCalcs = UnifiedResultsService.calculateResults(submission);
  
  // Generate realistic timeline phases using unified calculations
  const generateTimelinePhases = (): TimelinePhase[] => {
    const currentARR = submission.current_arr || 0;
    
    // Use more relaxed thresholds - lower percentage OR absolute minimum
    const percentageThreshold = currentARR * 0.003; // 0.3% of ARR (reduced from 0.5%)
    const absoluteMinimum = 15000; // $15K absolute minimum
    const threshold = Math.max(percentageThreshold, absoluteMinimum);

    console.log('=== TIMELINE PHASE GENERATION ===');
    console.log('Current ARR:', currentARR);
    console.log('Percentage threshold (0.3%):', percentageThreshold);
    console.log('Absolute minimum:', absoluteMinimum);
    console.log('Final threshold:', threshold);
    console.log('Unified calculations:', {
      leadResponseLoss: unifiedCalcs.leadResponseLoss,
      selfServeGap: unifiedCalcs.selfServeGap,
      processInefficiency: unifiedCalcs.processInefficiency,
      failedPaymentLoss: unifiedCalcs.failedPaymentLoss
    });

    const phases: TimelinePhase[] = [];

    // Phase 1: Lead Response (if above threshold)
    if (unifiedCalcs.leadResponseLoss > threshold) {
      const recoveryRate = 0.65; // 65% recovery rate
      phases.push({
        id: 'lead-response',
        title: 'Lead Response Optimization',
        description: 'Implement automated lead response and scoring systems',
        startMonth: 1,
        endMonth: 3,
        difficulty: 'easy',
        recoveryPotential: unifiedCalcs.leadResponseLoss * recoveryRate,
        actions: [
          { title: 'Audit current response processes', weeks: 2, owner: 'Sales Ops' },
          { title: 'Implement lead automation tools', weeks: 3, owner: 'Marketing' },
          { title: 'Configure notification systems', weeks: 2, owner: 'Sales Ops' },
          { title: 'Train response team', weeks: 2, owner: 'Sales Management' }
        ]
      });
    }

    // Phase 2: Self-Serve Gap (if above threshold)
    if (unifiedCalcs.selfServeGap > threshold) {
      const recoveryRate = 0.55; // 55% recovery rate for self-serve
      phases.push({
        id: 'self-serve',
        title: 'Self-Serve Conversion Enhancement',
        description: 'Optimize onboarding flow and conversion triggers',
        startMonth: 2,
        endMonth: 5,
        difficulty: 'medium',
        recoveryPotential: unifiedCalcs.selfServeGap * recoveryRate,
        actions: [
          { title: 'Analyze conversion funnel', weeks: 2, owner: 'Product' },
          { title: 'Optimize onboarding flow', weeks: 4, owner: 'Product' },
          { title: 'A/B test pricing pages', weeks: 3, owner: 'Marketing' },
          { title: 'Deploy in-app guidance', weeks: 3, owner: 'Product' }
        ]
      });
    }

    // Phase 3: Payment Recovery (if above threshold)  
    if (unifiedCalcs.failedPaymentLoss > threshold) {
      const recoveryRate = 0.70; // 70% recovery rate for payment issues
      phases.push({
        id: 'payment-recovery',
        title: 'Payment Recovery System',
        description: 'Implement advanced payment retry and dunning management',
        startMonth: 3,
        endMonth: 6,
        difficulty: 'medium',
        recoveryPotential: unifiedCalcs.failedPaymentLoss * recoveryRate,
        actions: [
          { title: 'Analyze payment failure patterns', weeks: 2, owner: 'Finance' },
          { title: 'Implement payment retry logic', weeks: 4, owner: 'Engineering' },
          { title: 'Add alternative payment methods', weeks: 3, owner: 'Product' },
          { title: 'Deploy dunning management', weeks: 2, owner: 'Finance' }
        ]
      });
    }

    // Phase 4: Process Automation (if above threshold)
    if (unifiedCalcs.processInefficiency > threshold) {
      const recoveryRate = 0.75; // 75% recovery rate for automation
      phases.push({
        id: 'process-automation', 
        title: 'Process Automation',
        description: 'Automate manual processes and workflows',
        startMonth: 4,
        endMonth: 8,
        difficulty: 'hard',
        recoveryPotential: unifiedCalcs.processInefficiency * recoveryRate,
        actions: [
          { title: 'Map current workflows', weeks: 2, owner: 'Operations' },
          { title: 'Identify automation opportunities', weeks: 2, owner: 'Operations' },
          { title: 'Configure automation tools', weeks: 4, owner: 'Operations' },
          { title: 'Train team on new processes', weeks: 3, owner: 'Operations' }
        ]
      });
    }

    console.log('Generated phases:', phases.map(p => ({ 
      id: p.id, 
      recovery: p.recoveryPotential,
      thresholdCheck: p.recoveryPotential > threshold
    })));

    return phases.sort((a, b) => a.startMonth - b.startMonth);
  };

  const phases = generateTimelinePhases();
  const totalRecovery = phases.reduce((sum, phase) => sum + phase.recoveryPotential, 0);
  
  // Calculate realistic investment with proper scaling
  const calculateInvestment = () => {
    const baseInvestment = Math.min(Math.max(15000, (submission.current_arr || 0) * 0.003), 35000);
    const phaseMultiplier = phases.length;
    const complexityFactor = phases.some(p => p.difficulty === 'hard') ? 1.3 : 1.1;
    
    const implementationCost = baseInvestment * phaseMultiplier * complexityFactor;
    const ongoingCost = implementationCost * 0.15; // 15% ongoing
    const totalAnnualInvestment = (implementationCost / 2.5) + ongoingCost; // Amortize over 2.5 years
    
    return {
      implementationCost,
      ongoingCost, 
      totalAnnualInvestment,
      paybackMonths: totalRecovery > 0 ? Math.min(Math.ceil(implementationCost / (totalRecovery / 12)), 24) : 24
    };
  };

  const investment = calculateInvestment();
  
  // Calculate realistic ROI with confidence adjustments
  const calculateROI = () => {
    if (investment.totalAnnualInvestment <= 0) return { roi: 0, category: 'Invalid' };
    
    // Basic ROI calculation
    const basicROI = ((totalRecovery - investment.totalAnnualInvestment) / investment.totalAnnualInvestment) * 100;
    
    // Apply confidence multiplier based on data quality
    const currentARR = submission.current_arr || 0;
    const confidenceMultiplier = currentARR > 2000000 ? 0.85 : 
                                currentARR > 500000 ? 0.75 : 0.65;
    
    // Apply confidence adjustment and cap at realistic levels
    const adjustedROI = Math.min(basicROI * confidenceMultiplier, 150); // Cap at 150%
    
    // Categorize ROI
    let category: string;
    if (adjustedROI < 30) category = 'Moderate Return';
    else if (adjustedROI < 70) category = 'Strong Return';  
    else if (adjustedROI < 120) category = 'Excellent Return';
    else category = 'Exceptional Return';
    
    return { roi: Math.max(adjustedROI, -50), category }; // Floor at -50%
  };

  const roiData = calculateROI();
  
  // Generate chart data using unified calculations
  const generateChartData = () => {
    const data = [{ month: 'Current', recovery: 0, cumulative: 0 }];
    let cumulativeTotal = 0;
    
    for (let month = 1; month <= 12; month++) {
      let monthlyRecovery = 0;
      
      phases.forEach(phase => {
        if (month >= phase.startMonth && month <= phase.endMonth) {
          const phaseProgress = (month - phase.startMonth + 1) / (phase.endMonth - phase.startMonth + 1);
          const totalPhaseMonths = phase.endMonth - phase.startMonth + 1;
          
          // Realistic ramp-up curve
          let monthlyContribution: number;
          if (phaseProgress <= 0.3) {
            // Slow start: 15% of recovery in first 30% of timeline
            monthlyContribution = (phase.recoveryPotential * 0.15) / (totalPhaseMonths * 0.3);
          } else if (phaseProgress <= 0.8) {
            // Active period: 70% of recovery in middle 50% of timeline  
            monthlyContribution = (phase.recoveryPotential * 0.70) / (totalPhaseMonths * 0.5);
          } else {
            // Stabilization: 15% of recovery in final 20% of timeline
            monthlyContribution = (phase.recoveryPotential * 0.15) / (totalPhaseMonths * 0.2);
          }
          
          monthlyRecovery += monthlyContribution;
        }
      });
      
      cumulativeTotal += monthlyRecovery;
      data.push({
        month: `Month ${month}`,
        recovery: monthlyRecovery,
        cumulative: cumulativeTotal
      });
    }
    
    console.log('Chart data generated:', data);
    return data;
  };

  const chartData = generateChartData();
  
  // Calculate recovery percentage using unified calculations
  const recoveryPercentage = Math.min((totalRecovery / Math.max(unifiedCalcs.totalLoss, 1)) * 100, 65);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-revenue-success bg-revenue-success/10';
      case 'medium': return 'text-revenue-warning bg-revenue-warning/10';
      case 'hard': return 'text-revenue-danger bg-revenue-danger/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  // Generate milestones based on phases
  const milestones = phases.slice(0, 3).map((phase, index) => ({
    day: `Month ${phase.endMonth}`,
    title: `${phase.title} Complete`,
    description: phase.description,
    icon: index === 0 ? CheckCircle : index === 1 ? Target : TrendingUp,
    progress: Math.round(((index + 1) / Math.min(phases.length, 3)) * 100)
  }));

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
                  {phases.length}-phase revenue recovery plan with {Math.round(recoveryPercentage)}% leak recovery potential
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
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-primary/5 to-revenue-primary/10 border border-revenue-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-revenue-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Recovery Potential</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalRecovery)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {Math.round(recoveryPercentage)}% of revenue leak
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-secondary/5 to-revenue-secondary/10 border border-revenue-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-revenue-secondary" />
                    <span className="text-sm font-medium text-muted-foreground">Timeline</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {phases.length > 0 ? Math.max(...phases.map(p => p.endMonth)) : 12} months
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {phases.length} implementation phases
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-warning/5 to-revenue-warning/10 border border-revenue-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-revenue-warning" />
                    <span className="text-sm font-medium text-muted-foreground">Investment</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(investment.totalAnnualInvestment)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Annual investment required
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-success/5 to-revenue-success/10 border border-revenue-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-revenue-success" />
                    <span className="text-sm font-medium text-muted-foreground">Expected ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {Math.round(roiData.roi)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {investment.paybackMonths} month payback
                  </div>
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
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
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
                {phases.length === 0 ? (
                  <div className="p-6 text-center bg-muted/30 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      No significant optimization opportunities identified at current thresholds.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {phases.map((phase, index) => (
                      <Card key={phase.id} className="border-border/30">
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <h4 className="text-lg sm:text-xl font-semibold leading-tight">{phase.title}</h4>
                                  <Badge className={getDifficultyColor(phase.difficulty)}>
                                    {phase.difficulty}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">Month {phase.startMonth}-{phase.endMonth}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{phase.description}</p>
                              </div>
                            </div>
                            
                            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                              <div className="text-center sm:text-left">
                                <div className="text-xl sm:text-2xl font-bold text-revenue-primary mb-1">
                                  {formatCurrency(phase.recoveryPotential)}
                                </div>
                                <p className="text-sm text-muted-foreground">Recovery Potential</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h5 className="font-medium mb-3">Key Actions:</h5>
                            <ul className="space-y-2">
                              {phase.actions.map((action, actionIndex) => (
                                <li key={actionIndex} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                                  {action.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestones */}
              {milestones.length > 0 && (
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
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};
