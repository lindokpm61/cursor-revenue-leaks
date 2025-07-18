import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ExperimentProvider } from "./hooks/useExperiment";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import ActionPlan from "./pages/ActionPlan";
import PublicActionPlan from "./pages/PublicActionPlan";
import Results from "./pages/Results";
import PublicResults from "./pages/PublicResults";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PublicCalculator from "./pages/PublicCalculator";
import CleanResults from "./pages/CleanResults";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExperimentProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/public-calculator" element={<PublicCalculator />} />
                <Route path="/action-plan/:id" element={<ActionPlan />} />
                <Route path="/public-action-plan/:id" element={<PublicActionPlan />} />
                <Route path="/results/:id" element={<CleanResults />} />
                <Route path="/public-results/:id" element={<PublicResults />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ExperimentProvider>
    </QueryClientProvider>
  );
}

export default App;
