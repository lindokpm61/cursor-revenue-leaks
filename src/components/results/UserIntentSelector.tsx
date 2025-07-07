import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Zap, 
  Calendar, 
  BarChart3,
  ChevronDown,
  Clock,
  TrendingUp,
  Users
} from "lucide-react";

export type UserIntent = 
  | "understand-problem" 
  | "quick-wins" 
  | "plan-implementation" 
  | "compare-competitors"
  | null;

interface UserIntentSelectorProps {
  selectedIntent: UserIntent;
  onIntentChange: (intent: UserIntent) => void;
  estimatedTime?: string;
}

const intentOptions = [
  {
    id: "quick-wins" as const,
    label: "Fix This Fast",
    description: "Quick wins focus",
    icon: Zap,
    color: "text-revenue-success",
    bg: "bg-revenue-success/10",
    border: "border-revenue-success/20",
    time: "2 min"
  },
  {
    id: "plan-implementation" as const,
    label: "See Full Analysis", 
    description: "Complete assessment",
    icon: Calendar,
    color: "text-revenue-primary",
    bg: "bg-revenue-primary/10", 
    border: "border-revenue-primary/20",
    time: "15 min"
  },
  {
    id: "compare-competitors" as const,
    label: "Compare to Industry",
    description: "Benchmarking focus",
    icon: BarChart3,
    color: "text-revenue-warning",
    bg: "bg-revenue-warning/10",
    border: "border-revenue-warning/20",
    time: "5 min"
  },
  {
    id: "understand-problem" as const,
    label: "Just Exploring",
    description: "High-level overview", 
    icon: Target,
    color: "text-revenue-danger",
    bg: "bg-revenue-danger/10",
    border: "border-revenue-danger/20",
    time: "3 min"
  }
];

export const UserIntentSelector = ({ 
  selectedIntent, 
  onIntentChange, 
  estimatedTime 
}: UserIntentSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(!selectedIntent);

  const selectedOption = intentOptions.find(option => option.id === selectedIntent);

  if (!isExpanded && selectedIntent) {
    return (
      <Card className="mb-8 bg-gradient-to-r from-primary/5 to-revenue-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${selectedOption?.bg} border ${selectedOption?.border}`}>
                {selectedOption && <selectedOption.icon className={`h-6 w-6 ${selectedOption.color}`} />}
              </div>
              <div>
                <div className="font-semibold text-h3">I want to {selectedOption?.label?.toLowerCase()}</div>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className="text-xs px-3 py-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {estimatedTime || selectedOption?.time} read
                  </Badge>
                  <span className="text-small text-muted-foreground">{selectedOption?.description}</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              Change focus
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 bg-gradient-to-r from-primary/5 to-revenue-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="font-bold text-h1 mb-2">What's Your Priority Today?</h3>
          <p className="text-body text-muted-foreground">Choose your focus for personalized insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intentOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedIntent === option.id;
            
            return (
              <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto p-4 justify-start text-left transition-all duration-200 ${
                  isSelected 
                    ? `${option.bg} ${option.border} border-2 shadow-lg`
                    : "hover:shadow-md border-border/50"
                }`}
                onClick={() => {
                  onIntentChange(option.id);
                  setIsExpanded(false);
                }}
              >
                <div className="flex items-start gap-4 w-full">
                  <div className={`p-2 rounded-lg ${isSelected ? option.bg : 'bg-muted/50'} border ${isSelected ? option.border : 'border-border/30'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? option.color : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-small mb-1 ${isSelected ? option.color : 'text-foreground'}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {option.description}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0.5 ${isSelected ? option.bg : 'bg-muted/50'}`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {option.time}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {selectedIntent && (
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-background to-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-small">Analysis Personalized</div>
                <div className="text-xs text-muted-foreground">
                  Content has been tailored to your selected focus area
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};