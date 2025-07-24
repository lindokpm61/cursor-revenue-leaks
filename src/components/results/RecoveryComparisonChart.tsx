import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { calculateRecoveryRanges, type ConfidenceFactors } from "@/lib/calculator/enhancedCalculations";

interface RecoveryComparisonChartProps {
  leakageData: Array<{
    category: string;
    title: string;
    amount: number;
    percentage: number;
    icon: any;
    description: string;
    color: string;
  }>;
  formatCurrency: (amount: number) => string;
  confidenceFactors?: ConfidenceFactors;
}

export const RecoveryComparisonChart = ({ leakageData, formatCurrency, confidenceFactors }: RecoveryComparisonChartProps) => {
  // Default confidence factors if not provided
  const defaultConfidenceFactors: ConfidenceFactors = {
    companySize: 'scaleup',
    currentMaturity: 'intermediate',
    changeManagementCapability: 'medium',
    resourceAvailable: true
  };

  const factors = confidenceFactors || defaultConfidenceFactors;

  const chartConfig = {
    currentLoss: {
      label: "Current Loss",
      color: "hsl(var(--revenue-warning))",
    },
    conservative: {
      label: "Conservative Recovery",
      color: "hsl(var(--revenue-success))",
    },
    optimistic: {
      label: "Optimistic Recovery", 
      color: "hsl(var(--revenue-primary))",
    },
  };

  // Map category keys to enhanced calculation keys
  const categoryMap: Record<string, keyof typeof losses> = {
    'leadResponseLoss': 'leadResponse',
    'failedPaymentLoss': 'paymentRecovery',
    'selfServeGap': 'selfServe',
    'processInefficiency': 'processAutomation'
  };

  // Prepare losses for enhanced calculation
  const losses = {
    leadResponse: 0,
    selfServe: 0,
    processAutomation: 0,
    paymentRecovery: 0
  };

  // Map leakage data to losses structure using category key
  leakageData.forEach((item) => {
    const mappedKey = categoryMap[item.category];
    if (mappedKey) {
      losses[mappedKey] = item.amount;
    }
  });

  // Calculate realistic recovery potential using enhanced calculations
  const recoveryRanges = calculateRecoveryRanges(losses, factors);

  // Filter out zero-value categories and prepare chart data
  const chartData = leakageData
    .filter(item => item.amount > 0) // Only show categories with losses
    .map((item) => {
      const mappedKey = categoryMap[item.category];
      const conservativeRecovery = mappedKey ? recoveryRanges.conservative.categoryRecovery[mappedKey] || 0 : 0;
      const optimisticRecovery = mappedKey ? recoveryRanges.optimistic.categoryRecovery[mappedKey] || 0 : 0;
      
      return {
        category: item.title, // Use display title instead of category key
        currentLoss: item.amount,
        afterConservative: Math.round(item.amount - conservativeRecovery), // Remaining loss after recovery
        afterOptimistic: Math.round(item.amount - optimisticRecovery), // Remaining loss after recovery
        conservativeRecovery: Math.round(conservativeRecovery),
        optimisticRecovery: Math.round(optimisticRecovery),
      };
    });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <ChartContainer config={chartConfig} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
              maxBarSize={35}
              barCategoryGap="25%"
            >
              <XAxis 
                dataKey="category"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                fontSize={11}
                width={60}
              />
              <Bar 
                dataKey="currentLoss" 
                fill="hsl(var(--revenue-warning))"
                name="Current Loss"
                radius={[3, 3, 0, 0]}
              />
              <Bar 
                dataKey="afterConservative" 
                fill="hsl(var(--revenue-success))"
                name="After Conservative Recovery"
                radius={[3, 3, 0, 0]}
              />
              <Bar 
                dataKey="afterOptimistic" 
                fill="hsl(var(--revenue-primary))"
                name="After Optimistic Recovery"
                radius={[3, 3, 0, 0]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: number) => [formatCurrency(value), ""]}
                  />
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      <div className="mt-4 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-revenue-warning"></div>
          <span>Current Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-revenue-success"></div>
          <span>After Conservative Recovery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-revenue-primary"></div>
          <span>After Optimistic Recovery</span>
        </div>
      </div>
    </div>
  );
};