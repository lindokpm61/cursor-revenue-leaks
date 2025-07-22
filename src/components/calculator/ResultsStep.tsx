import { Button } from "@/components/ui/button";
import { CalculatorData, Calculations } from "./useCalculatorData";
import { Save, Calendar, Share2, CheckCircle, LayoutDashboard, Bug, Loader2, AlertTriangle, Clock, Target } from "lucide-react";
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
    handleCloseRegistrationModal,
    isSaved,
    navigateToDashboard,
    forceShowRegistrationModal,
    clearAllAuthState
  } = useSaveResults();

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
    console.log('Book consultation clicked');
    window.open('https://cal.com/rev-calculator/revenuecalculator-strategy-session', '_blank');
    
    toast({
      title: "Strategic Consultation Booking",
      description: "Opening calendar to schedule your revenue optimization strategy session",
    });
  };

  const handleShareAnalysis = () => {
    console.log('Share analysis clicked');
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Strategic Analysis Shared",
      description: "Link copied - share this revenue optimization assessment with your team",
    });
  };

  const handleSaveClick = async () => {
    if (saving) {
      return;
    }
    
    try {
      await handleSave(data, calculations);
    } catch (error) {
      console.error('Save button handler error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving. Please try again.",
        variant: "destructive",
      });
    }
  };

  const dailyBleed = calculations.totalLeakage / 365;

  return (
    <div className="space-y-8">

      {/* Executive Summary with Crisis Assessment */}
      <div className="space-y-6">
        <ExecutiveSummary 
          data={data} 
          calculations={calculations} 
          formatCurrency={formatCurrency} 
        />
        
        {/* Strategic Opportunity + Social Proof */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center p-6 bg-gradient-to-r from-primary/10 via-revenue-growth/10 to-primary/10 rounded-xl border-2 border-primary/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-revenue-growth flex items-center justify-center text-xs font-bold text-white border-2 border-background">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="font-medium">Join 2,847+ executives who unlocked their revenue potential</span>
          </div>
          <div className="text-sm text-primary font-bold">
            💰 OPPORTUNITY AVAILABLE: {formatCurrency(dailyBleed)} daily potential
          </div>
        </div>
      </div>
      
      {/* Strategic Action CTA */}
      <div className="bg-gradient-to-r from-primary/20 via-revenue-growth/15 to-primary/20 border-2 border-primary/30 rounded-xl p-8 text-center space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <h3 className="text-h1 font-bold text-primary">
              STRATEGIC REVENUE OPTIMIZATION PLAN
            </h3>
          </div>
          <div className="text-h2 font-bold text-primary mb-2">
            {formatCurrency(calculations.totalLeakage)} Annual Growth Opportunity
          </div>
          <p className="text-body text-primary/90 max-w-2xl mx-auto font-medium">
            {isSaved 
              ? "📊 Strategic analysis saved! Book a consultation to implement these optimization strategies and unlock substantial revenue growth."
              : "💰 Your business has significant revenue optimization potential. Book a strategy session to discuss implementation and unlock substantial growth opportunities."
            }
          </p>
          
          {isSaved && (
            <div className="flex items-center justify-center gap-2 text-revenue-success">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Strategic Analysis Saved to Dashboard</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={handleBookConsultation}
            size="lg"
            className="bg-gradient-to-r from-primary to-revenue-growth text-white font-bold px-8 py-4 h-14 text-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
          >
            <Calendar className="h-5 w-5 mr-3" />
            🚀 BOOK STRATEGY CONSULTATION - Free 30min Session
          </Button>
          
          <p className="text-xs text-primary font-bold">
            ↑ BOOK NOW: Strategic consultation available - Speak with revenue optimization specialist
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {isSaved ? (
            <Button
              onClick={navigateToDashboard}
              variant="outline"
              size="lg"
              className="hover:bg-primary hover:text-primary-foreground border-primary text-primary"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              View Strategic Dashboard
            </Button>
          ) : (
            <Button
              onClick={handleSaveClick}
              disabled={saving}
              variant="outline"
              size="lg"
              className="hover:bg-primary hover:text-primary-foreground border-primary text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving Strategic Analysis...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {user ? "Save Strategic Analysis" : "Create Account to Save Analysis"}
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleShareAnalysis}
            variant="outline"
            size="lg"
            className="hover:bg-revenue-growth hover:text-white border-revenue-growth text-revenue-growth"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Strategic Analysis
          </Button>

          {isSaved && (
            <Button
              onClick={handleBookConsultation}
              variant="outline"
              size="lg"
              className="hover:bg-primary hover:text-white border-primary text-primary"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Strategy Consultation
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {isSaved 
            ? "Strategic analysis secured • Share with team • Book optimization consultation"
            : "No verification required • Instant strategic access • 100% confidential revenue assessment"
          }
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

      {/* Floating Strategic Reminder */}
      <div className="sticky bottom-4 mx-auto max-w-md">
        <div className="bg-background/95 backdrop-blur-sm border-2 border-primary/30 rounded-full p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              {isSaved ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-revenue-success" />
                  <span className="font-bold text-revenue-success">Analysis Saved</span>
                </div>
              ) : (
                <>
                  <span className="font-bold text-primary">💰 {formatCurrency(calculations.totalLeakage)}</span>
                  <span className="text-primary/80"> opportunity annually</span>
                </>
              )}
            </div>
            {isSaved ? (
              <Button
                onClick={navigateToDashboard}
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Strategic Dashboard
              </Button>
            ) : (
              <Button
                onClick={handleBookConsultation}
                size="sm"
                className="bg-gradient-to-r from-primary to-revenue-growth"
              >
                📅 Book Call
              </Button>
            )}
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
