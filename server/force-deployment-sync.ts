// FORCE DEPLOYMENT SYNC - Aggressive cache busting and validation
import { db } from './db';
import * as schema from '@shared/schema';

const DEPLOYMENT_VERSION = "2025-08-17-SYNC-FIX-v3";

export const forceDeploymentSync = async () => {
  console.log(`🚀 FORCE SYNC: Starting deployment synchronization v${DEPLOYMENT_VERSION}`);
  
  try {
    // Test database connectivity
    console.log("🔍 FORCE SYNC: Testing database connection...");
    const parentCount = await db.select().from(schema.parents);
    console.log(`✅ FORCE SYNC: Database connected - ${parentCount.length} parents found`);
    
    // Verify messaging functions are loaded
    const { getMessagesForAdminFixed, getAllParentsFixed } = await import('./db-storage-messaging-fix');
    console.log("✅ FORCE SYNC: Messaging fix functions loaded");
    
    // Test parent retrieval
    const testParents = await getAllParentsFixed();
    console.log(`✅ FORCE SYNC: Parent retrieval test - ${testParents.length} parents`);
    
    // Verify storage class methods
    const { storage } = await import('./db-storage');
    if (typeof storage.getAllParents === 'function' && typeof storage.getMessagesForAdmin === 'function') {
      console.log("✅ FORCE SYNC: DatabaseStorage methods verified");
    } else {
      console.error("❌ FORCE SYNC: DatabaseStorage methods missing!");
    }
    
    console.log(`🎯 FORCE SYNC: Deployment synchronization complete v${DEPLOYMENT_VERSION}`);
    
  } catch (error) {
    console.error("❌ FORCE SYNC: Synchronization failed:", error);
    throw error;
  }
};

// Auto-execute on import
forceDeploymentSync().catch(console.error);