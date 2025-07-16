import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, Building, TrendingUp } from "lucide-react";
import { UserRegistrationService } from "@/services/UserRegistrationService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ConsultantRegistrationFormProps {
  email: string;
  submissions: any[];
  pattern: any;
  onSuccess?: () => void;
}

const ConsultantRegistrationForm = ({ 
  email, 
  submissions, 
  pattern, 
  onSuccess 
}: ConsultantRegistrationFormProps) => {
  const [formData, setFormData] = useState({
    email: email,
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    actualCompanyName: "",
    actualRole: "",
    businessModel: "consulting",
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
      const result = await UserRegistrationService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        actualCompanyName: formData.actualCompanyName,
        actualRole: formData.actualRole,
        businessModel: formData.businessModel,
        userClassification: 'consultant',
        userTier: pattern?.value_tier || 'standard'
      });

      if (result.success) {
        toast({
          title: "Consultant Account Created",
          description: `Welcome! Your ${submissions.length} client analyses have been linked to your account.`,
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

  const totalPortfolioValue = pattern?.total_arr || 0;
  const uniqueCompanies = submissions.map(s => s.company_name);

  return (
    <div className="space-y-6">
      {/* Pattern Detection Summary */}
      <Card className="border-revenue-primary/20 bg-revenue-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="h-5 w-5 text-revenue-primary" />
            <h3 className="font-semibold text-revenue-primary">Consultant Account Detected</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            We found {submissions.length} revenue analyses for different companies. 
            Let's set up your consultant profile to properly manage your client portfolio.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-revenue-primary">{submissions.length}</div>
              <div className="text-xs text-muted-foreground">Client Companies</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-revenue-primary">{pattern?.unique_industries || 0}</div>
              <div className="text-xs text-muted-foreground">Industries</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-revenue-primary">{formatCurrency(totalPortfolioValue)}</div>
              <div className="text-xs text-muted-foreground">Total ARR</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Form */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-revenue-primary" />
            Consultant Account Setup
          </CardTitle>
          <CardDescription>
            Create your consultant profile to manage multiple client analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal/Business Identity */}
            <div className="space-y-4">
              <h4 className="font-medium">Your Business Information</h4>
              
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
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualCompanyName">Your Company/Agency</Label>
                  <Input
                    id="actualCompanyName"
                    type="text"
                    placeholder="e.g., Revenue Optimization LLC"
                    value={formData.actualCompanyName}
                    onChange={(e) => setFormData({...formData, actualCompanyName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualRole">Your Role</Label>
                  <Select value={formData.actualRole} onValueChange={(value) => setFormData({...formData, actualRole: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue_consultant">Revenue Consultant</SelectItem>
                      <SelectItem value="business_advisor">Business Advisor</SelectItem>
                      <SelectItem value="agency_owner">Agency Owner</SelectItem>
                      <SelectItem value="fractional_executive">Fractional Executive</SelectItem>
                      <SelectItem value="independent_consultant">Independent Consultant</SelectItem>
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
                <p className="text-sm text-muted-foreground">For partnership opportunities and priority client referrals</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessModel">Client Relationship Type</Label>
                <Select value={formData.businessModel} onValueChange={(value) => setFormData({...formData, businessModel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consulting">Paid consulting clients</SelectItem>
                    <SelectItem value="prospecting">Prospective client analysis</SelectItem>
                    <SelectItem value="due_diligence">Due diligence for investment</SelectItem>
                    <SelectItem value="portfolio">Portfolio company analysis</SelectItem>
                    <SelectItem value="pro_bono">Pro bono/educational</SelectItem>
                  </SelectContent>
                </Select>
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
              {loading ? "Creating Consultant Account..." : "Create Consultant Account"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Client Portfolio Preview */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Your Client Portfolio</CardTitle>
          <CardDescription>Companies you've analyzed will be linked to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {uniqueCompanies.slice(0, 5).map((company, index) => {
              const submission = submissions.find(s => s.company_name === company);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{company}</div>
                      {submission?.industry && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {submission.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {submission?.current_arr && (
                      <div className="font-medium">{formatCurrency(submission.current_arr)} ARR</div>
                    )}
                    {submission?.total_leak && (
                      <div className="text-revenue-primary text-xs">
                        {formatCurrency(submission.total_leak)} opportunity
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {uniqueCompanies.length > 5 && (
              <div className="text-center text-sm text-muted-foreground">
                +{uniqueCompanies.length - 5} more companies
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultantRegistrationForm;