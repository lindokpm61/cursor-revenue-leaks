
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Target, Zap, Calendar, TrendingUp } from "lucide-react";
import { UnifiedCalculations } from "@/lib/results/UnifiedResultsService";
import { BlurOverlay } from "@/components/ui/blur-overlay";

interface UnifiedStrategicAnalysisProps {
  calculations: UnifiedCalculations;
  companyName: string;
  formatCurrency: (amount: number) => string;
  onGetActionPlan: () => void;
  onQuickWins: () => void;
  onBookCall: () => void;
}

export const UnifiedStrategicAnalysis = ({ 
  calculations, 
  companyName, 
  formatCurrency,
  onGetActionPlan,
  onQuickWins,
  onBookCall
}: UnifiedStrategicAnalysisProps) => {
  // DEBUG: Log what UnifiedStrategicAnalysis is receiving
  console.log('=== UNIFIED STRATEGIC ANALYSIS COMPONENT ===');
  console.log('Received calculations object:', calculations);
  console.log('calculations.totalLoss:', calculations.totalLoss);
  console.log('calculations.conservativeRecovery:', calculations.conservativeRecovery);
  console.log('calculations.optimisticRecovery:', calculations.optimisticRecovery);
  console.log('formatCurrency function:', formatCurrency);
  console.log('formatCurrency(calculations.totalLoss):', formatCurrency(calculations.totalLoss));

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Hero Card */}
        <Card className="lg:col-span-3 bg-gradient-to-r from-primary/5 to-revenue-growth/5 border-primary/20">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Strategic Revenue Opportunity
                </h2>
                <div className="text-2xl md:text-3xl lg:text-4xl text-primary font-bold flex items-center gap-3 mb-3">
                  <ArrowUp className="h-8 w-8" />
                  {formatCurrency(calculations.totalLoss)}
                </div>
                <p className="text-lg text-muted-foreground">
                  Annual growth potential identified
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/50 border">
                  <div className="text-xl md:text-2xl text-revenue-growth font-bold mb-1">
                    {formatCurrency(calculations.conservativeRecovery)}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Strategic Recovery (60%)
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-1">
                    Achievable with focused execution
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border">
                  <div className="text-xl md:text-2xl text-primary font-bold mb-1">
                    {formatCurrency(calculations.optimisticRecovery)}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Optimal Recovery (80%)
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-1">
                    With optimal execution and resources
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={onGetActionPlan} className="flex-1">
                  <Target className="h-4 w-4 mr-2" />
                  Get Strategic Plan
                </Button>
                <Button variant="outline" onClick={onQuickWins} className="flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Wins
                </Button>
                <Button variant="default" onClick={onBookCall} className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Strategy Call
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Performance Summary</CardTitle>
            <CardDescription className="text-sm">
              Current state and growth potential
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-xl font-bold text-primary mb-1">
                  {calculations.lossPercentageOfARR.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  growth opportunity
                </div>
              </div>
              
              <div className="text-center p-4 bg-revenue-growth/10 rounded-lg border border-revenue-growth/20">
                <div className="text-xl font-bold text-revenue-growth mb-1">
                  {calculations.recoveryPercentageOfLoss.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  recovery potential
                </div>
              </div>

              <div className="text-center p-4 bg-revenue-success/10 rounded-lg border border-revenue-success/20">
                <div className="text-xl font-bold text-revenue-success mb-1">
                  {formatCurrency(calculations.performanceMetrics.secureRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  secure revenue
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Context with Blur Overlay */}
      <BlurOverlay 
        title="Unlock Complete Strategic Analysis"
        description="Get detailed implementation roadmap and strategic recommendations"
        ctaText="Book Strategy Consultation"
        onUnlock={onBookCall}
        blurLevel="medium"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Strategic Performance Context
            </CardTitle>
            <CardDescription>
              Understanding your revenue optimization opportunity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  {formatCurrency(calculations.performanceMetrics.currentARR)}
                </div>
                <div className="text-sm text-muted-foreground">Current ARR</div>
                <div className="text-xs text-primary mt-1">
                  {calculations.lossPercentageOfARR.toFixed(1)}% optimization opportunity
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-primary mb-2">
                  {Math.round(calculations.recoveryPercentageOfLoss)}%
                </div>
                <div className="text-sm text-muted-foreground">Recovery Rate</div>
                <div className="text-xs text-revenue-growth mt-1">
                  Conservative estimate
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-revenue-growth mb-2">
                  {calculations.lossBreakdown.length}
                </div>
                <div className="text-sm text-muted-foreground">Optimization Areas</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Identified improvement categories
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl md:text-2xl font-bold text-primary mb-2">
                  6-12
                </div>
                <div className="text-sm text-muted-foreground">Month Timeline</div>
                <div className="text-xs text-primary mt-1">
                  To achieve full recovery
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-primary/10 to-revenue-growth/10 p-6 rounded-xl border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <Target className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    Strategic Revenue Optimization
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your analysis shows {formatCurrency(calculations.totalLoss)} in annual revenue optimization 
                    potential across {calculations.lossBreakdown.length} key areas. With focused execution, 
                    you can recover {formatCurrency(calculations.conservativeRecovery)} within 6-12 months.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-foreground">Primary Focus Areas:</div>
                      <div className="text-primary">
                        {calculations.lossBreakdown
                          .sort((a, b) => b.amount - a.amount)
                          .slice(0, 2)
                          .map(item => item.title)
                          .join(' & ')
                        }
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Expected Timeline:</div>
                      <div className="text-primary">60% recovery in 6 months</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </BlurOverlay>
    </div>
  );
};
