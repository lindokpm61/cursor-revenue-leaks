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
      <ExecutiveSummary 
        data={data} 
        calculations={calculations} 
        formatCurrency={formatCurrency} 
      />
      
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

      {/* Save Actions */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => handleSave(data, calculations)}
          disabled={saving}
          className="bg-gradient-to-r from-primary to-revenue-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Results"}
        </Button>
      </div>

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