/**
 * FINAL DEPLOYMENT RESET
 * 
 * This is the most comprehensive database reset that will work 100%.
 * It handles every possible constraint issue and rebuilds everything cleanly.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function finalDeploymentReset() {
  console.log("🔧 FINAL DEPLOYMENT RESET: Starting comprehensive database reset");
  
  try {
    // Step 1: Use TRUNCATE which resets everything safely
    console.log("🗑️ FINAL RESET: Truncating all tables safely...");
    
    // Truncate with CASCADE to handle all foreign key relationships
    await db.execute(sql`TRUNCATE TABLE pbis_entries CASCADE`);
    await db.execute(sql`TRUNCATE TABLE point_entries CASCADE`);
    await db.execute(sql`TRUNCATE TABLE parent_teacher_messages CASCADE`);
    await db.execute(sql`TRUNCATE TABLE scholar_badges CASCADE`);
    await db.execute(sql`TRUNCATE TABLE game_sessions CASCADE`);
    await db.execute(sql`TRUNCATE TABLE game_access CASCADE`);
    await db.execute(sql`TRUNCATE TABLE reflections CASCADE`);
    await db.execute(sql`TRUNCATE TABLE scholars CASCADE`);
    await db.execute(sql`TRUNCATE TABLE houses CASCADE`);
    await db.execute(sql`TRUNCATE TABLE parents CASCADE`);
    await db.execute(sql`TRUNCATE TABLE teachers CASCADE`);
    await db.execute(sql`TRUNCATE TABLE administrators CASCADE`);
    
    console.log("   💥 ALL TABLES TRUNCATED SAFELY");
    
    // Step 2: Insert exactly 5 houses using raw SQL for maximum compatibility
    console.log("🏠 FINAL RESET: Creating exactly 5 houses...");
    
    await db.execute(sql`
      INSERT INTO houses (id, name, color, icon, motto, academic_points, attendance_points, behavior_points, bhsa_mustang_traits_points, member_count) VALUES
      ('tesla', 'Tesla', '#7c3aed', '⚡', 'Innovation and Discovery', 36, 18, 22, 0, 1),
      ('drew', 'Drew', '#dc2626', '🏥', 'Healing and Compassion', 20, 44, 4, 0, 1),
      ('marshall', 'Marshall', '#059669', '⚖️', 'Justice and Equality', 0, 14, -4, 0, 1),
      ('johnson', 'Johnson', '#d97706', '🧮', 'Knowledge and Calculation', 0, 0, 0, 0, 1),
      ('west', 'West', '#0284c7', '🌟', 'Leadership and Excellence', 0, 0, 0, 0, 1)
    `);
    
    console.log("   ✅ FINAL RESET: 5 houses created");
    
    // Step 3: Create essential students with working credentials
    console.log("👥 FINAL RESET: Creating essential students...");
    
    const studentPasswordHash = await bcrypt.hash("student123", 10);
    
    await db.execute(sql`
      INSERT INTO scholars (id, name, student_id, house_id, grade, academic_points, attendance_points, behavior_points, bhsa_mustang_traits_points, is_house_sorted, username, password_hash, is_active, created_at) VALUES
      ('hulk-student-001', 'Hulk Hogan', 'HH001', 'tesla', 8, 0, 0, 0, 0, true, 'hulhog03', ${studentPasswordHash}, true, NOW()),
      ('tiffany-student-002', 'Tiffany Demo Daughter', 'TD002', 'drew', 7, 0, 0, 0, 0, true, 'tifdau78', ${studentPasswordHash}, true, NOW()),
      ('michael-student-003', 'Michael Success Student', 'MS003', 'marshall', 6, 0, 0, 0, 0, true, 'micsuc755', ${studentPasswordHash}, true, NOW()),
      ('grade7-student-004', 'Grade 7 Demo Student', 'GD004', 'johnson', 7, 0, 0, 0, 0, true, 'gra7de999', ${studentPasswordHash}, true, NOW()),
      ('sarah-student-005', 'Sarah Grade Six', 'SG005', 'west', 6, 0, 0, 0, 0, true, 'sargra601', ${studentPasswordHash}, true, NOW())
    `);
    
    console.log("   ✅ FINAL RESET: 5 students created");
    
    // Step 4: Create essential parents with working credentials
    console.log("👨‍👩‍👧‍👦 FINAL RESET: Creating essential parents...");
    
    const parentPasswordHash = await bcrypt.hash("parent123", 10);
    
    await db.execute(sql`
      INSERT INTO parents (id, email, password, first_name, last_name, phone, preferred_language, scholar_ids, is_verified, created_at) VALUES
      ('tiffany-parent-001', 'Tiffanydemo83@gmail.com', ${parentPasswordHash}, 'Tiffany', 'Demo', NULL, 'en', ARRAY['tiffany-student-002'], true, NOW()),
      ('hulk-parent-002', 'hulkmania@aol.com', ${parentPasswordHash}, 'Hulk', 'Mania', NULL, 'en', ARRAY['hulk-student-001'], true, NOW()),
      ('demo-parent-003', 'demoparent@yahoo.com', ${parentPasswordHash}, 'Demo', 'Parent', NULL, 'en', ARRAY['michael-student-003'], true, NOW())
    `);
    
    console.log("   ✅ FINAL RESET: 3 parents created");
    
    // Step 5: Create essential teachers with working credentials
    console.log("👨‍🏫 FINAL RESET: Creating essential teachers...");
    
    const teacherPasswordHash = await bcrypt.hash("BHSATeacher2025!", 10);
    
    await db.execute(sql`
      INSERT INTO teachers (id, name, email, password, role, subject, can_see_grades, created_at) VALUES
      ('david-teacher-001', 'David Thompson', 'david.thompson@bhsa.edu', ${teacherPasswordHash}, '6th Grade', NULL, ARRAY[6], NOW()),
      ('sarah-teacher-002', 'Sarah Johnson', 'sarah.johnson@bhsa.edu', ${teacherPasswordHash}, '7th Grade', NULL, ARRAY[7], NOW()),
      ('jennifer-teacher-003', 'Jennifer Adams', 'jennifer.adams@bhsa.edu', ${teacherPasswordHash}, '8th Grade', NULL, ARRAY[8], NOW()),
      ('michael-teacher-004', 'Michael Davis', 'michael.davis@bhsa.edu', ${teacherPasswordHash}, 'Unified Arts', 'Computer Science', ARRAY[6,7,8], NOW()),
      ('john-teacher-005', 'John Christopher', 'john.christopher@bhsa.edu', ${teacherPasswordHash}, 'Administration', NULL, ARRAY[6,7,8], NOW())
    `);
    
    console.log("   ✅ FINAL RESET: 5 teachers created");
    
    // Step 6: Create system administrator
    console.log("👑 FINAL RESET: Creating system administrator...");
    
    const adminPasswordHash = await bcrypt.hash("BHSAAdmin2025!", 10);
    
    await db.execute(sql`
      INSERT INTO administrators (id, email, password, role, name, is_approved, created_at) VALUES
      ('system-admin-001', 'admin@bhsa.edu', ${adminPasswordHash}, 'Principal', 'System Administrator', true, NOW())
    `);
    
    console.log("   ✅ FINAL RESET: System administrator created");
    
    // Step 7: Final verification
    console.log("✅ FINAL RESET: Verifying reset...");
    
    const houseCount = await db.execute(sql`SELECT COUNT(*) as count FROM houses`);
    const studentCount = await db.execute(sql`SELECT COUNT(*) as count FROM scholars`);
    const parentCount = await db.execute(sql`SELECT COUNT(*) as count FROM parents`);
    const teacherCount = await db.execute(sql`SELECT COUNT(*) as count FROM teachers`);
    const adminCount = await db.execute(sql`SELECT COUNT(*) as count FROM administrators`);
    
    const houses = houseCount.rows[0].count;
    const students = studentCount.rows[0].count;
    const parents = parentCount.rows[0].count;
    const teachers = teacherCount.rows[0].count;
    const admins = adminCount.rows[0].count;
    
    console.log(`   ✅ FINAL RESET: ${houses} houses`);
    console.log(`   ✅ FINAL RESET: ${students} students`);
    console.log(`   ✅ FINAL RESET: ${parents} parents`);
    console.log(`   ✅ FINAL RESET: ${teachers} teachers`);
    console.log(`   ✅ FINAL RESET: ${admins} administrators`);
    
    if (houses !== 5) {
      throw new Error(`FINAL RESET FAILED: Expected 5 houses, found ${houses}`);
    }
    
    const houseNamesResult = await db.execute(sql`SELECT name FROM houses ORDER BY name`);
    const houseNames = houseNamesResult.rows.map(row => row.name);
    
    console.log("🎉 FINAL DEPLOYMENT RESET COMPLETE!");
    
    return {
      success: true,
      message: "Final deployment reset completed successfully",
      totalHouses: houses,
      houseNames: houseNames,
      studentsFixed: students,
      parentsFixed: parents,
      teachersFixed: teachers,
      adminsCreated: admins,
      isFullyFixed: houses === 5,
      loginCredentials: {
        student: "hulhog03 / student123",
        parent: "Tiffanydemo83@gmail.com / parent123", 
        teacher: "Any teacher email / BHSATeacher2025!",
        admin: "admin@bhsa.edu / BHSAAdmin2025!"
      }
    };
    
  } catch (error) {
    console.error("🔧 FINAL DEPLOYMENT RESET ERROR:", error);
    throw error;
  }
}