import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadGeneration } from "./useCalculatorData";
import { TrendingUp, DollarSign, Clock } from "lucide-react";
import { saveCalculatorProgress } from "@/lib/coreDataCapture";
import { useEffect } from "react";

// Helper function to safely convert input values to numbers
const safeInputNumber = (value: string): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface LeadGenerationStepProps {
  data: LeadGeneration;
  onUpdate: (updates: Partial<LeadGeneration>) => void;
}

export const LeadGenerationStep = ({ data, onUpdate }: LeadGenerationStepProps) => {
  // Enhanced auto-save data when it changes with validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Only save if we have meaningful data
      if (data.monthlyLeads && data.monthlyLeads > 0) {
        try {
          await saveCalculatorProgress({
            monthlyLeads: data.monthlyLeads,
            averageDealValue: data.averageDealValue || 0,
            leadResponseTimeHours: data.leadResponseTimeHours || 0
          }, 2);
        } catch (error) {
          console.error('Error saving step 2 data:', error);
        }
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [data]);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Lead Generation Metrics
          </CardTitle>
          <CardDescription>
            How effectively are you generating and responding to leads?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="monthly-leads">Monthly Leads</Label>
            <Input
              id="monthly-leads"
              type="number"
              value={data.monthlyLeads ?? ""}
              onChange={(e) => onUpdate({ monthlyLeads: safeInputNumber(e.target.value) })}
              placeholder="500"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
            <p className="text-sm text-muted-foreground">Total leads generated per month</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="average-deal-value">Average Deal Value</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="average-deal-value"
                type="number"
                value={data.averageDealValue ?? ""}
                onChange={(e) => onUpdate({ averageDealValue: safeInputNumber(e.target.value) })}
                placeholder="5000"
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">Average revenue per closed deal</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-response-time">Lead Response Time (Hours)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="lead-response-time"
                type="number"
                value={data.leadResponseTimeHours ?? ""}
                onChange={(e) => onUpdate({ leadResponseTimeHours: safeInputNumber(e.target.value) })}
                placeholder="2"
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">Average time to respond to new leads</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-revenue-warning/20 bg-revenue-warning/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">⚡ 2025 Response Time Framework</h3>
          <p className="text-sm text-muted-foreground mb-3">
            New research shows exponential decay: 100x higher contact probability within 5 minutes vs 30 minutes.
          </p>
          <div className="grid grid-cols-2 gap-3 text-center mb-3">
            <div>
              <div className="text-lg font-bold text-revenue-success">0-5 min</div>
              <p className="text-xs text-muted-foreground">100% Effectiveness</p>
            </div>
            <div>
              <div className="text-lg font-bold text-revenue-warning">5-30 min</div>
              <p className="text-xs text-muted-foreground">60-85% Effectiveness</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-revenue-danger">1-4 hours</div>
              <p className="text-xs text-muted-foreground">15-35% Effectiveness</p>
            </div>
            <div>
              <div className="text-lg font-bold text-revenue-danger">4+ hours</div>
              <p className="text-xs text-muted-foreground">5-15% Effectiveness</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            <strong>Deal Size Targets:</strong> SMB (&lt;$25K): &lt;5min | Mid-Market ($25-100K): &lt;15min | Enterprise ($100K+): &lt;60min
          </p>
        </CardContent>
      </Card>
    </div>
  );
};