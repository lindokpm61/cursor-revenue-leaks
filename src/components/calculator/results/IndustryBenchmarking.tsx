
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Trophy,
  Clock,
  CreditCard,
  Settings,
  Users,
  ChevronDown
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { industryDefaults, IndustryBenchmarks, bestInClassTargets, BestInClassBenchmarks } from '@/lib/industryDefaults';
import { getCalculationConfidenceLevel } from '@/lib/calculator/validationHelpers';
import { type UnifiedCalculations } from '@/lib/results/UnifiedResultsService';

interface IndustryBenchmarkingProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  calculations: UnifiedCalculations;
  variant?: 'condensed' | 'standard' | 'detailed' | 'competitive';
}

interface BenchmarkMetric {
  id: string;
  title: string;
  userValue: number;
  industryAvg: number;
  bestInClass: number;
  unit: string;
  icon: any;
  higherIsBetter: boolean;
  performance: 'below-average' | 'average' | 'above-average' | 'best-in-class';
  gapToAverage: number;
  gapToBestInClass: number;
  revenueOpportunity: number;
  strategicAdvantage: boolean;
}

export const IndustryBenchmarking = ({ submission, formatCurrency, calculations, variant = 'standard' }: IndustryBenchmarkingProps) => {
  const [isContentOpen, setIsContentOpen] = useState(true);

  const calculateBenchmarks = (): BenchmarkMetric[] => {
    // Map submission industry to benchmark keys with robust fallback
    const normalizedIndustry = (submission.industry || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    
    const industryKeys = Object.keys(industryDefaults);
    const exactMatch = industryKeys.find(key => key === normalizedIndustry);
    const partialMatch = !exactMatch ? 
      industryKeys.find(key => normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) : 
      null;
      
    const industryKey = (exactMatch || partialMatch || 
      (normalizedIndustry.includes('saas') ? 'saas-software' : 'other')) as keyof typeof industryDefaults;
      
    const industryData = industryDefaults[industryKey];
    const bestInClassData = bestInClassTargets[industryKey];
    
    // Use UnifiedResultsService calculations for revenue opportunities instead of internal calculations
    const leadResponseOpportunity = calculations.leadResponseLoss;
    const conversionOpportunity = calculations.selfServeGap;
    const paymentOpportunity = calculations.failedPaymentLoss;
    const processOpportunity = calculations.processInefficiency;
    
    const metrics: BenchmarkMetric[] = [
      {
        id: 'lead-response',
        title: 'Lead Response Time',
        userValue: submission.lead_response_time || 0,
        industryAvg: industryData.leadResponseTimeHours,
        bestInClass: Math.round((bestInClassData.leadResponseTimeMinutes / 60) * 10) / 10, // Convert to hours and round to 1 decimal
        unit: 'hours',
        icon: Clock,
        higherIsBetter: false,
        performance: 'below-average',
        gapToAverage: 0,
        gapToBestInClass: 0,
        revenueOpportunity: leadResponseOpportunity,
        strategicAdvantage: false
      },
      {
        id: 'conversion-rate',
        title: 'Self-Serve Conversion Rate',
        userValue: submission.free_to_paid_conversion || 0,
        industryAvg: industryData.freeToPaidConversionRate,
        bestInClass: bestInClassData.freeToPaidConversionRateMax,
        unit: '%',
        icon: Target,
        higherIsBetter: true,
        performance: 'below-average',
        gapToAverage: 0,
        gapToBestInClass: 0,
        revenueOpportunity: conversionOpportunity,
        strategicAdvantage: false
      },
      {
        id: 'payment-failure',
        title: 'Failed Payment Rate',
        userValue: submission.failed_payment_rate || 0,
        industryAvg: industryData.failedPaymentRate,
        bestInClass: bestInClassData.failedPaymentRateMin,
        unit: '%',
        icon: CreditCard,
        higherIsBetter: false,
        performance: 'below-average',
        gapToAverage: 0,
        gapToBestInClass: 0,
        revenueOpportunity: paymentOpportunity,
        strategicAdvantage: false
      },
      {
        id: 'process-efficiency',
        title: 'Manual Hours per Week',
        userValue: submission.manual_hours || 0,
        industryAvg: industryData.manualHours,
        bestInClass: bestInClassData.manualHoursMin,
        unit: 'hours',
        icon: Settings,
        higherIsBetter: false,
        performance: 'below-average',
        gapToAverage: 0,
        gapToBestInClass: 0,
        revenueOpportunity: processOpportunity,
        strategicAdvantage: false
      }
    ];

    // Calculate performance and strategic opportunities
    metrics.forEach(metric => {
      if (metric.higherIsBetter) {
        // For metrics where higher is better
        if (metric.userValue >= metric.bestInClass) {
          metric.performance = 'best-in-class';
          metric.strategicAdvantage = true;
        } else if (metric.userValue >= metric.industryAvg * 1.2) {
          metric.performance = 'above-average';
          metric.strategicAdvantage = true;
        } else if (metric.userValue >= metric.industryAvg * 0.8) {
          metric.performance = 'average';
        } else {
          metric.performance = 'below-average';
        }
        
        metric.gapToAverage = metric.industryAvg - metric.userValue;
        metric.gapToBestInClass = metric.bestInClass - metric.userValue;
      } else {
        // For metrics where lower is better
        if (metric.userValue <= metric.bestInClass) {
          metric.performance = 'best-in-class';
          metric.strategicAdvantage = true;
        } else if (metric.userValue <= metric.industryAvg * 0.8) {
          metric.performance = 'above-average';
          metric.strategicAdvantage = true;
        } else if (metric.userValue <= metric.industryAvg * 1.2) {
          metric.performance = 'average';
        } else {
          metric.performance = 'below-average';
        }
        
        metric.gapToAverage = metric.userValue - metric.industryAvg;
        metric.gapToBestInClass = metric.userValue - metric.bestInClass;
      }
    });

    return metrics;
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'best-in-class': return { icon: Trophy, color: 'text-revenue-primary', bg: 'bg-revenue-primary/10' };
      case 'above-average': return { icon: CheckCircle, color: 'text-revenue-success', bg: 'bg-revenue-success/10' };
      case 'average': return { icon: Target, color: 'text-revenue-warning', bg: 'bg-revenue-warning/10' };
      case 'below-average': return { icon: AlertTriangle, color: 'text-revenue-danger', bg: 'bg-revenue-danger/10' };
      default: return { icon: Target, color: 'text-muted-foreground', bg: 'bg-muted/10' };
    }
  };

  const getPerformanceLabel = (performance: string) => {
    switch (performance) {
      case 'best-in-class': return '🏆 Best-in-Class';
      case 'above-average': return '✅ Above Average';
      case 'average': return '📊 Industry Average';
      case 'below-average': return '📈 Growth Opportunity';
      default: return 'Unknown';
    }
  };

  const getPerformanceGauge = (metric: BenchmarkMetric) => {
    let progressValue: number;
    let progressColor: string;

    // Calculate progress as percentage towards best-in-class
    if (metric.higherIsBetter) {
      progressValue = Math.min((metric.userValue / metric.bestInClass) * 100, 100);
      // Ensure a minimum visible progress for non-zero values
      if (metric.userValue > 0 && progressValue < 5) {
        progressValue = 5; // Minimum 5% for visibility
      }
    } else {
      // For "lower is better" metrics, invert the scale
      const maxValue = Math.max(metric.userValue, metric.industryAvg * 2);
      progressValue = Math.max(100 - ((metric.userValue / maxValue) * 100), 0);
      // Ensure some progress is shown even for poor performance
      if (progressValue < 5) {
        progressValue = 5;
      }
    }

    // Debug log for conversion rate specifically
    if (metric.id === 'conversion-rate') {
      console.log('=== CONVERSION RATE PROGRESS DEBUG ===');
      console.log('User Value:', metric.userValue);
      console.log('Best in Class:', metric.bestInClass);
      console.log('Industry Avg:', metric.industryAvg);
      console.log('Calculated Progress Value:', progressValue);
      console.log('Higher is Better:', metric.higherIsBetter);
      console.log('Revenue Opportunity:', metric.revenueOpportunity);
      console.log('Performance:', metric.performance);
    }

    switch (metric.performance) {
      case 'best-in-class': progressColor = 'bg-revenue-primary'; break;
      case 'above-average': progressColor = 'bg-revenue-success'; break;
      case 'average': progressColor = 'bg-revenue-warning'; break;
      case 'below-average': progressColor = 'bg-revenue-danger'; break;
      default: progressColor = 'bg-muted';
    }

    return { value: progressValue, color: progressColor };
  };

  const getContextualMessage = (metric: BenchmarkMetric): string => {
    const confidenceNote = confidenceLevel.level === 'low' ? ' (estimate)' : '';
    
    switch (metric.id) {
      case 'lead-response':
        if (metric.performance === 'below-average') {
          const bestInClassMinutes = Math.round(metric.bestInClass * 60);
          const revenueImpact = metric.revenueOpportunity > 0 ? formatCurrency(metric.revenueOpportunity) : '';
          const dailyLoss = metric.revenueOpportunity > 0 ? formatCurrency(metric.revenueOpportunity / 365) : '';
          return `🚨 CRITICAL: Slow response bleeding ${revenueImpact} annually (${dailyLoss}/day). Emergency protocol: ${bestInClassMinutes}-minute response required${confidenceNote}`;
        } else if (metric.performance === 'best-in-class') {
          return `🏆 You've achieved best-in-class response time - massive competitive advantage!`;
        }
        return `⚡ Strong response time, but best-in-class performers respond in ${Math.round(metric.bestInClass * 60)} minutes`;
      
      case 'conversion-rate':
        if (metric.performance === 'below-average') {
          const revenueImpact = metric.revenueOpportunity > 0 ? formatCurrency(metric.revenueOpportunity) : '';
          const dailyLoss = metric.revenueOpportunity > 0 ? formatCurrency(metric.revenueOpportunity / 365) : '';
          return `🚨 CRITICAL: Conversion failure bleeding ${revenueImpact} annually (${dailyLoss}/day). Emergency target: ${metric.bestInClass}% conversion rate${confidenceNote}`;
        } else if (metric.performance === 'best-in-class') {
          return `🏆 Best-in-class conversion rate - you're maximizing every signup!`;
        }
        return `📈 Above average, but ${metric.bestInClass}% is achievable for top performers`;
      
      case 'payment-failure':
        if (metric.performance === 'below-average') {
          const dailyLoss = metric.revenueOpportunity > 0 ? formatCurrency(metric.revenueOpportunity / 365) : '';
          return `🚨 CRITICAL: Payment failures bleeding ${formatCurrency(metric.revenueOpportunity)} annually (${dailyLoss}/day). Emergency target: ${metric.bestInClass}% failure rate${confidenceNote}`;
        } else if (metric.performance === 'best-in-class') {
          return `🏆 Best-in-class payment processing - minimal revenue loss!`;
        }
        return `💳 Good payment processing, but ${metric.bestInClass}% is the gold standard`;
      
      case 'process-efficiency':
        if (metric.performance === 'below-average') {
          const hoursSaved = Math.round(metric.userValue - metric.bestInClass);
          const dailyLoss = metric.revenueOpportunity > 0 ? formatCurrency(metric.revenueOpportunity / 365) : '';
          return `🚨 CRITICAL: Manual processes bleeding ${formatCurrency(metric.revenueOpportunity)} annually (${dailyLoss}/day). Emergency automation needed: reduce to ${metric.bestInClass} hours/week${confidenceNote}`;
        } else if (metric.performance === 'best-in-class') {
          return `🏆 Highly automated operations - maximum efficiency achieved!`;
        }
        return `🔧 Efficient operations, but ${metric.bestInClass} hours/week is possible with full automation`;
      
      default:
        return '';
    }
  };

  const metrics = calculateBenchmarks();
  const confidenceLevel = getCalculationConfidenceLevel({
    currentARR: submission.current_arr || 0,
    monthlyLeads: submission.monthly_leads || 0,
    monthlyFreeSignups: submission.monthly_free_signups || 0,
    totalLeak: submission.total_leak || 0
  });
  
  const biggestOpportunity = metrics.reduce((max, metric) => 
    metric.revenueOpportunity > max.revenueOpportunity ? metric : max
  );
  const strategicOpportunities = metrics.filter(metric => 
    metric.performance === 'below-average' && metric.revenueOpportunity > 0
  );
  const competitiveAdvantages = metrics.filter(metric => 
    metric.strategicAdvantage === true
  );
  
  const totalRevenueOpportunity = metrics.reduce((sum, metric) => sum + metric.revenueOpportunity, 0);

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-blue-500">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-primary flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    PERFORMANCE INSIGHTS & OPPORTUNITIES
                    <Badge variant="secondary">ANALYSIS READY</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Strategic benchmarking analysis complete • Growth opportunities identified
                  {confidenceLevel.level !== 'high' && (
                    <span className="text-orange-600"> • {confidenceLevel.level} confidence</span>
                  )}
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-4">
                <ChevronDown className={`h-4 w-4 transition-transform ${isContentOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <CardContent className="space-y-8 pt-6">
              {/* Strategic Opportunity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg border-2 border-primary/30">
                <div>
                  <h3 className="font-semibold text-sm text-primary mb-1">💰 Growth Opportunity</h3>
                  <p className="text-sm text-muted-foreground">Annual revenue potential</p>
                  <div className="text-xl font-bold text-primary">
                    {totalRevenueOpportunity > 0 ? formatCurrency(totalRevenueOpportunity) : 'Optimized'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {totalRevenueOpportunity > 0 ? formatCurrency(totalRevenueOpportunity / 365) + '/day potential' : ''}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-blue-600 mb-1">📈 Improvement Areas</h3>
                  <p className="text-sm text-muted-foreground">{strategicOpportunities.length} optimization opportunities</p>
                  <div className="text-lg font-bold text-blue-600">
                    {strategicOpportunities.length > 0 ? `${strategicOpportunities.length} growth areas` : 'Performance optimized'}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-revenue-success mb-1">✅ Strong Performance</h3>
                  <p className="text-sm text-muted-foreground">{competitiveAdvantages.length} above-average metrics</p>
                  <div className="text-lg font-bold text-revenue-success">
                    {competitiveAdvantages.length} competitive advantages
                  </div>
                </div>
              </div>

              {/* Performance Analysis with Strategic Blur Overlay */}
              <div className="relative min-h-[600px]">
                <div>
                  <h3 className="text-lg font-semibold mb-6 text-primary">📊 Performance Benchmarking: Current Position → Growth Potential</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {metrics.map((metric) => {
                      const Icon = metric.icon;
                      const performanceIcon = getPerformanceIcon(metric.performance);
                      const gauge = getPerformanceGauge(metric);
                      const PerformanceIcon = performanceIcon.icon;

                      return (
                        <Card key={metric.id} className="border-border/30">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{metric.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className={`p-1 rounded ${performanceIcon.bg}`}>
                                      <PerformanceIcon className={`h-3 w-3 ${performanceIcon.color}`} />
                                    </div>
                                    <span className={`text-sm font-medium ${performanceIcon.color}`}>
                                      {getPerformanceLabel(metric.performance)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                              <div className="space-y-4">
                               <div className="grid grid-cols-3 gap-4 text-sm">
                                 <div>
                                   <div className="text-muted-foreground">Your Performance</div>
                                   <div className="font-bold text-lg">
                                     {metric.userValue}{metric.unit}
                                   </div>
                                 </div>
                                 <div>
                                   <div className="text-muted-foreground">Industry Average</div>
                                   <div className="font-medium text-lg">
                                     {metric.industryAvg}{metric.unit}
                                   </div>
                                 </div>
                                 <div>
                                   <div className="text-muted-foreground">Best-in-Class</div>
                                   <div className="font-bold text-lg text-revenue-primary">
                                     {Math.round(metric.bestInClass * 10) / 10}{metric.unit}
                                   </div>
                                 </div>
                               </div>

                               <div className="space-y-3">
                                 <div className="flex justify-between text-sm">
                                   <span>Progress to Best-in-Class</span>
                                   <span className="font-medium">{Math.round(gauge.value)}%</span>
                                 </div>
                                 <div className="relative">
                                   <Progress value={gauge.value} className="h-4" />
                                   <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="text-xs font-medium text-white mix-blend-difference">
                                       {metric.performance === 'best-in-class' ? '🏆' : `${Math.round(gauge.value)}%`}
                                     </div>
                                  </div>
                                </div>
                                 
                                 {/* Revenue Opportunity Display */}
                                 {metric.revenueOpportunity > 0 && (
                                   <div className="mt-2 p-2 bg-revenue-primary/10 rounded text-xs">
                                     <span className="font-medium text-revenue-primary">
                                       💰 {formatCurrency(metric.revenueOpportunity)} annual opportunity
                                     </span>
                                   </div>
                                 )}
                              </div>

                               <div className="text-sm bg-muted/30 p-4 rounded-lg border-l-2 border-l-primary">
                                 {getContextualMessage(metric)}
                               </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Strategic Performance Analysis Overlay */}
                <div className="absolute inset-0 bg-background/65 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 border border-border/50">
                  <div className="text-center p-8 max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      Detailed Performance Analysis Available
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Get comprehensive benchmarking insights with industry comparisons, competitive positioning, and strategic improvement recommendations.
                    </p>
                    <Button 
                      onClick={() => window.open('https://cal.com/rev-calculator/revenuecalculator-strategy-session', '_blank')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Book Strategy Session
                    </Button>
                  </div>
                </div>
              </div>

              {/* Confidence Level Information */}
              {confidenceLevel.level !== 'high' && (
                <div className="mb-6 p-4 border border-revenue-warning/30 bg-revenue-warning/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-revenue-warning" />
                    <h4 className="font-medium text-revenue-warning">Calculation Confidence: {confidenceLevel.level.charAt(0).toUpperCase() + confidenceLevel.level.slice(1)}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The benchmarking accuracy is {confidenceLevel.level === 'low' ? 'limited' : 'moderate'} based on your provided data. 
                    To improve accuracy, consider:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {confidenceLevel.factors.map((factor, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-revenue-warning/70"></span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Industry Context with Strategic Blur Overlay */}
              <div className="relative min-h-[300px]">
                <Card className="border-primary/20 bg-gradient-to-r from-background to-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Industry Context & Opportunities</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 text-revenue-danger">Priority Improvements:</h4>
                        <ul className="space-y-2">
                           {metrics.filter(m => m.performance === 'below-average').map(metric => (
                             <li key={metric.id} className="flex items-center gap-2 text-sm">
                               <AlertTriangle className="h-4 w-4 text-revenue-danger" />
                               <span>{metric.title}: {Math.abs(metric.gapToAverage).toFixed(0)} {metric.unit} gap to average</span>
                             </li>
                           ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3 text-revenue-success">Current Strengths:</h4>
                        <ul className="space-y-2">
                           {competitiveAdvantages.map(metric => (
                             <li key={metric.id} className="flex items-center gap-2 text-sm">
                               <CheckCircle className="h-4 w-4 text-revenue-success" />
                               <span>{metric.title}: {metric.performance === 'best-in-class' ? 'Best-in-class performance' : 'Above average'}</span>
                             </li>
                           ))}
                          {competitiveAdvantages.length === 0 && (
                            <li className="text-sm text-muted-foreground">
                              Focus on reaching industry benchmarks first
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Strategic Industry Analysis Overlay */}
                <div className="absolute inset-0 bg-background/65 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 border border-border/50">
                  <div className="text-center p-8 max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      Strategic Competitive Analysis Available
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Access detailed industry comparisons, competitive positioning insights, and strategic recommendations for market leadership.
                    </p>
                    <Button 
                      onClick={() => window.open('https://cal.com/rev-calculator/revenuecalculator-strategy-session', '_blank')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Book Strategy Session
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};
