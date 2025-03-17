import { useQuery } from "@tanstack/react-query";
import { Expense } from "@shared/schema";
import { ExpenseCard } from "@/components/expense-card";
import { ExpenseChart } from "@/components/expense-chart";
import { NavSidebar } from "@/components/nav-sidebar";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const totalSpent = expenses?.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  ) ?? 0;

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

  return (
    <div className="flex h-screen">
      <NavSidebar />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalSpent.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            {expenses && expenses.length > 0 && (
              <ExpenseChart expenses={expenses} />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Expenses</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expenses?.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No expenses yet. Add your first expense to get started!
                </div>
              ) : (
                expenses?.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={(expense) => setLocation(`/add?id=${expense.id}`)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
