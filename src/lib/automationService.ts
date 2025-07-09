import { 
  processAutomationTasks 
} from "./advancedAutomation";

let automationInterval: NodeJS.Timeout | null = null;

// Start the background automation service
export const startAutomationService = () => {
  if (automationInterval) {
    console.log('Automation service already running');
    return;
  }

  console.log('Starting background automation service...');
  
  // Run immediately
  processAutomationTasks();
  
  // Then run every 5 minutes
  automationInterval = setInterval(() => {
    processAutomationTasks();
  }, 5 * 60 * 1000); // 5 minutes
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