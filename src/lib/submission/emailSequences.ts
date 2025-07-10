// Email sequence scheduling and management

import { supabase } from "@/integrations/supabase/client";
import { EmailSequenceData } from "./types";

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