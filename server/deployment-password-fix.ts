// DEPLOYMENT PASSWORD FIX - Force correct passwords on deployment
import type { Express } from "express";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { teachers } from "../shared/schema";

export function registerPasswordFix(app: Express) {
  // DEPLOYMENT FIX: Force correct password for David Thompson
  app.post("/api/deployment/fix-passwords", async (req, res) => {
    try {
      console.log("🔧 DEPLOYMENT PASSWORD FIX: Starting password correction...");
      
      // Update David Thompson's password to the correct one
      const result = await db
        .update(teachers)
        .set({ password: "bushpbis2025" })
        .where(sql`email = 'david.thompson@bhsteam.edu'`)
        .returning();
      
      if (result.length > 0) {
        console.log("✅ DEPLOYMENT PASSWORD FIX: David Thompson password updated to bushpbis2025");
      } else {
        console.log("❌ DEPLOYMENT PASSWORD FIX: David Thompson not found");
      }
      
      // Also fix all other teachers to use the correct password
      await db
        .update(teachers)
        .set({ password: "bushpbis2025" })
        .where(sql`password = 'BHSATeacher2025!'`);
      
      console.log("✅ DEPLOYMENT PASSWORD FIX: All teacher passwords updated to bushpbis2025");
      
      res.json({
        success: true,
        message: "Teacher passwords updated successfully",
        timestamp: new Date().toISOString(),
        davidThompsonUpdated: result.length > 0,
        correctPassword: "bushpbis2025"
      });
      
    } catch (error: any) {
      console.error("❌ DEPLOYMENT PASSWORD FIX: Failed:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Check current password status
  app.get("/api/deployment/password-status", async (req, res) => {
    try {
      const davidResult = await db
        .select({ name: teachers.name, email: teachers.email, password: teachers.password })
        .from(teachers)
        .where(sql`email = 'david.thompson@bhsteam.edu'`)
        .limit(1);
      
      const allTeachers = await db
        .select({ name: teachers.name, email: teachers.email, password: teachers.password })
        .from(teachers)
        .limit(10);
      
      res.json({
        davidThompson: davidResult[0] || null,
        sampleTeachers: allTeachers,
        correctPassword: "bushpbis2025"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}