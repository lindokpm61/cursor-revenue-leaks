
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckSquare, 
  Clock, 
  Users, 
  AlertCircle,
  Target,
  Calendar,
  Copy
} from "lucide-react";

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
}

interface ActionCardProps {
  action: ActionItem;
  formatCurrency: (amount: number) => string;
  priorityConfig: {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    label: string;
  };
}

export const ActionCard = ({ action, formatCurrency, priorityConfig }: ActionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const Icon = action.icon;

  const toggleStep = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const copyImplementationPlan = () => {
    const plan = `
${action.title} - Implementation Plan

Overview: ${action.description}

Why It Matters: ${action.whyItMatters}

Implementation Steps:
${action.implementationSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Dependencies:
${action.dependencies.map(dep => `• ${dep}`).join('\n')}

Timeline: ${action.timeframe}
Difficulty: ${action.difficulty}
Expected Recovery: ${formatCurrency(action.potentialRecovery)}
Payback Period: ${action.paybackPeriod}
`;
    navigator.clipboard.writeText(plan);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'default' as const;
      case 'Medium': return 'secondary' as const;
      case 'Hard': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const completionPercentage = (completedSteps.size / action.implementationSteps.length) * 100;

  return (
    <Card className={`${priorityConfig.borderColor} ${priorityConfig.bgColor}`}>
      <CardContent className="p-6">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-3 rounded-lg ${priorityConfig.bgColor.replace('/5', '/20')}`}>
                <Icon className={`h-6 w-6 ${priorityConfig.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg">{action.title}</h4>
                  <Badge variant={getDifficultyBadgeVariant(action.difficulty)} className="text-xs">
                    {action.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {action.timeframe}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                
                {/* Key Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current:</span>
                    <div className="font-medium">{action.currentMetric}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target:</span>
                    <div className="font-medium text-green-600">{action.targetMetric}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recovery:</span>
                    <div className="font-bold text-primary">
                      {formatCurrency(action.potentialRecovery)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payback:</span>
                    <div className="font-medium">{action.paybackPeriod}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-4">
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Progress Overview */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Current Performance</span>
              <span>{Math.round(action.currentProgress)}%</span>
            </div>
            <Progress value={action.currentProgress} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {Math.round(action.targetProgress)}%</span>
              <span className={action.confidence === 'high' ? 'text-green-600' : action.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'}>
                {action.confidence} confidence
              </span>
            </div>
          </div>

          <CollapsibleContent>
            <div className="space-y-6 pt-4 border-t">
              {/* Why It Matters */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Why This Matters
                </h5>
                <p className="text-blue-800 text-sm">{action.whyItMatters}</p>
              </div>

              {/* Implementation Steps */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Implementation Steps
                  </h5>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completedSteps.size}/{action.implementationSteps.length} completed
                    </span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {action.implementationSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => toggleStep(index)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          completedSteps.has(index)
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {completedSteps.has(index) && <CheckSquare className="h-3 w-3" />}
                      </button>
                      <div className="flex-1">
                        <div className={`text-sm ${completedSteps.has(index) ? 'line-through text-gray-500' : ''}`}>
                          <span className="font-medium text-primary mr-2">Step {index + 1}:</span>
                          {step}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies & Resources */}
              <div>
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Dependencies & Resources Required
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {action.dependencies.map((dependency, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">{dependency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Risk Assessment & Mitigation
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-orange-800">Complexity Level:</span>
                    <div className={`${getDifficultyColor(action.difficulty)} font-medium`}>
                      {action.difficulty} - {action.complexity || 'Standard implementation complexity'}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-orange-800">Success Probability:</span>
                    <div className={action.confidence === 'high' ? 'text-green-600' : action.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'}>
                      {action.confidence === 'high' ? '85%' : action.confidence === 'medium' ? '65%' : '45%'} - {action.confidence} confidence
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button onClick={copyImplementationPlan} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Implementation Plan
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Implementation
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Get Expert Help
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
