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
  BarChart,
  Bar,
} from "recharts";

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

  // Calculate category averages
  const categoryAverages = expenses?.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = {
        category: expense.category,
        total: 0,
        count: 0
      };
    }
    acc[expense.category].total += Number(expense.amount);
    acc[expense.category].count += 1;
    return acc;
  }, {} as Record<string, { category: string; total: number; count: number }>);

  const categoryData = Object.values(categoryAverages || {}).map(({ category, total, count }) => ({
    category,
    average: Number((total / count).toFixed(2))
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
              <CardTitle>Average Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Average"]}
                    />
                    <Bar
                      dataKey="average"
                      fill="var(--primary)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
