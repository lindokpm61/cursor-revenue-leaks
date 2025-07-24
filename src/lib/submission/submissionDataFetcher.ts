
import { supabase } from "@/integrations/supabase/client";
import { getTemporarySubmission } from "./submissionStorage";

// Fetch submission by ID from the permanent submissions table
export const getSubmissionById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('calculator_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
    return data;
  } catch (error) {
    console.error('Error getting submission:', error);
    return null;
  }
};

// Transform permanent submission data to match calculator_data structure
export const transformSubmissionToCalculatorData = (submission: any) => {
  if (!submission) return null;

  return {
    temp_id: submission.id,
    company_name: submission.company_name,
    email: submission.contact_email,
    industry: submission.industry,
    lead_score: submission.lead_score,
    calculator_data: {
      companyInfo: {
        companyName: submission.company_name,
        currentARR: submission.current_arr,
        industry: submission.industry
      },
      leadGeneration: {
        monthlyLeads: submission.monthly_leads,
        averageDealValue: submission.average_deal_value,
        leadResponseTime: submission.lead_response_time
      },
      selfServe: {
        monthlyFreeSignups: submission.monthly_free_signups,
        freeToLaidConversion: submission.free_to_paid_conversion,
        monthlyMRR: submission.monthly_mrr,
        failedPaymentRate: submission.failed_payment_rate
      },
      operations: {
        manualHours: submission.manual_hours,
        hourlyRate: submission.hourly_rate
      }
    },
    total_revenue_leak: submission.total_leak,
    recovery_potential: submission.recovery_potential_70,
    created_at: submission.created_at,
    converted_to_user_id: submission.user_id
  };
};

// Unified function to fetch submission data from either table
export const fetchSubmissionData = async (id: string) => {
  try {
    // First try to get from permanent submissions table
    const permanentSubmission = await getSubmissionById(id);
    if (permanentSubmission) {
      return transformSubmissionToCalculatorData(permanentSubmission);
    }

    // Fallback to temporary submissions
    const tempSubmission = await getTemporarySubmission(id);
    return tempSubmission;
  } catch (error) {
    console.error('Error fetching submission data:', error);
    return null;
  }
};
