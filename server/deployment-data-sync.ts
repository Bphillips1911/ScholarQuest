// DEPLOYMENT DATA SYNC - Force consistent data between preview and deployment
import { db } from './db';
import { sql } from 'drizzle-orm';

export const ensureDeploymentDataSync = async () => {
  console.log("🔄 DEPLOYMENT SYNC: Starting data synchronization verification");
  
  try {
    // Get current parent count
    const countResult = await db.execute("SELECT COUNT(*) as count FROM parents");
    const currentCount = countResult.rows?.[0]?.count || 0;
    console.log(`📊 DEPLOYMENT SYNC: Current parent count: ${currentCount}`);
    
    if (currentCount < 13) {
      console.log("⚠️  DEPLOYMENT SYNC: Missing parent data, attempting to seed...");
      
      // Seed essential parent data if missing
      const parentData = [
        { email: "joe.clark@example.com", firstName: "Joe", lastName: "Clark" },
        { email: "nslaw@yahoo.com", firstName: "Nancy", lastName: "Law" },
        { email: "jrabbit@yahoo.com", firstName: "Jessica", lastName: "Rabbit" },
        { email: "clovesimmons@yahoo.com", firstName: "Clove", lastName: "Simmons" },
        { email: "testparent@example.com", firstName: "Test", lastName: "Parent" },
        { email: "emily.test@example.com", firstName: "Emily", lastName: "TestParent" },
        { email: "sarah.newparent@example.com", firstName: "Sarah", lastName: "NewParent" },
        { email: "testing.emailfix@example.com", firstName: "Testing", lastName: "EmailFix" },
        { email: "final.testparent@example.com", firstName: "Final", lastName: "TestParent" },
        { email: "success.emailtest@example.com", firstName: "Success", lastName: "EmailTest" },
        { email: "clovesimmons01@yahoo.com", firstName: "Clove", lastName: "Simmons" },
        { email: "csimmons@gmail.com", firstName: "Charlie", lastName: "Simmons" },
        { email: "test.parentlink@example.com", firstName: "Test", lastName: "Parent" }
      ];
      
      for (const parent of parentData) {
        try {
          await db.execute(sql`
            INSERT INTO parents (id, first_name, last_name, email, created_at, is_verified)
            VALUES (gen_random_uuid(), ${parent.firstName}, ${parent.lastName}, ${parent.email}, NOW(), true)
            ON CONFLICT (email) DO NOTHING
          `);
        } catch (insertError) {
          // Try alternative UUID generation
          try {
            const uuid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await db.execute(`
              INSERT INTO parents (id, first_name, last_name, email, created_at, is_verified)
              VALUES ('${uuid}', '${parent.firstName}', '${parent.lastName}', '${parent.email}', NOW(), true)
              ON CONFLICT (email) DO NOTHING
            `);
          } catch (fallbackError) {
            console.log(`❌ Failed to insert parent ${parent.email}:`, fallbackError.message);
          }
        }
      }
      
      // Verify final count
      const finalResult = await db.execute("SELECT COUNT(*) as count FROM parents");
      const finalCount = finalResult.rows?.[0]?.count || 0;
      console.log(`✅ DEPLOYMENT SYNC: Final parent count: ${finalCount}`);
    } else {
      console.log("✅ DEPLOYMENT SYNC: Parent data appears complete");
    }
    
  } catch (error) {
    console.error("❌ DEPLOYMENT SYNC: Critical error:", error);
  }
};