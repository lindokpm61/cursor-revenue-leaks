import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadGeneration } from "./useCalculatorData";
import { TrendingUp, DollarSign, Clock, AlertTriangle, Target } from "lucide-react";
import { saveCalculatorProgress } from "@/lib/coreDataCapture";
import { useEffect } from "react";
import { EnhancedInput } from "./EnhancedInput";
import { industryDefaults, getValidationRules, getBenchmark, formatValue } from "@/lib/industryDefaults";

const safeInputNumber = (value: string): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface LeadGenerationStepProps {
  data: LeadGeneration;
  onUpdate: (updates: Partial<LeadGeneration>) => void;
  industry?: string;
}

export const LeadGenerationStep = ({ data, onUpdate, industry }: LeadGenerationStepProps) => {
  const industryData = industry ? industryDefaults[industry] : industryDefaults.other;
  
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
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
            How effectively are you generating and responding to leads? We'll compare your metrics to industry benchmarks.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EnhancedInput
            id="monthly-leads"
            label="Monthly Leads"
            type="number"
            value={data.monthlyLeads ?? ""}
            onChange={(value) => onUpdate({ monthlyLeads: safeInputNumber(value as string) })}
            placeholder="500"
            validation={getValidationRules('monthlyLeads', industry)}
            benchmark={getBenchmark('monthlyLeads', industry)}
            industryDefaults={{ [industry || 'other']: industryData.monthlyLeads }}
            currentIndustry={industry}
            helpText="Total qualified leads generated per month"
          />

          <EnhancedInput
            id="average-deal-value"
            label="Average Deal Value"
            type="number"
            value={data.averageDealValue ?? ""}
            onChange={(value) => onUpdate({ averageDealValue: safeInputNumber(value as string) })}
            placeholder="5000"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            validation={getValidationRules('averageDealValue', industry)}
            benchmark={getBenchmark('averageDealValue', industry)}
            industryDefaults={{ [industry || 'other']: industryData.averageDealValue }}
            currentIndustry={industry}
            helpText="Average revenue per closed deal in USD"
            formatValue={(value) => `$${value.toLocaleString()}`}
          />

          <EnhancedInput
            id="lead-response-time"
            label="Lead Response Time"
            type="number"
            value={data.leadResponseTimeHours ?? ""}
            onChange={(value) => onUpdate({ leadResponseTimeHours: safeInputNumber(value as string) })}
            placeholder="2"
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            suffix="hours"
            validation={getValidationRules('leadResponseTimeHours', industry)}
            benchmark={{
              ...getBenchmark('leadResponseTimeHours', industry),
              type: "inverse" as const
            }}
            industryDefaults={{ [industry || 'other']: industryData.leadResponseTimeHours }}
            currentIndustry={industry}
            helpText="Average time to respond to new leads (lower is better)"
          />
        </CardContent>
      </Card>

      {/* High Response Time Alert */}
      {data.leadResponseTimeHours && data.leadResponseTimeHours > 8 && (
        <Card className="border-destructive/20 bg-destructive/5 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-2">High Response Time Alert</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your {data.leadResponseTimeHours}-hour response time significantly exceeds the 2-hour target. 
                  Contact odds decrease by 60%+ after the first hour.
                </p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Potential annual loss: </span>
                  <span className="font-semibold text-destructive">
                    ${((data.monthlyLeads || 0) * (data.averageDealValue || 0) * 0.4 * 12).toLocaleString()}
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
            Lead Generation Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-success">≤ 2 hrs</div>
              <p className="text-sm text-muted-foreground">Optimal Response Time</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-primary">
                {formatValue('monthlyLeads', industryData.monthlyLeads)}
              </div>
              <p className="text-sm text-muted-foreground">Industry Average</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-revenue-warning">
                {formatValue('averageDealValue', industryData.averageDealValue)}
              </div>
              <p className="text-sm text-muted-foreground">Industry ACV</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};