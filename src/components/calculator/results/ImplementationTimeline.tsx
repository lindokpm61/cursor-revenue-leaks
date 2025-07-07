import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ImplementationTimelineProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
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

export const ImplementationTimeline = ({ submission, formatCurrency }: ImplementationTimelineProps) => {
  const calculateTimelinePhases = (): TimelinePhase[] => {
    const leadResponseRecovery = submission.lead_response_loss || 0;
    const conversionRecovery = submission.selfserve_gap_loss || 0;
    const processRecovery = submission.process_inefficiency_loss || 0;
    const totalInvestment = 50000; // Estimated implementation investment

    const phases: TimelinePhase[] = [
      {
        phase: "1",
        months: "Month 1-2",
        title: "Quick Wins Implementation",
        description: "Immediate response time optimization and basic process improvements",
        recovery: leadResponseRecovery * 0.7, // 70% of lead response losses recovered
        difficulty: "Easy",
        actions: [
          "Implement lead response automation",
          "Set up notification systems",
          "Train response team",
          "Deploy lead scoring system"
        ],
        cumulativeRecovery: 0,
        roiPercentage: 0
      },
      {
        phase: "2", 
        months: "Month 3-4",
        title: "Conversion Improvements",
        description: "Self-serve optimization and conversion rate improvements",
        recovery: conversionRecovery * 0.6, // 60% of conversion losses recovered
        difficulty: "Medium",
        actions: [
          "Optimize onboarding flow",
          "Implement conversion tracking",
          "A/B test pricing pages",
          "Deploy in-app guidance"
        ],
        cumulativeRecovery: 0,
        roiPercentage: 0
      },
      {
        phase: "3",
        months: "Month 5-6", 
        title: "Process Automation",
        description: "Advanced automation and manual process elimination",
        recovery: processRecovery * 0.8, // 80% of process losses recovered
        difficulty: "Medium-Hard",
        actions: [
          "Deploy workflow automation",
          "Integrate payment systems",
          "Eliminate manual processes",
          "Implement advanced analytics"
        ],
        cumulativeRecovery: 0,
        roiPercentage: 0
      }
    ];

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
  const totalLeak = submission.total_leak || 1;
  const recoveryPercentage = Math.min((totalRecovery / totalLeak) * 100, 85);

  // Chart data for cumulative recovery
  const chartData = [
    { month: 'Current', recovery: 0, cumulative: 0 },
    { month: 'Month 2', recovery: phases[0]?.recovery || 0, cumulative: phases[0]?.cumulativeRecovery || 0 },
    { month: 'Month 4', recovery: phases[1]?.recovery || 0, cumulative: phases[1]?.cumulativeRecovery || 0 },
    { month: 'Month 6', recovery: phases[2]?.recovery || 0, cumulative: phases[2]?.cumulativeRecovery || 0 }
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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Implementation Timeline & ROI</CardTitle>
            <p className="text-muted-foreground mt-1">
              Month-by-month revenue recovery plan with {Math.round(recoveryPercentage)}% leak recovery potential
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Recovery Summary */}
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
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                        {phase.phase}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-semibold">{phase.title}</h4>
                          <Badge className={getDifficultyColor(phase.difficulty)}>
                            {phase.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{phase.months}</p>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-revenue-primary mb-1">
                        {formatCurrency(phase.recovery)}
                      </div>
                      <p className="text-sm text-muted-foreground">Recovery Potential</p>
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
    </Card>
  );
};