
import { CalculatorData, Calculations } from "@/components/calculator/useCalculatorData";

/**
 * Maps calculator data and calculations to submission data format
 */
export const mapToSubmissionData = (
  data: CalculatorData, 
  calculations: Calculations, 
  leadScore: number, 
  userId: string
) => {
  console.log("=== SUBMISSION DATA MAPPER DEBUG ===");
  console.log("Input data:", data);
  console.log("Input calculations:", calculations);
  console.log("Calculations type:", typeof calculations);
  console.log("Calculations keys:", Object.keys(calculations || {}));
  
  // Log each calculation value individually
  console.log("Individual calculation values:");
  console.log("- leadResponseLoss:", calculations?.leadResponseLoss, typeof calculations?.leadResponseLoss);
  console.log("- failedPaymentLoss:", calculations?.failedPaymentLoss, typeof calculations?.failedPaymentLoss);
  console.log("- selfServeGap:", calculations?.selfServeGap, typeof calculations?.selfServeGap);
  console.log("- processLoss:", calculations?.processLoss, typeof calculations?.processLoss);
  console.log("- totalLeakage:", calculations?.totalLeakage, typeof calculations?.totalLeakage);
  console.log("- potentialRecovery70:", calculations?.potentialRecovery70, typeof calculations?.potentialRecovery70);
  console.log("- potentialRecovery85:", calculations?.potentialRecovery85, typeof calculations?.potentialRecovery85);

  // Ensure calculations object exists and has required properties
  if (!calculations) {
    console.error("❌ CRITICAL: Calculations object is null/undefined!");
    throw new Error("Calculations object is required but was null/undefined");
  }

  // Validate that calculations have numeric values
  const requiredCalculations = [
    'leadResponseLoss', 'failedPaymentLoss', 'selfServeGap', 'processLoss', 
    'totalLeakage', 'potentialRecovery70', 'potentialRecovery85'
  ];
  
  const missingOrInvalidCalcs = requiredCalculations.filter(key => {
    const value = calculations[key as keyof Calculations];
    return value === null || value === undefined || isNaN(Number(value));
  });
  
  if (missingOrInvalidCalcs.length > 0) {
    console.error("❌ CRITICAL: Missing or invalid calculations:", missingOrInvalidCalcs);
    console.error("❌ This will result in NULL values in the database!");
  }

  const mappedData = {
    company_name: data.companyInfo.companyName,
    contact_email: data.companyInfo.email,
    industry: data.companyInfo.industry,
    current_arr: data.companyInfo.currentARR,
    monthly_leads: data.leadGeneration.monthlyLeads,
    average_deal_value: data.leadGeneration.averageDealValue,
    lead_response_time: data.leadGeneration.leadResponseTimeHours,
    monthly_free_signups: data.selfServeMetrics.monthlyFreeSignups,
    free_to_paid_conversion: data.selfServeMetrics.freeToPaidConversionRate,
    monthly_mrr: data.selfServeMetrics.monthlyMRR,
    failed_payment_rate: data.operationsData.failedPaymentRate,
    manual_hours: data.operationsData.manualHoursPerWeek,
    hourly_rate: data.operationsData.hourlyRate,
    // Use fallback of 0 if calculations are invalid, but log the issue
    lead_response_loss: Number(calculations.leadResponseLoss) || 0,
    failed_payment_loss: Number(calculations.failedPaymentLoss) || 0,
    selfserve_gap_loss: Number(calculations.selfServeGap) || 0,
    process_inefficiency_loss: Number(calculations.processLoss) || 0,
    total_leak: Number(calculations.totalLeakage) || 0,
    recovery_potential_70: Number(calculations.potentialRecovery70) || 0,
    recovery_potential_85: Number(calculations.potentialRecovery85) || 0,
    leak_percentage: data.companyInfo.currentARR > 0 
      ? Number(((calculations.totalLeakage / data.companyInfo.currentARR) * 100).toFixed(2))
      : 0,
    lead_score: leadScore,
    user_id: userId,
  };

  console.log("=== MAPPED SUBMISSION DATA ===");
  console.log("Mapped data:", mappedData);
  console.log("Mapped calculation values:");
  console.log("- lead_response_loss:", mappedData.lead_response_loss);
  console.log("- failed_payment_loss:", mappedData.failed_payment_loss);
  console.log("- selfserve_gap_loss:", mappedData.selfserve_gap_loss);
  console.log("- process_inefficiency_loss:", mappedData.process_inefficiency_loss);
  console.log("- total_leak:", mappedData.total_leak);
  console.log("- recovery_potential_70:", mappedData.recovery_potential_70);
  console.log("- recovery_potential_85:", mappedData.recovery_potential_85);

  return mappedData;
};
