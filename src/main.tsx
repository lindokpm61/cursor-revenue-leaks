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


createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
