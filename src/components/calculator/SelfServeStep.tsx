import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelfServeMetrics } from "./useCalculatorData";
import { Users, Percent, DollarSign, Target } from "lucide-react";
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

interface SelfServeStepProps {
  data: SelfServeMetrics;
  onUpdate: (updates: Partial<SelfServeMetrics>) => void;
  industry?: string;
}

export const SelfServeStep = ({ data, onUpdate, industry }: SelfServeStepProps) => {
  const industryData = industry ? industryDefaults[industry] : industryDefaults.other;
  
  // Add debug logging for self-serve data
  console.log('=== SELF-SERVE STEP DEBUG ===');
  console.log('Self-serve data:', {
    monthlyFreeSignups: data.monthlyFreeSignups,
    freeToPaidConversionRate: data.freeToPaidConversionRate,
    monthlyMRR: data.monthlyMRR,
    industry: industry,
    industryDefaults: industryData
  });

  // Enhanced auto-save data when it changes with validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Only save if we have meaningful data
      if (data.monthlyFreeSignups && data.monthlyFreeSignups > 0) {
        console.log('Saving self-serve data:', {
          monthlyFreeSignups: data.monthlyFreeSignups,
          freeToPaidConversionRate: data.freeToPaidConversionRate || 0,
          monthlyMRR: data.monthlyMRR || 0
        });
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
          <EnhancedInput
            id="monthly-free-signups"
            label="Monthly Free Signups"
            type="number"
            value={data.monthlyFreeSignups ?? ""}
            onChange={(value) => onUpdate({ monthlyFreeSignups: safeInputNumber(value as string) })}
            placeholder="1000"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            validation={getValidationRules('monthlyFreeSignups', industry)}
            benchmark={getBenchmark('monthlyFreeSignups', industry)}
            industryDefaults={{ [industry || 'other']: industryData.monthlyFreeSignups }}
            currentIndustry={industry}
            helpText="Free trial or freemium signups per month"
          />

          <EnhancedInput
            id="conversion-rate"
            label="Free-to-Paid Conversion %"
            type="number"
            value={data.freeToPaidConversionRate ?? ""}
            onChange={(value) => onUpdate({ freeToPaidConversionRate: safeInputNumber(value as string) })}
            placeholder="10"
            icon={<Percent className="h-4 w-4 text-muted-foreground" />}
            suffix="%"
            validation={getValidationRules('freeToPaidConversionRate', industry)}
            benchmark={getBenchmark('freeToPaidConversionRate', industry)}
            industryDefaults={{ [industry || 'other']: industryData.freeToPaidConversionRate }}
            currentIndustry={industry}
            helpText="Percentage of free users who become paid customers"
          />

          <EnhancedInput
            id="monthly-mrr"
            label="Monthly MRR"
            type="number"
            value={data.monthlyMRR ?? ""}
            onChange={(value) => onUpdate({ monthlyMRR: safeInputNumber(value as string) })}
            placeholder="50000"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            validation={getValidationRules('monthlyMRR', industry)}
            benchmark={getBenchmark('monthlyMRR', industry)}
            industryDefaults={{ [industry || 'other']: industryData.monthlyMRR }}
            currentIndustry={industry}
            helpText="Monthly Recurring Revenue"
            formatValue={(value) => `$${value.toLocaleString()}`}
          />
        </CardContent>
      </Card>

      {/* Low Conversion Alert */}
      {data.freeToPaidConversionRate && data.freeToPaidConversionRate < 2 && (
        <Card className="border-destructive/20 bg-destructive/5 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-2">Low Conversion Rate Alert</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your {data.freeToPaidConversionRate}% conversion rate is significantly below industry standards. 
                  This suggests major self-serve onboarding gaps.
                </p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Potential monthly loss: </span>
                  <span className="font-semibold text-destructive">
                    ${((data.monthlyFreeSignups || 0) * (industryData.freeToPaidConversionRate - (data.freeToPaidConversionRate || 0)) / 100 * (data.monthlyMRR || 0) / ((data.monthlyFreeSignups || 1) * (data.freeToPaidConversionRate || 1) / 100)).toLocaleString()}
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
            Self-Serve Conversion Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-success">
                {formatValue('freeToPaidConversionRate', industryData.freeToPaidConversionRate)}
              </div>
              <p className="text-sm text-muted-foreground">Industry Average</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-primary">
                {formatValue('monthlyFreeSignups', industryData.monthlyFreeSignups)}
              </div>
              <p className="text-sm text-muted-foreground">Monthly Signups</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-revenue-warning">
                {formatValue('monthlyMRR', industryData.monthlyMRR)}
              </div>
              <p className="text-sm text-muted-foreground">Target MRR</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
