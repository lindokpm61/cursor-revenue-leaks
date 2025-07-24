import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationsData } from "./useCalculatorData";
import { AlertTriangle, Clock, DollarSign, Target, TrendingDown } from "lucide-react";
import { saveCalculatorProgress } from "@/lib/coreDataCapture";
import { useEffect } from "react";
import { EnhancedInput } from "./EnhancedInput";
import { getValidationRules, getBenchmark, formatValue, industryDefaults } from "@/lib/industryDefaults";

// Helper function to safely convert input values to numbers
const safeInputNumber = (value: string): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface OperationsStepProps {
  data: OperationsData;
  onUpdate: (updates: Partial<OperationsData>) => void;
  industry?: string;
}

export const OperationsStep = ({ data, onUpdate, industry }: OperationsStepProps) => {
  const industryData = industry ? industryDefaults[industry] : industryDefaults.other;
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
          <EnhancedInput
            id="failed-payment-rate"
            label="Failed Payment Rate"
            type="number"
            value={data.failedPaymentRate ?? ""}
            onChange={(value) => onUpdate({ failedPaymentRate: safeInputNumber(value as string) })}
            placeholder="3"
            icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
            suffix="%"
            validation={getValidationRules('failedPaymentRate', industry)}
            benchmark={getBenchmark('failedPaymentRate', industry)}
            industryDefaults={{ [industry || 'other']: industryData.failedPaymentRate }}
            currentIndustry={industry}
            helpText="Percentage of payments that fail monthly"
          />

          <EnhancedInput
            id="manual-hours"
            label="Manual Hours Per Week"
            type="number"
            value={data.manualHoursPerWeek ?? ""}
            onChange={(value) => onUpdate({ manualHoursPerWeek: safeInputNumber(value as string) })}
            placeholder="20"
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            validation={getValidationRules('manualHours', industry)}
            benchmark={getBenchmark('manualHours', industry)}
            industryDefaults={{ [industry || 'other']: industryData.manualHours }}
            currentIndustry={industry}
            helpText="Hours spent on manual processes weekly"
            formatValue={(value) => `${value} hrs/week`}
          />

          <EnhancedInput
            id="hourly-rate"
            label="Hourly Rate"
            type="number"
            value={data.hourlyRate ?? ""}
            onChange={(value) => onUpdate({ hourlyRate: safeInputNumber(value as string) })}
            placeholder="75"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            validation={getValidationRules('hourlyRate', industry)}
            benchmark={getBenchmark('hourlyRate', industry)}
            industryDefaults={{ [industry || 'other']: industryData.hourlyRate }}
            currentIndustry={industry}
            helpText="Average hourly cost for manual work"
            formatValue={(value) => `$${value}/hr`}
          />
        </CardContent>
      </Card>

      {/* High Manual Hours Alert */}
      {data.manualHoursPerWeek && data.manualHoursPerWeek > 40 && (
        <Card className="border-destructive/20 bg-destructive/5 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-2">High Manual Hours Alert</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your {data.manualHoursPerWeek} hours/week of manual work significantly exceeds automation targets. 
                  This represents a major efficiency opportunity.
                </p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Annual cost: </span>
                  <span className="font-semibold text-destructive">
                    ${((data.manualHoursPerWeek || 0) * (data.hourlyRate || 0) * 52).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industry Benchmarks */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-accent" />
            Operations Efficiency Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-success">
                {formatValue('failedPaymentRate', industryData.failedPaymentRate)}
              </div>
              <p className="text-sm text-muted-foreground">Target Failed Rate</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-primary">
                {formatValue('manualHours', industryData.manualHours)}
              </div>
              <p className="text-sm text-muted-foreground">Efficiency Target</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-revenue-warning">
                {formatValue('hourlyRate', industryData.hourlyRate)}
              </div>
              <p className="text-sm text-muted-foreground">Market Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};