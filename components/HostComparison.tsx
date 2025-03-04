import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";

interface HostComparisonProps {
  relativeYAxis?: boolean; // New prop to enable relative Y-axis scaling
  title: string;
  description?: string;
  dataKey: string;
  data: {
    host_name: string;
    value: number;
    color?: string;
  }[];
  isDisparity?: boolean;
  icon?: React.ReactNode;
}

interface ProcessedDataItem {
  host_name: string;
  value: number;
  color?: string;
}

interface CustomTooltipPayload {
  payload: ProcessedDataItem;
  value: number;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayload[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 rounded shadow-md uppercase bg-black text-white">
        <p className="text-sm">{payload[0].payload.host_name.toUpperCase()}: {`${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

const HostComparison: React.FC<HostComparisonProps> = ({ title, description, data, isDisparity = false, icon, relativeYAxis = false }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const axisColor = isDarkMode ? "#BBB" : "#333";

  // Find the highest absolute disparity value for dynamic domain scaling
  const maxDisparity = Math.ceil(Math.max(...data.map(item => Math.abs(item.value)), 10) / 10) * 10;

  // Determine max Y-axis value dynamically if relativeYAxis is enabled
  const maxYAxis = relativeYAxis
    ? Math.ceil(Math.max(...data.map(item => item.value), 10) / 10) * 10
    : 100; // Default to 100 for non-relative scaling

  // Process data to include color directly
  const processedData = [...data]
    .sort((a, b) => b.value - a.value) // Sort from high to low
    .map(item => ({
    ...item,
    color: isDisparity
      ? (item.value < 0 ? "#22c55e" : "hsl(var(--primary))")
      : "#777777",
  }));

  return (
    <Card className="border bg-transparent">
       <CardHeader>
        <div className="flex items-center gap-2">
          {icon || <BarChart3 className="w-6 h-6" />}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#333" : "#CCC"} />
            <XAxis dataKey="host_name" tickFormatter={(name) => name.toUpperCase()} tick={{ fill: axisColor }} />
            <YAxis domain={isDisparity ? [-maxDisparity, maxDisparity] : [0, maxYAxis]} tick={{ fill: axisColor }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)" }} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]}>
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || "hsl(var(--primary))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HostComparison;
