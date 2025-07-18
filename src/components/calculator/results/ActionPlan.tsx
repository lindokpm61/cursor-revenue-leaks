
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Calculations } from "../useCalculatorData";
import { calculateUnifiedResults, generateRealisticTimeline, UnifiedCalculationInputs } from "@/lib/calculator/unifiedCalculations";

interface ActionPlanProps {
  calculations: Calculations;
  data?: any; // Calculator data for enhanced calculations
}

export const ActionPlan = ({ calculations, data }: ActionPlanProps) => {
  // Use unified calculations if data is available
  let unifiedResults = null;
  let timeline = null;
  
  if (data) {
    const inputs: UnifiedCalculationInputs = {
      currentARR: data.calculator_data?.companyInfo?.currentARR || 0,
      monthlyMRR: data.calculator_data?.selfServe?.monthlyMRR || 0,
      monthlyLeads: data.calculator_data?.leadGeneration?.monthlyLeads || 0,
      averageDealValue: data.calculator_data?.leadGeneration?.averageDealValue || 0,
      leadResponseTime: data.calculator_data?.leadGeneration?.leadResponseTime || 0,
      monthlyFreeSignups: data.calculator_data?.selfServe?.monthlyFreeSignups || 0,
      freeToLaidConversion: data.calculator_data?.selfServe?.freeToLaidConversion || 0,
      failedPaymentRate: data.calculator_data?.selfServe?.failedPaymentRate || 0,
      manualHours: data.calculator_data?.operations?.manualHours || 0,
      hourlyRate: data.calculator_data?.operations?.hourlyRate || 0,
      industry: data.calculator_data?.companyInfo?.industry || data.industry
    };
    
    console.log("ActionPlan component - calculating with inputs:", inputs);
    unifiedResults = calculateUnifiedResults(inputs);
    timeline = generateRealisticTimeline(unifiedResults, inputs);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  // Add debug output
  console.log("ActionPlan rendering with:", {
    unifiedResults: unifiedResults ? {
      leadResponseLoss: unifiedResults.leadResponseLoss,
      failedPaymentLoss: unifiedResults.failedPaymentLoss,
      selfServeGap: unifiedResults.selfServeGap,
      processInefficiency: unifiedResults.processInefficiency,
      actionSpecificRecovery: unifiedResults.actionSpecificRecovery,
      confidence: unifiedResults.confidenceLevel
    } : 'None',
    calculationsInput: {
      leadResponseLoss: calculations.leadResponseLoss,
      failedPaymentLoss: calculations.failedPaymentLoss,
      selfServeGap: calculations.selfServeGap,
      processLoss: calculations.processLoss
    },
    topPriority
  });

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Strategic Action Plan
        </CardTitle>
        {unifiedResults?.confidenceLevel === 'low' && (
          <div className="flex items-center gap-2 text-sm text-orange-600 mt-2">
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
                <span className="font-semibold text-foreground">Top Priority Focus</span>
              </div>
              <p className="text-lg font-medium text-primary">{topPriority.name}</p>
              <p className="text-sm text-muted-foreground">
                Recovery potential: {formatCurrency(topPriority.value)}
              </p>
            </div>

            {/* Timeline Phases */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Implementation Timeline</h4>
              <div className="space-y-4">
                {timeline.map((phase, index) => (
                  <div key={phase.id} className="border rounded-lg p-4 bg-background">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {index + 1}
                          </div>
                          <h5 className="font-medium text-foreground">{phase.title}</h5>
                          <Badge className={getDifficultyColor(phase.difficulty)}>
                            {phase.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Months {phase.startMonth}-{phase.endMonth}
                          </span>
                          <span className="font-medium text-primary">
                            {formatCurrency(phase.recoveryPotential)} recovery
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions List */}
                    <div className="mt-3 space-y-2">
                      <h6 className="text-sm font-medium">Key Actions:</h6>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {phase.actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="text-sm text-muted-foreground">
                            • {action.title} ({action.weeks}w, {action.owner})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {unifiedResults?.bounds?.warningFlags && unifiedResults.bounds.warningFlags.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h6 className="font-medium text-yellow-800 mb-2">Calculation Notes:</h6>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {unifiedResults.bounds.warningFlags.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          // Fallback to static plan
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Quick Wins (0-60 days)</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Implement automated lead response system</li>
                <li>• Set up failed payment recovery workflows</li>
                <li>• Review and optimize onboarding flow</li>
                <li>• Automate most time-consuming manual tasks</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Long-term Impact (3-8 months)</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Advanced lead scoring and qualification</li>
                <li>• Predictive churn prevention</li>
                <li>• Self-serve optimization program</li>
                <li>• Complete process automation suite</li>
              </ul>
            </div>
            
            <div className="md:col-span-2 mt-6 p-4 bg-background rounded-lg border">
              <p className="text-sm font-medium text-foreground mb-2">
                💡 Priority Focus: {topPriority.name}
              </p>
              <p className="text-xs text-muted-foreground">
                This area represents your largest revenue leak and should be addressed first for maximum impact.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
