import { InsertUser, User, InsertExpense, Expense } from "@shared/schema";
import session from "express-session";
import { redis } from "./redis";
import createMemoryStore from "memorystore";
import RedisStore from "connect-redis";

const MemoryStore = createMemoryStore(session);

// Cache TTLs in seconds
const CACHE_TTL = {
  USER: 3600, // 1 hour
  EXPENSES: 300, // 5 minutes
};

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

    // Initialize Redis connection
    redis.connect().catch(console.error);

    // Use Redis for session store
    this.sessionStore = new RedisStore({ 
      client: redis.getClient(),
      prefix: "sess:",
    });
  }

  private async getCachedUser(id: number): Promise<User | undefined> {
    const cacheKey = `user:${id}`;
    const cached = await redis.get<User>(cacheKey);
    if (cached) return cached;
    return undefined;
  }

  private async setCachedUser(user: User): Promise<void> {
    const cacheKey = `user:${user.id}`;
    await redis.set(cacheKey, user, CACHE_TTL.USER);
  }

  private async getCachedExpenses(userId: number): Promise<Expense[] | undefined> {
    const cacheKey = `expenses:${userId}`;
    const cached = await redis.get<Expense[]>(cacheKey);
    if (cached) return cached;
    return undefined;
  }

  private async setCachedExpenses(userId: number, expenses: Expense[]): Promise<void> {
    const cacheKey = `expenses:${userId}`;
    await redis.set(cacheKey, expenses, CACHE_TTL.EXPENSES);
  }

  private async invalidateExpensesCache(userId: number): Promise<void> {
    const cacheKey = `expenses:${userId}`;
    await redis.del(cacheKey);
  }

  async getUser(id: number): Promise<User | undefined> {
    // Try cache first
    const cachedUser = await this.getCachedUser(id);
    if (cachedUser) return cachedUser;

    // If not in cache, get from storage
    const user = this.users.get(id);
    if (user) {
      await this.setCachedUser(user);
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
    if (user) {
      await this.setCachedUser(user);
    }
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    await this.setCachedUser(user);
    return user;
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    // Try cache first
    const cachedExpenses = await this.getCachedExpenses(userId);
    if (cachedExpenses) return cachedExpenses;

    // If not in cache, get from storage
    const expenses = Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId,
    );
    await this.setCachedExpenses(userId, expenses);
    return expenses;
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(userId: number, expense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const newExpense = { ...expense, id, userId };
    this.expenses.set(id, newExpense);
    await this.invalidateExpensesCache(userId);
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
    await this.invalidateExpensesCache(expense.userId);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<void> {
    const expense = this.expenses.get(id);
    if (expense) {
      await this.invalidateExpensesCache(expense.userId);
      this.expenses.delete(id);
    }
  }
}

export const storage = new MemStorage();