
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { ActionPlanChecklistItem } from "./ActionPlanChecklistItem";
import { BlurOverlay } from "@/components/ui/blur-overlay";
import type { TimelinePhase } from "@/lib/calculator/unifiedCalculations";

interface ActionPlanTimelineProps {
  phases: TimelinePhase[];
  totalRecovery: number;
  totalInvestment: number;
  paybackMonths: number;
  formatCurrency: (amount: number) => string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export const ActionPlanTimeline = ({
  phases = [],
  totalRecovery,
  totalInvestment,
  paybackMonths,
  formatCurrency,
  confidenceLevel
}: ActionPlanTimelineProps) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(phases.length > 0 ? [phases[0].id] : []));
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const handleActionToggle = (actionId: string, completed: boolean) => {
    const newCompleted = new Set(completedActions);
    if (completed) {
      newCompleted.add(actionId);
    } else {
      newCompleted.delete(actionId);
    }
    setCompletedActions(newCompleted);
  };

  const getPhaseProgress = (phase: TimelinePhase) => {
    const actions = phase.actions || [];
    const totalActions = actions.length;
    const completedInPhase = actions.filter(action => 
      completedActions.has(`${phase.id}-${action.title}`)
    ).length;
    return totalActions > 0 ? (completedInPhase / totalActions) * 100 : 0;
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevel = (difficulty: string): 'low' | 'medium' | 'high' => {
    switch (difficulty) {
      case 'easy': return 'low';
      case 'medium': return 'medium';
      case 'hard': return 'high';
      default: return 'medium';
    }
  };

  // Calculate cumulative recovery over time
  const cumulativeRecovery = phases.reduce((acc, phase, index) => {
    const previous = index > 0 ? acc[index - 1].cumulative : 0;
    const current = previous + phase.recoveryPotential;
    acc.push({
      month: phase.endMonth,
      phase: phase.title,
      monthly: phase.recoveryPotential,
      cumulative: current
    });
    return acc;
  }, [] as Array<{ month: number; phase: string; monthly: number; cumulative: number }>);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Optimization Timeline & Growth Plan
          </CardTitle>
          <Badge className={getConfidenceColor(confidenceLevel)}>
            {confidenceLevel} confidence
          </Badge>
        </div>
        
        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Growth Potential</span>
            </div>
            <p className="text-lg font-bold text-green-900">{formatCurrency(totalRecovery)}</p>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Investment Needed</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(totalInvestment)}</p>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">ROI Timeline</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{paybackMonths} months</p>
          </div>
        </div>

        {/* Cumulative Recovery Visualization */}
        <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <h4 className="font-medium text-foreground mb-3">Progressive Growth Timeline</h4>
          <div className="space-y-2">
            {cumulativeRecovery.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Month {milestone.month}: {milestone.phase}</span>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-medium">+{formatCurrency(milestone.monthly)}</span>
                  <span className="text-muted-foreground">
                    (Total: {formatCurrency(milestone.cumulative)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* No Phases Message */}
        {phases.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Optimization Phases</h3>
            <p className="text-muted-foreground">
              Based on your current data, we've identified excellent optimization opportunities that require a custom strategy approach.
            </p>
          </div>
        )}

        {/* Phase Overview - SHOW WHAT TO DO */}
        {phases.map((phase, index) => {
          const isExpanded = expandedPhases.has(phase.id);
          const progress = getPhaseProgress(phase);
          const isCurrentPhase = index === 0;
          
          return (
            <div key={phase.id} className="space-y-4">
              <div 
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isCurrentPhase 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-background hover:bg-muted/50'
                }`}
                onClick={() => togglePhase(phase.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCurrentPhase 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{phase.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Months {phase.startMonth}-{phase.endMonth} • {(phase.actions || []).length} strategic actions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        {formatCurrency(phase.recoveryPotential)}
                      </p>
                      <p className="text-xs text-muted-foreground">growth potential</p>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Strategic Focus</span>
                    <span className="text-muted-foreground">{phase.difficulty} implementation</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <p className="text-sm text-muted-foreground mt-2">{phase.description}</p>
              </div>

              {/* Expanded Phase Overview - Show direction without details */}
              {isExpanded && (
                <div className="ml-6 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {phase.difficulty === 'easy' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {phase.difficulty === 'medium' && <Clock className="h-4 w-4 text-yellow-600" />}
                    {phase.difficulty === 'hard' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    <span>Strategic Priority: {phase.difficulty}</span>
                    {(phase.prerequisites || []).length > 0 && (
                      <span className="ml-4">
                        Dependencies: {(phase.prerequisites || []).length} items
                      </span>
                    )}
                  </div>

                  {/* Key Focus Areas - Show what, not how */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Strategic Focus Areas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(phase.actions || []).slice(0, 2).map((action, actionIndex) => (
                        <div key={actionIndex} className="p-3 border border-border/50 rounded-lg bg-background/50">
                          <div className="font-medium text-sm text-foreground">{action.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {action.weeks} week focus • Led by {action.owner}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {(phase.actions || []).length > 2 && (
                      <p className="text-sm text-muted-foreground italic">
                        +{(phase.actions || []).length - 2} additional strategic initiatives included
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Detailed Implementation - BLUR THE HOW */}
        <BlurOverlay 
          title="Get Detailed Implementation Roadmap"
          description="Access step-by-step execution plans, resource requirements, risk mitigation strategies, and success metrics"
          ctaText="Book Implementation Strategy Session"
          onUnlock={() => window.open('https://calendly.com/strategy-session', '_blank')}
          blurLevel="medium"
        >
          <div className="p-6 bg-muted/20 rounded-xl border space-y-6">
            <h4 className="text-lg font-semibold text-foreground">Detailed Implementation Checklist</h4>
            
            {phases.map((phase, phaseIndex) => (
              <div key={phase.id} className="border-l-2 border-primary/30 pl-4">
                <h5 className="font-medium text-foreground mb-3">
                  Phase {phaseIndex + 1}: {phase.title} - Detailed Actions
                </h5>
                <div className="space-y-2">
                  {(phase.actions || []).map((action, actionIndex) => (
                    <ActionPlanChecklistItem
                      key={actionIndex}
                      id={`${phase.id}-${action.title}`}
                      title={action.title}
                      description={`${action.weeks} week implementation • Owner: ${action.owner} • Detailed workflow provided`}
                      weeks={action.weeks}
                      owner={action.owner}
                      recoveryPotential={phase.recoveryPotential / Math.max((phase.actions || []).length, 1)}
                      difficulty={phase.difficulty}
                      riskLevel={getRiskLevel(phase.difficulty)}
                      prerequisites={phase.prerequisites || []}
                      isCompleted={completedActions.has(`${phase.id}-${action.title}`)}
                      onToggle={handleActionToggle}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-background/50 rounded">
                    <div className="font-medium">Risk Factors</div>
                    <div className="text-muted-foreground">Identified & mitigated</div>
                  </div>
                  <div className="p-2 bg-background/50 rounded">
                    <div className="font-medium">Resource Requirements</div>
                    <div className="text-muted-foreground">Detailed breakdown</div>
                  </div>
                  <div className="p-2 bg-background/50 rounded">
                    <div className="font-medium">Success Metrics</div>
                    <div className="text-muted-foreground">KPI tracking plan</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Implementation Support Framework */}
            <div className="mt-6 p-4 bg-background/50 rounded-lg">
              <h5 className="font-medium text-foreground mb-2">Implementation Support Framework</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-1">Change Management Protocol</div>
                  <div className="text-muted-foreground">Team training, communication plans, adoption strategies</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Quality Assurance Process</div>
                  <div className="text-muted-foreground">Testing procedures, validation checkpoints, rollback plans</div>
                </div>
              </div>
            </div>
          </div>
        </BlurOverlay>

        {/* ROI Analysis - Show impact, blur detailed metrics */}
        <div className="relative">
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Growth ROI Summary</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Year 1 ROI</div>
                <div className="text-lg font-bold text-green-700">
                  {Math.round(((totalRecovery - totalInvestment) / totalInvestment) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Break-even Timeline</div>
                <div className="text-lg font-bold text-blue-700">Month {paybackMonths}</div>
              </div>
              <div className="text-sm text-gray-600 opacity-60">Net Benefit Analysis</div>
              <div className="text-sm text-gray-600 opacity-60">Risk Assessment</div>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-sm text-muted-foreground">
                Complete financial analysis and risk modeling available in strategy consultation
              </p>
            </div>
          </div>
        </div>

        {/* Implementation Guidance */}
        {confidenceLevel === 'low' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800">Strategic Implementation Guidance</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  Conservative estimates suggest validating assumptions and starting with pilot programs. 
                  Strategy consultation recommended for optimal implementation approach.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
