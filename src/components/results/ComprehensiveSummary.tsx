
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Target, Zap, BarChart3, AlertTriangle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { UnifiedRevenueCharts } from "@/components/results/UnifiedRevenueCharts";
import { UnifiedResultsService } from "@/lib/results/UnifiedResultsService";

interface ComprehensiveSummaryProps {
  submission: any;
  formatCurrency: (amount: number) => string;
  onExpandSection?: (sectionId: string) => void;
}

export const ComprehensiveSummary = ({ submission, formatCurrency, onExpandSection }: ComprehensiveSummaryProps) => {
  // Calculate unified results
  const unifiedResults = UnifiedResultsService.calculateResults(submission);
  
  // Get top 3 priority actions based on loss amounts
  const getTopPriorityActions = () => {
    const actions = [
      { 
        name: "Lead Response Optimization", 
        value: unifiedResults.leadResponseLoss || 0,
        timeframe: "4-6 weeks",
        effort: "Medium",
        recovery: (unifiedResults.leadResponseLoss || 0) * 0.6
      },
      { 
        name: "Self-Serve Optimization", 
        value: unifiedResults.selfServeGap || 0,
        timeframe: "8-12 weeks", 
        effort: "High",
        recovery: (unifiedResults.selfServeGap || 0) * 0.5
      },
      { 
        name: "Payment Recovery", 
        value: unifiedResults.failedPaymentLoss || 0,
        timeframe: "1-2 weeks",
        effort: "Low", 
        recovery: (unifiedResults.failedPaymentLoss || 0) * 0.8
      },
      { 
        name: "Process Automation", 
        value: unifiedResults.processInefficiency || 0,
        timeframe: "2-4 weeks",
        effort: "Low",
        recovery: (unifiedResults.processInefficiency || 0) * 0.7
      }
    ];
    
    return actions
      .filter(action => action.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };

  const topActions = getTopPriorityActions();
  const totalInvestmentEstimate = 150000; // Estimated based on typical implementation costs

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Context Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-revenue-primary/10 border border-primary/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-2xl mb-2 text-primary">Executive Revenue Recovery Summary</h2>
            <p className="text-muted-foreground mb-4">
              Comprehensive analysis of revenue leakage, recovery potential, and strategic action priorities for {submission.company_name}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {unifiedResults.lossPercentageOfARR.toFixed(1)}% of ARR at Risk
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                {unifiedResults.recoveryPercentageOfLoss.toFixed(0)}% Recoverable
              </Badge>
              <Badge variant="outline" className="text-xs">
                {topActions.length} Priority Actions Identified
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-red-50 border-red-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Total Revenue Leak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive leading-none mb-2">
              {formatCurrency(unifiedResults.totalLoss)}
            </p>
            <p className="text-sm text-muted-foreground">
              {unifiedResults.lossPercentageOfARR.toFixed(1)}% of current ARR
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-revenue-success" />
              Recovery Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-success leading-none mb-2">
              {formatCurrency(unifiedResults.conservativeRecovery)}
            </p>
            <p className="text-sm text-muted-foreground">conservative estimate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Investment Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary leading-none mb-2">
              {formatCurrency(totalInvestmentEstimate)}
            </p>
            <p className="text-sm text-muted-foreground">implementation cost</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-revenue-success" />
              Net ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-revenue-success leading-none mb-2">
              {Math.round(((unifiedResults.conservativeRecovery - totalInvestmentEstimate) / totalInvestmentEstimate) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">first year return</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Revenue Analysis & Recovery Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UnifiedRevenueCharts 
            calculations={unifiedResults}
            formatCurrency={formatCurrency}
          />
        </CardContent>
      </Card>

      {/* Top Priority Actions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Strategic Action Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topActions.map((action, index) => (
              <div key={action.name} className="border rounded-lg p-4 bg-gradient-to-r from-background to-muted/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-foreground">{action.name}</h4>
                      <Badge className={getEffortColor(action.effort)}>
                        {action.effort} Effort
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Loss:</span>
                        <div className="font-semibold text-destructive">
                          {formatCurrency(action.value)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recovery Potential:</span>
                        <div className="font-semibold text-revenue-success">
                          {formatCurrency(action.recovery)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timeline:</span>
                        <div className="font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {action.timeframe}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ROI Impact:</span>
                        <div className="font-semibold text-primary">
                          {Math.round((action.recovery / action.value) * 100)}% recovery
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Action Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Implementation Summary</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-800">Total Recovery</div>
                  <div className="text-green-600 font-bold">
                    {formatCurrency(topActions.reduce((sum, action) => sum + action.recovery, 0))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Implementation Timeline</div>
                  <div className="text-gray-600">8-12 weeks total</div>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Estimated Investment</div>
                  <div className="text-gray-600">{formatCurrency(totalInvestmentEstimate)}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Payback Period</div>
                  <div className="text-green-600 font-semibold">3-6 months</div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button 
                className="bg-gradient-to-r from-primary to-primary/80"
                onClick={() => onExpandSection?.('timeline')}
              >
                View Detailed Timeline
              </Button>
              <Button 
                variant="outline"
                onClick={() => onExpandSection?.('priorities')}
              >
                See All Priority Actions
              </Button>
              <Button 
                variant="ghost"
                onClick={() => onExpandSection?.('scenarios')}
              >
                Explore Scenarios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
