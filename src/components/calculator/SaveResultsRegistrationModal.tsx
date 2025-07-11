import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, TrendingUp, Calculator } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserPattern } from "@/hooks/useUserPattern";
import { supabase } from "@/integrations/supabase/client";
import { submissionService, userProfileService, analyticsService, integrationLogService } from "@/lib/supabase";
import { handleUserRegistration } from "@/lib/advancedAutomation";
import { getTempId } from "@/lib/coreDataCapture";
import { CalculatorData, Calculations } from "./useCalculatorData";

interface SaveResultsRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CalculatorData;
  calculations: Calculations;
  onSuccess: (submissionId: string) => void;
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  actualCompany?: string;
  actualRole?: string;
  businessModel?: string;
  password: string;
}

export const SaveResultsRegistrationModal = ({ 
  isOpen, 
  onClose, 
  data, 
  calculations, 
  onSuccess 
}: SaveResultsRegistrationModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    email: data.companyInfo.email || '',
    firstName: '',
    lastName: '',
    phone: data.companyInfo.phone || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  
  // Use pattern analysis for email
  const { pattern, submissions, loading: patternLoading } = useUserPattern(formData.email);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      compactDisplay: 'short'
    }).format(amount);
  };

  const calculateLeadScore = (data: CalculatorData, calculations: Calculations): number => {
    let score = 0;
    
    // ARR Points
    const arr = data.companyInfo.currentARR || 0;
    if (arr >= 5000000) {
      score += 50; // $5M+
    } else if (arr >= 1000000) {
      score += 40; // $1M-5M
    } else if (arr >= 500000) {
      score += 30; // $500K-1M
    } else {
      score += 20; // <$500K
    }
    
    // Leak Impact Points
    const totalLeak = calculations.totalLeakage || 0;
    if (totalLeak >= 1000000) {
      score += 40; // $1M+ leak
    } else if (totalLeak >= 500000) {
      score += 30; // $500K-1M leak
    } else if (totalLeak >= 250000) {
      score += 20; // $250K-500K leak
    } else {
      score += 10; // <$250K leak
    }
    
    // Industry Multiplier
    const industry = data.companyInfo.industry?.toLowerCase() || '';
    if (industry.includes('saas-software') || industry.includes('saas') || industry.includes('software')) {
      score += 12; // SaaS & Software (highest intent)
    } else if (industry.includes('marketing-advertising') || industry.includes('marketing') || industry.includes('advertising')) {
      score += 9; // Marketing & Advertising (high intent)
    } else if (industry.includes('technology-it') || industry.includes('technology') || industry.includes('tech')) {
      score += 8; // Technology & IT
    } else if (industry.includes('financial-services') || industry.includes('finance') || industry.includes('financial')) {
      score += 8; // Financial Services
    } else if (industry.includes('consulting-professional') || industry.includes('consulting') || industry.includes('professional')) {
      score += 7; // Consulting & Professional Services
    } else if (industry.includes('healthcare')) {
      score += 6; // Healthcare
    } else if (industry.includes('ecommerce-retail') || industry.includes('ecommerce') || industry.includes('retail')) {
      score += 6; // E-commerce & Retail
    } else if (industry.includes('manufacturing')) {
      score += 5; // Manufacturing
    } else if (industry.includes('education')) {
      score += 5; // Education
    } else {
      score += 4; // Other
    }
    
    return Math.min(score, 100); // Cap at 100
  };

  const getFormConfig = () => {
    const userType = pattern?.user_type || 'standard';
    
    switch (userType) {
      case 'consultant':
        return {
          title: "Consultant Account Setup",
          subtitle: "We detected you've analyzed multiple companies",
          message: `Set up your consultant profile to save this ${formatCurrency(calculations.totalLeakage)} recovery opportunity`,
          roleOptions: [
            'Revenue Consultant',
            'Business Advisor', 
            'Agency Owner',
            'Fractional Executive',
            'Independent Consultant'
          ],
          businessModelOptions: [
            'Paid consulting client',
            'Prospective client analysis',
            'Due diligence for investment',
            'Portfolio company analysis',
            'Pro bono/educational'
          ]
        };
        
      case 'enterprise':
        return {
          title: "Enterprise Account Setup",
          subtitle: "Managing multiple business units?",
          message: `Set up your enterprise access to save this ${formatCurrency(calculations.totalLeakage)} analysis`,
          roleOptions: [
            'VP Revenue Operations',
            'Chief Revenue Officer',
            'VP Finance',
            'Chief Operating Officer',
            'Division Manager'
          ]
        };
        
      default: // standard user
        return {
          title: `Save Your ${data.companyInfo.companyName} Analysis`,
          subtitle: "Create your account to access your results",
          message: `Secure your ${formatCurrency(calculations.totalLeakage)} recovery opportunity`,
          roleOptions: [
            'CEO/Founder',
            'CRO/VP Sales', 
            'VP Marketing',
            'VP Operations',
            'Head of Revenue',
            'Other'
          ]
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the advanced registration handler with data migration
      const tempId = getTempId();
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        actualCompany: formData.actualCompany || data.companyInfo.companyName,
        actualRole: formData.actualRole,
        businessModel: formData.businessModel || 'internal',
        role: 'user'
      };

      const result = await handleUserRegistration(registrationData, tempId);
      
      if (result.user && result.submission) {
        toast({
          title: "Account Created Successfully!",
          description: "Your revenue analysis has been saved and email sequences activated.",
        });
        
        onSuccess(result.submission.id);
      } else {
        throw new Error('Registration completed but submission failed');
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove the old saveResultsForUser function as it's now handled by advancedAutomation

  const config = getFormConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-revenue-primary">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">{config.title}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {config.subtitle}
          </p>
        </DialogHeader>

        {/* Value Proposition */}
        <Card className="border-revenue-success/20 bg-revenue-success/5 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-revenue-success" />
              <div className="text-lg font-bold text-revenue-success">
                {formatCurrency(calculations.totalLeakage)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {config.message}
            </p>
          </CardContent>
        </Card>

        {patternLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Analyzing your profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email*</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">For priority consultation and implementation support</p>
            </div>

            {(pattern?.user_type === 'consultant' || pattern?.user_type === 'enterprise') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="actualCompany">
                    {pattern.user_type === 'consultant' ? 'Your Company/Agency*' : 'Parent Company*'}
                  </Label>
                  <Input
                    id="actualCompany"
                    type="text"
                    value={formData.actualCompany || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualCompany: e.target.value }))}
                    placeholder={pattern.user_type === 'consultant' ? 'e.g., Revenue Optimization LLC' : ''}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualRole">Your Role*</Label>
                  <Select
                    value={formData.actualRole || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, actualRole: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {pattern.user_type === 'consultant' && config.businessModelOptions && (
                  <div className="space-y-2">
                    <Label htmlFor="businessModel">How do you work with these companies?*</Label>
                    <Select
                      value={formData.businessModel || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, businessModel: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business model" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.businessModelOptions.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {pattern?.user_type === 'standard' && (
              <div className="space-y-2">
                <Label htmlFor="role">Your Role at {data.companyInfo.companyName}*</Label>
                <Select
                  value={formData.actualRole || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, actualRole: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-revenue-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                pattern?.user_type === 'consultant' ? 'Create Consultant Account' :
                pattern?.user_type === 'enterprise' ? 'Create Enterprise Account' :
                'Save My Analysis'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};