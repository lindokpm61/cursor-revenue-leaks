// Core submission storage operations

import { supabase } from "@/integrations/supabase/client";
import { TemporarySubmissionData } from "./types";
import { getTempId, getSessionId, getTrackingData } from "./trackingHelpers";

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