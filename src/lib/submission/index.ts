// Main export file for submission functionality

// Types
export type { TemporarySubmissionData, EmailSequenceData } from "./types";

// Lead scoring
export { calculateLeadScore } from "./leadScoring";

// Tracking helpers
export { 
  generateTempId, 
  getSessionId, 
  getTempId, 
  getTrackingData 
} from "./trackingHelpers";

// Core storage
export { 
  saveTemporarySubmission, 
  getTemporarySubmission 
} from "./submissionStorage";

// Calculator progress
export { updateCalculatorProgress } from "./calculatorProgress";

// Engagement tracking
export { trackEngagement } from "./engagementTracking";

// Email sequences (enhanced)
export { 
  scheduleEmailSequenceEnhanced as scheduleEmailSequence,
  hasSequenceBeenTriggered,
  cancelPendingSequences 
} from "../enhancedEmailSequences";

// User conversion
export { convertToUserSubmission } from "./userConversion";

// Cleanup
export { cleanupExpiredSubmissions } from "./cleanup";

// Integration logging
export { integrationLogger } from "../integrationLogger";

// Re-export everything for backward compatibility
export * from "./types";
export * from "./leadScoring";
export * from "./trackingHelpers";
export * from "./submissionStorage";
export * from "./calculatorProgress";
export * from "./engagementTracking";
export * from "./emailSequences";
export * from "./userConversion";
export * from "./cleanup";