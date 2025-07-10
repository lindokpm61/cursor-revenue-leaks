import { supabase } from "@/integrations/supabase/client";

export interface TemporarySubmissionData {
  temp_id: string;
  session_id?: string;
  email?: string;
  company_name?: string;
  industry?: string;
  current_step: number;
  steps_completed: number;
  completion_percentage: number;
  calculator_data: Record<string, any>;
  total_revenue_leak?: number;
  recovery_potential?: number;
  lead_score?: number;
  email_sequences_triggered?: string[];
  last_email_sent_at?: string;
  last_activity_at?: string;
  email_engagement_score?: number;
  twenty_crm_contact_id?: string;
  smartlead_campaign_ids?: string[];
  n8n_workflow_status?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  page_views?: number;
  time_spent_seconds?: number;
  return_visits?: number;
  calculator_interactions?: number;
}

export interface EmailSequenceData {
  temp_id: string;
  sequence_type: string;
  scheduled_for: string;
  contact_email: string;
  contact_data?: Record<string, any>;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  n8n_execution_id?: string;
}

// Generate a unique temporary ID
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get session ID from browser
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('calculator_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('calculator_session_id', sessionId);
  }
  return sessionId;
};

// Get or create temp ID from localStorage
export const getTempId = (): string => {
  let tempId = localStorage.getItem('calculator_temp_id');
  if (!tempId) {
    tempId = generateTempId();
    localStorage.setItem('calculator_temp_id', tempId);
  }
  return tempId;
};

// Get tracking data from browser/URL
export const getTrackingData = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    user_agent: navigator.userAgent,
    referrer_url: document.referrer,
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
  };
};

// Create or update temporary submission
export const saveTemporarySubmission = async (data: Partial<TemporarySubmissionData>) => {
  const tempId = data.temp_id || getTempId();
  const sessionId = getSessionId();
  const trackingData = getTrackingData();

  try {
    // Ensure temp_id is always present
    const submissionData = {
      temp_id: tempId,
      session_id: sessionId,
      ...trackingData,
      ...data,
    };

    // Validate that temp_id is not null or empty
    if (!submissionData.temp_id) {
      throw new Error('temp_id is required for temporary submission');
    }

    // Use upsert to handle race conditions gracefully
    const { data: upserted, error } = await supabase
      .from('temporary_submissions')
      .upsert([submissionData], { 
        onConflict: 'temp_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return upserted;
  } catch (error) {
    console.error('Error saving temporary submission:', error);
    throw error;
  }
};

// Get temporary submission by temp_id
export const getTemporarySubmission = async (tempId?: string) => {
  const id = tempId || getTempId();
  
  try {
    const { data, error } = await supabase
      .from('temporary_submissions')
      .select('*')
      .eq('temp_id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
    return data;
  } catch (error) {
    console.error('Error getting temporary submission:', error);
    return null;
  }
};

// Update completion progress
export const updateCalculatorProgress = async (
  currentStep: number,
  stepData: Record<string, any>,
  calculations?: Record<string, any>
) => {
  const tempId = getTempId();
  
  try {
    const existing = await getTemporarySubmission(tempId);
    const currentCalculatorData = existing?.calculator_data || {};
    
    // Merge new step data with existing calculator data
    const updatedCalculatorData = {
      ...(currentCalculatorData as Record<string, any>),
      [`step_${currentStep}`]: stepData,
    };

    // Calculate completion percentage
    const totalSteps = 5; // Adjust based on your calculator steps
    const completionPercentage = Math.round((currentStep / totalSteps) * 100);

    const updateData: Partial<TemporarySubmissionData> = {
      current_step: currentStep,
      steps_completed: currentStep,
      completion_percentage: completionPercentage,
      calculator_data: updatedCalculatorData,
      calculator_interactions: (existing?.calculator_interactions || 0) + 1,
    };

    // Add calculated results if provided
    if (calculations) {
      updateData.total_revenue_leak = Math.round(calculations.totalLeak || 0);
      updateData.recovery_potential = Math.round(calculations.recoveryPotential70 || 0);
      updateData.lead_score = Math.round(calculations.leadScore || 0);
    }

    // Extract email and company info if in step data
    if (stepData.email) updateData.email = stepData.email;
    if (stepData.companyName) updateData.company_name = stepData.companyName;
    if (stepData.industry) updateData.industry = stepData.industry;

    return await saveTemporarySubmission(updateData);
  } catch (error) {
    console.error('Error updating calculator progress:', error);
    throw error;
  }
};

// Track page views and engagement
export const trackEngagement = async (action: string, data?: Record<string, any>) => {
  const tempId = getTempId();
  
  try {
    const existing = await getTemporarySubmission(tempId);
    
    const updateData: Partial<TemporarySubmissionData> = {};
    
    switch (action) {
      case 'page_view':
        updateData.page_views = (existing?.page_views || 0) + 1;
        break;
      case 'return_visit':
        updateData.return_visits = (existing?.return_visits || 0) + 1;
        break;
      case 'time_spent':
        updateData.time_spent_seconds = (existing?.time_spent_seconds || 0) + (data?.seconds || 0);
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await saveTemporarySubmission(updateData);
    }
  } catch (error) {
    console.error('Error tracking engagement:', error);
  }
};

// Schedule email sequence
export const scheduleEmailSequence = async (sequenceData: EmailSequenceData) => {
  try {
    const { data, error } = await supabase
      .from('email_sequence_queue')
      .insert([sequenceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scheduling email sequence:', error);
    throw error;
  }
};

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

// Cleanup expired submissions (utility function)
export const cleanupExpiredSubmissions = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_temp_submissions');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cleaning up expired submissions:', error);
    throw error;
  }
};