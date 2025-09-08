// DEPLOYMENT COMPREHENSIVE SEED - Populates deployment database with all essential data
import { db } from "./db";
import { houses, scholars, teacherAuth, administrators, parents } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

/**
 * Comprehensive seeding for deployment environments
 * This ensures your deployed app has all the essential data your school needs
 */
export async function seedDeploymentComprehensive() {
  console.log("🚀 DEPLOYMENT COMPREHENSIVE SEED: Starting full database population...");
  
  try {
    // 1. SEED TEACHERS (Core functionality)
    await seedEssentialTeachers();
    
    // 2. SEED HOUSES (Point system)
    await seedHouses();
    
    // 3. SEED SCHOLARS (Students for teachers to manage)
    await seedEssentialScholars();
    
    // 4. SEED PARENTS (Parent portal functionality)
    await seedEssentialParents();
    
    // 5. SEED ADMINISTRATORS (Admin access)
    await seedAdministrators();
    
    console.log("✅ DEPLOYMENT COMPREHENSIVE SEED: Database fully populated!");
    return true;
    
  } catch (error) {
    console.error("❌ DEPLOYMENT COMPREHENSIVE SEED: Failed:", error);
    throw error;
  }
}

async function seedEssentialTeachers() {
  console.log("📚 SEEDING: Essential teachers...");
  
  const hashedPassword = await bcrypt.hash("BHSATeacher2025!", 10);
  
  const essentialTeachers = [
    {
      id: "8991dee3-3b8f-486b-94ff-024a37b56188", // David Thompson's exact ID
      email: "david.thompson@bhsteam.edu",
      name: "David Thompson",
      gradeRole: "7th Grade",
      subject: "Science",
      passwordHash: hashedPassword,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      email: "sarah.johnson@bhsteam.edu",
      name: "Sarah Johnson",
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
      name: "Jennifer Adams",
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
      name: "Michael Davis",
      gradeRole: "7th Grade",
      subject: "Science",
      passwordHash: hashedPassword,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: randomUUID(),
      email: "jchristopher808@yahoo.com",
      name: "John Christopher",
      gradeRole: "Unified Arts",
      subject: "Physical Education",
      passwordHash: hashedPassword,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  for (const teacher of essentialTeachers) {
    try {
      await db.insert(teacherAuth).values(teacher).onConflictDoNothing();
      console.log(`✅ Teacher: ${teacher.name}`);
    } catch (error) {
      console.log(`⚠️ Teacher ${teacher.name} may already exist`);
    }
  }
}

async function seedHouses() {
  console.log("🏠 SEEDING: Houses...");
  
  const housesData = [
    {
      id: "tesla",
      name: "Tesla",
      color: "#7c3aed", // Purple
      icon: "⚡",
      motto: "Electrifying Excellence",
      academicPoints: 36,
      attendancePoints: 18,
      behaviorPoints: 22,
      bhsaMustangTraitsPoints: 80,
      memberCount: 0,
    },
    {
      id: "curie",
      name: "Drew",
      color: "#dc2626", // Red
      icon: "🧪",
      motto: "Pioneering Progress",
      academicPoints: 20,
      attendancePoints: 44,
      behaviorPoints: 4,
      bhsaMustangTraitsPoints: 94,
      memberCount: 0,
    },
    {
      id: "nobel",
      name: "Marshall",
      color: "#059669", // Green
      icon: "⚖️",
      motto: "Excellence in Achievement",
      academicPoints: 0,
      attendancePoints: 14,
      behaviorPoints: -4,
      bhsaMustangTraitsPoints: 0,
      memberCount: 0,
    },
    {
      id: "franklin",
      name: "Johnson",
      color: "#1e40af", // Blue
      icon: "🔬",
      motto: "Innovation Through Discovery",
      academicPoints: 0,
      attendancePoints: 0,
      behaviorPoints: 0,
      bhsaMustangTraitsPoints: 0,
      memberCount: 6,
    },
    {
      id: "lovelace",
      name: "West",
      color: "#ea580c", // Orange
      icon: "🧭",
      motto: "Coding the Future",
      academicPoints: 0,
      attendancePoints: 0,
      behaviorPoints: 0,
      bhsaMustangTraitsPoints: 0,
      memberCount: 0,
    }
  ];

  for (const house of housesData) {
    try {
      await db.insert(houses).values(house).onConflictDoNothing();
      console.log(`✅ House: ${house.name}`);
    } catch (error) {
      console.log(`⚠️ House ${house.name} may already exist`);
    }
  }
}

async function seedEssentialScholars() {
  console.log("👥 SEEDING: Essential scholars...");
  
  const hashedStudentPassword = await bcrypt.hash("BHSAStudent2025!", 10);
  
  const essentialScholars = [
    // David Thompson's 7th Grade Students
    {
      id: "72705d6a-c0df-4c63-a193-8c2025849337", // Hulk Hogan's exact ID
      name: "Hulk Hogan",
      studentId: "BH0903",
      houseId: "curie",
      grade: 7,
      academicPoints: 7,
      attendancePoints: 11,
      behaviorPoints: -13,
      bhsaMustangTraitsPoints: 0,
      isHouseSorted: false,
      sortingNumber: null,
      addedByTeacher: "8991dee3-3b8f-486b-94ff-024a37b56188", // David Thompson
      username: "hulhog03",
      passwordHash: hashedStudentPassword,
      teacherId: "8991dee3-3b8f-486b-94ff-024a37b56188",
      needsPasswordReset: false,
      isActive: true,
      deactivatedAt: null,
      deactivatedBy: null,
      deactivationReason: null,
      createdAt: new Date("2025-09-03T21:23:09.705Z"),
    },
    {
      id: "5681687e-a8a1-43db-a5b2-f8519f201e7c", // Tiffany Demo Daughter's exact ID
      name: "Tiffany Demo Daughter",
      studentId: "BH1478",
      houseId: "tesla",
      grade: 7,
      academicPoints: -6,
      attendancePoints: 18,
      behaviorPoints: 89,
      bhsaMustangTraitsPoints: 0,
      isHouseSorted: false,
      sortingNumber: null,
      addedByTeacher: "8991dee3-3b8f-486b-94ff-024a37b56188", // David Thompson
      username: "tifdau78",
      passwordHash: hashedStudentPassword,
      teacherId: "8991dee3-3b8f-486b-94ff-024a37b56188",
      needsPasswordReset: false,
      isActive: true,
      deactivatedAt: null,
      deactivatedBy: null,
      deactivationReason: null,
      createdAt: new Date("2025-09-01T02:24:24.240Z"),
    },
    // Additional essential scholars
    {
      id: randomUUID(),
      name: "Michael Success Student",
      studentId: "BH7555",
      houseId: "nobel",
      grade: 7,
      academicPoints: 0,
      attendancePoints: 7,
      behaviorPoints: -2,
      bhsaMustangTraitsPoints: 0,
      isHouseSorted: true,
      sortingNumber: null,
      addedByTeacher: "8991dee3-3b8f-486b-94ff-024a37b56188",
      username: "micsuc755",
      passwordHash: hashedStudentPassword,
      teacherId: "8991dee3-3b8f-486b-94ff-024a37b56188",
      needsPasswordReset: false,
      isActive: true,
      deactivatedAt: null,
      deactivatedBy: null,
      deactivationReason: null,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      name: "Grade 7 Demo Student",
      studentId: "BH7999",
      houseId: "lovelace",
      grade: 7,
      academicPoints: 10,
      attendancePoints: 0,
      behaviorPoints: 10,
      bhsaMustangTraitsPoints: 0,
      isHouseSorted: true,
      sortingNumber: null,
      addedByTeacher: "8991dee3-3b8f-486b-94ff-024a37b56188",
      username: "gra7de999",
      passwordHash: hashedStudentPassword,
      teacherId: "8991dee3-3b8f-486b-94ff-024a37b56188",
      needsPasswordReset: false,
      isActive: true,
      deactivatedAt: null,
      deactivatedBy: null,
      deactivationReason: null,
      createdAt: new Date(),
    },
    // 6th Grade students for Sarah Johnson
    {
      id: randomUUID(),
      name: "Sarah Grade Six",
      studentId: "BH6001",
      houseId: "franklin",
      grade: 6,
      academicPoints: 15,
      attendancePoints: 12,
      behaviorPoints: 8,
      bhsaMustangTraitsPoints: 20,
      isHouseSorted: true,
      sortingNumber: null,
      addedByTeacher: randomUUID(), // Will use Sarah's ID when available
      username: "sargra601",
      passwordHash: hashedStudentPassword,
      teacherId: null,
      needsPasswordReset: false,
      isActive: true,
      deactivatedAt: null,
      deactivatedBy: null,
      deactivationReason: null,
      createdAt: new Date(),
    }
  ];

  for (const scholar of essentialScholars) {
    try {
      await db.insert(scholars).values(scholar).onConflictDoNothing();
      console.log(`✅ Scholar: ${scholar.name} (${scholar.username})`);
    } catch (error) {
      console.log(`⚠️ Scholar ${scholar.name} may already exist`);
    }
  }
}

async function seedEssentialParents() {
  console.log("👨‍👩‍👧‍👦 SEEDING: Essential parents...");
  
  const hashedParentPassword = await bcrypt.hash("BHSAParent2025!", 10);
  
  const essentialParents = [
    {
      id: "ae5d429e-314d-4199-8167-342f116406cd", // Tiffany Demo's exact ID
      email: "Tiffanydemo83@gmail.com",
      password: hashedParentPassword,
      firstName: "Tiffany",
      lastName: "Demo", 
      phone: "555-1478",
      preferredLanguage: "en",
      scholarIds: [],
      isVerified: true,
      createdAt: new Date(),
    },
    {
      id: "71c06ba3-bd8c-42fe-9c04-d6db3af4e407", // Hulk Mania's exact ID
      email: "hulkmania@aol.com", 
      password: hashedParentPassword,
      firstName: "Hulk",
      lastName: "Mania",
      phone: "555-0903",
      preferredLanguage: "en",
      scholarIds: [],
      isVerified: true,
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      email: "demoparent@yahoo.com",
      password: hashedParentPassword,
      firstName: "Demo",
      lastName: "Parent",
      phone: "555-0100",
      preferredLanguage: "en",
      scholarIds: [],
      isVerified: true,
      createdAt: new Date(),
    }
  ];

  for (const parent of essentialParents) {
    try {
      await db.insert(parents).values(parent).onConflictDoNothing();
      console.log(`✅ Parent: ${parent.firstName} ${parent.lastName} (${parent.email})`);
    } catch (error) {
      console.log(`⚠️ Parent ${parent.firstName} ${parent.lastName} may already exist`);
    }
  }
}

async function seedAdministrators() {
  console.log("👑 SEEDING: Administrators...");
  
  const hashedAdminPassword = await bcrypt.hash("BHSAAdmin2025!", 10);
  
  const essentialAdmins = [
    {
      id: randomUUID(),
      email: "admin@bhsteam.edu",
      firstName: "System",
      lastName: "Administrator",
      title: "Principal",
      passwordHash: hashedAdminPassword,
      isActive: true,
      canManageTeachers: true,
      canViewAllData: true,
      canExportData: true,
      canManageSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  for (const admin of essentialAdmins) {
    try {
      await db.insert(administrators).values(admin).onConflictDoNothing();
      console.log(`✅ Administrator: ${admin.firstName} ${admin.lastName}`);
    } catch (error) {
      console.log(`⚠️ Administrator ${admin.firstName} ${admin.lastName} may already exist`);
    }
  }
}