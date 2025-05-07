import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface SurveyCompletionData {
  name: string;
  total: number;
  completed: number;
}

interface SurveyCompletionChartProps {
  data: SurveyCompletionData[];
}

export function SurveyCompletionChart({ data }: SurveyCompletionChartProps) {
  const [timeframe, setTimeframe] = useState("7days");

  // Filter data based on timeframe in a real app
  // This is just for demonstration
  const chartData = data;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-primary-600">
            Total: {payload[0]?.value}
          </p>
          <p className="text-sm text-accent-500">
            Completed: {payload[1]?.value}
          </p>
          <p className="text-sm text-gray-500">
            Completion Rate: 
            {payload[0]?.value ? 
              ` ${Math.round((payload[1]?.value as number * 100) / (payload[0]?.value as number))}%` 
              : ' 0%'}
          </p>
        </div>
      );
    }
  
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle>Survey Completion Rate</CardTitle>
          <CardDescription>
            Overview of survey responses and completion rates
          </CardDescription>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" name="Total Responses" fill="hsl(var(--primary))" />
              <Bar dataKey="completed" name="Completed" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
