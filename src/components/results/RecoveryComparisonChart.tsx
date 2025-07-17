import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface RecoveryComparisonChartProps {
  leakageData: Array<{
    category: string;
    amount: number;
  }>;
  formatCurrency: (amount: number) => string;
}

export const RecoveryComparisonChart = ({ leakageData, formatCurrency }: RecoveryComparisonChartProps) => {
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

  // Apply realistic category-specific recovery rates instead of blanket percentages
  const categoryRecoveryRates = {
    'Lead Response Loss': { conservative: 0.45, optimistic: 0.60 },
    'Failed Payment Loss': { conservative: 0.65, optimistic: 0.75 },
    'Self-Serve Gap': { conservative: 0.25, optimistic: 0.40 },
    'Process Inefficiency': { conservative: 0.50, optimistic: 0.65 }
  };

  const chartData = leakageData.map((item) => {
    const categoryName = item.category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const rates = categoryRecoveryRates[categoryName as keyof typeof categoryRecoveryRates] || 
                  { conservative: 0.40, optimistic: 0.55 }; // Default rates
    
    return {
      category: categoryName,
      currentLoss: item.amount,
      conservative: Math.round(item.amount * rates.conservative),
      optimistic: Math.round(item.amount * rates.optimistic),
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
                dataKey="conservative" 
                fill="hsl(var(--revenue-success))"
                name="Conservative Recovery"
                radius={[3, 3, 0, 0]}
              />
              <Bar 
                dataKey="optimistic" 
                fill="hsl(var(--revenue-primary))"
                name="Optimistic Recovery"
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
          <span>Conservative Recovery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-revenue-primary"></div>
          <span>Optimistic Recovery</span>
        </div>
      </div>
    </div>
  );
};