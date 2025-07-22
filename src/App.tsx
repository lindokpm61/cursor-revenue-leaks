import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import { ExperimentProvider } from "./context/ExperimentContext";
import { ErrorBoundary } from 'react-error-boundary';
import ErrorScreen from "./components/ErrorScreen";
import PublicLayout from "./layouts/PublicLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CalculatorPage from "./pages/CalculatorPage";
import ResultsPage from "./pages/ResultsPage";
import AccountPage from "./pages/AccountPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";
import AdminExperiments from "./pages/admin/AdminExperiments";
import AdminSettings from "./pages/admin/AdminSettings";
import AuthGuard from "./components/AuthGuard";
import GuestGuard from "./components/GuestGuard";
import AdminGuard from "./components/AdminGuard";
import AdminEmails from "./pages/admin/AdminEmails";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <ErrorBoundary FallbackComponent={ErrorScreen}>
        <AuthProvider>
          <ExperimentProvider>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
                  <Route path="/calculator" element={<PublicLayout><CalculatorPage /></PublicLayout>} />
                  <Route path="/results" element={<PublicLayout><ResultsPage /></PublicLayout>} />

                  {/* Auth Routes */}
                  <Route path="/login" element={
                    <GuestGuard>
                      <AuthLayout><LoginPage /></AuthLayout>
                    </GuestGuard>
                  } />
                  <Route path="/register" element={
                    <GuestGuard>
                      <AuthLayout><RegisterPage /></AuthLayout>
                    </GuestGuard>
                  } />

                  {/* Protected Routes */}
                  <Route path="/account" element={
                    <AuthGuard>
                      <PublicLayout><AccountPage /></PublicLayout>
                    </AuthGuard>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminDashboard />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/analytics" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminAnalytics />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/leads" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminLeads />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/users" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminUsers />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/emails" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminEmails />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/integrations" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminIntegrations />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/system-health" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminSystemHealth />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/experiments" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminExperiments />
                      </AdminLayout>
                    </AuthGuard>
                  } />
                  <Route path="/admin/settings" element={
                    <AuthGuard>
                      <AdminLayout>
                        <AdminSettings />
                      </AdminLayout>
                    </AuthGuard>
                  } />

                  {/* Catch-all route */}
                  <Route path="*" element={<PublicLayout><LandingPage /></PublicLayout>} />
                </Routes>
              </BrowserRouter>
            </QueryClientProvider>
          </ExperimentProvider>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
