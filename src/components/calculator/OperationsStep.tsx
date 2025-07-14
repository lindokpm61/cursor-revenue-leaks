import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperationsData } from "./useCalculatorData";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import { saveCalculatorProgress } from "@/lib/coreDataCapture";
import { useEffect } from "react";

// Helper function to safely convert input values to numbers
const safeInputNumber = (value: string): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface OperationsStepProps {
  data: OperationsData;
  onUpdate: (updates: Partial<OperationsData>) => void;
}

export const OperationsStep = ({ data, onUpdate }: OperationsStepProps) => {
  // Enhanced auto-save data when it changes with validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Only save if we have meaningful data
      if (data.manualHoursPerWeek || data.failedPaymentRate || data.hourlyRate) {
        try {
          await saveCalculatorProgress({
            manualHoursPerWeek: data.manualHoursPerWeek || 0,
            hourlyRate: data.hourlyRate || 0,
            failedPaymentRate: data.failedPaymentRate || 0
          }, 4);
        } catch (error) {
          console.error('Error saving step 4 data:', error);
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
            <AlertTriangle className="h-5 w-5 text-primary" />
            Operations Data
          </CardTitle>
          <CardDescription>
            How much revenue is lost due to operational inefficiencies?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="failed-payment-rate">Failed Payment Rate %</Label>
            <Input
              id="failed-payment-rate"
              type="number"
              value={data.failedPaymentRate ?? ""}
              onChange={(e) => onUpdate({ failedPaymentRate: safeInputNumber(e.target.value) })}
              placeholder="3"
              max="100"
              className="transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
            <p className="text-sm text-muted-foreground">Percentage of payments that fail monthly</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-hours">Manual Hours Per Week</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="manual-hours"
                type="number"
                value={data.manualHoursPerWeek ?? ""}
                onChange={(e) => onUpdate({ manualHoursPerWeek: safeInputNumber(e.target.value) })}
                placeholder="20"
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">Hours spent on manual processes weekly</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourly-rate">Hourly Rate</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="hourly-rate"
                type="number"
                value={data.hourlyRate ?? ""}
                onChange={(e) => onUpdate({ hourlyRate: safeInputNumber(e.target.value) })}
                placeholder="75"
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">Average hourly cost for manual work</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-revenue-warning/20 bg-revenue-warning/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">🚀 2025 Recovery & Automation Framework</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Payment Recovery Systems</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Basic:</strong> 30-40% recovery rate</p>
                <p><strong>Advanced:</strong> 60-80% recovery rate</p>
                <p><strong>Best-in-Class:</strong> 80-90% recovery rate</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Process Automation ROI</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Productivity:</strong> +32% revenue generation</p>
                <p><strong>Sales Efficiency:</strong> +14.5% productivity</p>
                <p><strong>Marketing:</strong> +40% efficiency gains</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p><strong>McKinsey 2024:</strong> Up to 70% of work activities could be automated with 76% of companies seeing positive ROI within first year.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};