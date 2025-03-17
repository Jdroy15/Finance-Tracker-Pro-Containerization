import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';
import { RedisClientOptions } from '@redis/client';

// Redis client configuration
const redisConfig: RedisClientOptions = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      // Exponential backoff with max delay of 3 seconds
      return Math.min(retries * 50, 3000);
    }
  }
};

class RedisWrapper {
  private static instance: RedisWrapper;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient(redisConfig);
    
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });
  }

  public static getInstance(): RedisWrapper {
    if (!RedisWrapper.instance) {
      RedisWrapper.instance = new RedisWrapper();
    }
    return RedisWrapper.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  // Cache helpers
  public async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export const redis = RedisWrapper.getInstance();
