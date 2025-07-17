import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface LeakagePieChartProps {
  leakageData: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  formatCurrency: (amount: number) => string;
}

const COLORS = [
  'hsl(var(--destructive))',
  'hsl(var(--revenue-warning))', 
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--revenue-success))',
];

export const LeakagePieChart = ({ leakageData, formatCurrency }: LeakagePieChartProps) => {
  // Filter out zero values and prepare data
  const chartData = leakageData
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((item, index) => ({
      name: item.category,
      value: item.amount,
      percentage: item.percentage,
      color: COLORS[index % COLORS.length]
    }));

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No revenue leakage data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary font-bold">{formatCurrency(data.value)}</p>
          <p className="text-muted-foreground text-sm">{data.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={30}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};