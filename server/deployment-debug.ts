// DEPLOYMENT DEBUG - Comprehensive environment and database testing
import { db } from './db';
import { sql } from 'drizzle-orm';

export const debugDeploymentEnvironment = async () => {
  console.log("🔍 DEPLOYMENT DEBUG: Starting comprehensive environment analysis");
  
  try {
    // Test environment variables
    console.log("📊 Environment Variables:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- DATABASE_URL present:", !!process.env.DATABASE_URL);
    console.log("- REPL_ID:", process.env.REPL_ID);
    
    // Test database connection types
    console.log("\n🗄️  Database Connection Tests:");
    
    // Test 1: Simple count query
    try {
      const countResult = await db.execute("SELECT COUNT(*) as count FROM parents");
      const count = countResult.rows?.[0]?.count || 0;
      console.log(`✅ Simple count query: ${count} parents found`);
    } catch (error) {
      console.log(`❌ Simple count query failed: ${error.message}`);
    }
    
    // Test 2: Column listing
    try {
      const columnsResult = await db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'parents' LIMIT 10");
      const columns = columnsResult.rows?.map(row => row.column_name) || [];
      console.log(`✅ Parent table columns: ${columns.join(', ')}`);
    } catch (error) {
      console.log(`❌ Column query failed: ${error.message}`);
    }
    
    // Test 3: Sample data query with different syntaxes
    const testQueries = [
      'SELECT id, first_name, last_name, email FROM parents LIMIT 3',
      'SELECT id, "first_name", "last_name", email FROM parents LIMIT 3',
      'SELECT * FROM parents LIMIT 3'
    ];
    
    for (let i = 0; i < testQueries.length; i++) {
      try {
        const result = await db.execute(testQueries[i]);
        console.log(`✅ Query ${i + 1} success: ${result.rows?.length || 0} rows`);
        if (result.rows?.[0]) {
          console.log(`   Sample row keys: ${Object.keys(result.rows[0]).join(', ')}`);
        }
        break; // Use first successful query format
      } catch (error) {
        console.log(`❌ Query ${i + 1} failed: ${error.message}`);
      }
    }
    
    // Test 4: Message table structure
    try {
      const messageCount = await db.execute("SELECT COUNT(*) as count FROM parent_teacher_messages");
      const count = messageCount.rows?.[0]?.count || 0;
      console.log(`✅ Message count query: ${count} messages found`);
    } catch (error) {
      console.log(`❌ Message count query failed: ${error.message}`);
    }
    
    console.log("🎯 DEPLOYMENT DEBUG: Analysis complete");
    
  } catch (error) {
    console.error("❌ DEPLOYMENT DEBUG: Critical error:", error);
  }
};