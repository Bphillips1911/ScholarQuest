import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon in all environments
neonConfig.webSocketConstructor = ws;

// Enhanced production configuration
const isProduction = process.env.NODE_ENV === "production";

// Validate environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  const errorMessage = isProduction 
    ? `Missing required environment variables for deployment: ${missingEnvVars.join(', ')}`
    : `Missing environment variables: ${missingEnvVars.join(', ')}. Did you forget to provision a database?`;
  console.error('DATABASE ERROR:', errorMessage);
  throw new Error(errorMessage);
}

// Enhanced production-optimized pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 20 : 5, // Higher connection limit in production
  min: isProduction ? 5 : 1, // Keep minimum connections alive in production
  connectionTimeoutMillis: isProduction ? 60000 : 10000, // Extended timeout for deployment
  idleTimeoutMillis: isProduction ? 600000 : 30000, // Keep connections alive longer in production
  acquireTimeoutMillis: isProduction ? 60000 : 10000, // Time to wait for available connection
  createTimeoutMillis: isProduction ? 60000 : 10000, // Time to wait for new connection creation
  createRetryIntervalMillis: isProduction ? 2000 : 1000, // Retry interval for connection creation
  reapIntervalMillis: isProduction ? 10000 : 1000, // How often to check for idle connections
  maxUses: isProduction ? 7500 : 1000, // Maximum uses per connection before recreation
};

console.log('DATABASE: Initializing connection pool with config:', {
  environment: process.env.NODE_ENV || 'development',
  isProduction,
  maxConnections: poolConfig.max,
  minConnections: poolConfig.min,
});

export const pool = new Pool(poolConfig);
export const db = drizzle({ client: pool, schema });

// Enhanced error handling and monitoring
pool.on('error', (err) => {
  console.error('DATABASE POOL ERROR:', {
    message: err.message,
    code: (err as any).code || 'NO_CODE',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
  
  if (isProduction) {
    // In production, attempt to recreate the pool after a delay
    setTimeout(() => {
      console.log('DATABASE: Attempting to recreate connection pool...');
    }, 5000);
  }
});

pool.on('connect', (client) => {
  console.log('DATABASE: Client connected successfully', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  });
});

// Connection retry logic for deployment
export async function testDatabaseConnection(retries = 5, delay = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`DATABASE: Testing connection (attempt ${attempt}/${retries})`);
      const client = await pool.connect();
      await client.query('SELECT 1 as test');
      client.release();
      console.log('DATABASE: Connection test successful');
      return true;
    } catch (error) {
      console.error(`DATABASE: Connection test failed (attempt ${attempt}/${retries}):`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error && typeof error === 'object' && 'code' in error ? error.code : 'NO_CODE',
        attempt,
        retries
      });
      
      if (attempt === retries) {
        console.error('DATABASE: All connection attempts failed');
        return false;
      }
      
      console.log(`DATABASE: Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Initialize connection test
if (isProduction) {
  testDatabaseConnection(10, 3000).then(success => {
    if (!success) {
      console.error('DATABASE: Failed to establish connection after all retries');
      process.exit(1);
    }
  });
}
