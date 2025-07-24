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
    <div className="w-full flex flex-col items-center">
      <ChartContainer config={chartConfig} className="h-[280px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
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
      
      <div className="flex justify-center gap-6 text-sm mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-revenue-success"></div>
          <span>Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-revenue-warning"></div>
          <span>At Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-revenue-primary"></div>
          <span>Recovery</span>
        </div>
      </div>
    </div>
  );
};