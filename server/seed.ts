import { db } from "./db";
import { houses, scholars } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if houses already exist
    const existingHouses = await db.select().from(houses);
    if (existingHouses.length > 0) {
      console.log("Database already seeded");
      return;
    }

    // Insert the five houses
    const housesData = [
      {
        id: "franklin",
        name: "House of Franklin",
        color: "#3B82F6", // Blue
        icon: "⚡",
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
        icon: "🌿",
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
        icon: "🔬",
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
        icon: "⚖️",
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
        icon: "🎨",
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

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}