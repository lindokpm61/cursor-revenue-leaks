import { Cell, PieChart, Pie, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface HeroRevenueChartProps {
  secureRevenue: number;
  revenueAtRisk: number;
  recoveryPotential: number;
  formatCurrency: (amount: number) => string;
}

export const HeroRevenueChart = ({ 
  secureRevenue, 
  revenueAtRisk, 
  recoveryPotential, 
  formatCurrency 
}: HeroRevenueChartProps) => {
  const data = [
    {
      name: "Secure Revenue",
      value: secureRevenue,
      color: "hsl(var(--revenue-success))",
    },
    {
      name: "Revenue at Risk",
      value: revenueAtRisk,
      color: "hsl(var(--revenue-warning))",
    },
    {
      name: "Recovery Potential",
      value: recoveryPotential,
      color: "hsl(var(--revenue-primary))",
    },
  ];

  const chartConfig = {
    revenue: {
      label: "Revenue",
    },
    secure: {
      label: "Secure Revenue",
      color: "hsl(var(--revenue-success))",
    },
    risk: {
      label: "Revenue at Risk", 
      color: "hsl(var(--revenue-warning))",
    },
    recovery: {
      label: "Recovery Potential",
      color: "hsl(var(--revenue-primary))",
    },
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number) => [formatCurrency(value), ""]}
                  labelKey="name"
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      
      <div className="flex justify-center mt-4 space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-revenue-success"></div>
          <span>Secure</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-revenue-warning"></div>
          <span>At Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-revenue-primary"></div>
          <span>Recovery</span>
        </div>
      </div>
    </div>
  );
};