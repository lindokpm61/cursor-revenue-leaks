import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, TrendingUp, Target, Zap } from "lucide-react";

interface EnhancedInsightsProps {
  breakdown: {
    leadResponse: {
      dealSizeTier: string;
      conversionImpact: number;
      responseTimeHours: number;
      effectiveness?: number;
    };
    failedPayments: {
      recoverySystem: string;
      recoveryRate: number;
      actualLossAfterRecovery: number;
      monthlyImpact?: number;
    };
    selfServeGap: {
      industryBenchmark: number;
      industryName: string;
      gapPercentage: number;
      currentConversion: number;
      potentialARPU?: number;
    };
    processInefficiency: {
      revenueGeneratingPotential: number;
      automationPotential: number;
      weeklyHours?: number;
      hourlyRate?: number;
    };
    recoveryValidation: {
      canAchieve70: boolean;
      canAchieve85: boolean;
      limitations: string[];
    };
    validation?: {
      warnings: string[];
      confidenceLevel: 'high' | 'medium' | 'low';
    };
  };
}

export const EnhancedInsights = ({ breakdown }: EnhancedInsightsProps) => {
  const { leadResponse, failedPayments, selfServeGap, processInefficiency, recoveryValidation } = breakdown;

  return (
    <div className="space-y-6">
      {/* Recovery Validation Alerts */}
      <div className="space-y-3">
        {!recoveryValidation.canAchieve70 && (
          <Alert className="border-revenue-warning/50 bg-revenue-warning/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>70% Recovery Target:</strong> May not be achievable due to: {recoveryValidation.limitations.join(', ')}
            </AlertDescription>
          </Alert>
        )}
        
        {!recoveryValidation.canAchieve85 && recoveryValidation.canAchieve70 && (
          <Alert className="border-revenue-warning/50 bg-revenue-warning/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>85% Recovery Target:</strong> Requires improvements in: {recoveryValidation.limitations.join(', ')}
            </AlertDescription>
          </Alert>
        )}
        
        {recoveryValidation.canAchieve85 && (
          <Alert className="border-revenue-success/50 bg-revenue-success/10">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Excellent Foundation:</strong> Your company profile supports achieving 85% recovery potential.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Enhanced Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Lead Response Insights */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Lead Response Analysis
            </CardTitle>
            <CardDescription>2025 exponential decay framework applied</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deal Size Tier</span>
              <Badge variant={leadResponse.dealSizeTier === 'Enterprise' ? 'default' : 'secondary'}>
                {leadResponse.dealSizeTier}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Effectiveness</span>
              <span className="font-medium text-sm">
                {Math.round((leadResponse.effectiveness || 0.75) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Response Time</span>
              <span className={`font-medium text-sm ${
                leadResponse.responseTimeHours < 1 ? 'text-revenue-success' : 
                leadResponse.responseTimeHours < 4 ? 'text-revenue-warning' : 'text-revenue-danger'
              }`}>
                {leadResponse.responseTimeHours}h
              </span>
            </div>
            {leadResponse.responseTimeHours > 1 && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                💡 Reducing response time to &lt;5 minutes could increase effectiveness to 100%
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Recovery Insights */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Payment Recovery System
            </CardTitle>
            <CardDescription>Advanced dunning capabilities assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current System</span>
              <Badge variant={
                failedPayments.recoverySystem.includes('Best') ? 'default' :
                failedPayments.recoverySystem.includes('Advanced') ? 'secondary' : 'outline'
              }>
                {failedPayments.recoverySystem}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recovery Rate</span>
              <span className="font-medium text-sm text-revenue-success">
                {Math.round(failedPayments.recoveryRate * 100)}%
              </span>
            </div>
            {failedPayments.recoveryRate < 70 && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                🚀 Upgrading to Advanced/Best-in-Class systems could recover 60-90% of failed payments
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-Serve Conversion Insights */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Industry Conversion Analysis
            </CardTitle>
            <CardDescription>2025 industry-specific benchmarks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Industry</span>
              <span className="font-medium text-sm">{selfServeGap.industryName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your Rate</span>
              <span className="font-medium text-sm">{selfServeGap.currentConversion.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Industry Benchmark</span>
              <span className="font-medium text-sm text-revenue-success">
                {selfServeGap.industryBenchmark.toFixed(1)}%
              </span>
            </div>
            {selfServeGap.gapPercentage > 0 && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                📈 Closing the {selfServeGap.gapPercentage.toFixed(1)}% gap could significantly increase revenue
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Automation Insights */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Automation Potential
            </CardTitle>
            <CardDescription>Enhanced ROI framework (McKinsey 2024)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Weekly Manual Hours</span>
              <span className="font-medium text-sm">{processInefficiency.weeklyHours || 0}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Automation Potential</span>
              <span className="font-medium text-sm text-revenue-success">
                {Math.round(processInefficiency.automationPotential * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenue Generation</span>
              <span className="font-medium text-sm text-revenue-success">
                ${Math.round(processInefficiency.revenueGeneratingPotential).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              ⚡ 76% of companies see positive ROI within first year of automation implementation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Priority Recommendations */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-base">🎯 Implementation Priority Framework</CardTitle>
          <CardDescription>Based on your specific profile and market conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">1</div>
              <div>
                <p className="font-medium text-sm">Lead Response Optimization</p>
                <p className="text-xs text-muted-foreground">
                  Implement AI-powered lead routing for sub-5-minute response times
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">2</div>
              <div>
                <p className="font-medium text-sm">Advanced Payment Recovery</p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to advanced dunning systems for 60-90% recovery rates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">3</div>
              <div>
                <p className="font-medium text-sm">Product-Led Growth Implementation</p>
                <p className="text-xs text-muted-foreground">
                  Integrate PQL framework for 2-3x higher conversion rates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">4</div>
              <div>
                <p className="font-medium text-sm">Process Automation Platform</p>
                <p className="text-xs text-muted-foreground">
                  Deploy automation for 30-35% efficiency gains and revenue generation
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};