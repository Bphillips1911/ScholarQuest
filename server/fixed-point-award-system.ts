/**
 * FIXED POINT AWARD SYSTEM
 * 
 * Fixes the critical point assignment issues:
 * 1. Updates scholar aggregate fields (academicPoints, etc.)
 * 2. Recalculates house totals
 * 3. Broadcasts real-time websocket events
 * 4. Properly attributes points (admin vs teacher)
 * 5. Syncs across all dashboards instantly
 */

import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { scholars, houses, pointEntries } from "../shared/schema";

// Websocket clients store (you'll need to import your actual websocket implementation)
let wsClients: any[] = [];

export function setWebSocketClients(clients: any[]) {
  wsClients = clients;
}

export async function awardPointsFixed(params: {
  scholarId: string;
  points: number;
  category: 'academic' | 'attendance' | 'behavior' | 'bhsa_mustang_traits';
  reason: string;
  awardedById: string;
  awardedByType: 'admin' | 'teacher';
  awardedByName: string;
}) {
  console.log("📊 FIXED POINT AWARD: Starting point assignment with real-time sync...");
  
  try {
    const { scholarId, points, category, reason, awardedById, awardedByType, awardedByName } = params;
    
    // STEP 1: Get scholar info
    const scholar = await db.select().from(scholars).where(eq(scholars.id, scholarId)).limit(1);
    if (scholar.length === 0) {
      throw new Error(`Scholar not found: ${scholarId}`);
    }
    
    const scholarData = scholar[0];
    console.log(`   👤 Awarding ${points} ${category} points to ${scholarData.name}`);
    
    // STEP 2: Create point entry with proper attribution
    const pointEntryId = `pe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(pointEntries).values({
      id: pointEntryId,
      scholarId: scholarId,
      teacherId: awardedById,
      points: points,
      category: category,
      reason: reason,
      givenBy: awardedByType, // This fixes the attribution issue!
      timestamp: new Date()
    });
    
    console.log(`   ✅ Point entry created: ${pointEntryId}`);
    
    // STEP 3: Update scholar aggregate fields
    let updateQuery;
    switch (category) {
      case 'academic':
        updateQuery = {
          academicPoints: sql`${scholars.academicPoints} + ${points}`
        };
        break;
      case 'attendance':
        updateQuery = {
          attendancePoints: sql`${scholars.attendancePoints} + ${points}`
        };
        break;
      case 'behavior':
        updateQuery = {
          behaviorPoints: sql`${scholars.behaviorPoints} + ${points}`
        };
        break;
      case 'bhsa_mustang_traits':
        updateQuery = {
          bhsaMustangTraitsPoints: sql`${scholars.bhsaMustangTraitsPoints} + ${points}`
        };
        break;
    }
    
    await db.update(scholars)
      .set(updateQuery)
      .where(eq(scholars.id, scholarId));
    
    console.log(`   ✅ Scholar ${category} points updated: +${points}`);
    
    // STEP 4: Get updated scholar data
    const updatedScholar = await db.select().from(scholars).where(eq(scholars.id, scholarId)).limit(1);
    const newTotals = updatedScholar[0];
    
    // STEP 5: Recalculate house totals
    if (scholarData.houseId) {
      console.log(`   🏠 Recalculating house totals for ${scholarData.houseId}...`);
      
      // Get all scholars in this house
      const houseScholars = await db.select().from(scholars).where(eq(scholars.houseId, scholarData.houseId));
      
      // Calculate house totals
      const houseTotals = houseScholars.reduce((acc, s) => ({
        academic: acc.academic + (s.academicPoints || 0),
        attendance: acc.attendance + (s.attendancePoints || 0),
        behavior: acc.behavior + (s.behaviorPoints || 0),
        traits: acc.traits + (s.bhsaMustangTraitsPoints || 0)
      }), { academic: 0, attendance: 0, behavior: 0, traits: 0 });
      
      const totalPoints = houseTotals.academic + houseTotals.attendance + houseTotals.behavior + houseTotals.traits;
      
      // Update house totals
      await db.update(houses)
        .set({
          academicPoints: houseTotals.academic,
          attendancePoints: houseTotals.attendance,
          behaviorPoints: houseTotals.behavior,
          bhsaMustangTraitsPoints: houseTotals.traits,
          totalPoints: totalPoints
        })
        .where(eq(houses.id, scholarData.houseId));
      
      console.log(`   ✅ House ${scholarData.houseId} totals updated: ${totalPoints} total points`);
    }
    
    // STEP 6: Broadcast real-time websocket event
    const pointUpdateEvent = {
      type: 'POINTS_UPDATED',
      data: {
        scholarId: scholarId,
        scholarName: scholarData.name,
        pointsAwarded: points,
        category: category,
        reason: reason,
        awardedBy: awardedByName,
        awardedByType: awardedByType,
        newTotals: {
          academic: newTotals.academicPoints,
          attendance: newTotals.attendancePoints,
          behavior: newTotals.behaviorPoints,
          traits: newTotals.bhsaMustangTraitsPoints,
          total: (newTotals.academicPoints || 0) + (newTotals.attendancePoints || 0) + 
                 (newTotals.behaviorPoints || 0) + (newTotals.bhsaMustangTraitsPoints || 0)
        },
        houseId: scholarData.houseId,
        timestamp: new Date().toISOString()
      }
    };
    
    // Broadcast to all connected websocket clients
    console.log(`   📡 Broadcasting real-time update to ${wsClients.length} connected clients...`);
    wsClients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(JSON.stringify(pointUpdateEvent));
        } catch (error) {
          console.error("   ❌ Failed to send websocket message:", error);
        }
      }
    });
    
    console.log("🎉 FIXED POINT AWARD: Complete with real-time sync!");
    
    return {
      success: true,
      message: `Successfully awarded ${points} ${category} points to ${scholarData.name}`,
      data: {
        pointEntryId,
        scholarId,
        scholarName: scholarData.name,
        pointsAwarded: points,
        category,
        reason,
        awardedBy: awardedByName,
        awardedByType,
        newTotals: pointUpdateEvent.data.newTotals,
        houseId: scholarData.houseId
      },
      realTimeUpdate: pointUpdateEvent
    };
    
  } catch (error) {
    console.error("📊 FIXED POINT AWARD ERROR:", error);
    throw error;
  }
}

// Teacher password change function
export async function changeTeacherPassword(params: {
  teacherId: string;
  currentPassword: string;
  newPassword: string;
}) {
  console.log("🔑 TEACHER PASSWORD CHANGE: Starting password update...");
  
  try {
    const bcrypt = require('bcryptjs');
    const { teacherId, currentPassword, newPassword } = params;
    
    // Get teacher from teacherAuth table
    const teacher = await db.select().from(teacherAuth).where(eq(teacherAuth.id, teacherId)).limit(1);
    if (teacher.length === 0) {
      throw new Error('Teacher not found');
    }
    
    const teacherData = teacher[0];
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, teacherData.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password in teacherAuth table
    await db.update(teacherAuth)
      .set({ passwordHash: newPasswordHash })
      .where(eq(teacherAuth.id, teacherId));
    
    // Also update in teachers table for consistency
    await db.update(teachers)
      .set({ passwordHash: newPasswordHash })
      .where(eq(teachers.id, teacherId));
    
    console.log("   ✅ Teacher password updated successfully");
    
    return {
      success: true,
      message: "Password updated successfully"
    };
    
  } catch (error) {
    console.error("🔑 TEACHER PASSWORD CHANGE ERROR:", error);
    throw error;
  }
}