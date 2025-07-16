import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/ErrorBoundary.tsx'
import { initSentry } from './lib/sentry'
import "./lib/automationService"; // Initialize automation service
import { testAbandonmentRecovery, triggerAbandonmentRecoveryTest } from './lib/testAbandonmentRecovery'
import { processAutomationTasks } from './lib/advancedAutomation'
import './index.css'

// Initialize Sentry
initSentry();

// Development helpers - expose to global scope for testing
if (typeof window !== 'undefined') {
  (window as any).abandonmentTest = {
    check: testAbandonmentRecovery,
    trigger: triggerAbandonmentRecoveryTest,
    process: processAutomationTasks
  };
  
  // Additional debugging helpers
  (window as any).debug = {
    clearLocalStorage: () => {
      localStorage.removeItem('temp_submission_id');
      console.log('🗑️ Cleared temp submission ID from localStorage');
    },
    simulateAbandonment: async () => {
      console.log('🚨 Simulating abandonment...');
      const tempId = localStorage.getItem('temp_submission_id');
      if (tempId) {
        await triggerAbandonmentRecoveryTest();
      } else {
        console.log('No temp ID found - start calculator first');
      }
    }
  };
}

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
