import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyInfo } from "./useCalculatorData";
import { Building2, Mail, DollarSign, AlertCircle, Phone } from "lucide-react";
import { saveCalculatorProgress } from "@/lib/coreDataCapture";
import { isValidEmail } from "@/lib/calculatorHandlers";
import { useEffect, useState } from "react";

// Helper function to safely convert input values to numbers
const safeInputNumber = (value: string): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface CompanyInfoStepProps {
  data: CompanyInfo;
  onUpdate: (updates: Partial<CompanyInfo>) => void;
}

export const CompanyInfoStep = ({ data, onUpdate }: CompanyInfoStepProps) => {
  const [emailError, setEmailError] = useState<string>("");
  
  // Validate email when it changes
  useEffect(() => {
    if (data.email && data.email.trim()) {
      if (!isValidEmail(data.email)) {
        setEmailError("Please provide a valid business email address");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  }, [data.email]);
  // Auto-save data when it changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (data.email || data.companyName) {
        try {
          await saveCalculatorProgress({
            email: data.email,
            phone: data.phone,
            companyName: data.companyName,
            industry: data.industry,
            currentARR: data.currentARR,
          }, 1);
        } catch (error) {
          console.error('Error saving step 1 data:', error);
        }
      }
    }, 2000); // Debounce saves by 2 seconds

    return () => clearTimeout(timeoutId);
  }, [data]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Information
          </CardTitle>
          <CardDescription>
            Tell us about your company to provide personalized insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={data.companyName}
                onChange={(e) => onUpdate({ companyName: e.target.value })}
                placeholder="Enter your company name"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => onUpdate({ email: e.target.value })}
                  placeholder="your.email@company.com"
                  className={`pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary ${
                    emailError ? 'border-destructive' : ''
                  }`}
                />
                {emailError && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">Business Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={(e) => onUpdate({ phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-sm text-muted-foreground">For priority consultation opportunities</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={data.industry} onValueChange={(value) => onUpdate({ industry: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas-software">SaaS & Software</SelectItem>
                  <SelectItem value="technology-it">Technology & IT</SelectItem>
                  <SelectItem value="marketing-advertising">Marketing & Advertising</SelectItem>
                  <SelectItem value="financial-services">Financial Services</SelectItem>
                  <SelectItem value="consulting-professional">Consulting & Professional Services</SelectItem>
                  <SelectItem value="ecommerce-retail">E-commerce & Retail</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="current-arr">Current Annual Recurring Revenue (ARR)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current-arr"
                  type="number"
                  value={data.currentARR ?? ""}
                  onChange={(e) => onUpdate({ currentARR: safeInputNumber(e.target.value) })}
                  placeholder="1000000"
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-sm text-muted-foreground">Enter your annual recurring revenue in USD</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-revenue-success">110%</div>
              <p className="text-sm text-muted-foreground">Average NRR Benchmark</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">78%</div>
              <p className="text-sm text-muted-foreground">Gross Margin Benchmark</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-revenue-warning">32%</div>
              <p className="text-sm text-muted-foreground">Growth Rate Benchmark</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};