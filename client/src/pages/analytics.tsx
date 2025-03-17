import { useQuery } from "@tanstack/react-query";
import { Expense } from "@shared/schema";
import { NavSidebar } from "@/components/nav-sidebar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
} from "recharts";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function AnalyticsPage() {
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

  // Calculate daily spending for the current month
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
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

  return (
    <div className="flex h-screen">
      <NavSidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Expense Analytics</h1>

          <Card>
            <CardHeader>
              <CardTitle>Daily Spending This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySpending}>
                    <CartesianGrid strokeDasharray="3 3" />
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
                      stroke="var(--primary)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                          >
                            ${value}
                          </text>
                        );
                      }}
                    >
                      {monthlyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
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