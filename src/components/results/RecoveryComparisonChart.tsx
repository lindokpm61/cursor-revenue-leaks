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
    <div className="w-full">
      <ChartContainer config={chartConfig} className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis 
              dataKey="category"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              fontSize={12}
            />
            <Bar 
              dataKey="currentLoss" 
              fill="hsl(var(--revenue-warning))"
              name="Current Loss"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="conservative" 
              fill="hsl(var(--revenue-success))"
              name="70% Recovery"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="optimistic" 
              fill="hsl(var(--revenue-primary))"
              name="85% Recovery"
              radius={[2, 2, 0, 0]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
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
  );
};