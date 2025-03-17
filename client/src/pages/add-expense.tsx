import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertExpenseSchema, categories, Expense } from "@shared/schema";
import { NavSidebar } from "@/components/nav-sidebar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AddExpensePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get expense ID from URL if editing
  const expenseId = new URLSearchParams(window.location.search).get("id");
  
  const { data: existingExpense, isLoading: isLoadingExpense } = useQuery<Expense>({
    queryKey: [`/api/expenses/${expenseId}`],
    enabled: !!expenseId,
  });

  const form = useForm({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: "",
      category: categories[0],
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Update form values when editing existing expense
  React.useEffect(() => {
    if (existingExpense) {
      form.reset({
        amount: existingExpense.amount.toString(),
        category: existingExpense.category,
        description: existingExpense.description,
        date: format(new Date(existingExpense.date), "yyyy-MM-dd"),
      });
    }
  }, [existingExpense, form]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (expenseId) {
        return apiRequest("PATCH", `/api/expenses/${expenseId}`, data);
      }
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: expenseId ? "Expense updated" : "Expense added",
        description: expenseId
          ? "Your expense has been updated"
          : "Your expense has been added",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (expenseId && isLoadingExpense) {
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
      <div className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">
            {expenseId ? "Edit Expense" : "Add New Expense"}
          </h1>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {expenseId ? "Update Expense" : "Add Expense"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
