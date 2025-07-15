import { Button } from "@/components/ui/button";
import { CalculatorData, Calculations } from "./useCalculatorData";
import { Save } from "lucide-react";
import { ExecutiveSummary } from "./results/ExecutiveSummary";
import { RevenueCharts } from "./results/RevenueCharts";
import { DetailedBreakdown } from "./results/DetailedBreakdown";
import { ActionPlan } from "./results/ActionPlan";
import { EnhancedInsights } from "./results/EnhancedInsights";
import { useSaveResults } from "./results/useSaveResults";
import { SaveResultsRegistrationModal } from "./SaveResultsRegistrationModal";
import { validateRecoveryAssumptions } from '@/lib/calculator/enhancedCalculations';

interface ResultsStepProps {
  data: CalculatorData;
  calculations: Calculations;
}

export const ResultsStep = ({ data, calculations }: ResultsStepProps) => {
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
      actualLossAfterRecovery: calculations.failedPaymentLoss * 0.65 // 65% actual loss after 35% recovery
    },
    selfServeGap: {
      industryBenchmark: 15, // default benchmark
      industryName: data.companyInfo?.industry || 'Other',
      gapPercentage: Math.max(0, 15 - (data.selfServeMetrics?.freeToPaidConversionRate || 0)),
      currentConversion: data.selfServeMetrics?.freeToPaidConversionRate || 0
    },
    processInefficiency: {
      revenueGeneratingPotential: calculations.processLoss * 0.3, // 30% could be revenue-generating time
      automationPotential: 0.7
    },
    recoveryValidation: (() => {
      const validation = validateRecoveryAssumptions({
        currentARR: data.companyInfo?.currentARR || 0,
        grossRetention: 85, // default gross retention
        netRetention: 100, // default net retention
        customerSatisfaction: 8, // default satisfaction (out of 10)
        hasRevOps: true // assume basic process exists
      });
      return {
        canAchieve70: validation.canAchieve70,
        canAchieve85: validation.canAchieve85,
        limitations: validation.reasons // map reasons to limitations
      };
    })()
  };
  
  const formatCurrency = (amount: number) => {
    // Handle invalid numbers
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

  return (
    <div className="space-y-8">
      {/* Enhanced Executive Summary with Social Proof */}
      <div className="space-y-6">
        <ExecutiveSummary 
          data={data} 
          calculations={calculations} 
          formatCurrency={formatCurrency} 
        />
        
        {/* Social Proof & Urgency */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center p-6 bg-gradient-to-r from-primary/5 via-revenue-primary/5 to-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-revenue-primary flex items-center justify-center text-xs font-bold text-white border-2 border-background">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="font-medium">Join 2,847+ executives who've optimized their revenue</span>
          </div>
          <div className="text-sm text-revenue-warning font-medium">
            ⏰ Limited consultation spots this month
          </div>
        </div>
      </div>
      
      {/* Value-First Save Section - Above detailed breakdowns */}
      <div className="bg-gradient-to-r from-revenue-success/10 via-primary/5 to-revenue-success/10 border-2 border-revenue-success/20 rounded-xl p-8 text-center space-y-6">
        <div className="space-y-4">
          <h3 className="text-h1 font-bold text-foreground">
            Secure Your {formatCurrency(calculations.totalLeakage)} Recovery Plan
          </h3>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Get instant access to your personalized action plan, implementation timeline, and priority recommendations. 
            Plus receive ongoing support and quarterly reviews.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-revenue-success/20 flex items-center justify-center">
              <Save className="h-5 w-5 text-revenue-success" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Saved Analysis</div>
              <div className="text-xs text-muted-foreground">Access anytime</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              📊
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Action Plan</div>
              <div className="text-xs text-muted-foreground">Step-by-step guide</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-revenue-warning/20 flex items-center justify-center">
              🎯
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">Expert Support</div>
              <div className="text-xs text-muted-foreground">Implementation help</div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => handleSave(data, calculations)}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-primary to-revenue-primary text-white font-bold px-8 py-4 h-14 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Save className="h-5 w-5 mr-3" />
          {saving ? "Securing Your Results..." : "Get My Recovery Plan (Free)"}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          No credit card required • Instant access • 100% confidential
        </p>
      </div>
      
      <RevenueCharts 
        data={data} 
        calculations={calculations} 
        formatCurrency={formatCurrency} 
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

      {/* Registration Modal */}
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