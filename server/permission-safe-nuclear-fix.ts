/**
 * PERMISSION-SAFE NUCLEAR FIX
 * 
 * This fix works within database permission constraints by deleting data
 * in the correct order to respect foreign key relationships.
 */

import { db } from "./db";
import { houses, scholars, pointEntries, parents, teachers, administrators, parentTeacherMessages, pbisEntries } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function permissionSafeNuclearFix() {
  console.log("🛡️ PERMISSION-SAFE NUCLEAR FIX: Starting database rebuild");
  
  try {
    // Step 1: Delete in correct order to respect foreign key constraints
    console.log("🗑️ PERMISSION-SAFE: Deleting data in correct order...");
    
    // Delete child tables first (those that reference other tables)
    console.log("   Deleting PBIS entries...");
    await db.delete(pbisEntries);
    
    console.log("   Deleting point entries...");
    await db.delete(pointEntries);
    
    console.log("   Deleting parent-teacher messages...");
    await db.delete(parentTeacherMessages);
    
    // Now we can safely delete parent tables
    console.log("   Deleting all scholars...");
    await db.delete(scholars);
    
    console.log("   Deleting all houses...");
    await db.delete(houses);
    
    console.log("   Cleaning up parents and teachers...");
    await db.execute(sql`DELETE FROM parents WHERE email != 'admin@system.com'`);
    await db.execute(sql`DELETE FROM teachers WHERE email != 'admin@system.com'`);
    
    console.log("   💥 ALL DATA SAFELY DELETED");
    
    // Step 2: Create exactly 5 houses using Drizzle ORM
    console.log("🏠 PERMISSION-SAFE: Creating exactly 5 houses...");
    
    const exactHouses = [
      { 
        id: "tesla", 
        name: "Tesla", 
        color: "#7c3aed",
        icon: "⚡",
        motto: "Innovation and Discovery",
        academicPoints: 36, 
        attendancePoints: 18, 
        behaviorPoints: 22,
        bhsaMustangTraitsPoints: 0,
        memberCount: 0 
      },
      { 
        id: "drew", 
        name: "Drew", 
        color: "#dc2626",
        icon: "🏥", 
        motto: "Healing and Compassion",
        academicPoints: 20, 
        attendancePoints: 44, 
        behaviorPoints: 4,
        bhsaMustangTraitsPoints: 0,
        memberCount: 0 
      },
      { 
        id: "marshall", 
        name: "Marshall", 
        color: "#059669",
        icon: "⚖️",
        motto: "Justice and Equality",
        academicPoints: 0, 
        attendancePoints: 14, 
        behaviorPoints: -4,
        bhsaMustangTraitsPoints: 0,
        memberCount: 0 
      },
      { 
        id: "johnson", 
        name: "Johnson", 
        color: "#d97706",
        icon: "🧮",
        motto: "Knowledge and Calculation",
        academicPoints: 0, 
        attendancePoints: 0, 
        behaviorPoints: 0,
        bhsaMustangTraitsPoints: 0,
        memberCount: 0 
      },
      { 
        id: "west", 
        name: "West", 
        color: "#0284c7",
        icon: "🌟",
        motto: "Leadership and Excellence", 
        academicPoints: 0, 
        attendancePoints: 0, 
        behaviorPoints: 0,
        bhsaMustangTraitsPoints: 0,
        memberCount: 0 
      }
    ];
    
    await db.insert(houses).values(exactHouses);
    
    for (const house of exactHouses) {
      console.log(`   ✅ PERMISSION-SAFE: Created ${house.name}`);
    }
    
    // Step 3: Create essential students using Drizzle ORM
    console.log("👥 PERMISSION-SAFE: Creating essential students...");
    
    const studentPassword = await bcrypt.hash("student123", 10);
    const students = [
      { 
        name: "Hulk Hogan", 
        studentId: "HH001", 
        houseId: "tesla", 
        grade: 8, 
        username: "hulhog03", 
        passwordHash: studentPassword,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        bhsaMustangTraitsPoints: 0,
        isHouseSorted: true,
        isActive: true
      },
      { 
        name: "Tiffany Demo Daughter", 
        studentId: "TD002", 
        houseId: "drew", 
        grade: 7, 
        username: "tifdau78", 
        passwordHash: studentPassword,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        bhsaMustangTraitsPoints: 0,
        isHouseSorted: true,
        isActive: true
      },
      { 
        name: "Michael Success Student", 
        studentId: "MS003", 
        houseId: "marshall", 
        grade: 6, 
        username: "micsuc755", 
        passwordHash: studentPassword,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        bhsaMustangTraitsPoints: 0,
        isHouseSorted: true,
        isActive: true
      },
      { 
        name: "Grade 7 Demo Student", 
        studentId: "GD004", 
        houseId: "johnson", 
        grade: 7, 
        username: "gra7de999", 
        passwordHash: studentPassword,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        bhsaMustangTraitsPoints: 0,
        isHouseSorted: true,
        isActive: true
      },
      { 
        name: "Sarah Grade Six", 
        studentId: "SG005", 
        houseId: "west", 
        grade: 6, 
        username: "sargra601", 
        passwordHash: studentPassword,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        bhsaMustangTraitsPoints: 0,
        isHouseSorted: true,
        isActive: true
      }
    ];
    
    await db.insert(scholars).values(students);
    
    for (const student of students) {
      console.log(`   ✅ PERMISSION-SAFE: Created student ${student.username}`);
    }
    
    // Step 4: Create essential parents using Drizzle ORM
    console.log("👨‍👩‍👧‍👦 PERMISSION-SAFE: Creating essential parents...");
    
    const parentPassword = await bcrypt.hash("parent123", 10);
    const essentialParents = [
      { 
        email: "Tiffanydemo83@gmail.com", 
        password: parentPassword, 
        firstName: "Tiffany", 
        lastName: "Demo", 
        scholarIds: ["tifdau78"], 
        preferredLanguage: "en",
        isVerified: true
      },
      { 
        email: "hulkmania@aol.com", 
        password: parentPassword, 
        firstName: "Hulk", 
        lastName: "Mania", 
        scholarIds: ["hulhog03"], 
        preferredLanguage: "en",
        isVerified: true
      },
      { 
        email: "demoparent@yahoo.com", 
        password: parentPassword, 
        firstName: "Demo", 
        lastName: "Parent", 
        scholarIds: ["micsuc755"], 
        preferredLanguage: "en",
        isVerified: true
      }
    ];
    
    await db.insert(parents).values(essentialParents);
    
    for (const parent of essentialParents) {
      console.log(`   ✅ PERMISSION-SAFE: Created parent ${parent.email}`);
    }
    
    // Step 5: Create essential teachers using Drizzle ORM
    console.log("👨‍🏫 PERMISSION-SAFE: Creating essential teachers...");
    
    const teacherPassword = await bcrypt.hash("BHSATeacher2025!", 10);
    const essentialTeachers = [
      { 
        name: "David Thompson", 
        email: "david.thompson@bhsa.edu", 
        password: teacherPassword, 
        role: "6th Grade", 
        canSeeGrades: [6]
      },
      { 
        name: "Sarah Johnson", 
        email: "sarah.johnson@bhsa.edu", 
        password: teacherPassword, 
        role: "7th Grade", 
        canSeeGrades: [7]
      },
      { 
        name: "Jennifer Adams", 
        email: "jennifer.adams@bhsa.edu", 
        password: teacherPassword, 
        role: "8th Grade", 
        canSeeGrades: [8]
      },
      { 
        name: "Michael Davis", 
        email: "michael.davis@bhsa.edu", 
        password: teacherPassword, 
        role: "Unified Arts", 
        canSeeGrades: [6, 7, 8]
      },
      { 
        name: "John Christopher", 
        email: "john.christopher@bhsa.edu", 
        password: teacherPassword, 
        role: "Administration", 
        canSeeGrades: [6, 7, 8]
      }
    ];
    
    await db.insert(teachers).values(essentialTeachers);
    
    for (const teacher of essentialTeachers) {
      console.log(`   ✅ PERMISSION-SAFE: Created teacher ${teacher.email}`);
    }
    
    // Step 6: Verification
    console.log("✅ PERMISSION-SAFE: Verifying rebuild...");
    
    const finalHouses = await db.select().from(houses);
    const finalStudents = await db.select().from(scholars);
    const finalParents = await db.select().from(parents);
    const finalTeachers = await db.select().from(teachers);
    
    const houseCount = finalHouses.length;
    const studentCount = finalStudents.length;
    const parentCount = finalParents.length;
    const teacherCount = finalTeachers.length;
    
    console.log(`   ✅ PERMISSION-SAFE: ${houseCount} houses`);
    console.log(`   ✅ PERMISSION-SAFE: ${studentCount} students`);
    console.log(`   ✅ PERMISSION-SAFE: ${parentCount} parents`);
    console.log(`   ✅ PERMISSION-SAFE: ${teacherCount} teachers`);
    
    if (houseCount !== 5) {
      throw new Error(`PERMISSION-SAFE FAILED: Expected 5 houses, found ${houseCount}`);
    }
    
    const houseNames = finalHouses.map(house => house.name).sort();
    
    console.log("🎉 PERMISSION-SAFE NUCLEAR FIX COMPLETE!");
    
    return {
      success: true,
      message: "Permission-safe nuclear fix completed successfully",
      totalHouses: houseCount,
      houseNames: houseNames,
      studentsFixed: studentCount,
      parentsFixed: parentCount,
      teachersFixed: teacherCount,
      isFullyFixed: houseCount === 5
    };
    
  } catch (error) {
    console.error("🛡️ PERMISSION-SAFE NUCLEAR FIX ERROR:", error);
    throw error;
  }
}