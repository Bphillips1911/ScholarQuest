// DEPLOYMENT FORCE API - Alternative API endpoints that bypass all middleware
import type { Express } from "express";
import { db } from "./db";

export function registerForceDeploymentAPI(app: Express) {
  // Force API for parents - no auth, direct database access
  app.get("/api/force/parents", async (req, res) => {
    console.log("🚀 FORCE API: Direct parent query (no auth)");
    
    try {
      const result = await db.execute(
        "SELECT id, first_name, last_name, email FROM parents ORDER BY created_at DESC"
      );
      
      const parents = (result.rows || []).map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email
      }));
      
      console.log(`🚀 FORCE API: Found ${parents.length} parents`);
      res.json({ 
        count: parents.length,
        parents: parents,
        message: "Direct database query bypassing all middleware"
      });
    } catch (error) {
      console.error("🚀 FORCE API: Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Force API for messages - no auth, direct database access
  app.get("/api/force/messages", async (req, res) => {
    console.log("🚀 FORCE API: Direct message query (no auth)");
    
    try {
      const result = await db.execute(
        "SELECT id, subject, message, sender_type, created_at FROM parent_teacher_messages ORDER BY created_at DESC LIMIT 20"
      );
      
      const messages = (result.rows || []).map(row => ({
        id: row.id,
        subject: row.subject,
        message: row.message,
        sender_type: row.sender_type,
        created_at: row.created_at
      }));
      
      console.log(`🚀 FORCE API: Found ${messages.length} messages`);
      res.json({
        count: messages.length,
        messages: messages,
        message: "Direct database query bypassing all middleware"
      });
    } catch (error) {
      console.error("🚀 FORCE API: Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}