import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ExperimentProvider } from "./components/experiments/ExperimentProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Results from "./pages/Results";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";
import AdminExperiments from "./pages/admin/AdminExperiments";
import AdminSettings from "./pages/admin/AdminSettings";
import { AuthGuard } from "./components/auth/AuthGuard";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminLayout from "./layouts/AdminLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <AuthProvider>
          <ExperimentProvider>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/results" element={<Results />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

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
                  <Route path="*" element={<Index />} />
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
