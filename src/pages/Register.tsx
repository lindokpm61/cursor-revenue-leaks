import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ArrowLeft, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserPattern, getUserTypeDisplayName } from "@/hooks/useUserPattern";
import ConsultantRegistrationForm from "@/components/auth/ConsultantRegistrationForm";
import EnterpriseRegistrationForm from "@/components/auth/EnterpriseRegistrationForm";
import StandardRegistrationForm from "@/components/auth/StandardRegistrationForm";

const Register = () => {
  const [email, setEmail] = useState("");
  const [showPatternAnalysis, setShowPatternAnalysis] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use pattern analysis for email
  const { pattern, submissions, loading: patternLoading, error: patternError } = useUserPattern(email);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setShowPatternAnalysis(true);
    }
  };

  const handleRegistrationSuccess = () => {
    toast({
      title: "Account Created Successfully",
      description: "Welcome! You can now access your revenue analysis dashboard.",
    });
    navigate("/dashboard");
  };

  const renderRegistrationForm = () => {
    if (!showPatternAnalysis || patternLoading) {
      return null;
    }

    // If no submissions found, use standard form
    if (!submissions || submissions.length === 0) {
      return (
        <StandardRegistrationForm
          email={email}
          submissions={[]}
          pattern={null}
          onSuccess={handleRegistrationSuccess}
        />
      );
    }

    // Determine form type based on pattern analysis
    const userType = pattern?.user_type || 'standard';
    
    switch (userType) {
      case 'consultant':
        return (
          <ConsultantRegistrationForm
            email={email}
            submissions={submissions}
            pattern={pattern}
            onSuccess={handleRegistrationSuccess}
          />
        );
      case 'enterprise':
        return (
          <EnterpriseRegistrationForm
            email={email}
            submissions={submissions}
            pattern={pattern}
            onSuccess={handleRegistrationSuccess}
          />
        );
      case 'investor':
        return (
          <ConsultantRegistrationForm
            email={email}
            submissions={submissions}
            pattern={pattern}
            onSuccess={handleRegistrationSuccess}
          />
        );
      default:
        return (
          <StandardRegistrationForm
            email={email}
            submissions={submissions}
            pattern={pattern}
            onSuccess={handleRegistrationSuccess}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary to-revenue-primary">
              <Calculator className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
          </div>
          <p className="text-muted-foreground">
            {showPatternAnalysis 
              ? `Smart account setup for ${getUserTypeDisplayName(pattern?.user_type || 'standard')}` 
              : "Join thousands of SaaS leaders optimizing their revenue"
            }
          </p>
        </div>

        {/* Email Entry or Registration Form */}
        {!showPatternAnalysis ? (
          <div className="max-w-md mx-auto">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Enter Your Email</CardTitle>
                <CardDescription>
                  We'll analyze your submission history to personalize your account setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-revenue-primary"
                    disabled={!email || !email.includes('@')}
                  >
                    Continue
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="mt-6 border-revenue-success/20 bg-revenue-success/5">
              <CardContent className="p-4">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-revenue-success">What you'll get:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Unlimited revenue assessments</li>
                    <li>• Historical analysis tracking</li>
                    <li>• Industry benchmarking</li>
                    <li>• Priority email support</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pattern Analysis Loading */}
            {patternLoading && (
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Loader className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">
                      Analyzing your submission history...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pattern Analysis Error */}
            {patternError && (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-sm text-destructive">
                    Could not analyze submission history. Using standard registration.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Adaptive Registration Form */}
            {renderRegistrationForm()}

            {/* Back to Email Entry */}
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setShowPatternAnalysis(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Use different email
              </Button>
            </div>

            {/* Already have account link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;