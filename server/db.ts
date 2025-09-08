import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environments
neonConfig.webSocketConstructor = ws;

// Enhanced connection configuration for production
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  const error = new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
  console.error("Database configuration error:", error.message);
  throw error;
}

console.log("Initializing database connection...");

// Enhanced pool configuration for production deployment
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings for production
  max: process.env.NODE_ENV === 'production' ? 10 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle(pool, { schema });

console.log("Database connection initialized successfully");