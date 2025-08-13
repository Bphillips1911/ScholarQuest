import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon in all environments
neonConfig.webSocketConstructor = ws;

// Enhanced production configuration
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.DATABASE_URL) {
  const errorMessage = isProduction 
    ? "DATABASE_URL environment variable is required for production deployment"
    : "DATABASE_URL must be set. Did you forget to provision a database?";
  throw new Error(errorMessage);
}

// Production-optimized pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 10 : 5, // Higher connection limit in production
  connectionTimeoutMillis: isProduction ? 30000 : 10000, // Longer timeout in production
  idleTimeoutMillis: isProduction ? 300000 : 30000, // Keep connections alive longer in production
};

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });

// Test connection on startup in production
if (isProduction) {
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });
  
  pool.on('connect', () => {
    console.log('Database pool connected successfully');
  });
}
