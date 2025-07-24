import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CompanyInfo } from "./useCalculatorData";
import { Building2, Mail, DollarSign, AlertCircle, Phone, TrendingUp, Users, Target } from "lucide-react";
import { saveCalculatorProgress } from "@/lib/coreDataCapture";
import { isValidEmail } from "@/lib/calculatorHandlers";
import { useEffect, useState } from "react";
import { EnhancedInput } from "./EnhancedInput";
import { industryDefaults, formatValue } from "@/lib/industryDefaults";

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
  const [showIndustryDefaults, setShowIndustryDefaults] = useState(false);
  
  // Get industry-specific data
  const industryData = data.industry ? industryDefaults[data.industry] : null;
  
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

  // Show industry defaults when industry is selected
  useEffect(() => {
    if (data.industry && !data.currentARR) {
      setShowIndustryDefaults(true);
    }
  }, [data.industry, data.currentARR]);

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

  const applyIndustryDefaults = () => {
    if (industryData) {
      // Calculate ARR from MRR * 12 as a reasonable starting point
      const estimatedARR = industryData.monthlyMRR * 12;
      onUpdate({ currentARR: estimatedARR });
      setShowIndustryDefaults(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Information
          </CardTitle>
          <CardDescription>
            Tell us about your company to provide personalized insights and industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EnhancedInput
              id="company-name"
              label="Company Name"
              value={data.companyName || ""}
              onChange={(value) => onUpdate({ companyName: value as string })}
              placeholder="Enter your company name"
              validation={{ required: true }}
              helpText="Your company name helps us provide relevant industry benchmarks"
            />

            <EnhancedInput
              id="email"
              label="Email Address"
              type="email"
              value={data.email || ""}
              onChange={(value) => onUpdate({ email: value as string })}
              placeholder="your.email@company.com"
              icon={<Mail className="h-4 w-4 text-muted-foreground" />}
              validation={{ 
                required: true, 
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please provide a valid business email address"
              }}
              helpText="We'll use this to send your personalized revenue leak analysis"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EnhancedInput
              id="phone"
              label="Business Phone Number"
              type="tel"
              value={data.phone || ""}
              onChange={(value) => onUpdate({ phone: value as string })}
              placeholder="+1 (555) 123-4567"
              icon={<Phone className="h-4 w-4 text-muted-foreground" />}
              helpText="Optional - For priority consultation opportunities"
            />

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                value={data.industry} 
                onValueChange={(value) => onUpdate({ industry: value })}
              >
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
              <p className="text-sm text-muted-foreground">
                This helps us provide industry-specific benchmarks and smart defaults
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <EnhancedInput
              id="current-arr"
              label="Current Annual Recurring Revenue (ARR)"
              type="number"
              value={data.currentARR ?? ""}
              onChange={(value) => onUpdate({ currentARR: safeInputNumber(value as string) })}
              placeholder="1000000"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              validation={{
                min: 0,
                max: 1000000000
              }}
              benchmark={industryData ? {
                value: industryData.monthlyMRR * 12,
                label: "Industry Average",
                type: "good"
              } : undefined}
              helpText="Enter your annual recurring revenue in USD"
              formatValue={(value) => `$${value.toLocaleString()}`}
            />

            {/* Industry defaults suggestion */}
            {showIndustryDefaults && industryData && (
              <Card className="border-accent/20 bg-accent/5 animate-fade-in">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-accent" />
                      <div>
                        <h4 className="font-medium">Apply Industry Defaults</h4>
                        <p className="text-sm text-muted-foreground">
                          Based on {data.industry?.replace('-', ' ')} industry averages
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent/10"
                      onClick={applyIndustryDefaults}
                    >
                      Apply {formatValue('monthlyMRR', industryData.monthlyMRR * 12)} ARR
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Industry Benchmarks */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-accent" />
            {data.industry ? 
              `${data.industry.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Benchmarks` : 
              'SaaS Industry Benchmarks'
            }
          </CardTitle>
          <CardDescription>
            {data.industry ? 
              'Industry-specific performance indicators for your sector' :
              'General SaaS performance indicators - select your industry for customized benchmarks'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-4 w-4 text-revenue-success" />
                <div className="text-2xl font-bold text-revenue-success">
                  {industryData ? 
                    `${industryData.freeToPaidConversionRate}%` : 
                    '12%'
                  }
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Conversion Rate Target</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <div className="text-2xl font-bold text-primary">
                  {industryData ? 
                    formatValue('averageDealValue', industryData.averageDealValue) : 
                    '$15K'
                  }
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Average Deal Value</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-revenue-warning" />
                <div className="text-2xl font-bold text-revenue-warning">110%</div>
              </div>
              <p className="text-sm text-muted-foreground">Net Revenue Retention</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};