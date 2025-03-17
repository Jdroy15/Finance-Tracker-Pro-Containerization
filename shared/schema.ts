import { pgTable, text, serial, integer, date, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoles = ["user", "admin"] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Other"
] as const;

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    role: z.enum(userRoles).default("user"),
  });

export const insertExpenseSchema = createInsertSchema(expenses)
  .pick({
    amount: true,
    category: true,
    description: true,
    date: true,
  })
  .extend({
    category: z.enum(categories),
    amount: z.coerce.number().positive("Amount must be positive").transform(val => Number(val.toFixed(2))),
    date: z.coerce.date(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type UserRole = typeof userRoles[number];