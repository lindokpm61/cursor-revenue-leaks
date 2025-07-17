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
      label: "70% Recovery",
      color: "hsl(var(--revenue-success))",
    },
    optimistic: {
      label: "85% Recovery", 
      color: "hsl(var(--revenue-primary))",
    },
  };

  const chartData = leakageData
    .filter(item => item.category !== "failedPaymentLoss") // Exclude failed payment loss
    .map(item => ({
      category: item.category.replace(/([A-Z])/g, ' $1').trim(),
      currentLoss: item.amount,
      conservative: item.amount * 0.7,
      optimistic: item.amount * 0.85,
    }));

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
                name="70% Recovery"
                radius={[3, 3, 0, 0]}
              />
              <Bar 
                dataKey="optimistic" 
                fill="hsl(var(--revenue-primary))"
                name="85% Recovery"
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
          <span>70% Recovery</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-revenue-primary"></div>
          <span>85% Recovery</span>
        </div>
      </div>
    </div>
  );
};