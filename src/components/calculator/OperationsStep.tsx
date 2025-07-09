import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperationsData } from "./useCalculatorData";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import { updateCalculatorProgress } from "@/lib/temporarySubmissions";
import { useEffect } from "react";

interface OperationsStepProps {
  data: OperationsData;
  onUpdate: (updates: Partial<OperationsData>) => void;
}

export const OperationsStep = ({ data, onUpdate }: OperationsStepProps) => {
  // Auto-save data when it changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (data.failedPaymentRate || data.manualHoursPerWeek || data.hourlyRate) {
        try {
          await updateCalculatorProgress(4, data);
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
              value={data.failedPaymentRate || ""}
              onChange={(e) => onUpdate({ failedPaymentRate: Number(e.target.value) })}
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
                value={data.manualHoursPerWeek || ""}
                onChange={(e) => onUpdate({ manualHoursPerWeek: Number(e.target.value) })}
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
                value={data.hourlyRate || ""}
                onChange={(e) => onUpdate({ hourlyRate: Number(e.target.value) })}
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
          <h3 className="font-semibold text-foreground mb-4">⚡ Automation Opportunities</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Failed Payments</p>
              <p className="text-xs text-muted-foreground">
                Automated dunning management can recover 20-40% of failed payments
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Manual Processes</p>
              <p className="text-xs text-muted-foreground">
                Automation can typically reduce manual work by 60-80%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};