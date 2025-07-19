
// Core submission storage operations

import { supabase } from "@/integrations/supabase/client";
import { TemporarySubmissionData } from "./types";
import { getTempId, getSessionId, getTrackingData } from "./trackingHelpers";

// Create or update temporary submission with enhanced lead tracking
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
      // Enhanced tracking for better lead qualification
      last_activity_at: new Date().toISOString(),
      calculator_interactions: (data.calculator_interactions || 0) + 1,
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

    // Track high-value leads based on calculator completion + engagement
    if (upserted.total_revenue_leak && upserted.total_revenue_leak > 100000) {
      console.log('High-value lead detected:', {
        tempId: upserted.temp_id,
        totalLeak: upserted.total_revenue_leak,
        company: upserted.company_name,
        email: upserted.email
      });
      
      // Could trigger sales alerts here for qualified leads
      await trackHighValueLead(upserted);
    }

    return upserted;
  } catch (error) {
    console.error('Error saving temporary submission:', error);
    throw error;
  }
};

// Track high-value leads for sales team
const trackHighValueLead = async (submission: any) => {
  try {
    // Track in analytics for sales alerts
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'high_value_lead_qualified',
        user_id: null, // Anonymous lead
        submission_id: null,
        properties: {
          temp_id: submission.temp_id,
          company_name: submission.company_name,
          email: submission.email,
          total_revenue_leak: submission.total_revenue_leak,
          recovery_potential: submission.recovery_potential,
          lead_score: submission.lead_score,
          qualification_source: 'calculator_completion'
        }
      });
  } catch (error) {
    console.warn('Failed to track high-value lead:', error);
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

// Enhanced lead qualification based on calculator data and engagement
export const qualifyLead = (submissionData: any): number => {
  let score = 0;
  
  // Calculator completion bonus
  if (submissionData.completion_percentage >= 100) {
    score += 30;
  }
  
  // Revenue size scoring
  const totalLeak = submissionData.total_revenue_leak || 0;
  if (totalLeak >= 1000000) {
    score += 40; // $1M+ leak
  } else if (totalLeak >= 500000) {
    score += 30; // $500K+ leak
  } else if (totalLeak >= 100000) {
    score += 20; // $100K+ leak
  }
  
  // Engagement scoring
  if (submissionData.calculator_interactions >= 5) {
    score += 15; // High engagement
  }
  
  // Contact information provided
  if (submissionData.email) {
    score += 15;
  }
  if (submissionData.phone) {
    score += 10;
  }
  
  // Company information quality
  if (submissionData.company_name && submissionData.industry) {
    score += 10;
  }
  
  return Math.min(score, 100);
};
