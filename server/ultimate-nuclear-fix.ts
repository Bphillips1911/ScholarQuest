/**
 * ULTIMATE NUCLEAR DEPLOYMENT FIX
 * 
 * This uses raw SQL to temporarily disable foreign key constraints,
 * completely wipe everything, and rebuild from scratch.
 */

import { db } from "./db";
import { houses, scholars, pointEntries, parents, teachers, administrators, parentTeacherMessages, pbisEntries } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function ultimateNuclearFix() {
  console.log("🚀 ULTIMATE NUCLEAR FIX: Starting complete database rebuild");
  
  try {
    // Step 1: DISABLE ALL FOREIGN KEY CONSTRAINTS
    console.log("🔓 ULTIMATE: Disabling foreign key constraints...");
    await db.execute(sql`SET session_replication_role = 'replica'`);
    
    // Step 2: NUCLEAR DELETION - Delete EVERYTHING
    console.log("💥 ULTIMATE: Nuclear deletion of all data...");
    
    await db.execute(sql`DELETE FROM pbis_entries`);
    await db.execute(sql`DELETE FROM point_entries`);
    await db.execute(sql`DELETE FROM parent_teacher_messages`);
    await db.execute(sql`DELETE FROM scholars`);
    await db.execute(sql`DELETE FROM houses`);
    await db.execute(sql`DELETE FROM parents WHERE email != 'admin@system.com'`);
    await db.execute(sql`DELETE FROM teachers WHERE email != 'admin@system.com'`);
    
    console.log("   💥 ALL DATA DESTROYED");
    
    // Step 3: CREATE EXACTLY 5 HOUSES
    console.log("🏠 ULTIMATE: Creating exactly 5 houses...");
    
    const exactHouses = [
      { 
        id: "tesla", 
        name: "Tesla", 
        color: "#7c3aed",
        icon: "⚡",
        motto: "Innovation and Discovery",
        academic_points: 36, 
        attendance_points: 18, 
        behavior_points: 22,
        bhsa_mustang_traits_points: 0,
        member_count: 0 
      },
      { 
        id: "drew", 
        name: "Drew", 
        color: "#dc2626",
        icon: "🏥", 
        motto: "Healing and Compassion",
        academic_points: 20, 
        attendance_points: 44, 
        behavior_points: 4,
        bhsa_mustang_traits_points: 0,
        member_count: 0 
      },
      { 
        id: "marshall", 
        name: "Marshall", 
        color: "#059669",
        icon: "⚖️",
        motto: "Justice and Equality",
        academic_points: 0, 
        attendance_points: 14, 
        behavior_points: -4,
        bhsa_mustang_traits_points: 0,
        member_count: 0 
      },
      { 
        id: "johnson", 
        name: "Johnson", 
        color: "#d97706",
        icon: "🧮",
        motto: "Knowledge and Calculation",
        academic_points: 0, 
        attendance_points: 0, 
        behavior_points: 0,
        bhsa_mustang_traits_points: 0,
        member_count: 0 
      },
      { 
        id: "west", 
        name: "West", 
        color: "#0284c7",
        icon: "🌟",
        motto: "Leadership and Excellence", 
        academic_points: 0, 
        attendance_points: 0, 
        behavior_points: 0,
        bhsa_mustang_traits_points: 0,
        member_count: 0 
      }
    ];
    
    for (const house of exactHouses) {
      await db.execute(sql`
        INSERT INTO houses (id, name, color, icon, motto, academic_points, attendance_points, behavior_points, bhsa_mustang_traits_points, member_count) 
        VALUES (${house.id}, ${house.name}, ${house.color}, ${house.icon}, ${house.motto}, ${house.academic_points}, ${house.attendance_points}, ${house.behavior_points}, ${house.bhsa_mustang_traits_points}, ${house.member_count})
      `);
      console.log(`   ✅ ULTIMATE: Created ${house.name}`);
    }
    
    // Step 4: CREATE ESSENTIAL STUDENTS
    console.log("👥 ULTIMATE: Creating essential students...");
    
    const studentPassword = await bcrypt.hash("student123", 10);
    const students = [
      { id: "hulk-hogan-001", name: "Hulk Hogan", student_id: "HH001", house_id: "tesla", grade: 8, username: "hulhog03", password_hash: studentPassword },
      { id: "tiffany-demo-002", name: "Tiffany Demo Daughter", student_id: "TD002", house_id: "drew", grade: 7, username: "tifdau78", password_hash: studentPassword },
      { id: "michael-success-003", name: "Michael Success Student", student_id: "MS003", house_id: "marshall", grade: 6, username: "micsuc755", password_hash: studentPassword },
      { id: "grade7-demo-004", name: "Grade 7 Demo Student", student_id: "GD004", house_id: "johnson", grade: 7, username: "gra7de999", password_hash: studentPassword },
      { id: "sarah-grade6-005", name: "Sarah Grade Six", student_id: "SG005", house_id: "west", grade: 6, username: "sargra601", password_hash: studentPassword }
    ];
    
    for (const student of students) {
      await db.execute(sql`
        INSERT INTO scholars (id, name, student_id, house_id, grade, academic_points, attendance_points, behavior_points, bhsa_mustang_traits_points, is_house_sorted, username, password_hash, is_active, created_at) 
        VALUES (${student.id}, ${student.name}, ${student.student_id}, ${student.house_id}, ${student.grade}, 0, 0, 0, 0, true, ${student.username}, ${student.password_hash}, true, NOW())
      `);
      console.log(`   ✅ ULTIMATE: Created student ${student.username}`);
    }
    
    // Step 5: CREATE ESSENTIAL PARENTS
    console.log("👨‍👩‍👧‍👦 ULTIMATE: Creating essential parents...");
    
    const parentPassword = await bcrypt.hash("parent123", 10);
    const parents = [
      { id: "tiffany-demo-parent", email: "Tiffanydemo83@gmail.com", password: parentPassword, first_name: "Tiffany", last_name: "Demo", scholar_ids: ["tiffany-demo-002"], is_verified: true },
      { id: "hulk-mania-parent", email: "hulkmania@aol.com", password: parentPassword, first_name: "Hulk", last_name: "Mania", scholar_ids: ["hulk-hogan-001"], is_verified: true },
      { id: "demo-parent-general", email: "demoparent@yahoo.com", password: parentPassword, first_name: "Demo", last_name: "Parent", scholar_ids: ["michael-success-003"], is_verified: true }
    ];
    
    for (const parent of parents) {
      await db.execute(sql`
        INSERT INTO parents (id, email, password, first_name, last_name, scholar_ids, preferred_language, is_verified, created_at) 
        VALUES (${parent.id}, ${parent.email}, ${parent.password}, ${parent.first_name}, ${parent.last_name}, ${JSON.stringify(parent.scholar_ids)}, 'en', ${parent.is_verified}, NOW())
      `);
      console.log(`   ✅ ULTIMATE: Created parent ${parent.email}`);
    }
    
    // Step 6: CREATE ESSENTIAL TEACHERS
    console.log("👨‍🏫 ULTIMATE: Creating essential teachers...");
    
    const teacherPassword = await bcrypt.hash("BHSATeacher2025!", 10);
    const teachers = [
      { id: "david-thompson", name: "David Thompson", email: "david.thompson@bhsa.edu", password: teacherPassword, role: "6th Grade", can_see_grades: [6] },
      { id: "sarah-johnson", name: "Sarah Johnson", email: "sarah.johnson@bhsa.edu", password: teacherPassword, role: "7th Grade", can_see_grades: [7] },
      { id: "jennifer-adams", name: "Jennifer Adams", email: "jennifer.adams@bhsa.edu", password: teacherPassword, role: "8th Grade", can_see_grades: [8] },
      { id: "michael-davis", name: "Michael Davis", email: "michael.davis@bhsa.edu", password: teacherPassword, role: "Unified Arts", can_see_grades: [6, 7, 8] },
      { id: "john-christopher", name: "John Christopher", email: "john.christopher@bhsa.edu", password: teacherPassword, role: "Administration", can_see_grades: [6, 7, 8] }
    ];
    
    for (const teacher of teachers) {
      await db.execute(sql`
        INSERT INTO teachers (id, name, email, password, role, can_see_grades, created_at) 
        VALUES (${teacher.id}, ${teacher.name}, ${teacher.email}, ${teacher.password}, ${teacher.role}, ${JSON.stringify(teacher.can_see_grades)}, NOW())
      `);
      console.log(`   ✅ ULTIMATE: Created teacher ${teacher.email}`);
    }
    
    // Step 7: RE-ENABLE FOREIGN KEY CONSTRAINTS
    console.log("🔒 ULTIMATE: Re-enabling foreign key constraints...");
    await db.execute(sql`SET session_replication_role = 'origin'`);
    
    // Step 8: VERIFICATION
    console.log("✅ ULTIMATE: Verifying rebuild...");
    
    const finalHouses = await db.execute(sql`SELECT COUNT(*) as count FROM houses`);
    const finalStudents = await db.execute(sql`SELECT COUNT(*) as count FROM scholars`);
    const finalParents = await db.execute(sql`SELECT COUNT(*) as count FROM parents`);
    const finalTeachers = await db.execute(sql`SELECT COUNT(*) as count FROM teachers`);
    
    const houseCount = finalHouses.rows[0].count;
    const studentCount = finalStudents.rows[0].count;
    const parentCount = finalParents.rows[0].count;
    const teacherCount = finalTeachers.rows[0].count;
    
    console.log(`   ✅ ULTIMATE: ${houseCount} houses`);
    console.log(`   ✅ ULTIMATE: ${studentCount} students`);
    console.log(`   ✅ ULTIMATE: ${parentCount} parents`);
    console.log(`   ✅ ULTIMATE: ${teacherCount} teachers`);
    
    if (houseCount !== 5) {
      throw new Error(`ULTIMATE FAILED: Expected 5 houses, found ${houseCount}`);
    }
    
    const houseNamesResult = await db.execute(sql`SELECT name FROM houses ORDER BY name`);
    const houseNames = houseNamesResult.rows.map(row => row.name);
    
    console.log("🎉 ULTIMATE NUCLEAR FIX COMPLETE!");
    
    return {
      success: true,
      message: "Ultimate nuclear fix completed successfully",
      totalHouses: houseCount,
      houseNames: houseNames,
      studentsFixed: studentCount,
      parentsFixed: parentCount,
      teachersFixed: teacherCount,
      isFullyFixed: houseCount === 5
    };
    
  } catch (error) {
    console.error("💥 ULTIMATE NUCLEAR FIX ERROR:", error);
    
    // Always re-enable foreign key constraints even if there's an error
    try {
      await db.execute(sql`SET session_replication_role = 'origin'`);
    } catch (constraintError) {
      console.error("Failed to re-enable constraints:", constraintError);
    }
    
    throw error;
  }
}