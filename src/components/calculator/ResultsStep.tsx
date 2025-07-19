
import { Button } from "@/components/ui/button";
import { CalculatorData, Calculations } from "./useCalculatorData";
import { Save, Calendar, Share2, Download } from "lucide-react";
import { ExecutiveSummary } from "./results/ExecutiveSummary";
import { RevenueCharts } from "./results/RevenueCharts";
import { DetailedBreakdown } from "./results/DetailedBreakdown";
import { ActionPlan } from "./results/ActionPlan";
import { EnhancedInsights } from "./results/EnhancedInsights";
import { useSaveResults } from "./results/useSaveResults";
import { SaveResultsRegistrationModal } from "./SaveResultsRegistrationModal";
import { validateRecoveryAssumptions, type ConfidenceFactors } from '@/lib/calculator/enhancedCalculations';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ResultsStepProps {
  data: CalculatorData;
  calculations: Calculations;
}

export const ResultsStep = ({ data, calculations }: ResultsStepProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    handleSave, 
    saving, 
    showRegistrationModal, 
    pendingData, 
    handleRegistrationSuccess, 
    handleCloseRegistrationModal 
  } = useSaveResults();

  // Create enhanced insights breakdown
  const enhancedBreakdown = {
    leadResponse: {
      dealSizeTier: (data.leadGeneration?.averageDealValue || 0) > 100000 ? 'Enterprise' : 
                   (data.leadGeneration?.averageDealValue || 0) > 25000 ? 'Mid-Market' : 'SMB',
      conversionImpact: calculations.leadResponseLoss,
      responseTimeHours: data.leadGeneration?.leadResponseTimeHours || 0
    },
    failedPayments: {
      recoverySystem: 'Basic System',
      recoveryRate: 0.35,
      actualLossAfterRecovery: calculations.failedPaymentLoss * 0.65
    },
    selfServeGap: {
      industryBenchmark: 15,
      industryName: data.companyInfo?.industry || 'Other',
      gapPercentage: Math.max(0, 15 - (data.selfServeMetrics?.freeToPaidConversionRate || 0)),
      currentConversion: data.selfServeMetrics?.freeToPaidConversionRate || 0
    },
    processInefficiency: {
      revenueGeneratingPotential: calculations.processLoss * 0.3,
      automationPotential: 0.7
    },
    recoveryValidation: (() => {
      const validation = validateRecoveryAssumptions({
        currentARR: data.companyInfo?.currentARR || 0,
        grossRetention: 85,
        netRetention: 100,
        customerSatisfaction: 8,
        hasRevOps: true
      });
      return {
        canAchieve70: validation.canAchieve70,
        canAchieve85: validation.canAchieve85,
        limitations: validation.reasons
      };
    })()
  };
  
  const formatCurrency = (amount: number) => {
    if (!isFinite(amount) || isNaN(amount)) {
      return '$0';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);
  };

  const handleBookConsultation = () => {
    // Primary CTA - no account required
    window.open('https://calendly.com/your-consultation', '_blank');
    
    // Track high-intent action
    toast({
      title: "Consultation Booking",
      description: "Opening calendar to schedule your implementation call",
    });
  };

  const handleShareAnalysis = () => {
    // Copy current URL or create shareable link
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Analysis Shared",
      description: "Link copied to clipboard - you can share this analysis",
    });
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Executive Summary with Immediate Value */}
      <div className="space-y-6">
        <ExecutiveSummary 
          data={data} 
          calculations={calculations} 
          formatCurrency={formatCurrency} 
        />
        
        {/* Immediate Value + Urgency Messaging */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center p-6 bg-gradient-to-r from-primary/5 via-revenue-primary/5 to-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-revenue-primary flex items-center justify-center text-xs font-bold text-white border-2 border-background">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="font-medium">Join 2,847+ executives recovering millions in lost revenue</span>
          </div>
          <div className="text-sm text-revenue-warning font-medium">
            ⏰ Every day of delay costs {formatCurrency(calculations.totalLeakage / 365)}
          </div>
        </div>
      </div>
      
      {/* Optimized CTA Hierarchy - No Registration Barriers */}
      <div className="bg-gradient-to-r from-revenue-success/10 via-primary/5 to-revenue-success/10 border-2 border-revenue-success/20 rounded-xl p-8 text-center space-y-6">
        <div className="space-y-4">
          <h3 className="text-h1 font-bold text-foreground">
            Your {formatCurrency(calculations.totalLeakage)} Recovery Plan
          </h3>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Complete analysis ready. Choose your next step to start recovering this revenue.
          </p>
        </div>
        
        {/* Primary CTA - No Barriers */}
        <div className="space-y-4">
          <Button
            onClick={handleBookConsultation}
            size="lg"
            className="bg-gradient-to-r from-primary to-revenue-primary text-white font-bold px-8 py-4 h-14 text-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
          >
            <Calendar className="h-5 w-5 mr-3" />
            Book Implementation Consultation (Free)
          </Button>
          
          <p className="text-xs text-revenue-success font-medium">
            ↑ Priority booking - Speak with a revenue optimization expert
          </p>
        </div>

        {/* Secondary CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <Button
            onClick={() => handleSave(data, calculations)}
            disabled={saving}
            variant="outline"
            size="lg"
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <Save className="h-4 w-4 mr-2" />
            {user ? "Save to Dashboard" : "Create Account to Save"}
          </Button>
          
          <Button
            onClick={handleShareAnalysis}
            variant="outline"
            size="lg"
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Analysis
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          No email verification required • Instant access • 100% confidential
        </p>
      </div>
      
      {/* Full Results - Always Visible */}
      <RevenueCharts 
        data={data} 
        calculations={calculations} 
        formatCurrency={formatCurrency}
        confidenceFactors={{
          companySize: data.companyInfo.currentARR > 10000000 ? 'enterprise' :
                       data.companyInfo.currentARR > 1000000 ? 'scaleup' : 'startup',
          currentMaturity: data.companyInfo.currentARR > 5000000 && calculations.totalLeakage < data.companyInfo.currentARR * 0.15 ? 'advanced' :
                           data.companyInfo.currentARR > 1000000 && calculations.totalLeakage < data.companyInfo.currentARR * 0.25 ? 'intermediate' : 'basic',
          changeManagementCapability: data.companyInfo.currentARR > 5000000 ? 'high' : 'medium',
          resourceAvailable: true
        } as ConfidenceFactors}
      />
      
      <DetailedBreakdown 
        data={data} 
        calculations={calculations} 
        formatCurrency={formatCurrency} 
      />

      <EnhancedInsights 
        breakdown={enhancedBreakdown}
      />

      <ActionPlan calculations={calculations} data={data} />

      {/* Floating Value Reminder */}
      <div className="sticky bottom-4 mx-auto max-w-md">
        <div className="bg-background/95 backdrop-blur-sm border border-primary/20 rounded-full p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <span className="font-bold text-revenue-warning">{formatCurrency(calculations.totalLeakage)}</span>
              <span className="text-muted-foreground"> at risk</span>
            </div>
            <Button
              onClick={handleBookConsultation}
              size="sm"
              className="bg-gradient-to-r from-primary to-revenue-primary"
            >
              Book Call
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Modal - Only for Save to Dashboard */}
      {showRegistrationModal && pendingData && (
        <SaveResultsRegistrationModal
          isOpen={showRegistrationModal}
          onClose={handleCloseRegistrationModal}
          data={pendingData.data}
          calculations={pendingData.calculations}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
};
