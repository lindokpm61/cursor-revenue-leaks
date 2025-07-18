
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
  phases,
  totalRecovery,
  totalInvestment,
  paybackMonths,
  formatCurrency,
  confidenceLevel
}: ActionPlanTimelineProps) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set([phases[0]?.id]));
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
    const totalActions = phase.actions.length;
    const completedInPhase = phase.actions.filter(action => 
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
            Implementation Timeline & Recovery Plan
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
              <span className="text-sm font-medium">Total Recovery</span>
            </div>
            <p className="text-lg font-bold text-green-900">{formatCurrency(totalRecovery)}</p>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Investment Required</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{formatCurrency(totalInvestment)}</p>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Payback Period</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{paybackMonths} months</p>
          </div>
        </div>

        {/* Cumulative Recovery Visualization */}
        <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <h4 className="font-medium text-foreground mb-3">Progressive Recovery Timeline</h4>
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
        {/* Phases */}
        {phases.map((phase, index) => {
          const isExpanded = expandedPhases.has(phase.id);
          const progress = getPhaseProgress(phase);
          const isCurrentPhase = index === 0; // Simplified current phase logic
          
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
                        Months {phase.startMonth}-{phase.endMonth} • {phase.actions.length} actions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        {formatCurrency(phase.recoveryPotential)}
                      </p>
                      <p className="text-xs text-muted-foreground">recovery potential</p>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Phase Progress</span>
                    <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <p className="text-sm text-muted-foreground mt-2">{phase.description}</p>
              </div>

              {/* Expanded Phase Details */}
              {isExpanded && (
                <div className="ml-6 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {phase.difficulty === 'easy' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {phase.difficulty === 'medium' && <Clock className="h-4 w-4 text-yellow-600" />}
                    {phase.difficulty === 'hard' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    <span>Difficulty: {phase.difficulty}</span>
                    {phase.prerequisites.length > 0 && (
                      <span className="ml-4">
                        Prerequisites: {phase.prerequisites.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Action Items */}
                  <div className="space-y-3">
                    {phase.actions.map((action, actionIndex) => (
                      <ActionPlanChecklistItem
                        key={actionIndex}
                        id={`${phase.id}-${action.title}`}
                        title={action.title}
                        description={`${action.weeks} week implementation • Owner: ${action.owner}`}
                        weeks={action.weeks}
                        owner={action.owner}
                        recoveryPotential={phase.recoveryPotential / phase.actions.length}
                        difficulty={phase.difficulty}
                        riskLevel={getRiskLevel(phase.difficulty)}
                        prerequisites={phase.prerequisites}
                        isCompleted={completedActions.has(`${phase.id}-${action.title}`)}
                        onToggle={handleActionToggle}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ROI Summary */}
        <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Implementation ROI Summary</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Year 1 ROI</div>
              <div className="text-lg font-bold text-green-700">
                {Math.round(((totalRecovery - totalInvestment) / totalInvestment) * 100)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Break-even</div>
              <div className="text-lg font-bold text-blue-700">Month {paybackMonths}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Net Benefit (Year 1)</div>
              <div className="text-lg font-bold text-purple-700">
                {formatCurrency(totalRecovery - totalInvestment)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Confidence Level</div>
              <div className="text-lg font-bold text-gray-700 capitalize">{confidenceLevel}</div>
            </div>
          </div>
        </div>

        {/* Implementation Tips */}
        {confidenceLevel === 'low' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800">Implementation Guidance</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  Low confidence estimates suggest starting with quick wins and validating assumptions before major investments. 
                  Consider pilot programs for higher-risk initiatives.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
