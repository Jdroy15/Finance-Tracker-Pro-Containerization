import { InsertUser, User, InsertExpense, Expense } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getExpenses(userId: number): Promise<Expense[]>;
  getExpenseById(id: number): Promise<Expense | undefined>;
  createExpense(userId: number, expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private expenses: Map<number, Expense>;
  private currentUserId: number;
  private currentExpenseId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.expenses = new Map();
    this.currentUserId = 1;
    this.currentExpenseId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    const userExpenses = Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId,
    );
    console.log('Retrieved expenses for user', userId, ':', userExpenses);
    return userExpenses;
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(userId: number, expense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const newExpense = { 
      ...expense, 
      id, 
      userId,
      date: expense.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
      amount: expense.amount.toString() // Convert number to string
    };
    this.expenses.set(id, newExpense);
    console.log('New expense created:', newExpense);
    return newExpense;
  }

  async updateExpense(
    id: number,
    expenseUpdate: Partial<InsertExpense>,
  ): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) throw new Error("Expense not found");

    const updatedExpense = { ...expense, ...expenseUpdate };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    this.expenses.delete(id);
  }
}

export const storage = new MemStorage();