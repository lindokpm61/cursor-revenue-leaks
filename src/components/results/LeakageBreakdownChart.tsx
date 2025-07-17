import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LeakageBreakdownChartProps {
  leakageData: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  formatCurrency: (amount: number) => string;
}

export const LeakageBreakdownChart = ({ leakageData, formatCurrency }: LeakageBreakdownChartProps) => {
  const chartConfig = {
    amount: {
      label: "Revenue Loss",
      color: "hsl(var(--revenue-warning))",
    },
  };

  const chartData = leakageData
    .sort((a, b) => b.amount - a.amount)
    .map(item => ({
      ...item,
      displayName: item.category.replace(/([A-Z])/g, ' $1').trim()
    }));

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
          >
            <XAxis 
              type="number" 
              tickFormatter={(value) => formatCurrency(value)}
              fontSize={12}
            />
            <YAxis 
              type="category" 
              dataKey="displayName"
              fontSize={12}
              width={90}
            />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--revenue-warning))"
              radius={[0, 4, 4, 0]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number) => [formatCurrency(value), "Revenue Loss"]}
                  labelKey="displayName"
                />
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};