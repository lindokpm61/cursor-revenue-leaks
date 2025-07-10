// Cleanup utilities for temporary submissions

import { supabase } from "@/integrations/supabase/client";

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