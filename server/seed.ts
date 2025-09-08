import { db } from "./db";
import { houses, scholars, teacherAuth, administrators } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { seedBadgesAndGames } from "./seed-badges-games";

export async function seedDatabase() {
  try {
    // DEPLOYMENT FIX: Force comprehensive seeding for all environments with REPL_ID
    const hasReplId = !!process.env.REPL_ID;
    const hasNeonDb = process.env.DATABASE_URL?.includes('neon.tech');
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log("SEED DEBUG: Environment check:", {
      hasReplId,
      hasNeonDb,
      isProduction,
      nodeEnv: process.env.NODE_ENV,
      replId: process.env.REPL_ID?.substring(0, 8),
      dbUrl: process.env.DATABASE_URL?.substring(0, 30)
    });
    
    // ALWAYS use comprehensive seeding for Replit environments
    if (hasReplId || hasNeonDb || isProduction) {
      console.log("🚀 REPLIT ENVIRONMENT DETECTED: Running comprehensive seeding...");
      const { seedDeploymentComprehensive } = await import('./deployment-comprehensive-seed');
      return await seedDeploymentComprehensive();
    }
    
    // CRITICAL DEPLOYMENT FIX - Always ensure teachers exist
    console.log("SEED: 🚀 DEPLOYMENT CRITICAL - Starting teacher seeding...");
    console.log(`SEED: Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`SEED: REPL_ID: ${process.env.REPL_ID || 'not set'}`);
    
    // FORCE teacher creation for deployment reliability
    const requiredTeachers = [
      "sarah.johnson@bhsteam.edu",
      "jennifer.adams@bhsteam.edu", 
      "michael.davis@bhsteam.edu",
      "david.thompson@bhsteam.edu"  // NEW 7th Grade Science teacher
    ];
    
    // Check existing teachers
    const existingTeachers = await db.select().from(teacherAuth);
    console.log(`SEED: Found ${existingTeachers.length} existing teachers in database`);
    
    // If no teachers exist OR if we're missing any required teacher, create them all
    const missingTeachers = requiredTeachers.filter(email => 
      !existingTeachers.find(t => t.email === email)
    );
    
    if (missingTeachers.length > 0 || existingTeachers.length === 0) {
      console.log(`SEED: 🔧 DEPLOYMENT FIX - Creating ${missingTeachers.length || 3} teachers...`);
      
      const hashedPassword = await bcrypt.hash("BHSATeacher2025!", 10);
      console.log("SEED: Password hashed successfully");
      
      // Create all required teachers in one batch for deployment reliability
      const teachersToCreate = requiredTeachers.map(email => {
        const teacherName = email === "sarah.johnson@bhsteam.edu" ? "Sarah Johnson" :
                          email === "jennifer.adams@bhsteam.edu" ? "Jennifer Adams" : 
                          email === "michael.davis@bhsteam.edu" ? "Michael Davis" : "David Thompson";
        
        return {
          id: randomUUID(),
          email: email,
          name: teacherName,
          gradeRole: email === "sarah.johnson@bhsteam.edu" ? "6th Grade" :
                    email === "jennifer.adams@bhsteam.edu" ? "7th Grade" :
                    email === "michael.davis@bhsteam.edu" ? "7th Grade" :  // FIXED: Michael is now 7th Grade
                    "7th Grade",  // David Thompson also 7th Grade
          subject: email === "sarah.johnson@bhsteam.edu" ? "Mathematics" :
                  email === "jennifer.adams@bhsteam.edu" ? "Science" :
                  email === "michael.davis@bhsteam.edu" ? "Science" :  // FIXED: Michael is now Science
                  "Science",  // David Thompson also Science
          passwordHash: hashedPassword,
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
      
      // Use INSERT ... ON CONFLICT DO NOTHING for deployment safety
      try {
        for (const teacherData of teachersToCreate) {
          const existing = existingTeachers.find(t => t.email === teacherData.email);
          if (!existing) {
            await db.insert(teacherAuth).values(teacherData);
            console.log(`SEED: ✅ Created teacher ${teacherData.email}`);
          }
        }
        console.log("SEED: 🎯 DEPLOYMENT SUCCESS - All teachers created!");
      } catch (insertError) {
        console.log(`SEED: 🚨 DEPLOYMENT ERROR:`, insertError);
      }
    } else {
      console.log("SEED: ✅ All required teachers already exist");
    }
    
    // Final verification 
    const finalTeachers = await db.select().from(teacherAuth);
    console.log(`SEED: ✅ FINAL COUNT - ${finalTeachers.length} teachers in database`);
    finalTeachers.forEach(t => console.log(`SEED: - ${t.email} (${t.name}) - Approved: ${t.isApproved}`));

    // Update house icons even if houses exist
    const existingHouses = await db.select().from(houses);
    if (existingHouses.length > 0) {
      // Update existing houses with new icons
      await db.update(houses).set({ icon: "🔬" }).where(eq(houses.id, "franklin"));
      await db.update(houses).set({ icon: "🦉" }).where(eq(houses.id, "courie"));
      await db.update(houses).set({ icon: "🐺" }).where(eq(houses.id, "west"));
      await db.update(houses).set({ icon: "🦅" }).where(eq(houses.id, "blackwell"));
      await db.update(houses).set({ icon: "🦁" }).where(eq(houses.id, "berruguete"));
      console.log("House icons updated");
      console.log("Database seeded successfully with houses, scholars, and teachers");
      return;
    }

    // Insert the five houses
    const housesData = [
      {
        id: "franklin",
        name: "House of Franklin",
        color: "#3B82F6", // Blue
        icon: "🔬", // Innovation
        motto: "Innovation Through Discovery",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "courie",
        name: "House of Courie",
        color: "#10B981", // Green
        icon: "🦉", // Owl
        motto: "Growth Through Knowledge",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "west",
        name: "House of West",
        color: "#8B5CF6", // Purple
        icon: "🐺", // Wolf
        motto: "Excellence Through Science",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "blackwell",
        name: "House of Blackwell",
        color: "#6B7280", // Gray
        icon: "🦅", // Falcon
        motto: "Strength Through Unity",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "berruguete",
        name: "House of Berruguete",
        color: "#F59E0B", // Orange
        icon: "🦁", // Lion
        motto: "Beauty Through Creativity",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
    ];

    await db.insert(houses).values(housesData);

    // Insert sample scholars
    const scholarsData = [
      {
        name: "Alex Johnson",
        studentId: "BH6001",
        houseId: "franklin",
        academicPoints: 45,
        attendancePoints: 30,
        behaviorPoints: 25,
      },
      {
        name: "Emma Davis",
        studentId: "BH6002",
        houseId: "courie",
        academicPoints: 40,
        attendancePoints: 35,
        behaviorPoints: 30,
      },
      {
        name: "Michael Brown",
        studentId: "BH7001",
        houseId: "west",
        academicPoints: 50,
        attendancePoints: 28,
        behaviorPoints: 35,
      },
      {
        name: "Sarah Wilson",
        studentId: "BH7002",
        houseId: "blackwell",
        academicPoints: 42,
        attendancePoints: 32,
        behaviorPoints: 28,
      },
      {
        name: "Carlos Martinez",
        studentId: "BH8001",
        houseId: "berruguete",
        academicPoints: 38,
        attendancePoints: 30,
        behaviorPoints: 32,
      },
    ];

    await db.insert(scholars).values(scholarsData);

    // Initialize admin users
    await seedAdminUsers();
    
    // Initialize badges and games
    const { seedBadgesAndGames } = await import('./seed-badges-games');
    await seedBadgesAndGames();
    
    console.log("Database seeded successfully with houses, scholars, teachers, administrators, badges, and games");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function seedAdminUsers() {
  try {
    console.log("SEED: 🔐 ADMIN - Initializing administrator accounts...");
    
    // Check if admin users already exist
    const existingAdmins = await db.select().from(administrators);
    console.log(`SEED: Found ${existingAdmins.length} existing administrators`);
    
    if (existingAdmins.length === 0) {
      const hashedPassword = await bcrypt.hash("School1911!", 10);
      
      const adminUsers = [
        {
          id: randomUUID(),
          email: "bphillips@bhm.k12.al.us",
          firstName: "Benjamin",
          lastName: "Phillips", 
          title: "Principal" as const,
          permissions: ["all"],
          passwordHash: hashedPassword,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      for (const admin of adminUsers) {
        await db.insert(administrators).values(admin);
        console.log(`SEED: ✅ Created admin: ${admin.email} (${admin.title})`);
      }
    } else {
      console.log("SEED: ✅ Admin users already exist");
      existingAdmins.forEach(admin => {
        console.log(`SEED: - ${admin.email} (${admin.title}) - Active: ${admin.isActive}`);
      });
    }
  } catch (error) {
    console.error("SEED: ❌ Admin initialization error:", error);
  }
}