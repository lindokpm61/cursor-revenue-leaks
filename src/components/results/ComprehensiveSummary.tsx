
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Clock, 
  Target, 
  TrendingDown, 
  Zap,
  Activity,
  FileText,
  ExternalLink
} from "lucide-react";

interface ComprehensiveSummaryProps {
  submission: any;
  formatCurrency: (amount: number) => string;
  onExpandSection: (sectionId: string) => void;
}

export const ComprehensiveSummary = ({ submission, formatCurrency, onExpandSection }: ComprehensiveSummaryProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const dailyLoss = (submission.totalLoss || 0) / 365;
  const weeklyLoss = (submission.totalLoss || 0) / 52;
  const monthlyLoss = (submission.totalLoss || 0) / 12;

  const crisisMetrics = [
    {
      id: 'bleeding-rate',
      title: 'Revenue Hemorrhaging Rate',
      value: formatCurrency(submission.totalLoss || 0),
      subtitle: 'Annual bleeding',
      icon: TrendingDown,
      status: 'critical',
      details: `Daily: ${formatCurrency(dailyLoss)} • Weekly: ${formatCurrency(weeklyLoss)} • Monthly: ${formatCurrency(monthlyLoss)}`
    },
    {
      id: 'emergency-recovery',
      title: 'Emergency Recovery Potential',
      value: formatCurrency(submission.conservativeRecovery || 0),
      subtitle: 'IF immediate action taken',
      icon: Target,
      status: 'recovery',
      details: `Conservative estimate with 70% confidence level`
    },
    {
      id: 'crisis-timeline',
      title: 'Crisis Response Window',
      value: '72 hours',
      subtitle: 'Time-sensitive intervention',
      icon: Clock,
      status: 'warning',
      details: `Every hour of delay reduces recovery potential by 2-3%`
    },
    {
      id: 'severity-assessment',
      title: 'Crisis Severity Level',
      value: 'CRITICAL',
      subtitle: 'Emergency intervention required',
      icon: AlertTriangle,
      status: 'critical',
      details: `Multiple bleeding points detected across all revenue streams`
    }
  ];

  const emergencyActions = [
    {
      id: 'lead-response',
      title: '🚨 Lead Response Crisis',
      description: 'IMMEDIATE: Stop lead hemorrhaging',
      impact: formatCurrency(submission.leadResponseLoss || 0),
      timeframe: 'Emergency (24-48h)',
      status: 'critical'
    },
    {
      id: 'payment-recovery',
      title: '💸 Payment Recovery Emergency',
      description: 'URGENT: Recover failed payments',
      impact: formatCurrency(submission.failedPaymentLoss || 0),
      timeframe: 'Crisis (48-72h)',
      status: 'urgent'
    },
    {
      id: 'conversion-bleeding',
      title: '🩸 Conversion Bleeding',
      description: 'CRITICAL: Fix conversion hemorrhaging',
      impact: formatCurrency(submission.selfServeGap || 0),
      timeframe: 'Emergency (1-2 weeks)',
      status: 'urgent'
    },
    {
      id: 'process-bleeding',
      title: '⚙️ Process Bleeding',
      description: 'VITAL: Automate bleeding processes',
      impact: formatCurrency(submission.processInefficiency || 0),
      timeframe: 'Stabilization (2-4 weeks)',
      status: 'medium'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'recovery': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Crisis Status Header */}
      <Card className="border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/20 animate-pulse">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl text-destructive">🚨 FINANCIAL EMERGENCY STATUS REPORT</CardTitle>
              <p className="text-destructive/80 mt-1">
                Comprehensive crisis assessment for {submission.company_name}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Crisis Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {crisisMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.id} className="border-destructive/20 hover:border-destructive/30 transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${metric.status === 'critical' ? 'bg-red-100' : metric.status === 'recovery' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <Icon className={`h-6 w-6 ${metric.status === 'critical' ? 'text-red-600' : metric.status === 'recovery' ? 'text-green-600' : 'text-yellow-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive mb-1">{metric.title}</h3>
                    <div className="text-2xl font-bold text-destructive mb-2">{metric.value}</div>
                    <p className="text-sm text-destructive/80 mb-2">{metric.subtitle}</p>
                    <p className="text-xs text-destructive/60">{metric.details}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Action Plan */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-xl text-destructive flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Emergency Action Plan
          </CardTitle>
          <p className="text-destructive/80">
            Critical interventions required to stop revenue bleeding
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emergencyActions.map((action, index) => (
              <div key={action.id} className="border border-destructive/20 rounded-lg p-4 hover:bg-destructive/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-bold text-destructive">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-destructive">{action.title}</h4>
                      <Badge className={getStatusColor(action.status)}>
                        {action.status === 'critical' ? 'CRITICAL' : action.status === 'urgent' ? 'URGENT' : 'MEDIUM'}
                      </Badge>
                    </div>
                    <p className="text-sm text-destructive/80 mb-3">{action.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        {action.timeframe}
                      </span>
                      <span className="font-medium text-destructive">
                        Bleeding: {action.impact}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExpandSection(action.id)}
                    className="border-destructive/20 text-destructive hover:bg-destructive/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Crisis Timeline */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-xl text-destructive flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Crisis Response Timeline
          </CardTitle>
          <p className="text-destructive/80">
            Time-sensitive emergency intervention schedule
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-destructive/20"></div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-destructive">Emergency Triage (0-24h)</h4>
                    <p className="text-sm text-destructive/80">Stop critical bleeding points immediately</p>
                    <div className="text-xs text-destructive/60 mt-1">Impact: {formatCurrency(dailyLoss)} daily savings</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-destructive">Crisis Stabilization (1-7 days)</h4>
                    <p className="text-sm text-destructive/80">Implement emergency recovery measures</p>
                    <div className="text-xs text-destructive/60 mt-1">Impact: {formatCurrency(weeklyLoss)} weekly recovery</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-destructive">Recovery Protocol (2-8 weeks)</h4>
                    <p className="text-sm text-destructive/80">Full system recovery implementation</p>
                    <div className="text-xs text-destructive/60 mt-1">Impact: {formatCurrency(monthlyLoss)} monthly recovery</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crisis Alert Footer */}
      <Alert className="border-destructive/30 bg-destructive/5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          <strong>CRITICAL REMINDER:</strong> Your business is hemorrhaging {formatCurrency(dailyLoss)} daily. 
          Every moment of delay increases financial damage. Emergency intervention is required within 72 hours 
          to maximize recovery potential.
        </AlertDescription>
      </Alert>
    </div>
  );
};
