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

    // Create permanent submission with proper type conversion
    const submissionPayload = {
      user_id: userId,
      company_name: tempSubmission.company_name || submissionData.company_name,
      contact_email: tempSubmission.email || submissionData.contact_email,
      industry: tempSubmission.industry || submissionData.industry,
      // Convert all numeric values to integers for bigint columns
      current_arr: Math.round(Number(submissionData.current_arr) || 0),
      monthly_leads: Math.round(Number(submissionData.monthly_leads) || 0),
      average_deal_value: Math.round(Number(submissionData.average_deal_value) || 0),
      lead_response_time: Math.round(Number(submissionData.lead_response_time) || 0),
      monthly_free_signups: Math.round(Number(submissionData.monthly_free_signups) || 0),
      monthly_mrr: Math.round(Number(submissionData.monthly_mrr) || 0),
      manual_hours: Math.round(Number(submissionData.manual_hours) || 0),
      hourly_rate: Math.round(Number(submissionData.hourly_rate) || 0),
      lead_response_loss: Math.round(Number(submissionData.lead_response_loss) || 0),
      failed_payment_loss: Math.round(Number(submissionData.failed_payment_loss) || 0),
      selfserve_gap_loss: Math.round(Number(submissionData.selfserve_gap_loss) || 0),
      process_inefficiency_loss: Math.round(Number(submissionData.process_inefficiency_loss) || 0),
      total_leak: Math.round(Number(tempSubmission.total_revenue_leak || submissionData.total_leak) || 0),
      recovery_potential_70: Math.round(Number(tempSubmission.recovery_potential || submissionData.recovery_potential_70) || 0),
      recovery_potential_85: Math.round(Number(submissionData.recovery_potential_85) || 0),
      lead_score: Math.round(Number(tempSubmission.lead_score || submissionData.lead_score) || 0),
      // Keep numeric types for numeric columns
      free_to_paid_conversion: Number(submissionData.free_to_paid_conversion) || 0,
      failed_payment_rate: Number(submissionData.failed_payment_rate) || 0,
      leak_percentage: Number(submissionData.leak_percentage) || 0,
      created_at: tempSubmission.created_at, // Preserve original timestamp
    };

    console.log('Submission payload:', submissionPayload);

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert([submissionPayload])
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
      
      const integrationResult = await integrations.processSubmission(crmSubmission);
      console.log('CRM integration completed:', integrationResult);
      
      // Update submission with CRM IDs if successful
      if (integrationResult.success && integrationResult.results.crm) {
        const updates: any = {};
        if (integrationResult.results.crm.companyId) {
          updates.twenty_company_id = integrationResult.results.crm.companyId;
        }
        if (integrationResult.results.crm.contactId) {
          updates.twenty_contact_id = integrationResult.results.crm.contactId;
        }
        
        if (Object.keys(updates).length > 0) {
          await supabase
            .from('submissions')
            .update(updates)
            .eq('id', submission.id);
        }
      }
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