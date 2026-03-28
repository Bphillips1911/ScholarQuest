// TEACHER AUTH FIX - Ensure teacher authentication works in deployment
import { db } from './db';
import bcrypt from 'bcryptjs';

const TEACHER_PASSWORD = "BHSATeacher2025!";

export const ensureTeacherAuthConsistency = async () => {
  console.log("🏫 TEACHER AUTH FIX: Starting teacher authentication verification");
  
  try {
    const teacherCount = await db.execute("SELECT COUNT(*) as count FROM teacher_auth");
    const count = parseInt(teacherCount.rows?.[0]?.count || '0');
    console.log(`🏫 TEACHER AUTH FIX: Found ${count} teachers in database`);
    
    // Check all essential teachers using correct column names (password_hash, is_approved)
    const requiredTeachers = [
      { email: "david.thompson@bhsteam.edu", name: "David Thompson", gradeRole: "7th Grade", subject: "Science" },
      { email: "sarah.johnson@bhsteam.edu",  name: "Sarah Johnson",  gradeRole: "6th Grade", subject: "Mathematics" },
      { email: "jennifer.adams@bhsteam.edu", name: "Jennifer Adams", gradeRole: "7th Grade", subject: "Science" },
      { email: "michael.davis@bhsteam.edu",  name: "Michael Davis",  gradeRole: "8th Grade", subject: "English" },
    ];

    const hashedPassword = await bcrypt.hash(TEACHER_PASSWORD, 10);

    for (const teacher of requiredTeachers) {
      const existing = await db.execute(
        `SELECT id, email, name, password_hash, is_approved FROM teacher_auth WHERE email = '${teacher.email}'`
      );
      
      if (existing.rows && existing.rows.length > 0) {
        const row = existing.rows[0] as any;
        const passwordValid = await bcrypt.compare(TEACHER_PASSWORD, row.password_hash || '');
        
        if (!passwordValid || !row.is_approved) {
          console.log(`🏫 TEACHER AUTH FIX: Resetting credentials for ${teacher.name}`);
          await db.execute(
            `UPDATE teacher_auth SET password_hash = '${hashedPassword}', is_approved = true WHERE email = '${teacher.email}'`
          );
          console.log(`✅ TEACHER AUTH FIX: ${teacher.name} credentials updated`);
        } else {
          console.log(`✅ TEACHER AUTH FIX: ${teacher.name} credentials OK`);
        }
      } else {
        console.log(`🏫 TEACHER AUTH FIX: Creating missing teacher: ${teacher.name}`);
        const teacherId = `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.execute(`
          INSERT INTO teacher_auth (id, email, name, grade_role, subject, password_hash, is_approved, created_at, updated_at)
          VALUES (
            '${teacherId}', '${teacher.email}', '${teacher.name}',
            '${teacher.gradeRole}', '${teacher.subject}', '${hashedPassword}',
            true, NOW(), NOW()
          )
        `);
        console.log(`✅ TEACHER AUTH FIX: ${teacher.name} created`);
      }
    }
    
    const finalCount = await db.execute("SELECT COUNT(*) as count FROM teacher_auth WHERE is_approved = true");
    const finalApproved = parseInt(finalCount.rows?.[0]?.count || '0');
    console.log(`🏫 TEACHER AUTH FIX: Final approved teacher count: ${finalApproved}`);
    console.log("✅ TEACHER AUTH FIX: Teacher authentication verification complete");
    
  } catch (error: any) {
    console.error("❌ TEACHER AUTH FIX: Error:", error.message);
  }
};
