import { Button } from "@/components/ui/button";
import { CalculatorData, Calculations } from "./useCalculatorData";
import { Save } from "lucide-react";
import { ExecutiveSummary } from "./results/ExecutiveSummary";
import { RevenueCharts } from "./results/RevenueCharts";
import { DetailedBreakdown } from "./results/DetailedBreakdown";
import { ActionPlan } from "./results/ActionPlan";
import { useSaveResults } from "./results/useSaveResults";
import { SaveResultsRegistrationModal } from "./SaveResultsRegistrationModal";

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
  
  const formatCurrency = (amount: number) => {
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

      <ActionPlan calculations={calculations} />

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