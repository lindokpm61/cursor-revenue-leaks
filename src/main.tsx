import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/ErrorBoundary.tsx'
import "./lib/automationService"; // Initialize automation service
import './index.css'

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
