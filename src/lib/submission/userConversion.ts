// Converting temporary submissions to permanent user submissions

import { supabase } from "@/integrations/supabase/client";
import { getTempId } from "./trackingHelpers";
import { getTemporarySubmission } from "./submissionStorage";
import { crmIntegration } from "@/lib/crmIntegration";

// Convert temporary submission to user submission
export const convertToUserSubmission = async (userId: string, submissionData: any) => {
  const tempId = getTempId();
  
  try {
    // Get temporary submission (if it exists)
    const tempSubmission = await getTemporarySubmission(tempId);
    console.log('Got temporary submission:', tempSubmission);
    
    // If no temporary submission exists, create submission directly
    if (!tempSubmission) {
      console.log('No temporary submission found, creating submission directly');
      return await createDirectSubmission(userId, submissionData);
    }

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

    // Trigger separated CRM integration using new service
    try {
      console.log('Starting separated CRM integration for user:', userId);
      
      const integrationResult = await crmIntegration.completeSubmissionIntegration(userId, submission.id);
      console.log('CRM integration completed:', integrationResult);

    } catch (error) {
      console.error('Separated CRM integration failed:', error);
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

// Create submission directly when no temporary submission exists
const createDirectSubmission = async (userId: string, submissionData: any) => {
  console.log('Creating direct submission with data:', submissionData);
  
  // Create permanent submission with proper type conversion
  const submissionPayload = {
    user_id: userId,
    company_name: submissionData.company_name,
    contact_email: submissionData.contact_email,
    industry: submissionData.industry,
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
    total_leak: Math.round(Number(submissionData.total_leak) || 0),
    recovery_potential_70: Math.round(Number(submissionData.recovery_potential_70) || 0),
    recovery_potential_85: Math.round(Number(submissionData.recovery_potential_85) || 0),
    lead_score: Math.round(Number(submissionData.lead_score) || 0),
    // Keep numeric types for numeric columns
    free_to_paid_conversion: Number(submissionData.free_to_paid_conversion) || 0,
    failed_payment_rate: Number(submissionData.failed_payment_rate) || 0,
    leak_percentage: Number(submissionData.leak_percentage) || 0,
  };

  console.log('Direct submission payload:', submissionPayload);

  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert([submissionPayload])
    .select()
    .single();

  if (submissionError) throw submissionError;

  // Trigger separated CRM integration for direct submission using new service
  try {
    console.log('Starting separated CRM integration for direct submission, user:', userId);
    
    const integrationResult = await crmIntegration.completeSubmissionIntegration(userId, submission.id);
    console.log('CRM integration completed for direct submission:', integrationResult);

  } catch (error) {
    console.error('Separated CRM integration failed for direct submission:', error);
    // Don't fail the entire conversion if CRM integration fails
  }

  return submission;
};