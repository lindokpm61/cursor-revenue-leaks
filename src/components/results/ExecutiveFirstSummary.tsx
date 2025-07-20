import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  Shield, 
  Award,
  Clock,
  Users,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Building2,
  BarChart3,
  Calendar,
  DollarSign
} from "lucide-react";
import { type Submission } from "@/lib/supabase";
import { calculateExecutiveSummary } from "@/lib/calculator/priorityCalculations";

interface ExecutiveFirstSummaryProps {
  submission: Submission;
  formatCurrency: (amount: number) => string;
  onGetActionPlan: () => void;
  onViewFullAnalysis: () => void;
}

export const ExecutiveFirstSummary = ({ 
  submission, 
  formatCurrency, 
  onGetActionPlan, 
  onViewFullAnalysis 
}: ExecutiveFirstSummaryProps) => {
  const executiveSummary = calculateExecutiveSummary(submission as any);
  const { totalLeakage, realisticRecovery, urgencyLevel, confidenceLevel } = executiveSummary;

  // Calculate key metrics for executive consumption
  const roiMultiplier = submission.current_arr && submission.current_arr > 0 
    ? Math.round((realisticRecovery / submission.current_arr) * 100) / 100
    : 0;
  
  const paybackMonths = submission.current_arr && submission.current_arr > 0
    ? Math.max(1, Math.round((totalLeakage * 0.15) / (realisticRecovery / 12)))
    : 12;

  const leakagePercentage = submission.current_arr ? 
    ((totalLeakage / submission.current_arr) * 100).toFixed(1) : '0';

  const urgencyConfig = {
    Critical: { 
      variant: 'destructive' as const, 
      icon: AlertTriangle, 
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      accentColor: 'bg-red-500'
    },
    High: { 
      variant: 'destructive' as const, 
      icon: TrendingUp, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      accentColor: 'bg-orange-500'
    },
    Medium: { 
      variant: 'outline' as const, 
      icon: Target, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      accentColor: 'bg-blue-500'
    },
    Low: { 
      variant: 'secondary' as const, 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      accentColor: 'bg-green-500'
    }
  };

  const config = urgencyConfig[urgencyLevel];
  const UrgencyIcon = config.icon;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Executive Hero Section */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600" />
        </div>
        
        <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
          {/* Mobile Priority Badge - Show at top on mobile */}
          <div className="md:hidden mb-4 flex justify-center">
            <Badge variant={config.variant} className="text-xs font-semibold px-3 py-2">
              <UrgencyIcon className="h-3 w-3 mr-2" />
              {urgencyLevel} Priority
            </Badge>
          </div>

          {/* Authority Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white shadow-lg border self-start">
                <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 leading-tight">
                  Revenue Recovery Analysis
                </h1>
                <p className="text-sm md:text-base text-slate-600 flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <Shield className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="break-words">Enterprise-grade assessment • 2,800+ companies analyzed</span>
                </p>
              </div>
            </div>
            
            <Badge variant={config.variant} className="hidden md:flex text-sm font-semibold px-4 py-2">
              <UrgencyIcon className="h-4 w-4 mr-2" />
              {urgencyLevel} Priority
            </Badge>
          </div>

          {/* Company Identity */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">{submission.company_name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white/80 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 mr-1" />
                {submission.industry || 'Technology'}
              </Badge>
              <Badge variant="outline" className="bg-white/80 text-xs sm:text-sm">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatCurrency(submission.current_arr || 0)} ARR
              </Badge>
              <Badge variant="outline" className="bg-white/80 text-xs sm:text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                Analyzed today
              </Badge>
            </div>
          </div>

          {/* Key Executive Metrics - Hero Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Revenue at Risk */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-red-100 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="p-2 rounded-lg bg-red-50">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                </div>
                <div className="text-sm font-medium text-red-700">Revenue at Risk</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-red-600 mb-2">
                {formatCurrency(totalLeakage)}
              </div>
              <div className="text-sm text-slate-600">
                {leakagePercentage}% of current ARR • Compounds monthly
              </div>
            </div>

            {/* Recovery Potential */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-green-100">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="p-2 rounded-lg bg-green-50">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <div className="text-sm font-medium text-green-700">Recovery Potential</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(realisticRecovery)}
              </div>
              <div className="text-sm text-slate-600">
                {confidenceLevel} confidence • 12-18 month target
              </div>
            </div>

            {/* ROI Impact */}
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-blue-100">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-blue-700">ROI Multiplier</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                {roiMultiplier}x
              </div>
              <div className="text-sm text-slate-600">
                {paybackMonths}-month payback period
              </div>
            </div>
          </div>

          {/* Executive Summary Statement */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200 mb-6 md:mb-8">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              Executive Summary
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm md:text-base">
              Our comprehensive analysis of {submission.company_name} reveals{' '}
              <span className="font-semibold text-red-600">{formatCurrency(totalLeakage)}</span> in 
              annual revenue optimization opportunities. With systematic implementation, we project{' '}
              <span className="font-semibold text-green-600">{formatCurrency(realisticRecovery)}</span> in 
              recoverable revenue within 18 months, delivering a{' '}
              <span className="font-semibold text-blue-600">{roiMultiplier}x ROI</span> on optimization investments.
            </p>
          </div>

          {/* Implementation Timeline Preview - Mobile Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 border border-green-200">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs md:text-sm font-bold text-green-700">30d</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-green-700 text-xs md:text-sm">Quick Wins</div>
                  <div className="text-xs text-green-600 truncate">{formatCurrency(realisticRecovery * 0.25)}</div>
                </div>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-1/4"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 border border-blue-200">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs md:text-sm font-bold text-blue-700">90d</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-blue-700 text-xs md:text-sm">Core Systems</div>
                  <div className="text-xs text-blue-600 truncate">{formatCurrency(realisticRecovery * 0.65)}</div>
                </div>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-2/3"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 border border-purple-200">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs md:text-sm font-bold text-purple-700">180d</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-purple-700 text-xs md:text-sm">Full Optimization</div>
                  <div className="text-xs text-purple-600 truncate">{formatCurrency(realisticRecovery)}</div>
                </div>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          {/* Executive Action CTAs - Mobile Optimized */}
          <div className="flex flex-col gap-3 md:gap-4">
            <Button 
              onClick={onGetActionPlan}
              size="lg" 
              className="w-full text-xs sm:text-sm md:text-base font-semibold h-12 md:h-14 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl touch-manipulation px-3 sm:px-4"
            >
              <Target className="h-4 w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate min-w-0">
                <span className="hidden sm:inline">Get Strategic Action Plan</span>
                <span className="sm:hidden">Get Action Plan</span>
              </span>
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
            </Button>
            
            <Button 
              onClick={onViewFullAnalysis}
              variant="outline" 
              size="lg"
              className="w-full text-xs sm:text-sm md:text-base font-medium h-12 md:h-14 bg-white hover:bg-slate-50 transition-all duration-300 rounded-xl border-2 touch-manipulation px-3 sm:px-4"
            >
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate min-w-0">
                <span className="hidden sm:inline">View Detailed Analysis</span>
                <span className="sm:hidden">View Analysis</span>
              </span>
            </Button>
          </div>

          {/* Urgency Indicator - Mobile Optimized */}
          {urgencyLevel === 'Critical' && (
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-3 p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
              <span className="text-sm md:text-base font-medium text-red-700 leading-tight">
                Time-sensitive opportunity - Revenue leak compounds {formatCurrency(totalLeakage/12)} monthly
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Professional Authority Footer - Mobile Optimized */}
      <div className="bg-slate-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200">
        <div className="text-center">
          <p className="text-xs md:text-sm font-medium text-slate-700 mb-3">
            Analysis Standards & Methodology
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-xs text-slate-600">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              <span>Fortune 500 Validated</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></div>
              <span>CRO Best Practices</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
              <span>Data-Driven Insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};