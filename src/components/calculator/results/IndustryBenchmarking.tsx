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
import { industryDefaults, IndustryBenchmarks } from '@/lib/industryDefaults';
import { getCalculationConfidenceLevel } from '@/lib/calculator/validationHelpers';

interface IndustryBenchmarkingProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  variant?: 'condensed' | 'standard' | 'detailed' | 'competitive';
}

interface BenchmarkMetric {
  id: string;
  title: string;
  userValue: number;
  industryMin: number;
  industryMax: number;
  industryAvg: number;
  unit: string;
  icon: any;
  higherIsBetter: boolean;
  performance: 'below' | 'average' | 'above' | 'leading';
  gapPercentage: number;
  opportunityScore: number;
}

export const IndustryBenchmarking = ({ submission, formatCurrency, variant = 'standard' }: IndustryBenchmarkingProps) => {
  const [isContentOpen, setIsContentOpen] = useState(variant === 'detailed' ? true : false);

  const calculateBenchmarks = (): BenchmarkMetric[] => {
    // Map submission industry to benchmark keys with robust fallback
    // Strip special characters and normalize industry name
    const normalizedIndustry = (submission.industry || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    
    // Create array of possible matches to handle partial matches
    const industryKeys = Object.keys(industryDefaults);
    const exactMatch = industryKeys.find(key => key === normalizedIndustry);
    const partialMatch = !exactMatch ? 
      industryKeys.find(key => normalizedIndustry.includes(key) || key.includes(normalizedIndustry)) : 
      null;
      
    // Use exact match, partial match, or appropriate fallback
    const industryKey = (exactMatch || partialMatch || 
      (normalizedIndustry.includes('saas') ? 'saas-software' : 'other')) as keyof typeof industryDefaults;
      
    const industryData = industryDefaults[industryKey];
    
    // Calculate confidence level for validation warnings
    const confidenceLevel = getCalculationConfidenceLevel({
      currentARR: submission.current_arr || 0,
      monthlyLeads: submission.monthly_leads || 0,
      monthlyFreeSignups: submission.monthly_free_signups || 0,
      totalLeak: submission.total_leak || 0
    });

    // Get optimal lead response time based on deal size
    const avgDealValue = submission.average_deal_value || 0;
    const optimalResponseTime = avgDealValue > 50000 ? 1 : avgDealValue > 10000 ? 1.5 : 2;
    
    const metrics: BenchmarkMetric[] = [
      {
        id: 'lead-response',
        title: 'Lead Response Time',
        userValue: submission.lead_response_time || 0,
        industryMin: optimalResponseTime,
        industryMax: industryData.leadResponseTimeHours * 2,
        industryAvg: industryData.leadResponseTimeHours,
        unit: 'hours',
        icon: Clock,
        higherIsBetter: false,
        performance: 'below',
        gapPercentage: 0,
        opportunityScore: 0
      },
      {
        id: 'conversion-rate',
        title: 'Self-Serve Conversion Rate',
        userValue: submission.free_to_paid_conversion || 0,
        industryMin: industryData.freeToPaidConversionRate * 0.7,
        industryMax: industryData.freeToPaidConversionRate * 1.5,
        industryAvg: industryData.freeToPaidConversionRate,
        unit: '%',
        icon: Target,
        higherIsBetter: true,
        performance: 'below',
        gapPercentage: 0,
        opportunityScore: 0
      },
      {
        id: 'payment-failure',
        title: 'Failed Payment Rate',
        userValue: submission.failed_payment_rate || 0,
        industryMin: industryData.failedPaymentRate * 0.5,
        industryMax: industryData.failedPaymentRate * 1.8,
        industryAvg: industryData.failedPaymentRate,
        unit: '%',
        icon: CreditCard,
        higherIsBetter: false,
        performance: 'below',
        gapPercentage: 0,
        opportunityScore: 0
      },
      {
        id: 'process-efficiency',
        title: 'Manual Hours per Week',
        userValue: submission.manual_hours || 0,
        industryMin: industryData.manualHours * 0.5,
        industryMax: industryData.manualHours * 1.8,
        industryAvg: industryData.manualHours,
        unit: 'hours',
        icon: Settings,
        higherIsBetter: false,
        performance: 'below',
        gapPercentage: 0,
        opportunityScore: 0
      }
    ];

  // Calculate performance and gaps
    metrics.forEach(metric => {
      if (metric.higherIsBetter) {
        if (metric.userValue >= metric.industryMax) {
          metric.performance = 'leading';
          metric.gapPercentage = ((metric.userValue - metric.industryAvg) / metric.industryAvg) * 100;
        } else if (metric.userValue >= metric.industryAvg) {
          metric.performance = 'above';
          metric.gapPercentage = ((metric.userValue - metric.industryAvg) / metric.industryAvg) * 100;
        } else if (metric.userValue >= metric.industryMin) {
          metric.performance = 'average';
          metric.gapPercentage = ((metric.userValue - metric.industryAvg) / metric.industryAvg) * 100;
        } else {
          metric.performance = 'below';
          metric.gapPercentage = ((metric.userValue - metric.industryAvg) / metric.industryAvg) * 100;
        }
        
        // For metrics where higher is better, opportunity is the gap to reach average
        metric.opportunityScore = Math.max(0, metric.industryAvg - metric.userValue);
      } else {
        // For metrics where lower is better (like response time)
        if (metric.userValue <= metric.industryMin) {
          metric.performance = 'leading';
          metric.gapPercentage = ((metric.industryAvg - metric.userValue) / metric.industryAvg) * 100;
        } else if (metric.userValue <= metric.industryAvg) {
          metric.performance = 'above';
          metric.gapPercentage = ((metric.industryAvg - metric.userValue) / metric.industryAvg) * 100;
        } else if (metric.userValue <= metric.industryMax) {
          metric.performance = 'average';
          metric.gapPercentage = ((metric.userValue - metric.industryAvg) / metric.industryAvg) * 100;
        } else {
          metric.performance = 'below';
          metric.gapPercentage = ((metric.userValue - metric.industryAvg) / metric.industryAvg) * 100;
        }
        
        // For metrics where lower is better, opportunity is how much above average
        metric.opportunityScore = Math.max(0, metric.userValue - metric.industryAvg);
      }
    });

    return metrics;
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'leading': return { icon: Trophy, color: 'text-revenue-primary', bg: 'bg-revenue-primary/10' };
      case 'above': return { icon: CheckCircle, color: 'text-revenue-success', bg: 'bg-revenue-success/10' };
      case 'average': return { icon: Target, color: 'text-revenue-warning', bg: 'bg-revenue-warning/10' };
      case 'below': return { icon: AlertTriangle, color: 'text-revenue-danger', bg: 'bg-revenue-danger/10' };
      default: return { icon: Target, color: 'text-muted-foreground', bg: 'bg-muted/10' };
    }
  };

  const getPerformanceLabel = (performance: string) => {
    switch (performance) {
      case 'leading': return '🎯 Industry Leading';
      case 'above': return '✅ Above Average';
      case 'average': return '📊 Industry Average';
      case 'below': return '⚠️ Below Average';
      default: return 'Unknown';
    }
  };

  const getPerformanceGauge = (metric: BenchmarkMetric) => {
    let progressValue: number;
    let progressColor: string;

    if (metric.higherIsBetter) {
      progressValue = Math.min((metric.userValue / metric.industryMax) * 100, 100);
    } else {
      progressValue = Math.max(100 - ((metric.userValue / metric.industryMax) * 100), 0);
    }

    switch (metric.performance) {
      case 'leading': progressColor = 'bg-revenue-primary'; break;
      case 'above': progressColor = 'bg-revenue-success'; break;
      case 'average': progressColor = 'bg-revenue-warning'; break;
      case 'below': progressColor = 'bg-revenue-danger'; break;
      default: progressColor = 'bg-muted';
    }

    return { value: progressValue, color: progressColor };
  };

  const getContextualMessage = (metric: BenchmarkMetric): string => {
    const gapText = Math.abs(metric.gapPercentage).toFixed(0);
    const confidenceNote = confidenceLevel.level === 'low' ? ' (low confidence)' : '';
    
    switch (metric.id) {
      case 'lead-response':
        if (metric.performance === 'below') {
          const timesFactor = metric.userValue > metric.industryAvg ? 
            Math.round(metric.userValue / metric.industryAvg) : 1;
          return `Your lead response is ${timesFactor}x slower than industry average${confidenceNote} - major revenue opportunity`;
        }
        return `Excellent lead response time - you're ${gapText}% faster than average!`;
      
      case 'conversion-rate':
        if (metric.performance === 'below') {
          // More accurate percentage calculation that handles zero values
          const improvementPercent = metric.userValue > 0 ?
            Math.round((metric.industryAvg - metric.userValue) / Math.max(0.1, metric.userValue) * 100) :
            Math.round(metric.industryAvg * 100);
          return `Your conversion rate has ${improvementPercent}% improvement potential${confidenceNote}`;
        }
        return `Strong conversion performance - ${gapText}% above industry standard!`;
      
      case 'payment-failure':
        if (metric.performance === 'above' || metric.performance === 'leading') {
          return `You're already above average in payment processing - ${gapText}% better than typical${confidenceNote}`;
        }
        return `Payment failures are ${Math.abs(metric.gapPercentage).toFixed(0)}% higher than industry average${confidenceNote}`;
      
      case 'process-efficiency':
        if (metric.performance === 'below') {
          const hoursDiff = Math.round(metric.userValue - metric.industryAvg);
          return `High manual workload - ${hoursDiff} more hours than industry average${confidenceNote}`;
        }
        return `Efficient operations - ${gapText}% better than industry standard!`;
      
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
    metric.opportunityScore > max.opportunityScore ? metric : max
  );
  const quickWins = metrics.filter(metric => 
    metric.performance === 'average' || (metric.performance === 'below' && metric.opportunityScore < biggestOpportunity.opportunityScore)
  );
  const competitiveAdvantages = metrics.filter(metric => 
    metric.performance === 'above' || metric.performance === 'leading'
  );

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <Collapsible open={isContentOpen} onOpenChange={setIsContentOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Industry Benchmarking</CardTitle>
                <p className="text-muted-foreground mt-1">
                  See how your performance compares to {submission.industry || 'SaaS'} industry standards 
                  {confidenceLevel.level !== 'high' && (
                    <span className="text-revenue-warning"> • {confidenceLevel.level} confidence</span>
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
              {/* Opportunity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-background to-primary/5 rounded-lg border">
                <div>
                  <h3 className="font-semibold text-sm text-revenue-danger mb-1">Biggest Opportunity</h3>
                  <p className="text-sm text-muted-foreground">{biggestOpportunity.title}</p>
                  <div className="text-lg font-bold text-revenue-danger">
                    {Math.abs(biggestOpportunity.gapPercentage).toFixed(0)}% gap
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-revenue-warning mb-1">Quick Win Potential</h3>
                  <p className="text-sm text-muted-foreground">{quickWins.length} metrics ready for improvement</p>
                  <div className="text-lg font-bold text-revenue-warning">
                    {quickWins.length} opportunities
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-revenue-success mb-1">Competitive Advantages</h3>
                  <p className="text-sm text-muted-foreground">{competitiveAdvantages.length} above-average metrics</p>
                  <div className="text-lg font-bold text-revenue-success">
                    {competitiveAdvantages.length} strengths
                  </div>
                </div>
              </div>

              {/* Performance Comparison */}
              <div>
                <h3 className="text-lg font-semibold mb-6">📊 Your Performance vs Industry Average</h3>
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
                            <div className="grid grid-cols-2 gap-4 text-sm">
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
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Performance Score</span>
                                <span className="font-medium">{Math.round(gauge.value)}%</span>
                              </div>
                              <div className="relative">
                                <Progress value={gauge.value} className="h-3" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-xs font-medium text-white mix-blend-difference">
                                    {metric.gapPercentage > 0 ? '+' : ''}{metric.gapPercentage.toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Range: {metric.industryMin}{metric.unit} - {metric.industryMax}{metric.unit}
                              </div>
                            </div>

                            <div className="p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                {getContextualMessage(metric)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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

              {/* Industry Context */}
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
                        {metrics.filter(m => m.performance === 'below').map(metric => (
                          <li key={metric.id} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-revenue-danger" />
                            <span>{metric.title}: {Math.abs(metric.gapPercentage).toFixed(0)}% below average</span>
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
                            <span>{metric.title}: {Math.abs(metric.gapPercentage).toFixed(0)}% above average</span>
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
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};