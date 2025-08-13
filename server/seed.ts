import { db } from "./db";
import { houses, scholars, teacherAuth } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function seedDatabase() {
  try {
    // ALWAYS seed teachers regardless of houses status - deployment fix
    console.log("🔍 Checking teacher authentication status...");
    const existingTeachers = await db.select().from(teacherAuth);
    console.log(`Database teachers found: ${existingTeachers.length}`);
    
    if (existingTeachers.length === 0) {
      console.log("🔄 Seeding teacher authentication data for deployment...");
      
      const hashedPassword = await bcrypt.hash("BHSATeacher2025!", 10);
      const teachersData = [
        {
          id: randomUUID(),
          email: "sarah.johnson@bhsteam.edu",
          fullName: "Sarah Johnson", 
          gradeRole: "6th Grade",
          subject: "Mathematics",
          passwordHash: hashedPassword,
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: randomUUID(),
          email: "jennifer.adams@bhsteam.edu",
          fullName: "Jennifer Adams",
          gradeRole: "7th Grade", 
          subject: "Science",
          passwordHash: hashedPassword,
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: randomUUID(),
          email: "michael.davis@bhsteam.edu",
          fullName: "Michael Davis",
          gradeRole: "8th Grade",
          subject: "English",
          passwordHash: hashedPassword,
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      await db.insert(teacherAuth).values(teachersData);
      console.log("✅ CRITICAL: Teacher authentication data seeded - 3 teachers added to database");
    } else {
      console.log(`✅ Found ${existingTeachers.length} existing teachers in database - no seeding needed`);
    }

    // Update house icons even if houses exist
    const existingHouses = await db.select().from(houses);
    if (existingHouses.length > 0) {
      // Update existing houses with new icons
      await db.update(houses).set({ icon: "🐎" }).where(eq(houses.id, "franklin"));
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
        icon: "🐎", // Mustang
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

    console.log("Database seeded successfully with houses, scholars, and teachers");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}