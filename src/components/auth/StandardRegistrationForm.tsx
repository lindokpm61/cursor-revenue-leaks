import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, TrendingUp } from "lucide-react";
import { multiCompanyUserService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface StandardRegistrationFormProps {
  email: string;
  submissions: any[];
  pattern: any;
  onSuccess?: () => void;
}

const StandardRegistrationForm = ({ 
  email, 
  submissions, 
  pattern, 
  onSuccess 
}: StandardRegistrationFormProps) => {
  const primarySubmission = submissions?.[0];
  const [formData, setFormData] = useState({
    email: email,
    password: "",
    confirmPassword: "",
    firstName: "",
    actualCompanyName: primarySubmission?.company_name || "",
    actualRole: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await multiCompanyUserService.createUserWithClassification({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        phone: formData.phone,
        actualCompanyName: formData.actualCompanyName,
        actualRole: formData.actualRole,
        businessModel: 'internal',
        userClassification: 'standard',
        userTier: pattern?.value_tier || 'standard'
      });

      if (result.success) {
        toast({
          title: "Account Created Successfully",
          description: "Welcome! Your revenue analysis has been saved to your account.",
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/dashboard");
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Registration failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      {primarySubmission && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">Your Revenue Analysis Ready</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Create your account to access your revenue recovery plan and track your progress.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {primarySubmission.current_arr ? formatCurrency(primarySubmission.current_arr) : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Current ARR</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-revenue-primary">
                  {primarySubmission.total_leak ? formatCurrency(primarySubmission.total_leak) : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Revenue Opportunity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-revenue-success">
                  {primarySubmission.recovery_potential_70 ? formatCurrency(primarySubmission.recovery_potential_70) : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Recovery Potential</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Get Your Revenue Recovery Plan
          </CardTitle>
          <CardDescription>
            Create your account to access detailed insights and implementation guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="bg-muted/50"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actualCompanyName">Company Name</Label>
                  <Input
                    id="actualCompanyName"
                    type="text"
                    value={formData.actualCompanyName}
                    onChange={(e) => setFormData({...formData, actualCompanyName: e.target.value})}
                    required
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualRole">Your Role at {formData.actualCompanyName || 'Company'}</Label>
                  <Select value={formData.actualRole} onValueChange={(value) => setFormData({...formData, actualRole: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ceo">CEO/Founder</SelectItem>
                      <SelectItem value="head_of_revenue">Head of Revenue</SelectItem>
                      <SelectItem value="vp_marketing">VP Marketing</SelectItem>
                      <SelectItem value="vp_sales">VP Sales</SelectItem>
                      <SelectItem value="operations_manager">Operations Manager</SelectItem>
                      <SelectItem value="finance_director">Finance Director</SelectItem>
                      <SelectItem value="business_owner">Business Owner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Business Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">For priority consultation and implementation support</p>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Account Security</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-revenue-primary"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Get My Recovery Plan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Company Analysis Preview */}
      {primarySubmission && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Your Analysis: {primarySubmission.company_name}</CardTitle>
            <CardDescription>Analysis completed on {new Date(primarySubmission.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Industry:</span>
                  <Badge variant="outline" className="text-xs">
                    {primarySubmission.industry || 'Not specified'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Leads:</span>
                  <span className="text-sm font-medium">
                    {primarySubmission.monthly_leads || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Average Deal Value:</span>
                  <span className="text-sm font-medium">
                    {primarySubmission.average_deal_value ? formatCurrency(primarySubmission.average_deal_value) : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Lead Response Time:</span>
                  <span className="text-sm font-medium">
                    {primarySubmission.lead_response_time ? `${primarySubmission.lead_response_time}h` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed Payment Rate:</span>
                  <span className="text-sm font-medium">
                    {primarySubmission.failed_payment_rate ? `${primarySubmission.failed_payment_rate}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Lead Score:</span>
                  <span className="text-sm font-medium text-primary">
                    {primarySubmission.lead_score || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StandardRegistrationForm;