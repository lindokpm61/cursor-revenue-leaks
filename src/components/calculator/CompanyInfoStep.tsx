import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyInfo } from "./useCalculatorData";

interface CompanyInfoStepProps {
  data: CompanyInfo;
  onUpdate: (updates: Partial<CompanyInfo>) => void;
}

export const CompanyInfoStep = ({ data, onUpdate }: CompanyInfoStepProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            placeholder="Enter your company name"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select value={data.industry} onValueChange={(value) => onUpdate({ industry: value })}>
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saas">SaaS/Software</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="fintech">Fintech</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companySize">Company Size</Label>
          <Select value={data.companySize} onValueChange={(value) => onUpdate({ companySize: value })}>
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
              <SelectItem value="small">Small (11-50 employees)</SelectItem>
              <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
              <SelectItem value="large">Large (201-1000 employees)</SelectItem>
              <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyRevenue">Monthly Revenue ($)</Label>
          <Input
            id="monthlyRevenue"
            type="number"
            value={data.monthlyRevenue || ""}
            onChange={(e) => onUpdate({ monthlyRevenue: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h3 className="font-semibold text-foreground mb-2">Why we need this information</h3>
        <p className="text-sm text-muted-foreground">
          Company information helps us provide more accurate benchmarks and recommendations 
          tailored to your industry and business size. This data is used solely for calculation 
          purposes and is not stored or shared.
        </p>
      </div>
    </div>
  );
};