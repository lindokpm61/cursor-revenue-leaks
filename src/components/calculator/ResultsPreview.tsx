import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, DollarSign, Clock, Users, Zap, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultsPreviewProps {
  completedSteps: number;
  totalSteps: number;
  hasValidData: boolean;
  estimatedLeakValue?: number;
  topLeakCategory?: string;
}

const sampleInsights = [
  {
    category: "Lead Response",
    issue: "Slow response times",
    impact: "$240K annual loss",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    category: "Payment Failures", 
    issue: "Poor dunning process",
    impact: "$180K annual loss",
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    category: "Conversion Gap",
    issue: "Below 15% benchmark",
    impact: "$320K opportunity",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    category: "Process Efficiency",
    issue: "Manual bottlenecks",
    impact: "$140K cost burden",
    icon: Zap,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
];

export const ResultsPreview = ({ 
  completedSteps, 
  totalSteps, 
  hasValidData, 
  estimatedLeakValue,
  topLeakCategory 
}: ResultsPreviewProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentInsight, setCurrentInsight] = useState(0);

  const completionPercentage = (completedSteps / totalSteps) * 100;
  const shouldShow = completedSteps >= 2 && hasValidData;

  // Rotate through insights
  useEffect(() => {
    if (!shouldShow) return;
    
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % sampleInsights.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [shouldShow]);

  // Show preview when conditions are met
  useEffect(() => {
    setIsVisible(shouldShow);
  }, [shouldShow]);

  if (!isVisible) return null;

  const insight = sampleInsights[currentInsight];
  const Icon = insight.icon;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-primary" />
            Results Preview
            <Badge variant="outline" className="ml-2">
              {Math.round(completionPercentage)}% Complete
            </Badge>
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        
        <Progress 
          value={completionPercentage} 
          className="h-2"
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sample insight preview */}
        <div className="p-4 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", insight.bgColor)}>
              <Icon className={cn("h-5 w-5", insight.color)} />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{insight.category}</h4>
                <Badge variant="secondary" className="text-xs">
                  Sample
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">{insight.issue}</p>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-revenue-warning" />
                <span className="text-sm font-medium text-revenue-warning">
                  {insight.impact}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-1">
          {sampleInsights.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                index === currentInsight ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Estimated leak preview */}
        {estimatedLeakValue && (
          <div className="p-3 rounded-lg bg-revenue-warning/10 border border-revenue-warning/20">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-revenue-warning" />
              <span className="text-muted-foreground">Estimated total leak:</span>
              <span className="font-bold text-revenue-warning">
                ${estimatedLeakValue.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Call to action */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground mb-3">
            Complete your assessment to see your{" "}
            <span className="font-semibold text-primary">personalized results</span>
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    i < completedSteps ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <span>{totalSteps - completedSteps} steps remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};