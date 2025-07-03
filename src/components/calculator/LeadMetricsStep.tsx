import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LeadMetrics } from "./useCalculatorData";
import { TrendingUp, Clock, Target, DollarSign } from "lucide-react";

interface LeadMetricsStepProps {
  data: LeadMetrics;
  onUpdate: (updates: Partial<LeadMetrics>) => void;
}

export const LeadMetricsStep = ({ data, onUpdate }: LeadMetricsStepProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="monthlyLeads" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Monthly Leads
          </Label>
          <Input
            id="monthlyLeads"
            type="number"
            value={data.monthlyLeads || ""}
            onChange={(e) => onUpdate({ monthlyLeads: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Total number of leads generated per month
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leadQualificationRate" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-revenue-success" />
            Lead Qualification Rate (%)
          </Label>
          <Input
            id="leadQualificationRate"
            type="number"
            value={data.leadQualificationRate || ""}
            onChange={(e) => onUpdate({ leadQualificationRate: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Percentage of leads that meet qualification criteria
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgLeadValue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-revenue-growth" />
            Average Lead Value ($)
          </Label>
          <Input
            id="avgLeadValue"
            type="number"
            value={data.avgLeadValue || ""}
            onChange={(e) => onUpdate({ avgLeadValue: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Estimated potential value per lead
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leadResponseTime" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-revenue-warning" />
            Lead Response Time (hours)
          </Label>
          <Input
            id="leadResponseTime"
            type="number"
            value={data.leadResponseTime || ""}
            onChange={(e) => onUpdate({ leadResponseTime: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Average time to respond to new leads
          </p>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Lead Quality Benchmarks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-revenue-success">Good (70%+)</p>
            <p className="text-muted-foreground">High-quality lead qualification</p>
          </div>
          <div>
            <p className="font-medium text-revenue-warning">Average (40-70%)</p>
            <p className="text-muted-foreground">Room for improvement</p>
          </div>
          <div>
            <p className="font-medium text-revenue-danger">Poor (&lt;40%)</p>
            <p className="text-muted-foreground">Significant optimization needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};