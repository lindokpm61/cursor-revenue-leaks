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
  return {
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
    lead_response_loss: Math.round(calculations.leadResponseLoss),
    failed_payment_loss: Math.round(calculations.failedPaymentLoss),
    selfserve_gap_loss: Math.round(calculations.selfServeGap),
    process_inefficiency_loss: Math.round(calculations.processLoss),
    total_leak: Math.round(calculations.totalLeakage),
    recovery_potential_70: Math.round(calculations.potentialRecovery70),
    recovery_potential_85: Math.round(calculations.potentialRecovery85),
    leak_percentage: data.companyInfo.currentARR > 0 
      ? Math.round((calculations.totalLeakage / data.companyInfo.currentARR) * 100)
      : 0,
    lead_score: leadScore,
    user_id: userId,
  };
};