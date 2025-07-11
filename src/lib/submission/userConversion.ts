// Converting temporary submissions to permanent user submissions

import { supabase } from "@/integrations/supabase/client";
import { getTempId } from "./trackingHelpers";
import { getTemporarySubmission } from "./submissionStorage";
import { integrations } from "@/lib/integrations";

// Convert temporary submission to user submission
export const convertToUserSubmission = async (userId: string, submissionData: any) => {
  const tempId = getTempId();
  
  try {
    // Get temporary submission
    const tempSubmission = await getTemporarySubmission(tempId);
    if (!tempSubmission) throw new Error('Temporary submission not found');

    // Create permanent submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert([{
        user_id: userId,
        company_name: tempSubmission.company_name || submissionData.company_name,
        contact_email: tempSubmission.email || submissionData.contact_email,
        industry: tempSubmission.industry || submissionData.industry,
        current_arr: submissionData.current_arr,
        monthly_leads: submissionData.monthly_leads,
        average_deal_value: submissionData.average_deal_value,
        lead_response_time: submissionData.lead_response_time,
        monthly_free_signups: submissionData.monthly_free_signups,
        free_to_paid_conversion: submissionData.free_to_paid_conversion,
        monthly_mrr: submissionData.monthly_mrr,
        failed_payment_rate: submissionData.failed_payment_rate,
        manual_hours: submissionData.manual_hours,
        hourly_rate: submissionData.hourly_rate,
        lead_response_loss: Math.round(submissionData.lead_response_loss || 0),
        failed_payment_loss: Math.round(submissionData.failed_payment_loss || 0),
        selfserve_gap_loss: Math.round(submissionData.selfserve_gap_loss || 0),
        process_inefficiency_loss: Math.round(submissionData.process_inefficiency_loss || 0),
        total_leak: Math.round(tempSubmission.total_revenue_leak || submissionData.total_leak || 0),
        leak_percentage: Math.round(submissionData.leak_percentage || 0),
        recovery_potential_70: Math.round(tempSubmission.recovery_potential || submissionData.recovery_potential_70 || 0),
        recovery_potential_85: Math.round(submissionData.recovery_potential_85 || 0),
        lead_score: Math.round(tempSubmission.lead_score || submissionData.lead_score || 0),
        created_at: tempSubmission.created_at, // Preserve original timestamp
      }])
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Trigger Twenty CRM integration
    try {
      // Map submission to CalculatorSubmission format
      const crmSubmission = {
        id: submission.id,
        company_name: submission.company_name,
        email: submission.contact_email,
        industry: submission.industry || 'Technology',
        current_arr: submission.current_arr || 0,
        monthly_leads: submission.monthly_leads || 0,
        average_deal_value: submission.average_deal_value || 0,
        lead_response_time_hours: submission.lead_response_time || 0,
        monthly_free_signups: submission.monthly_free_signups || 0,
        free_to_paid_conversion_rate: submission.free_to_paid_conversion || 0,
        monthly_mrr: submission.monthly_mrr || 0,
        failed_payment_rate: submission.failed_payment_rate || 0,
        manual_hours_per_week: submission.manual_hours || 0,
        hourly_rate: submission.hourly_rate || 0,
        calculations: {
          leadResponseLoss: submission.lead_response_loss || 0,
          failedPaymentLoss: submission.failed_payment_loss || 0,
          selfServeGap: submission.selfserve_gap_loss || 0,
          processLoss: submission.process_inefficiency_loss || 0,
          totalLeakage: submission.total_leak || 0,
          potentialRecovery70: submission.recovery_potential_70 || 0,
          potentialRecovery85: submission.recovery_potential_85 || 0,
        },
        lead_score: submission.lead_score || 0,
        created_at: submission.created_at,
      };
      
      await integrations.createCrmContact(crmSubmission);
    } catch (error) {
      console.error('CRM integration failed:', error);
      // Don't fail the entire conversion if CRM integration fails
    }

    // Mark temporary submission as converted
    await supabase
      .from('temporary_submissions')
      .update({
        converted_to_user_id: userId,
        conversion_completed_at: new Date().toISOString(),
      })
      .eq('temp_id', tempId);

    // Clear local storage
    localStorage.removeItem('calculator_temp_id');
    sessionStorage.removeItem('calculator_session_id');

    return submission;
  } catch (error) {
    console.error('Error converting temporary submission:', error);
    throw error;
  }
};