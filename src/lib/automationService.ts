import { 
  processAutomationTasks 
} from "./advancedAutomation";
import { 
  trackEmailSequencePerformance,
  analyzeAbandonmentPatterns,
  performDatabaseMaintenance
} from "./monitoringAnalytics";

let automationInterval: NodeJS.Timeout | null = null;

// Start the background automation service
export const startAutomationService = () => {
  if (automationInterval) {
    console.log('Automation service already running');
    return;
  }

  console.log('Starting background automation service...');
  
  // Run initial tasks immediately
  processAutomationTasks();
  trackEmailSequencePerformance();
  
  // Set up recurring intervals
  // Abandonment recovery every 15 minutes
  setInterval(() => {
    processAutomationTasks();
  }, 15 * 60 * 1000);
  
  // Email performance tracking every hour
  setInterval(() => {
    trackEmailSequencePerformance();
  }, 60 * 60 * 1000);
  
  // Abandonment analysis every 6 hours
  setInterval(() => {
    analyzeAbandonmentPatterns();
  }, 6 * 60 * 60 * 1000);
  
  // Database maintenance daily
  setInterval(() => {
    performDatabaseMaintenance();
  }, 24 * 60 * 60 * 1000);
};

// Stop the background automation service
export const stopAutomationService = () => {
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
    console.log('Background automation service stopped');
  }
};

// Initialize automation service on app start
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.addEventListener('load', () => {
    startAutomationService();
  });
  
  // Clean up on unload
  window.addEventListener('beforeunload', () => {
    stopAutomationService();
  });
}