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
    <div className="space-y-8">
      {/* Executive Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600" />
        </div>
        
        <div className="relative p-8 md:p-12">
          {/* Authority Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white shadow-lg border">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
                  Revenue Recovery Analysis
                </h1>
                <p className="text-slate-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Enterprise-grade assessment • 2,800+ companies analyzed
                </p>
              </div>
            </div>
            
            <Badge variant={config.variant} className="hidden md:flex text-sm font-semibold px-4 py-2">
              <UrgencyIcon className="h-4 w-4 mr-2" />
              {urgencyLevel} Priority
            </Badge>
          </div>

          {/* Company Identity */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{submission.company_name}</h2>
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="bg-white/80">
                <BarChart3 className="h-3 w-3 mr-1" />
                {submission.industry || 'Technology'}
              </Badge>
              <Badge variant="outline" className="bg-white/80">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatCurrency(submission.current_arr || 0)} ARR
              </Badge>
              <Badge variant="outline" className="bg-white/80">
                <Calendar className="h-3 w-3 mr-1" />
                Analyzed today
              </Badge>
            </div>
          </div>

          {/* Key Executive Metrics - Hero Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Revenue at Risk */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-sm font-medium text-red-700">Revenue at Risk</div>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {formatCurrency(totalLeakage)}
              </div>
              <div className="text-sm text-slate-600">
                {leakagePercentage}% of current ARR • Compounds monthly
              </div>
            </div>

            {/* Recovery Potential */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-50">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-sm font-medium text-green-700">Recovery Potential</div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(realisticRecovery)}
              </div>
              <div className="text-sm text-slate-600">
                {confidenceLevel} confidence • 12-18 month target
              </div>
            </div>

            {/* ROI Impact */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-blue-700">ROI Multiplier</div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {roiMultiplier}x
              </div>
              <div className="text-sm text-slate-600">
                {paybackMonths}-month payback period
              </div>
            </div>
          </div>

          {/* Executive Summary Statement */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Executive Summary
            </h3>
            <p className="text-slate-700 leading-relaxed text-base">
              Our comprehensive analysis of {submission.company_name} reveals{' '}
              <span className="font-semibold text-red-600">{formatCurrency(totalLeakage)}</span> in 
              annual revenue optimization opportunities. With systematic implementation, we project{' '}
              <span className="font-semibold text-green-600">{formatCurrency(realisticRecovery)}</span> in 
              recoverable revenue within 18 months, delivering a{' '}
              <span className="font-semibold text-blue-600">{roiMultiplier}x ROI</span> on optimization investments.
            </p>
          </div>

          {/* Implementation Timeline Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-700">30d</span>
                </div>
                <div>
                  <div className="font-semibold text-green-700 text-sm">Quick Wins</div>
                  <div className="text-xs text-green-600">{formatCurrency(realisticRecovery * 0.25)}</div>
                </div>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full w-1/4"></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-700">90d</span>
                </div>
                <div>
                  <div className="font-semibold text-blue-700 text-sm">Core Systems</div>
                  <div className="text-xs text-blue-600">{formatCurrency(realisticRecovery * 0.65)}</div>
                </div>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-2/3"></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-700">180d</span>
                </div>
                <div>
                  <div className="font-semibold text-purple-700 text-sm">Full Optimization</div>
                  <div className="text-xs text-purple-600">{formatCurrency(realisticRecovery)}</div>
                </div>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          {/* Executive Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={onGetActionPlan}
              size="lg" 
              className="flex-1 text-base font-semibold h-14 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
            >
              <Target className="h-5 w-5 mr-2" />
              Get Strategic Action Plan
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              onClick={onViewFullAnalysis}
              variant="outline" 
              size="lg"
              className="flex-1 text-base font-medium h-14 bg-white hover:bg-slate-50 transition-all duration-300 rounded-xl border-2"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              View Detailed Analysis
            </Button>
          </div>

          {/* Urgency Indicator */}
          {urgencyLevel === 'Critical' && (
            <div className="mt-6 flex items-center justify-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Clock className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-700">
                Time-sensitive opportunity - Revenue leak compounds {formatCurrency(totalLeakage/12)} monthly
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Professional Authority Footer */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Analysis Standards & Methodology
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Fortune 500 Validated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span>CRO Best Practices</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>Data-Driven Insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};