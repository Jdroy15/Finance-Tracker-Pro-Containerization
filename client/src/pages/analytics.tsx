import { useQuery } from "@tanstack/react-query";
import { Expense } from "@shared/schema";
import { NavSidebar } from "@/components/nav-sidebar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";

// Updated vibrant colors
const COLORS = [
  "#FF6B6B",  // Coral Red
  "#4ECDC4",  // Turquoise
  "#45B7D1",  // Sky Blue
  "#96CEB4",  // Sage Green
  "#FFEEAD",  // Cream Yellow
  "#D4A5A5",  // Dusty Rose
  "#9A94BC",  // Lavender
  "#CEE5D0",  // Mint Green
];

export default function AnalyticsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <NavSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </div>
    );
  }

  // Calculate daily spending for the selected month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailySpending = daysInMonth.map(day => {
    const dayExpenses = expenses?.filter(expense => 
      format(new Date(expense.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    ) || [];

    return {
      date: format(day, 'MMM d'),
      amount: dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    };
  });

  // Calculate monthly expenses by category
  const monthlyExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  }) || [];

  const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  const totalSpent = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  return (
    <div className="flex h-screen">
      <NavSidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Expense Analytics</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Total Spent: ${totalSpent.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Spending - {format(selectedDate, 'MMMM yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      dot={{ fill: "#FF6B6B" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category - {format(selectedDate, 'MMMM yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        name,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.1;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="currentColor"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            className="text-sm font-medium"
                          >
                            {`${name}: $${value}`}
                          </text>
                        );
                      }}
                    >
                      {monthlyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}