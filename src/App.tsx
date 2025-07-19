
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ExperimentProvider } from "./components/experiments/ExperimentProvider";
import { LandingPageABTest } from "./components/experiments/LandingPageABTest";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import ActionPlan from "./pages/ActionPlan";
import Results from "./pages/Results";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CleanResults from "./pages/CleanResults";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminExperiments from "./pages/admin/AdminExperiments";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExperimentProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<LandingPageABTest />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/action-plan/:id" element={<ActionPlan />} />
                <Route path="/results/:id" element={<CleanResults />} />
                
                {/* Admin Routes with AdminLayout wrapper */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="experiments" element={<AdminExperiments />} />
                  <Route path="system-health" element={<AdminSystemHealth />} />
                  <Route path="integrations" element={<AdminIntegrations />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="leads" element={<AdminLeads />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ExperimentProvider>
    </QueryClientProvider>
  );
}

export default App;
