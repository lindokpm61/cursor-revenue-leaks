import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/ErrorBoundary.tsx'
import "./lib/automationService"; // Initialize automation service
import { testAbandonmentRecovery, triggerAbandonmentRecoveryTest } from './lib/testAbandonmentRecovery'
import { processAutomationTasks } from './lib/advancedAutomation'
import './index.css'

// Development helpers - expose to global scope for testing
if (typeof window !== 'undefined') {
  (window as any).abandonmentTest = {
    check: testAbandonmentRecovery,
    trigger: triggerAbandonmentRecoveryTest,
    process: processAutomationTasks
  };
}

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
