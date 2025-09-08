// NUCLEAR DATABASE RESET - Complete wipe and reseed for deployment
import type { Express } from "express";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { houses, teachers, scholars, parents, pointEntries, administrators } from "../shared/schema";

export function registerNuclearReset(app: Express) {
  // NUCLEAR OPTION: Complete database reset and reseed
  app.post("/api/nuclear/reset-database", async (req, res) => {
    try {
      console.log("🚨 NUCLEAR RESET: Starting complete database wipe and reseed...");
      
      // STEP 1: Complete database wipe - Use TRUNCATE CASCADE to handle foreign keys
      console.log("💥 NUCLEAR: Wiping all tables with CASCADE...");
      
      // Use raw SQL to truncate all tables with CASCADE
      await db.execute(sql`TRUNCATE TABLE houses, teachers, scholars, parents, point_entries, pbis_entries, administrators, parent_teacher_messages, scholar_badges, game_access, game_sessions, reflections RESTART IDENTITY CASCADE`);
      
      console.log("💥 NUCLEAR: All tables wiped clean with CASCADE");
      
      // STEP 2: Recreate EXACT preview data structure
      console.log("🏠 NUCLEAR: Creating correct houses...");
      const houseData = [
        { 
          id: "tesla", 
          name: "Tesla", 
          color: "#e11d48", 
          icon: "⚡", 
          motto: "Innovation Through Science",
          academicPoints: 36,
          attendancePoints: 18,
          behaviorPoints: 22,
          bhsaMustangTraitsPoints: 0,
          memberCount: 0
        },
        { 
          id: "drew", 
          name: "Drew", 
          color: "#059669", 
          icon: "🔬", 
          motto: "Breaking Barriers in Medicine",
          academicPoints: 20,
          attendancePoints: 44,
          behaviorPoints: 4,
          bhsaMustangTraitsPoints: 0,
          memberCount: 0
        },
        { 
          id: "marshall", 
          name: "Marshall", 
          color: "#2563eb", 
          icon: "🏛️", 
          motto: "Justice and Excellence",
          academicPoints: 0,
          attendancePoints: 14,
          behaviorPoints: -4,
          bhsaMustangTraitsPoints: 0,
          memberCount: 0
        },
        { 
          id: "johnson", 
          name: "Johnson", 
          color: "#7c3aed", 
          icon: "🚀", 
          motto: "Reaching for the Stars",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          bhsaMustangTraitsPoints: 0,
          memberCount: 0
        },
        { 
          id: "west", 
          name: "West", 
          color: "#ea580c", 
          icon: "💻", 
          motto: "Computing the Future",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          bhsaMustangTraitsPoints: 0,
          memberCount: 0
        }
      ];
      
      for (const house of houseData) {
        await db.insert(houses).values(house);
        console.log(`✅ House: ${house.name} (Academic: ${house.academicPoints}, Attendance: ${house.attendancePoints}, Behavior: ${house.behaviorPoints})`);
      }
      
      // STEP 3: Create David Thompson with CORRECT password
      console.log("👨‍🏫 NUCLEAR: Creating David Thompson with correct password...");
      await db.insert(teachers).values({
        name: "David Thompson",
        email: "david.thompson@bhsteam.edu",
        password: "bushpbis2025", // CORRECT PASSWORD
        role: "7th Grade - Science",
        subject: "Science",
        canSeeGrades: [7]
      });
      console.log("✅ David Thompson created with password: bushpbis2025");
      
      // STEP 4: Create all essential teachers with CORRECT passwords
      const teacherData = [
        { name: "Sarah Johnson", email: "sarah.johnson@bhsteam.edu", password: "bushpbis2025", role: "6th Grade - Math", subject: "Math", canSeeGrades: [6] },
        { name: "Jennifer Adams", email: "jennifer.adams@bhsteam.edu", password: "bushpbis2025", role: "8th Grade - English", subject: "English", canSeeGrades: [8] },
        { name: "Michael Davis", email: "michael.davis@bhsteam.edu", password: "bushpbis2025", role: "7th Grade - Math", subject: "Math", canSeeGrades: [7] },
        { name: "John Christopher", email: "john.christopher@bhsteam.edu", password: "bushpbis2025", role: "PE Teacher", subject: "Physical Education", canSeeGrades: [6, 7, 8] }
      ];
      
      for (const teacher of teacherData) {
        await db.insert(teachers).values(teacher);
        console.log(`✅ Teacher: ${teacher.name} (${teacher.password})`);
      }
      
      // STEP 5: Create 7th grade scholars for David Thompson
      console.log("👥 NUCLEAR: Creating 7th grade scholars for David Thompson...");
      
      // Get David Thompson's ID from database
      const davidThompson = await db.select().from(teachers).where(sql`email = 'david.thompson@bhsteam.edu'`).limit(1);
      const davidId = davidThompson[0]?.id;
      
      const scholarData = [
        { studentId: "hulhog03", name: "Hulk Hogan", grade: 7, houseId: "tesla", teacherId: davidId, passwordHash: "hulhog03" },
        { studentId: "tifdau78", name: "Tiffany Demo Daughter", grade: 7, houseId: "drew", teacherId: davidId, passwordHash: "tifdau78" },
        { studentId: "micsuc755", name: "Michael Success Student", grade: 7, houseId: "marshall", teacherId: davidId, passwordHash: "micsuc755" },
        { studentId: "gra7de999", name: "Grade 7 Demo Student", grade: 7, houseId: "tesla", teacherId: davidId, passwordHash: "gra7de999" },
        { studentId: "sargra700", name: "Sarah Grade Seven", grade: 7, houseId: "drew", teacherId: davidId, passwordHash: "sargra700" },
        { studentId: "johsev701", name: "John Seven Student", grade: 7, houseId: "west", teacherId: davidId, passwordHash: "johsev701" },
        { studentId: "emipro702", name: "Emily Progress Student", grade: 7, houseId: "johnson", teacherId: davidId, passwordHash: "emipro702" },
        { studentId: "dansev703", name: "Daniel Seventh Grade", grade: 7, houseId: "tesla", teacherId: davidId, passwordHash: "dansev703" },
        { studentId: "lisgoo704", name: "Lisa Good Student", grade: 7, houseId: "marshall", teacherId: davidId, passwordHash: "lisgoo704" },
        { studentId: "robtop705", name: "Robert Top Student", grade: 7, houseId: "drew", teacherId: davidId, passwordHash: "robtop705" }
      ];
      
      for (const scholar of scholarData) {
        await db.insert(scholars).values({
          ...scholar,
          academicPoints: Math.floor(Math.random() * 30) + 5,
          attendancePoints: Math.floor(Math.random() * 20) + 2,
          behaviorPoints: Math.floor(Math.random() * 15) + 1,
          isHouseSorted: true
        });
        console.log(`✅ Scholar: ${scholar.name} (${scholar.studentId})`);
      }
      
      // STEP 6: Create essential parents
      console.log("👨‍👩‍👧‍👦 NUCLEAR: Creating parent accounts...");
      const parentData = [
        { email: "Tiffanydemo83@gmail.com", password: "tifdau78", firstName: "Tiffany", lastName: "Demo" },
        { email: "hulkmania@aol.com", password: "hulhog03", firstName: "Hulk", lastName: "Mania" },
        { email: "demoparent@yahoo.com", password: "micsuc755", firstName: "Demo", lastName: "Parent" }
      ];
      
      for (const parent of parentData) {
        await db.insert(parents).values({
          ...parent,
          isVerified: true,
          phone: "555-0100",
          scholarIds: []
        });
        console.log(`✅ Parent: ${parent.firstName} ${parent.lastName} (${parent.email})`);
      }
      
      // STEP 7: Create administrator
      console.log("👑 NUCLEAR: Creating administrator...");
      await db.insert(administrators).values({
        name: "System Administrator",
        email: "admin@bhsteam.edu",
        passwordHash: "BHSAAdmin2025!",
        title: "Principal",
        isApproved: true
      });
      console.log("✅ Administrator: System Administrator");
      
      console.log("🎯 NUCLEAR RESET: Complete! Database matches preview exactly.");
      
      res.json({
        success: true,
        message: "Nuclear database reset completed successfully",
        timestamp: new Date().toISOString(),
        summary: {
          houses: 5,
          teachers: 5,
          scholars: 10,
          parents: 3,
          administrators: 1,
          davidThompsonPassword: "bushpbis2025"
        }
      });
      
    } catch (error: any) {
      console.error("❌ NUCLEAR RESET: Failed:", error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Status check endpoint
  app.get("/api/nuclear/status", async (req, res) => {
    try {
      const housesCount = await db.select().from(houses);
      const teachersCount = await db.select().from(teachers);
      const scholarsCount = await db.select().from(scholars);
      
      res.json({
        houses: housesCount.length,
        teachers: teachersCount.length,  
        scholars: scholarsCount.length,
        houseNames: housesCount.map(h => h.name),
        davidThompsonExists: teachersCount.some(t => t.email === "david.thompson@bhsteam.edu")
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}