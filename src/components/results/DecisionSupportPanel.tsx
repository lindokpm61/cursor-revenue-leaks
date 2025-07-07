import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  Shield,
  Zap
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { type UserIntent } from "./UserIntentSelector";

interface DecisionSupportPanelProps {
  submission: Submission;
  userIntent: UserIntent;
  formatCurrency: (amount: number) => string;
}

interface ActionItem {
  title: string;
  description: string;
  difficulty: number; // 1-5 scale
  timeToImplement: string;
  resourceRequirement: "Low" | "Medium" | "High";
  riskLevel: "Low" | "Medium" | "High";
  successProbability: number; // 0-100
  potentialValue: number;
  category: "lead-response" | "payments" | "self-serve" | "operations";
}

const getActionItems = (submission: Submission): ActionItem[] => [
  {
    title: "Implement Lead Response Automation",
    description: "Set up automated email sequences for immediate lead acknowledgment",
    difficulty: 2,
    timeToImplement: "2-4 weeks",
    resourceRequirement: "Low",
    riskLevel: "Low", 
    successProbability: 85,
    potentialValue: (submission.lead_response_loss || 0) * 0.6,
    category: "lead-response"
  },
  {
    title: "Fix Payment Recovery System",
    description: "Implement dunning management and payment retry logic",
    difficulty: 3,
    timeToImplement: "4-6 weeks", 
    resourceRequirement: "Medium",
    riskLevel: "Low",
    successProbability: 90,
    potentialValue: (submission.failed_payment_loss || 0) * 0.8,
    category: "payments"
  },
  {
    title: "Optimize Self-Serve Onboarding",
    description: "Streamline signup flow and reduce friction points",
    difficulty: 4,
    timeToImplement: "6-8 weeks",
    resourceRequirement: "High", 
    riskLevel: "Medium",
    successProbability: 70,
    potentialValue: (submission.selfserve_gap_loss || 0) * 0.5,
    category: "self-serve"
  },
  {
    title: "Automate Manual Processes",
    description: "Replace manual workflows with automated solutions",
    difficulty: 5,
    timeToImplement: "8-12 weeks",
    resourceRequirement: "High",
    riskLevel: "Medium", 
    successProbability: 75,
    potentialValue: (submission.process_inefficiency_loss || 0) * 0.7,
    category: "operations"
  }
];

const getRiskColor = (level: string) => {
  switch (level) {
    case "Low": return "text-revenue-success bg-revenue-success/10 border-revenue-success/20";
    case "Medium": return "text-revenue-warning bg-revenue-warning/10 border-revenue-warning/20";
    case "High": return "text-revenue-danger bg-revenue-danger/10 border-revenue-danger/20";
    default: return "text-muted-foreground bg-muted/10 border-border/20";
  }
};

const getDifficultyStars = (difficulty: number) => {
  return "★".repeat(difficulty) + "☆".repeat(5 - difficulty);
};

export const DecisionSupportPanel = ({ 
  submission, 
  userIntent, 
  formatCurrency 
}: DecisionSupportPanelProps) => {
  const actionItems = getActionItems(submission);
  
  // Sort actions based on user intent
  const sortedActions = [...actionItems].sort((a, b) => {
    switch (userIntent) {
      case "quick-wins":
        return (a.difficulty + (5 - a.successProbability / 20)) - (b.difficulty + (5 - b.successProbability / 20));
      case "understand-problem":
        return b.potentialValue - a.potentialValue;
      case "plan-implementation":
        return a.difficulty - b.difficulty;
      default:
        return b.successProbability - a.successProbability;
    }
  });

  const getIntentMessage = () => {
    switch (userIntent) {
      case "understand-problem":
        return {
          title: "Biggest Problems Identified",
          subtitle: "Ordered by potential revenue impact",
          icon: Target
        };
      case "quick-wins":
        return {
          title: "Quick Win Opportunities",
          subtitle: "Ordered by ease of implementation and success probability",
          icon: Zap
        };
      case "plan-implementation":
        return {
          title: "Implementation Roadmap",
          subtitle: "Ordered by logical implementation sequence",
          icon: Clock
        };
      default:
        return {
          title: "Recommended Actions",
          subtitle: "Prioritized by success probability",
          icon: Lightbulb
        };
    }
  };

  const intentInfo = getIntentMessage();
  const IntentIcon = intentInfo.icon;

  return (
    <Card className="mb-8 bg-gradient-to-br from-background to-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <IntentIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-h2">{intentInfo.title}</CardTitle>
            <p className="text-small text-muted-foreground">{intentInfo.subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedActions.slice(0, 3).map((action, index) => (
            <div key={action.title} className="p-6 rounded-xl bg-gradient-to-r from-background to-card border border-border/50 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="text-xs font-bold px-3 py-1">
                  #{index + 1} Priority
                </Badge>
              </div>
              
              <div className="mb-4">
                <h4 className="font-bold text-h3 mb-2">{action.title}</h4>
                <p className="text-small text-muted-foreground">{action.description}</p>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-h1 font-bold text-revenue-success leading-none">
                    {formatCurrency(action.potentialValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">Potential Value</div>
                </div>
                
                <div className="text-center">
                  <div className="text-h2 font-bold text-foreground leading-none">
                    {action.successProbability}%
                  </div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                  <Progress value={action.successProbability} className="h-1 mt-1" />
                </div>

                <div className="text-center">
                  <div className="text-h3 font-bold text-foreground leading-none">
                    {getDifficultyStars(action.difficulty)}
                  </div>
                  <div className="text-xs text-muted-foreground">Difficulty</div>
                </div>

                <div className="text-center">
                  <div className="text-h3 font-bold text-foreground leading-none">
                    {action.timeToImplement}
                  </div>
                  <div className="text-xs text-muted-foreground">Timeline</div>
                </div>
              </div>

              {/* Decision Factors */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={`text-xs px-2 py-1 ${getRiskColor(action.riskLevel)}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {action.riskLevel} Risk
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-1">
                  <Users className="h-3 w-3 mr-1" />
                  {action.resourceRequirement} Resources
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {action.timeToImplement}
                </Badge>
              </div>

              {/* Confidence Indicators */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-revenue-success/5 to-revenue-primary/5 border border-revenue-success/20">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span className="font-medium text-small">Why this works</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Similar companies achieved average {action.successProbability}% success rate. 
                  Low implementation risk with proven ROI patterns.
                </div>
              </div>

              {userIntent === "understand-problem" && (
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-revenue-danger/5 to-revenue-warning/5 border border-revenue-danger/20">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="h-4 w-4 text-revenue-danger" />
                    <span className="font-medium text-small">Cost of inaction</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Delaying this fix could cost an additional {formatCurrency(action.potentialValue * 0.3)} over the next 12 months.
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Quick Action Panel */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-revenue-primary/5 border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-h3">Ready to start?</h4>
                  <p className="text-small text-muted-foreground">
                    {userIntent === "quick-wins" 
                      ? "Begin with the easiest high-impact action"
                      : "Start with your highest-priority opportunity"
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Download Plan
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-primary to-revenue-primary">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};