import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelfServeMetrics } from "./useCalculatorData";
import { Users, Percent, DollarSign } from "lucide-react";
import { saveCalculatorProgress } from "@/lib/coreDataCapture";
import { useEffect } from "react";

interface SelfServeStepProps {
  data: SelfServeMetrics;
  onUpdate: (updates: Partial<SelfServeMetrics>) => void;
}

export const SelfServeStep = ({ data, onUpdate }: SelfServeStepProps) => {
  // Enhanced auto-save data when it changes with validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Only save if we have meaningful data
      if (data.monthlyFreeSignups && data.monthlyFreeSignups > 0) {
        try {
          await saveCalculatorProgress({
            monthlyFreeSignups: data.monthlyFreeSignups,
            freeToPaidConversionRate: data.freeToPaidConversionRate || 0,
            monthlyMRR: data.monthlyMRR || 0
          }, 3);
        } catch (error) {
          console.error('Error saving step 3 data:', error);
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
            <Users className="h-5 w-5 text-primary" />
            Self-Serve Metrics
          </CardTitle>
          <CardDescription>
            How well are you converting free users to paid customers?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="monthly-free-signups">Monthly Free Signups</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthly-free-signups"
                type="number"
                value={data.monthlyFreeSignups || ""}
                onChange={(e) => onUpdate({ monthlyFreeSignups: Number(e.target.value) })}
                placeholder="1000"
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">Free trial or freemium signups per month</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion-rate">Free-to-Paid Conversion %</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="conversion-rate"
                type="number"
                value={data.freeToPaidConversionRate || ""}
                onChange={(e) => onUpdate({ freeToPaidConversionRate: Number(e.target.value) })}
                placeholder="10"
                max="100"
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">Percentage of free users who become paid</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-mrr">Monthly MRR</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthly-mrr"
                type="number"
                value={data.monthlyMRR || ""}
                onChange={(e) => onUpdate({ monthlyMRR: Number(e.target.value) })}
                placeholder="50000"
                className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-revenue-success/20 bg-revenue-success/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-4">🎯 Conversion Benchmarks</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-revenue-success">15%+</div>
              <p className="text-xs text-muted-foreground">Excellent Conversion</p>
            </div>
            <div>
              <div className="text-lg font-bold text-revenue-warning">5-15%</div>
              <p className="text-xs text-muted-foreground">Industry Average</p>
            </div>
            <div>
              <div className="text-lg font-bold text-revenue-danger">&lt;5%</div>
              <p className="text-xs text-muted-foreground">Needs Improvement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};