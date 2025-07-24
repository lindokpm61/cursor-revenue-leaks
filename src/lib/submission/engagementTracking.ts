// Engagement and analytics tracking

import { TemporarySubmissionData } from "./types";
import { getTempId } from "./trackingHelpers";
import { getTemporarySubmission, saveTemporarySubmission } from "./submissionStorage";

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