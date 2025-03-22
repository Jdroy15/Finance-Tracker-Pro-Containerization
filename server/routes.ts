import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertExpenseSchema } from "@shared/schema";
import { format, startOfMonth, endOfMonth } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/health", (req, res) => {
    console.log("[INFO] Health check requested"); // Debug log
    res.json({ status: "healthy" });
  });

  setupAuth(app);

  // Expenses CRUD
  app.get("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expenses = await storage.getExpenses(req.user.id);
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expense = insertExpenseSchema.parse(req.body);
    const created = await storage.createExpense(req.user.id, expense);
    res.status(201).json(created);
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expense = await storage.getExpenseById(parseInt(req.params.id));
    if (!expense || expense.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    const updated = await storage.updateExpense(
      expense.id,
      insertExpenseSchema.partial().parse(req.body),
    );
    res.json(updated);
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expense = await storage.getExpenseById(parseInt(req.params.id));
    if (!expense || expense.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    await storage.deleteExpense(expense.id);
    res.sendStatus(204);
  });

  // Export expenses to CSV
  app.get("/api/expenses/export", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const targetDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      const expenses = await storage.getExpenses(req.user.id);
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      // Create CSV content
      const csvHeader = "Date,Category,Description,Amount\n";
      const csvRows = monthlyExpenses.map(expense => {
        const date = format(new Date(expense.date), "yyyy-MM-dd");
        const description = expense.description.replace(/,/g, ";"); // Escape commas
        return `${date},${expense.category},${description},${expense.amount}`;
      }).join("\n");

      const csvContent = csvHeader + csvRows;

      // Set headers for file download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=expenses-${format(targetDate, "yyyy-MM")}.csv`
      );

      res.send(csvContent);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export expenses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}