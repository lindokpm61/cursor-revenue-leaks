import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { OperationsData } from "./useCalculatorData";
import { TrendingDown, DollarSign, TrendingUp, Heart } from "lucide-react";

interface OperationsDataStepProps {
  data: OperationsData;
  onUpdate: (updates: Partial<OperationsData>) => void;
}

export const OperationsDataStep = ({ data, onUpdate }: OperationsDataStepProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customerChurnRate" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-revenue-danger" />
            Monthly Churn Rate (%)
          </Label>
          <Input
            id="customerChurnRate"
            type="number"
            value={data.customerChurnRate || ""}
            onChange={(e) => onUpdate({ customerChurnRate: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Percentage of customers lost each month
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerLifetimeValue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-revenue-growth" />
            Customer Lifetime Value ($)
          </Label>
          <Input
            id="customerLifetimeValue"
            type="number"
            value={data.customerLifetimeValue || ""}
            onChange={(e) => onUpdate({ customerLifetimeValue: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Total revenue expected from a customer over their lifetime
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="upsellRate" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-revenue-success" />
            Upsell Rate (%)
          </Label>
          <Input
            id="upsellRate"
            type="number"
            value={data.upsellRate || ""}
            onChange={(e) => onUpdate({ upsellRate: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Percentage of customers who purchase additional products/services
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerSatisfactionScore" className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Customer Satisfaction Score (1-10)
          </Label>
          <Input
            id="customerSatisfactionScore"
            type="number"
            value={data.customerSatisfactionScore || ""}
            onChange={(e) => onUpdate({ customerSatisfactionScore: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="1"
            max="10"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Average customer satisfaction rating (NPS, CSAT, etc.)
          </p>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Customer Success Benchmarks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground mb-2">Churn Rate</p>
            <div className="space-y-1">
              <p className="text-revenue-success">Excellent: &lt;2%</p>
              <p className="text-revenue-warning">Good: 2-5%</p>
              <p className="text-revenue-danger">Poor: &gt;5%</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Upsell Rate</p>
            <div className="space-y-1">
              <p className="text-revenue-success">Excellent: &gt;30%</p>
              <p className="text-revenue-warning">Good: 15-30%</p>
              <p className="text-revenue-danger">Poor: &lt;15%</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">CSAT Score</p>
            <div className="space-y-1">
              <p className="text-revenue-success">Excellent: 8-10</p>
              <p className="text-revenue-warning">Good: 6-8</p>
              <p className="text-revenue-danger">Poor: &lt;6</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};