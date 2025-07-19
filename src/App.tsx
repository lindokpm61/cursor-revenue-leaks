import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ExperimentProvider } from "./components/experiments/ExperimentProvider";
import { LandingPageABTest } from "./components/experiments/LandingPageABTest";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import ActionPlan from "./pages/ActionPlan";
import Results from "./pages/Results";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CleanResults from "./pages/CleanResults";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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
                <Route path="/admin" element={<Admin />} />
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
