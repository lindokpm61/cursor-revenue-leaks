
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
    lead_response_loss: Number(calculations.leadResponseLoss.toFixed(2)),
    failed_payment_loss: Number(calculations.failedPaymentLoss.toFixed(2)),
    selfserve_gap_loss: Number(calculations.selfServeGap.toFixed(2)),
    process_inefficiency_loss: Number(calculations.processLoss.toFixed(2)),
    total_leak: Number(calculations.totalLeakage.toFixed(2)),
    recovery_potential_70: Number(calculations.potentialRecovery70.toFixed(2)),
    recovery_potential_85: Number(calculations.potentialRecovery85.toFixed(2)),
    leak_percentage: data.companyInfo.currentARR > 0 
      ? Number(((calculations.totalLeakage / data.companyInfo.currentARR) * 100).toFixed(2))
      : 0,
    lead_score: leadScore,
    user_id: userId,
  };

  console.log("=== MAPPED SUBMISSION DATA ===");
  console.log("Mapped data:", mappedData);

  return mappedData;
};
