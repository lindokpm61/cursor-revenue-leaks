
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Target,
  Zap,
  TrendingUp
} from "lucide-react";
import { TimelinePhase } from "@/lib/calculator/unifiedCalculations";

interface ImplementationRoadmapProps {
  phases: TimelinePhase[];
  totalRecovery: number;
  totalInvestment: number;
  formatCurrency: (amount: number) => string;
}

interface WeeklyTask {
  week: number;
  phase: string;
  task: string;
  owner: string;
  effort: string;
  dependencies: string[];
  deliverables: string[];
  riskLevel: 'low' | 'medium' | 'high';
  track: 'technical' | 'process' | 'training' | 'validation';
}

interface Milestone {
  week: number;
  title: string;
  description: string;
  successCriteria: string[];
  decisions: string[];
  rollbackPlan?: string;
}

export const ImplementationRoadmap = ({ 
  phases, 
  totalRecovery, 
  totalInvestment, 
  formatCurrency 
}: ImplementationRoadmapProps) => {
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Generate weekly tasks from phases
  const generateWeeklyTasks = (): WeeklyTask[] => {
    const tasks: WeeklyTask[] = [];
    
    phases.forEach(phase => {
      const phaseDuration = phase.endMonth - phase.startMonth + 1;
      const weeksInPhase = phaseDuration * 4;
      let currentWeek = (phase.startMonth - 1) * 4 + 1;
      
      // Generate tasks based on phase actions
      phase.actions.forEach((action, index) => {
        const actionWeek = currentWeek + Math.floor((action.weeks * index) / phase.actions.length);
        
        tasks.push({
          week: actionWeek,
          phase: phase.title,
          task: action.title,
          owner: action.owner,
          effort: `${action.weeks} weeks`,
          dependencies: index > 0 ? [phase.actions[index - 1].title] : [],
          deliverables: generateDeliverables(action.title),
          riskLevel: determineRiskLevel(phase.difficulty, action.title),
          track: determineTrack(action.title)
        });
      });
    });
    
    return tasks.sort((a, b) => a.week - b.week);
  };

  // Generate key milestones
  const generateMilestones = (): Milestone[] => {
    const milestones: Milestone[] = [];
    
    // Phase completion milestones
    phases.forEach(phase => {
      const endWeek = phase.endMonth * 4;
      
      milestones.push({
        week: endWeek,
        title: `${phase.title} Complete`,
        description: `Full implementation and validation of ${phase.title.toLowerCase()}`,
        successCriteria: generateSuccessCriteria(phase),
        decisions: [`Continue to next phase`, `Optimize current implementation`, `Pause for assessment`],
        rollbackPlan: `Revert to pre-${phase.title.toLowerCase()} configuration with documented lessons learned`
      });
    });

    // Add major decision gates
    milestones.push(
      {
        week: 4,
        title: "Foundation Review",
        description: "Initial setup and team readiness assessment",
        successCriteria: ["Team training completed", "Tools configured", "Baseline metrics captured"],
        decisions: ["Proceed with full rollout", "Extend pilot phase", "Adjust approach"]
      },
      {
        week: 8,
        title: "Quick Wins Checkpoint",
        description: "Evaluate early implementation results",
        successCriteria: ["First results measurable", "Team confidence high", "No major blockers"],
        decisions: ["Accelerate timeline", "Maintain current pace", "Address identified issues"]
      }
    );
    
    return milestones.sort((a, b) => a.week - b.week);
  };

  const weeklyTasks = generateWeeklyTasks();
  const milestones = generateMilestones();
  const maxWeeks = Math.max(...weeklyTasks.map(t => t.week), ...milestones.map(m => m.week));

  const filteredTasks = selectedTrack === 'all' 
    ? weeklyTasks 
    : weeklyTasks.filter(task => task.track === selectedTrack);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrackColor = (track: string) => {
    switch (track) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'process': return 'bg-purple-100 text-purple-800';
      case 'training': return 'bg-orange-100 text-orange-800';
      case 'validation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Implementation Roadmap Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{maxWeeks}</div>
              <div className="text-sm text-muted-foreground">Total Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{phases.length}</div>
              <div className="text-sm text-muted-foreground">Major Phases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{formatCurrency(totalRecovery)}</div>
              <div className="text-sm text-muted-foreground">Target Recovery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(totalRecovery / totalInvestment)}x</div>
              <div className="text-sm text-muted-foreground">ROI Multiple</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track Filter Tabs */}
      <Tabs value={selectedTrack} onValueChange={setSelectedTrack}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Tracks</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTrack} className="space-y-6">
          {/* Timeline View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Execution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: Math.ceil(maxWeeks / 4) }, (_, quarterIndex) => {
                  const quarterStart = quarterIndex * 4 + 1;
                  const quarterEnd = Math.min((quarterIndex + 1) * 4, maxWeeks);
                  const quarterTasks = filteredTasks.filter(
                    task => task.week >= quarterStart && task.week <= quarterEnd
                  );
                  const quarterMilestones = milestones.filter(
                    milestone => milestone.week >= quarterStart && milestone.week <= quarterEnd
                  );

                  return (
                    <div key={quarterIndex} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Weeks {quarterStart}-{quarterEnd}
                      </h4>
                      
                      {/* Quarter Tasks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {quarterTasks.map((task, taskIndex) => (
                          <div 
                            key={taskIndex} 
                            className="border rounded p-3 hover:shadow-sm transition-shadow cursor-pointer"
                            onClick={() => setSelectedWeek(selectedWeek === task.week ? null : task.week)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  Week {task.week}
                                </Badge>
                                <Badge className={`ml-2 text-xs ${getTrackColor(task.track)}`}>
                                  {task.track}
                                </Badge>
                              </div>
                              <Badge variant="outline" className={`text-xs ${getRiskColor(task.riskLevel)}`}>
                                {task.riskLevel} risk
                              </Badge>
                            </div>
                            <h5 className="font-medium text-sm mb-1">{task.task}</h5>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {task.owner}
                              <Clock className="h-3 w-3 ml-2" />
                              {task.effort}
                            </div>
                            
                            {selectedWeek === task.week && (
                              <div className="mt-3 pt-3 border-t space-y-2">
                                <div>
                                  <div className="text-xs font-medium">Deliverables:</div>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                                    {task.deliverables.map((deliverable, i) => (
                                      <li key={i}>{deliverable}</li>
                                    ))}
                                  </ul>
                                </div>
                                {task.dependencies.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium">Dependencies:</div>
                                    <div className="text-xs text-muted-foreground">
                                      {task.dependencies.join(', ')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Quarter Milestones */}
                      {quarterMilestones.map((milestone, milestoneIndex) => (
                        <div key={milestoneIndex} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <h5 className="font-semibold text-primary">
                              Week {milestone.week}: {milestone.title}
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h6 className="text-xs font-medium mb-1">Success Criteria:</h6>
                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                {milestone.successCriteria.map((criteria, i) => (
                                  <li key={i}>{criteria}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h6 className="text-xs font-medium mb-1">Decision Options:</h6>
                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                {milestone.decisions.map((decision, i) => (
                                  <li key={i}>{decision}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          {milestone.rollbackPlan && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-medium">Rollback Plan:</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{milestone.rollbackPlan}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Critical Path Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Critical Path & Dependencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium">Critical Path Duration:</span>
                  <span>{maxWeeks} weeks ({Math.ceil(maxWeeks / 4)} months)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h6 className="font-medium text-sm">High-Risk Dependencies</h6>
                    <div className="space-y-1">
                      {filteredTasks
                        .filter(task => task.riskLevel === 'high')
                        .slice(0, 3)
                        .map((task, i) => (
                          <div key={i} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                            Week {task.week}: {task.task}
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h6 className="font-medium text-sm">Parallel Opportunities</h6>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Training can run parallel with setup</div>
                      <div>• Testing overlaps with configuration</div>
                      <div>• Process design while tools deploy</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h6 className="font-medium text-sm">Acceleration Options</h6>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• Add dedicated resources (-2 weeks)</div>
                      <div>• Parallel track execution (-3 weeks)</div>
                      <div>• External consultant support (-1 week)</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
const generateDeliverables = (taskTitle: string): string[] => {
  const deliverableMap: Record<string, string[]> = {
    'Audit current response processes': ['Process documentation', 'Gap analysis report', 'Improvement recommendations'],
    'Implement lead automation tools': ['Tool configuration', 'Integration setup', 'Testing results'],
    'Configure notification systems': ['Alert rules setup', 'Escalation procedures', 'Team notifications'],
    'Train response team': ['Training materials', 'Certification completion', 'Process adoption'],
    'Analyze payment failure patterns': ['Failure analysis report', 'Pattern identification', 'Root cause analysis'],
    'Design retry logic system': ['System design document', 'Logic flow diagrams', 'Testing strategy'],
    'Review conversion analytics': ['Analytics audit', 'Conversion funnel analysis', 'Optimization opportunities'],
    'Map current workflows': ['Workflow documentation', 'Process maps', 'Bottleneck identification']
  };
  
  return deliverableMap[taskTitle] || ['Task completion', 'Documentation', 'Validation report'];
};

const determineRiskLevel = (phaseDifficulty: string, taskTitle: string): 'low' | 'medium' | 'high' => {
  if (phaseDifficulty === 'hard') return 'high';
  if (phaseDifficulty === 'medium') return 'medium';
  if (taskTitle.toLowerCase().includes('integration') || taskTitle.toLowerCase().includes('automation')) return 'medium';
  return 'low';
};

const determineTrack = (taskTitle: string): 'technical' | 'process' | 'training' | 'validation' => {
  const title = taskTitle.toLowerCase();
  if (title.includes('implement') || title.includes('configure') || title.includes('deploy')) return 'technical';
  if (title.includes('train') || title.includes('learn')) return 'training';
  if (title.includes('test') || title.includes('monitor') || title.includes('validate')) return 'validation';
  return 'process';
};

const generateSuccessCriteria = (phase: TimelinePhase): string[] => {
  const criteriaMap: Record<string, string[]> = {
    'Lead Response Optimization': [
      'Response time reduced to <2 hours',
      'Lead conversion rate improved by 15%+',
      'Automated notification system operational'
    ],
    'Payment Recovery System': [
      'Failed payment rate reduced by 50%+',
      'Recovery workflow automated',
      'Alternative payment methods active'
    ],
    'Enhance Self-Serve Conversion': [
      'Conversion rate improved by 20%+',
      'User onboarding optimized',
      'A/B testing framework deployed'
    ],
    'Automate Critical Processes': [
      'Manual hours reduced by 60%+',
      'Key workflows automated',
      'Process efficiency measurably improved'
    ]
  };
  
  return criteriaMap[phase.title] || [
    'Phase objectives met',
    'No major issues reported',
    'Team ready for next phase'
  ];
};
