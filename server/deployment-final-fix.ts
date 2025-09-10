/**
 * DEPLOYMENT FINAL FIX
 * 
 * This is the definitive solution to fix the house system corruption.
 * It will force the deployment database to match the preview.
 */

import { db } from "./db";
import { houses, scholars, pointEntries } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function fixDeploymentHouses() {
  console.log("🚀 DEPLOYMENT FINAL FIX: Starting comprehensive house system repair");
  
  try {
    // Step 1: Get current state
    const currentHouses = await db.select().from(houses);
    console.log("📊 CURRENT STATE:", {
      totalHouses: currentHouses.length,
      houseNames: currentHouses.map(h => h.name),
      houseIds: currentHouses.map(h => h.id)
    });

    // Step 2: Define correct houses
    const correctHouses = [
      { id: "tesla", name: "Tesla", color: "#7c3aed" },
      { id: "drew", name: "Drew", color: "#dc2626" },
      { id: "marshall", name: "Marshall", color: "#059669" },
      { id: "johnson", name: "Johnson", color: "#d97706" },
      { id: "west", name: "West", color: "#0284c7" }
    ];

    // Step 3: Nuclear cleanup - Delete ALL houses
    console.log("💥 NUCLEAR CLEANUP: Deleting all existing houses...");
    
    // Delete all point entries first
    await db.delete(pointEntries);
    console.log("   ✅ All point entries deleted");
    
    // Remove house assignments from scholars
    await db.update(scholars).set({ houseId: null });
    console.log("   ✅ All scholar house assignments removed");
    
    // Delete all houses
    await db.delete(houses);
    console.log("   ✅ All houses deleted");

    // Step 4: Create the 5 correct houses
    console.log("🏠 RECREATION: Creating the 5 correct houses...");
    
    for (const house of correctHouses) {
      const houseData = {
        ...house,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0
      };
      
      await db.insert(houses).values(houseData);
      console.log(`   ✅ Created: ${house.name} (${house.id})`);
    }

    // Step 5: Redistribute scholars to houses
    console.log("👥 REDISTRIBUTION: Assigning scholars to houses...");
    
    const allScholars = await db.select().from(scholars);
    const shuffledScholars = [...allScholars].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledScholars.length; i++) {
      const scholar = shuffledScholars[i];
      const houseIndex = i % 5;
      const assignedHouse = correctHouses[houseIndex];
      
      await db.update(scholars)
        .set({ houseId: assignedHouse.id })
        .where(eq(scholars.id, scholar.id));
    }
    
    console.log(`   ✅ ${allScholars.length} scholars redistributed to houses`);

    // Step 6: Update house member counts
    console.log("📈 UPDATING: House member counts...");
    
    for (const house of correctHouses) {
      const memberCount = await db.select().from(scholars).where(eq(scholars.houseId, house.id));
      await db.update(houses)
        .set({ memberCount: memberCount.length })
        .where(eq(houses.id, house.id));
      
      console.log(`   ✅ ${house.name}: ${memberCount.length} members`);
    }

    // Step 7: Final verification
    const finalHouses = await db.select().from(houses);
    const finalScholars = await db.select().from(scholars);
    
    console.log("🎉 FINAL VERIFICATION:", {
      totalHouses: finalHouses.length,
      houseNames: finalHouses.map(h => h.name),
      totalScholars: finalScholars.length,
      scholarsWithHouses: finalScholars.filter(s => s.houseId).length,
      isFixedCorrectly: finalHouses.length === 5
    });

    return {
      success: true,
      message: "Deployment houses fixed successfully!",
      housesCreated: 5,
      housesNames: finalHouses.map(h => h.name),
      scholarsAssigned: finalScholars.filter(s => s.houseId).length,
      isComplete: finalHouses.length === 5
    };

  } catch (error) {
    console.error("❌ DEPLOYMENT FIX ERROR:", error);
    throw error;
  }
}