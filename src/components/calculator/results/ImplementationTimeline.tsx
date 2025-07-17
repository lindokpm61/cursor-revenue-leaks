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
  calculatorData?: any; // Add calculator data for unified calculations
  variant?: 'condensed' | 'standard' | 'detailed' | 'competitive';
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

export const ImplementationTimeline = ({ submission, formatCurrency, validatedValues, calculatorData, variant = 'standard' }: ImplementationTimelineProps) => {
  const [isContentOpen, setIsContentOpen] = useState(variant === 'condensed' ? false : variant === 'detailed' ? true : false);

  // Use unified calculations if calculator data is available
  const getUnifiedCalculations = () => {
    if (!calculatorData) return null;
    
    const inputs: UnifiedCalculationInputs = {
      currentARR: calculatorData.companyInfo?.currentARR || submission.current_arr || 0,
      monthlyMRR: calculatorData.selfServe?.monthlyMRR || submission.monthly_mrr || 0,
      monthlyLeads: calculatorData.leadGeneration?.monthlyLeads || submission.monthly_leads || 0,
      averageDealValue: calculatorData.leadGeneration?.averageDealValue || submission.average_deal_value || 0,
      leadResponseTime: calculatorData.leadGeneration?.leadResponseTime || submission.lead_response_time || 0,
      monthlyFreeSignups: calculatorData.selfServe?.monthlyFreeSignups || submission.monthly_free_signups || 0,
      freeToLaidConversion: calculatorData.selfServe?.freeToLaidConversion || submission.free_to_paid_conversion || 0,
      failedPaymentRate: calculatorData.selfServe?.failedPaymentRate || submission.failed_payment_rate || 0,
      manualHours: calculatorData.operations?.manualHours || submission.manual_hours || 0,
      hourlyRate: calculatorData.operations?.hourlyRate || submission.hourly_rate || 0,
      industry: calculatorData.companyInfo?.industry || submission.industry
    };
    
    return calculateUnifiedResults(inputs);
  };

  const unifiedCalcs = getUnifiedCalculations();
  const realisticTimeline = unifiedCalcs ? generateRealisticTimeline(unifiedCalcs, {
    currentARR: calculatorData?.companyInfo?.currentARR || submission.current_arr || 0,
    monthlyMRR: calculatorData?.selfServe?.monthlyMRR || submission.monthly_mrr || 0,
    monthlyLeads: calculatorData?.leadGeneration?.monthlyLeads || submission.monthly_leads || 0,
    averageDealValue: calculatorData?.leadGeneration?.averageDealValue || submission.average_deal_value || 0,
    leadResponseTime: calculatorData?.leadGeneration?.leadResponseTime || submission.lead_response_time || 0,
    monthlyFreeSignups: calculatorData?.selfServe?.monthlyFreeSignups || submission.monthly_free_signups || 0,
    freeToLaidConversion: calculatorData?.selfServe?.freeToLaidConversion || submission.free_to_paid_conversion || 0,
    failedPaymentRate: calculatorData?.selfServe?.failedPaymentRate || submission.failed_payment_rate || 0,
    manualHours: calculatorData?.operations?.manualHours || submission.manual_hours || 0,
    hourlyRate: calculatorData?.operations?.hourlyRate || submission.hourly_rate || 0,
    industry: calculatorData?.companyInfo?.industry || submission.industry
  }) : null;

  const calculateTimelinePhases = (): TimelinePhase[] => {
    const currentARR = submission.current_arr || 0;
    const totalLeak = submission.total_leak || 0;
    const threshold = Math.max(currentARR * 0.005, 10000); // 0.5% ARR or $10K minimum threshold

    // Calculate actual losses for each category
    const leadResponseLoss = submission.lead_response_loss || 0;
    const selfServeLoss = submission.selfserve_gap_loss || 0;
    const processLoss = submission.process_inefficiency_loss || 0;
    const paymentLoss = submission.failed_payment_loss || 0;

    // Create potential phases with realistic recovery rates and timelines
    const potentialPhases = [];

    // Lead Response Phase (Phase 1 - Quick Wins)
    if (leadResponseLoss > threshold) {
      potentialPhases.push({
        type: 'lead_response',
        title: "Lead Response Optimization",
        description: "Response automation and lead capture improvements with 3-month ramp-up",
        recovery: Math.min(leadResponseLoss * 0.45, Math.min(currentARR * 0.12, totalLeak * 0.25)), // More conservative
        difficulty: "Easy" as const,
        months: "Month 1-3",
        rampUpMonths: 2, // No immediate recovery
        actions: [
          "Audit current response processes",
          "Implement lead response automation",
          "Set up notification systems", 
          "Deploy lead scoring system",
          "Train response team",
          "Monitor and optimize"
        ]
      });
    }

    // Self-Serve Phase (Phase 2 - Dependent on Phase 1)
    if (selfServeLoss > threshold) {
      potentialPhases.push({
        type: 'self_serve',
        title: "Self-Serve Optimization",
        description: "Conversion rate improvements and onboarding optimization over 4 months",
        recovery: Math.min(selfServeLoss * 0.35, Math.min(currentARR * 0.15, totalLeak * 0.30)), // More conservative
        difficulty: "Medium" as const,
        months: "Month 4-7",
        rampUpMonths: 2,
        dependency: 'lead_response', // Can't start until lead response is optimized
        actions: [
          "Analyze conversion funnel",
          "Optimize onboarding flow",
          "Implement conversion tracking",
          "A/B test pricing pages",
          "Deploy in-app guidance",
          "Measure and iterate"
        ]
      });
    }

    // Process Automation Phase (Phase 3 - Complex)
    if (processLoss > threshold) {
      potentialPhases.push({
        type: 'process_automation',
        title: "Process Automation",
        description: "Advanced automation and manual process elimination over 6 months",
        recovery: Math.min(processLoss * 0.50, Math.min(currentARR * 0.18, totalLeak * 0.25)), // More conservative
        difficulty: "Medium-Hard" as const,
        months: "Month 6-11",
        rampUpMonths: 3, // Longer ramp-up for complex changes
        dependency: 'self_serve',
        actions: [
          "Process audit and mapping",
          "Design automation workflows",
          "Deploy workflow automation",
          "Eliminate manual processes",
          "Implement advanced analytics",
          "Optimize resource allocation",
          "Train team on new processes"
        ]
      });
    }

    // Payment Recovery Phase (can run parallel to others)
    if (paymentLoss > threshold) {
      potentialPhases.push({
        type: 'payment_recovery',
        title: "Payment Recovery System", 
        description: "Payment failure reduction and retry logic optimization",
        recovery: Math.min(paymentLoss * 0.35, Math.min(currentARR * 0.06, totalLeak * 0.15)), // More conservative
        difficulty: "Medium" as const,
        months: "Month 3-5",
        rampUpMonths: 1,
        actions: [
          "Analyze payment failure patterns",
          "Implement payment retry logic",
          "Add multiple payment methods",
          "Deploy dunning management",
          "Optimize payment flows"
        ]
      });
    }

    // Sort by recovery potential and impact, but respect dependencies
    potentialPhases.sort((a, b) => b.recovery - a.recovery);
    
    // Ensure we don't exceed 60% of total leak in total recovery
    const maxTotalRecovery = Math.min(totalLeak * 0.60, currentARR * 0.30);
    let runningTotal = 0;
    const selectedPhases = [];
    
    for (const phase of potentialPhases) {
      if (runningTotal + phase.recovery <= maxTotalRecovery && selectedPhases.length < 3) {
        selectedPhases.push(phase);
        runningTotal += phase.recovery;
      }
    }

    // Convert to timeline phases with proper sequencing
    const phases: TimelinePhase[] = selectedPhases.map((phase, index) => {
      // Adjust months based on dependencies
      let monthsText = phase.months;
      if (phase.dependency && selectedPhases.find(p => p.type === phase.dependency)) {
        // Delay dependent phases
        monthsText = phase.months;
      }
      
      return {
        phase: (index + 1).toString(),
        months: monthsText,
        title: phase.title,
        description: phase.description,
        recovery: phase.recovery,
        difficulty: phase.difficulty,
        actions: phase.actions,
        cumulativeRecovery: 0,
        roiPercentage: 0
      };
    });

    // If no significant phases found, provide realistic default
    if (phases.length === 0) {
      const conservativeRecovery = Math.min(
        Math.max(leadResponseLoss, selfServeLoss, processLoss) * 0.20,
        currentARR * 0.08,
        totalLeak * 0.15
      );
      
      phases.push({
        phase: "1",
        months: "Month 1-9",
        title: "Incremental Optimization",
        description: "Conservative improvements across key business areas with gradual implementation",
        recovery: conservativeRecovery,
        difficulty: "Easy",
        actions: [
          "Audit current processes",
          "Identify quick wins",
          "Implement basic improvements",
          "Monitor and optimize",
          "Iterate based on results"
        ],
        cumulativeRecovery: 0,
        roiPercentage: 0
      });
    }

    // Calculate realistic investment and ROI using improved calculations
    let totalInvestment = 0;
    let totalAnnualInvestment = 0;
    let paybackMonths = 24;
    
    if (phases.length > 0) {
      // Activity-based investment calculation
      let implementationCost = 0;
      let ongoingCost = 0;
      
      phases.forEach(phase => {
        const complexity = phase.difficulty === 'Easy' ? 1 : 
                          phase.difficulty === 'Medium' ? 1.5 : 2;
        const basePhaseTime = 3; // months
        const costPerMonth = Math.min(8000 + (currentARR * 0.002), 25000);
        
        implementationCost += costPerMonth * basePhaseTime * complexity;
        ongoingCost += costPerMonth * 0.2 * complexity; // 20% ongoing
      });
      
      totalInvestment = implementationCost;
      totalAnnualInvestment = (implementationCost / 3) + ongoingCost; // Amortize over 3 years
      
      // Calculate payback period
      const totalRecovery = phases.reduce((sum, phase) => sum + phase.recovery, 0);
      paybackMonths = totalRecovery > 0 ? Math.ceil(totalInvestment / (totalRecovery / 12)) : 36;
      paybackMonths = Math.min(paybackMonths, 36); // Cap at 3 years
    }

    // Calculate cumulative recovery with proper ROI calculations
    let cumulative = 0;
    phases.forEach((phase, index) => {
      cumulative += phase.recovery;
      phase.cumulativeRecovery = cumulative;
      
      // Calculate proper annual ROI: ((Annual Recovery - Annual Investment) / Annual Investment) * 100
      if (totalAnnualInvestment > 0) {
        const annualROI = ((cumulative - totalAnnualInvestment) / totalAnnualInvestment) * 100;
        // Apply confidence reduction and cap at realistic levels
        const confidenceMultiplier = currentARR > 1000000 ? 1.0 : 
                                    currentARR > 500000 ? 0.85 : 0.7;
        phase.roiPercentage = Math.min(Math.max(annualROI * confidenceMultiplier, -100), 200);
      } else {
        phase.roiPercentage = 0;
      }
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

  // Use realistic timeline if available, otherwise fallback to legacy calculation
  const legacyPhases = calculateTimelinePhases();
  const phases = realisticTimeline || legacyPhases;
  
  // Calculate investment and ROI using unified calculations
  let totalInvestment = 0;
  let totalAnnualInvestment = 0;
  let paybackMonths = 24;
  
  if (unifiedCalcs && realisticTimeline) {
    const { calculateRealisticInvestment, calculateRealisticROI } = require('@/lib/calculator/unifiedCalculations');
    const investmentCalc = calculateRealisticInvestment(realisticTimeline, {
      currentARR: calculatorData?.companyInfo?.currentARR || submission.current_arr || 0,
      monthlyMRR: calculatorData?.selfServe?.monthlyMRR || submission.monthly_mrr || 0,
      monthlyLeads: calculatorData?.leadGeneration?.monthlyLeads || submission.monthly_leads || 0,
      averageDealValue: calculatorData?.leadGeneration?.averageDealValue || submission.average_deal_value || 0,
      leadResponseTime: calculatorData?.leadGeneration?.leadResponseTime || submission.lead_response_time || 0,
      monthlyFreeSignups: calculatorData?.selfServe?.monthlyFreeSignups || submission.monthly_free_signups || 0,
      freeToLaidConversion: calculatorData?.selfServe?.freeToLaidConversion || submission.free_to_paid_conversion || 0,
      failedPaymentRate: calculatorData?.selfServe?.failedPaymentRate || submission.failed_payment_rate || 0,
      manualHours: calculatorData?.operations?.manualHours || submission.manual_hours || 0,
      hourlyRate: calculatorData?.operations?.hourlyRate || submission.hourly_rate || 0,
      industry: calculatorData?.companyInfo?.industry || submission.industry
    });
    
    totalInvestment = investmentCalc.implementationCost;
    totalAnnualInvestment = investmentCalc.totalAnnualInvestment;
    paybackMonths = investmentCalc.paybackMonths;
  }
  
  // Calculate total recovery appropriately based on phase type
  const totalRecovery = unifiedCalcs ? unifiedCalcs.recovery85Percent : 
    (legacyPhases.length > 0 ? legacyPhases[legacyPhases.length - 1].cumulativeRecovery : 0);
  
  const totalLeak = unifiedCalcs ? unifiedCalcs.totalLoss : (validatedValues ? validatedValues.totalLeak : (submission.total_leak || 1));
  const currentARR = submission.current_arr || 0;
  
  // More conservative recovery percentage calculation
  const maxRecoveryPercentage = unifiedCalcs?.confidenceLevel === 'high' ? 65 : 
                                unifiedCalcs?.confidenceLevel === 'medium' ? 50 : 40;
  const recoveryPercentage = Math.min((totalRecovery / Math.max(totalLeak, 1)) * 100, maxRecoveryPercentage);
  
  const confidenceLevel = getCalculationConfidenceLevel({
    currentARR: submission.current_arr || 0,
    monthlyLeads: submission.monthly_leads || 0,
    monthlyFreeSignups: submission.monthly_free_signups || 0,
    totalLeak: submission.total_leak || 0
  });

  // Chart data with realistic ramp-up and proper recovery distribution
  const chartData = realisticTimeline ? 
    // Generate chart data from realistic timeline with proper ramp-up curves
    (() => {
      const data = [{ month: 'Current', recovery: 0, cumulative: 0 }];
      let cumulativeTotal = 0;
      
      // Generate 12 months of data
      for (let month = 1; month <= 12; month++) {
        let monthlyRecovery = 0;
        
        realisticTimeline.forEach(phase => {
          if (month >= phase.startMonth && month <= phase.endMonth) {
            const phaseProgress = (month - phase.startMonth + 1) / (phase.endMonth - phase.startMonth + 1);
            const totalPhaseMonths = phase.endMonth - phase.startMonth + 1;
            
            // Realistic ramp-up curve: slower start, faster middle, stabilizing end
            let monthlyContribution: number;
            if (phaseProgress <= 0.3) {
              // Ramp-up period: 20% of recovery in first 30% of timeline
              monthlyContribution = (phase.recoveryPotential * 0.2) / (totalPhaseMonths * 0.3);
            } else if (phaseProgress <= 0.8) {
              // Active period: 70% of recovery in middle 50% of timeline
              monthlyContribution = (phase.recoveryPotential * 0.7) / (totalPhaseMonths * 0.5);
            } else {
              // Stabilization: 10% of recovery in final 20% of timeline
              monthlyContribution = (phase.recoveryPotential * 0.1) / (totalPhaseMonths * 0.2);
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
      
      return data;
    })() :
    // Improved chart data for legacy timeline phases
    (() => {
      const data = [{ month: 'Current', recovery: 0, cumulative: 0 }];
      let cumulativeTotal = 0;
      
      // Generate 12 months with realistic distribution
      for (let month = 1; month <= 12; month++) {
        let monthlyRecovery = 0;
        
        legacyPhases.forEach((phase, phaseIndex) => {
          const phaseStartMonth = phaseIndex * 4 + 1; // Phases start at month 1, 5, 9
          const phaseEndMonth = phaseStartMonth + 3; // Each phase is 4 months
          
          if (month >= phaseStartMonth && month <= phaseEndMonth) {
            const monthInPhase = month - phaseStartMonth + 1;
            
            // Realistic recovery curve within each phase
            if (monthInPhase === 1) {
              monthlyRecovery += phase.recovery * 0.05; // 5% in month 1 (setup)
            } else if (monthInPhase === 2) {
              monthlyRecovery += phase.recovery * 0.25; // 25% in month 2 (early results)
            } else if (monthInPhase === 3) {
              monthlyRecovery += phase.recovery * 0.45; // 45% in month 3 (full effect)
            } else {
              monthlyRecovery += phase.recovery * 0.25; // 25% in month 4 (optimization)
            }
          }
        });
        
        cumulativeTotal += monthlyRecovery;
        data.push({
          month: `Month ${month}`,
          recovery: monthlyRecovery,
          cumulative: cumulativeTotal
        });
      }
      
      return data;
    })();

  const milestones = realisticTimeline ?
    // Generate milestones from realistic timeline
    realisticTimeline.map((phase, index) => ({
      day: `Month ${phase.endMonth}`,
      title: `${phase.title} Complete`,
      description: phase.description,
      icon: index === 0 ? CheckCircle : index === 1 ? Target : TrendingUp,
      progress: ((index + 1) / realisticTimeline.length) * 100
    })) :
    // Fallback milestones
    [
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
                  {realisticTimeline ? 
                    `${realisticTimeline.length}-phase revenue recovery plan with ${Math.round(recoveryPercentage)}% leak recovery potential` :
                    `Month-by-month revenue recovery plan with ${Math.round(recoveryPercentage)}% leak recovery potential`
                  }
                  {unifiedCalcs?.confidenceLevel === 'low' && (
                    <span className="text-revenue-warning"> • Low confidence estimates</span>
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
              {unifiedCalcs?.confidenceLevel === 'low' && (
                <div className="flex items-center gap-2 p-3 bg-revenue-warning/10 border border-revenue-warning/20 rounded-lg mb-4">
                  <AlertTriangle className="h-4 w-4 text-revenue-warning" />
                  <p className="text-sm text-muted-foreground">
                    Timeline estimates have low confidence due to limited data. Consider these as directional guidance.
                  </p>
                </div>
              )}
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
                    {unifiedCalcs?.confidenceLevel === 'low' && (
                      <span className="text-revenue-warning"> • Low confidence</span>
                    )}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-secondary/5 to-revenue-secondary/10 border border-revenue-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-revenue-secondary" />
                    <span className="text-sm font-medium text-muted-foreground">Timeline</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {realisticTimeline ? `${Math.max(...realisticTimeline.map(p => p.endMonth))}` : '12'} months
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {realisticTimeline ? realisticTimeline.length : phases.length} implementation phases
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-warning/5 to-revenue-warning/10 border border-revenue-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-revenue-warning" />
                    <span className="text-sm font-medium text-muted-foreground">Investment</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalAnnualInvestment || totalInvestment / 3)}
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
                    {phases.length > 0 ? 
                      ('roiPercentage' in phases[phases.length - 1] ? 
                        Math.round((phases[phases.length - 1] as TimelinePhase).roiPercentage) : 
                        Math.round(((totalRecovery - totalAnnualInvestment) / Math.max(totalAnnualInvestment, 1)) * 100)
                      ) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {paybackMonths} month payback period
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
                  {(realisticTimeline || legacyPhases).map((phase, index) => {
                    // Handle both phase types
                    const isLegacyPhase = 'phase' in phase;
                    const phaseKey = isLegacyPhase ? phase.phase : phase.id;
                    const phaseNumber = isLegacyPhase ? phase.phase : (index + 1).toString();
                    const phaseTitle = phase.title;
                    const phaseDescription = phase.description;
                    const phaseRecovery = isLegacyPhase ? phase.recovery : phase.recoveryPotential;
                    const phaseDifficulty = isLegacyPhase ? phase.difficulty : phase.difficulty;
                    const phaseMonths = isLegacyPhase ? phase.months : `Month ${phase.startMonth}-${phase.endMonth}`;
                    const phaseActions = isLegacyPhase ? phase.actions : phase.actions.map(a => a.title);
                    
                    return (
                    <Card key={phaseKey} className="border-border/30">
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-4">
                          {/* Header section with phase number and title */}
                           <div className="flex items-start gap-3 sm:gap-4">
                             <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
                               {phaseNumber}
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                 <h4 className="text-lg sm:text-xl font-semibold leading-tight">{phaseTitle}</h4>
                                 <Badge className={getDifficultyColor(phaseDifficulty)}>
                                   {phaseDifficulty}
                                 </Badge>
                               </div>
                               <p className="text-sm text-muted-foreground mb-1">{phaseMonths}</p>
                               <p className="text-sm text-muted-foreground leading-relaxed">{phaseDescription}</p>
                             </div>
                           </div>
                           
                           {/* Recovery potential - mobile optimized */}
                           <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                             <div className="text-center sm:text-left">
                               <div className="text-xl sm:text-2xl font-bold text-revenue-primary mb-1">
                                 {formatCurrency(phaseRecovery)}
                               </div>
                               <p className="text-sm text-muted-foreground">Recovery Potential</p>
                             </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                             <h5 className="font-medium mb-3">Key Actions:</h5>
                             <ul className="space-y-2">
                               {phaseActions.map((action, actionIndex) => (
                                 <li key={actionIndex} className="flex items-center gap-2 text-sm">
                                   <CheckCircle className="h-4 w-4 text-revenue-success" />
                                   {action}
                                 </li>
                               ))}
                             </ul>
                           </div>
                           
                           {isLegacyPhase && (
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
                           )}
                         </div>
                       </CardContent>
                     </Card>
                    );
                  })}
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