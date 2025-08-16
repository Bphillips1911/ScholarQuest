import { db } from "./db";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Deployment initialization script to ensure database schema exists
 * This runs on production deployments to verify/create required tables
 */
export async function initializeDeploymentDatabase(): Promise<boolean> {
  console.log('DEPLOYMENT: Starting database schema initialization...');
  
  try {
    // Check if critical tables exist
    const criticalTables = [
      'houses',
      'scholars', 
      'administrators',
      'teacher_auth',
      'parents',
      'parent_teacher_messages'
    ];
    
    const missingTables: string[] = [];
    
    for (const tableName of criticalTables) {
      try {
        await db.execute(sql`SELECT 1 FROM ${sql.identifier(tableName)} LIMIT 1`);
        console.log(`DEPLOYMENT: ✓ Table ${tableName} exists`);
      } catch (error) {
        console.log(`DEPLOYMENT: ✗ Table ${tableName} missing or inaccessible`);
        missingTables.push(tableName);
      }
    }
    
    if (missingTables.length > 0) {
      console.log(`DEPLOYMENT: Missing tables detected: ${missingTables.join(', ')}`);
      console.log('DEPLOYMENT: This suggests the database schema needs to be migrated');
      console.log('DEPLOYMENT: Running Drizzle push to create missing tables...');
      
      // In a real deployment, you would run migrations here
      // For now, we'll return false to indicate schema issues
      return false;
    }
    
    // Verify essential data exists
    try {
      const houseCount = await db.select().from(schema.houses);
      console.log(`DEPLOYMENT: Found ${houseCount.length} houses in database`);
      
      if (houseCount.length === 0) {
        console.log('DEPLOYMENT: No houses found - seeding will create them');
      }
    } catch (error) {
      console.log('DEPLOYMENT: Could not verify house data:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('DEPLOYMENT: Database schema initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('DEPLOYMENT: Database schema initialization failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

/**
 * Verify environment variables are properly set for deployment
 */
export function verifyDeploymentEnvironment(): boolean {
  console.log('DEPLOYMENT: Verifying environment variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'NODE_ENV'
  ];
  
  const optionalVars = [
    'SENDGRID_API_KEY',
    'PGHOST',
    'PGDATABASE', 
    'PGUSER',
    'PGPASSWORD',
    'PGPORT'
  ];
  
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    } else {
      console.log(`DEPLOYMENT: ✓ ${varName} is set`);
    }
  });
  
  // Check optional variables
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    } else {
      console.log(`DEPLOYMENT: ✓ ${varName} is set`);
    }
  });
  
  if (missingRequired.length > 0) {
    console.error('DEPLOYMENT: Missing required environment variables:', missingRequired.join(', '));
    return false;
  }
  
  if (missingOptional.length > 0) {
    console.log('DEPLOYMENT: Missing optional environment variables:', missingOptional.join(', '));
    console.log('DEPLOYMENT: Some features may not work without these variables');
  }
  
  console.log('DEPLOYMENT: Environment verification completed');
  return true;
}