import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertExpenseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
