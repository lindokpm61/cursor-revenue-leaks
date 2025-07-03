import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConversionData } from "./useCalculatorData";
import { Target, Users, Calendar, DollarSign } from "lucide-react";

interface ConversionDataStepProps {
  data: ConversionData;
  onUpdate: (updates: Partial<ConversionData>) => void;
}

export const ConversionDataStep = ({ data, onUpdate }: ConversionDataStepProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="leadToOpportunityRate" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Lead to Opportunity Rate (%)
          </Label>
          <Input
            id="leadToOpportunityRate"
            type="number"
            value={data.leadToOpportunityRate || ""}
            onChange={(e) => onUpdate({ leadToOpportunityRate: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Percentage of qualified leads that become sales opportunities
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="opportunityToCustomerRate" className="flex items-center gap-2">
            <Users className="h-4 w-4 text-revenue-success" />
            Opportunity to Customer Rate (%)
          </Label>
          <Input
            id="opportunityToCustomerRate"
            type="number"
            value={data.opportunityToCustomerRate || ""}
            onChange={(e) => onUpdate({ opportunityToCustomerRate: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Percentage of opportunities that close as customers
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgSalesCycleLength" className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-revenue-warning" />
            Average Sales Cycle (days)
          </Label>
          <Input
            id="avgSalesCycleLength"
            type="number"
            value={data.avgSalesCycleLength || ""}
            onChange={(e) => onUpdate({ avgSalesCycleLength: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Average time from opportunity to closed deal
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgDealSize" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-revenue-growth" />
            Average Deal Size ($)
          </Label>
          <Input
            id="avgDealSize"
            type="number"
            value={data.avgDealSize || ""}
            onChange={(e) => onUpdate({ avgDealSize: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Average revenue per closed deal
          </p>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Conversion Benchmarks by Industry
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground mb-2">Lead to Opportunity</p>
            <div className="space-y-1">
              <p className="text-revenue-success">SaaS: 15-25%</p>
              <p className="text-revenue-success">E-commerce: 20-30%</p>
              <p className="text-revenue-success">B2B Services: 10-20%</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Opportunity to Customer</p>
            <div className="space-y-1">
              <p className="text-revenue-success">SaaS: 20-30%</p>
              <p className="text-revenue-success">E-commerce: 25-35%</p>
              <p className="text-revenue-success">B2B Services: 15-25%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};