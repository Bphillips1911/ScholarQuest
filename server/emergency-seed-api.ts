// EMERGENCY SEEDING API - Manual trigger for deployment seeding
import type { Express } from "express";

export function registerEmergencySeeding(app: Express) {
  // EMERGENCY: Force deployment seeding endpoint - no auth required for deployment fixes
  app.post("/api/emergency/force-seed", async (req, res) => {
    try {
      console.log("🚨 EMERGENCY SEEDING: Starting forced comprehensive seeding...");
      console.log("🚨 EMERGENCY SEEDING: Environment:", {
        nodeEnv: process.env.NODE_ENV,
        replId: process.env.REPL_ID?.substring(0, 8),
        hasDbUrl: !!process.env.DATABASE_URL
      });
      
      const { seedDeploymentComprehensive } = await import('./deployment-comprehensive-seed');
      await seedDeploymentComprehensive();
      
      console.log("✅ EMERGENCY SEEDING: Complete!");
      res.json({ 
        success: true, 
        message: "Emergency seeding completed successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ EMERGENCY SEEDING: Failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Emergency database info endpoint
  app.get("/api/emergency/db-info", async (req, res) => {
    try {
      const { db } = await import('./db');
      const housesResult = await db.execute("SELECT COUNT(*) as count FROM houses");
      const scholarsResult = await db.execute("SELECT COUNT(*) as count FROM scholars");
      const parentsResult = await db.execute("SELECT COUNT(*) as count FROM parents");
      
      const info = {
        houses: parseInt(housesResult.rows?.[0]?.count || '0'),
        scholars: parseInt(scholarsResult.rows?.[0]?.count || '0'),
        parents: parseInt(parentsResult.rows?.[0]?.count || '0'),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasReplId: !!process.env.REPL_ID,
          hasDbUrl: !!process.env.DATABASE_URL
        }
      };
      
      console.log("🔍 EMERGENCY DB INFO:", info);
      res.json(info);
    } catch (error) {
      console.error("❌ EMERGENCY DB INFO: Failed:", error);
      res.status(500).json({ error: error.message });
    }
  });
}