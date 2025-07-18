
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Target, 
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface ProgressiveAnalysisProps {
  data: any;
  calculations: any;
  formatCurrency: (amount: number) => string;
  children: React.ReactNode;
}

export const ProgressiveAnalysis = ({
  data,
  calculations,
  formatCurrency,
  children
}: ProgressiveAnalysisProps) => {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);

  const insights = [
    {
      id: 'lead-response',
      title: 'Lead Response Time',
      impact: calculations.leadResponseLoss,
      severity: 'high',
      description: 'Slow lead response is costing you significant revenue',
      icon: TrendingUp
    },
    {
      id: 'failed-payments',
      title: 'Payment Failures',
      impact: calculations.failedPaymentLoss,
      severity: 'medium',
      description: 'Failed payments are creating revenue leakage',
      icon: AlertTriangle
    },
    {
      id: 'self-serve',
      title: 'Self-Serve Gap',
      impact: calculations.selfServeGap,
      severity: 'medium',
      description: 'Missing self-serve opportunities',
      icon: BarChart3
    }
  ].sort((a, b) => b.impact - a.impact);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-revenue-danger';
      case 'medium': return 'text-revenue-warning';
      default: return 'text-muted-foreground';
    }
  };

  if (!showFullAnalysis) {
    return (
      <div className="space-y-6">
        {/* Key Insights Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Revenue Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((insight) => {
              const Icon = insight.icon;
              const isExpanded = activeInsight === insight.id;
              
              return (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setActiveInsight(isExpanded ? null : insight.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${getSeverityColor(insight.severity)}`} />
                      <div>
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={insight.severity === 'high' ? 'destructive' : 'outline'}>
                        {formatCurrency(insight.impact)}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t animate-fade-in">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Current Impact:</span>
                          <p className={`${getSeverityColor(insight.severity)} font-semibold`}>
                            {formatCurrency(insight.impact)} annually
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Recovery Potential:</span>
                          <p className="text-revenue-success font-semibold">
                            {formatCurrency(insight.impact * 0.7)} (70%)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="pt-4 text-center">
              <Button
                onClick={() => setShowFullAnalysis(true)}
                variant="outline"
                className="hover:bg-primary hover:text-primary-foreground"
              >
                View Complete Analysis
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collapse Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Complete Revenue Analysis</h2>
        <Button
          variant="ghost"
          onClick={() => setShowFullAnalysis(false)}
          className="text-muted-foreground"
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          Simplify View
        </Button>
      </div>

      {/* Full Analysis Content */}
      {children}
    </div>
  );
};
