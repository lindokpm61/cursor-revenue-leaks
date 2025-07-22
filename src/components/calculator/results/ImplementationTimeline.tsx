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
  AlertTriangle,
  Siren,
  Timer
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { UnifiedResultsService, type SubmissionData } from '@/lib/results/UnifiedResultsService';

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
  const [isContentOpen, setIsContentOpen] = useState(true);

  // Transform submission to SubmissionData format for UnifiedResultsService
  const submissionData: SubmissionData = {
    id: submission.temp_id || '',
    company_name: submission.company_name || '',
    contact_email: submission.email || '',
    industry: submission.industry,
    current_arr: submission.current_arr || 0,
    monthly_leads: submission.monthly_leads || 0,
    average_deal_value: submission.average_deal_value || 0,
    lead_response_time: submission.lead_response_time || 0,
    monthly_free_signups: submission.monthly_free_signups || 0,
    free_to_paid_conversion: submission.free_to_paid_conversion || 0,
    monthly_mrr: submission.monthly_mrr || 0,
    failed_payment_rate: submission.failed_payment_rate || 0,
    manual_hours: submission.manual_hours || 0,
    hourly_rate: submission.hourly_rate || 0,
    lead_score: submission.lead_score || 50,
    user_id: submission.converted_to_user_id,
    created_at: submission.created_at || new Date().toISOString()
  };

  // Use unified calculations consistently
  const unifiedCalcs = UnifiedResultsService.calculateResults(submissionData);
  
  // Generate realistic timeline phases using unified calculations
  const generateTimelinePhases = (): TimelinePhase[] => {
    const currentARR = submissionData.current_arr;
    
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
        title: 'Lead Response Optimization Initiative',
        description: 'Strategic implementation of automated response systems to maximize lead conversion',
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
        title: 'Conversion Optimization Strategy',
        description: 'Strategic onboarding improvements to enhance conversion rates',
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
        title: 'Payment Recovery Enhancement',
        description: 'Strategic payment system improvements to maximize revenue retention',
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
        title: 'Process Automation Initiative',
        description: 'Strategic automation implementation to optimize operational efficiency',
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
    const baseInvestment = Math.min(Math.max(15000, (submissionData.current_arr || 0) * 0.003), 35000);
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
    const currentARR = submissionData.current_arr || 0;
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
      case 'easy': return 'text-revenue-success bg-revenue-success/10 border-revenue-success/20';
      case 'medium': return 'text-orange-600 bg-orange-500/10 border-orange-500/20';
      case 'hard': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
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
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-growth">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl text-primary flex items-center gap-2">
                  STRATEGIC REVENUE OPTIMIZATION ROADMAP
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">COMPREHENSIVE</Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {phases.length}-phase strategic implementation • Capture {Math.round(recoveryPercentage)}% of revenue opportunity systematically
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
              {/* Critical Revenue Bleeding Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 border-2 border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Strategic Recovery</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(totalRecovery)}
                  </div>
                  <div className="text-sm text-primary mt-1">
                    Capture {Math.round(recoveryPercentage)}% of opportunity
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Daily savings: {formatCurrency(totalRecovery / 365)}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-500/20 border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="h-5 w-5 text-revenue-growth" />
                    <span className="text-sm font-medium text-muted-foreground">Implementation Timeline</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {phases.length > 0 ? Math.max(...phases.map(p => p.endMonth)) : 12} months
                  </div>
                  <div className="text-sm text-orange-600 mt-1">
                    {phases.length} critical phases
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    First results: Month 2-3
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-primary/10 to-revenue-primary/20 border border-revenue-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-revenue-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Strategic Investment</span>
                  </div>
                  <div className="text-2xl font-bold text-revenue-primary">
                    {formatCurrency(investment.totalAnnualInvestment)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Strategic implementation cost
                  </div>
                  <div className="text-xs text-revenue-success mt-1">
                    vs. opportunity: {formatCurrency((unifiedCalcs.totalLoss || 0) - investment.totalAnnualInvestment)}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-success/10 to-revenue-success/20 border border-revenue-success/30">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-revenue-success" />
                    <span className="text-sm font-medium text-muted-foreground">Recovery ROI</span>
                  </div>
                  <div className="text-2xl font-bold text-revenue-success">
                    {Math.round(roiData.roi)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {investment.paybackMonths} month break-even
                  </div>
                  <div className="text-xs text-revenue-success mt-1">
                    Cost of inaction: {formatCurrency(unifiedCalcs.totalLoss || 0)}
                  </div>
                </div>
              </div>

              {/* Emergency Recovery Timeline Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                  <Target className="h-5 w-5" />
                  Strategic Revenue Optimization Timeline
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">OPPORTUNITY CAPTURE</Badge>
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Revenue Opportunity Captured']}
                        labelFormatter={(label) => `Strategic Timeline: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary)/0.2)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Implementation Phases with Strategic Blur Overlay */}
              <div className="relative min-h-[600px]">
                <div>
                  <h3 className="text-lg font-semibold mb-6 text-primary">🎯 Strategic Implementation Phases</h3>
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

                {/* Strategic Implementation Plan Overlay */}
                <div className="absolute inset-0 bg-background/85 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 border border-border/50">
                  <div className="text-center p-8 max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      Complete Implementation Strategy Available
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Access your detailed strategic roadmap with phase-by-phase execution plans, resource requirements, and success metrics.
                    </p>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Get Complete Strategy
                    </Button>
                  </div>
                </div>
              </div>

              {/* Milestones with Strategic Blur Overlay */}
              {milestones.length > 0 && (
                <div className="relative min-h-[400px]">
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

                  {/* Strategic Implementation Plan Overlay */}
                  <div className="absolute inset-0 bg-background/85 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 border border-border/50">
                    <div className="text-center p-8 max-w-lg mx-auto">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-primary mb-2">
                        Detailed Implementation Roadmap Available
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Get your step-by-step implementation guide with timelines, resource allocation, and milestone tracking for optimal revenue recovery.
                      </p>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Get Implementation Plan
                      </Button>
                    </div>
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
