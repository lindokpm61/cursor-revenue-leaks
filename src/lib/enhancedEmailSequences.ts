// Enhanced email sequence management with duplicate prevention and validation

import { supabase } from "@/integrations/supabase/client";
import { EmailSequenceData } from "./submission/types";

// Check if sequence has already been triggered with enhanced validation
export const hasSequenceBeenTriggered = async (
  tempId: string, 
  sequenceType: string
): Promise<boolean> => {
  try {
    // Validate inputs
    if (!tempId || !sequenceType) {
      console.error('Missing required parameters for sequence check:', { tempId, sequenceType });
      return false;
    }

    const { data, error } = await supabase
      .from('email_sequence_queue')
      .select('id, status, created_at')
      .eq('temp_id', tempId)
      .eq('sequence_type', sequenceType)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking sequence:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Exception in hasSequenceBeenTriggered:', error);
    return false;
  }
};

// Schedule email sequence with atomic operations and duplicate prevention
export const scheduleEmailSequenceEnhanced = async (
  sequenceData: EmailSequenceData
): Promise<any> => {
  try {
    // Validate required fields
    if (!sequenceData.temp_id) {
      throw new Error('temp_id is required for email sequence scheduling');
    }

    if (!sequenceData.sequence_type) {
      throw new Error('sequence_type is required for email sequence scheduling');
    }

    if (!sequenceData.contact_email) {
      throw new Error('contact_email is required for email sequence scheduling');
    }

    // Check for existing sequence first
    const alreadyTriggered = await hasSequenceBeenTriggered(
      sequenceData.temp_id, 
      sequenceData.sequence_type
    );

    if (alreadyTriggered) {
      console.log(`Sequence ${sequenceData.sequence_type} already triggered for ${sequenceData.temp_id}`);
      return null; // Don't schedule duplicate
    }

    // Use atomic insert with conflict handling
    const { data, error } = await supabase
      .from('email_sequence_queue')
      .insert([{
        ...sequenceData,
        created_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === '23505') {
        console.log(`Duplicate sequence prevented: ${sequenceData.sequence_type} for ${sequenceData.temp_id}`);
        return null;
      }
      throw error;
    }

    console.log(`Email sequence scheduled: ${sequenceData.sequence_type} for ${sequenceData.temp_id}`);
    return data;

  } catch (error) {
    console.error('Error scheduling enhanced email sequence:', error);
    throw error;
  }
};

// Cancel pending sequences for a temp_id (when user progresses)
export const cancelPendingSequences = async (
  tempId: string, 
  reason: string = 'user_progressed'
): Promise<number> => {
  try {
    if (!tempId) {
      throw new Error('temp_id is required for canceling sequences');
    }

    const { data, error } = await supabase
      .from('email_sequence_queue')
      .update({ 
        status: 'cancelled',
        sent_at: new Date().toISOString()
      })
      .eq('temp_id', tempId)
      .eq('status', 'pending')
      .select('id');

    if (error) throw error;

    const cancelledCount = data?.length || 0;
    
    if (cancelledCount > 0) {
      console.log(`Cancelled ${cancelledCount} pending sequences for ${tempId}: ${reason}`);
    }

    return cancelledCount;
  } catch (error) {
    console.error('Error cancelling pending sequences:', error);
    throw error;
  }
};

// Get sequence status for a temp_id
export const getSequenceStatus = async (tempId: string) => {
  try {
    if (!tempId) {
      throw new Error('temp_id is required for getting sequence status');
    }

    const { data, error } = await supabase
      .from('email_sequence_queue')
      .select('sequence_type, status, created_at, scheduled_for, sent_at')
      .eq('temp_id', tempId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting sequence status:', error);
    return [];
  }
};

// Validate sequence data before scheduling
export const validateSequenceData = (sequenceData: Partial<EmailSequenceData>): string[] => {
  const errors: string[] = [];

  if (!sequenceData.temp_id) {
    errors.push('temp_id is required');
  }

  if (!sequenceData.sequence_type) {
    errors.push('sequence_type is required');
  }

  if (!sequenceData.contact_email) {
    errors.push('contact_email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sequenceData.contact_email)) {
    errors.push('contact_email must be a valid email address');
  }

  if (!sequenceData.scheduled_for) {
    errors.push('scheduled_for is required');
  } else {
    const scheduledDate = new Date(sequenceData.scheduled_for);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('scheduled_for must be a valid date');
    } else if (scheduledDate < new Date()) {
      errors.push('scheduled_for cannot be in the past');
    }
  }

  return errors;
};