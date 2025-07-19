
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader, Save, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserPattern } from "@/hooks/useUserPattern";
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
  
  // Use pattern analysis for email (but don't restrict access)
  const { pattern, loading: patternLoading } = useUserPattern(formData.email);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tempId = getTempId();
      
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        actualCompany: formData.actualCompany || data.companyInfo.companyName,
        actualRole: formData.actualRole,
        businessModel: 'internal',
        role: 'user'
      };

      const result = await handleUserRegistration(registrationData, tempId);
      
      if (result.user) {
        if (result.submission) {
          toast({
            title: "Account Created!",
            description: "Your analysis has been saved to your dashboard.",
          });
          onSuccess(result.submission.id);
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome! Your analysis is being saved...",
          });
          onClose();
        }
      } else {
        throw new Error('Failed to create account');
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Account Creation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto" aria-describedby="registration-dialog-description">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-revenue-primary">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold">Save to Your Dashboard</DialogTitle>
          <p id="registration-dialog-description" className="text-sm text-muted-foreground mt-2">
            Create your account to save, track, and share your analysis
          </p>
        </DialogHeader>

        {/* Value Proposition - Simplified */}
        <Card className="border-revenue-success/20 bg-gradient-to-r from-revenue-success/5 to-primary/5 mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-revenue-success mb-2">
                {formatCurrency(calculations.totalLeakage)}
              </div>
              <p className="text-sm font-medium text-foreground mb-3">
                Recovery Opportunity Secured
              </p>
            </div>
            
            {/* What you get - Streamlined */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-revenue-success flex items-center justify-center">
                  <span className="text-white text-[10px]">✓</span>
                </div>
                <span>Permanent dashboard access</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-revenue-success flex items-center justify-center">
                  <span className="text-white text-[10px]">✓</span>
                </div>
                <span>Track implementation progress</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-revenue-success flex items-center justify-center">
                  <span className="text-white text-[10px]">✓</span>
                </div>
                <span>Share analysis with your team</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simplified Form */}
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
            <Label htmlFor="email">Email Address*</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              placeholder="any@email.com - all email types accepted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">For priority consultation access</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Your Role at {data.companyInfo.companyName}</Label>
            <Select
              value={formData.actualRole || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, actualRole: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CEO/Founder">CEO/Founder</SelectItem>
                <SelectItem value="CRO/VP Sales">CRO/VP Sales</SelectItem>
                <SelectItem value="VP Marketing">VP Marketing</SelectItem>
                <SelectItem value="VP Operations">VP Operations</SelectItem>
                <SelectItem value="Head of Revenue">Head of Revenue</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Create Password*</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
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
              <>
                <Save className="h-4 w-4 mr-2" />
                Save My Analysis
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            No email verification required • Instant access • Secure & confidential
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
