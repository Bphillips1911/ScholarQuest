// TEACHER AUTH FIX - Ensure teacher authentication works in deployment
import { db } from './db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const ensureTeacherAuthConsistency = async () => {
  console.log("🏫 TEACHER AUTH FIX: Starting teacher authentication verification");
  
  try {
    // Check current teacher count and data
    const teacherCount = await db.execute("SELECT COUNT(*) as count FROM teacher_auth");
    const count = parseInt(teacherCount.rows?.[0]?.count || '0');
    console.log(`🏫 TEACHER AUTH FIX: Found ${count} teachers in database`);
    
    // Verify David Thompson specifically
    const davidCheck = await db.execute(
      "SELECT id, email, name, password_hash as password, approved FROM teacher_auth WHERE email = 'david.thompson@bhsteam.edu'"
    );
    
    if (davidCheck.rows && davidCheck.rows.length > 0) {
      const david = davidCheck.rows[0];
      console.log(`🏫 TEACHER AUTH FIX: David Thompson found - Name: ${david.name}, Approved: ${david.approved}`);
      
      // Test password hash
      const isPasswordValid = await bcrypt.compare('teacher123', david.password);
      console.log(`🏫 TEACHER AUTH FIX: David Thompson password valid: ${isPasswordValid}`);
      
      if (!isPasswordValid || !david.approved) {
        console.log("🏫 TEACHER AUTH FIX: Updating David Thompson credentials");
        
        // Hash the correct password
        const hashedPassword = await bcrypt.hash('teacher123', 10);
        
        await db.execute(`
          UPDATE teacher_auth 
          SET password = '${hashedPassword}', approved = true, name = 'David Thompson'
          WHERE email = 'david.thompson@bhsteam.edu'
        `);
        
        console.log("✅ TEACHER AUTH FIX: David Thompson credentials updated");
      }
    } else {
      console.log("🏫 TEACHER AUTH FIX: David Thompson not found, creating account");
      
      // Create David Thompson account
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      const teacherId = `teacher-${Date.now()}`;
      
      await db.execute(`
        INSERT INTO teacher_auth (id, email, name, password, approved, created_at)
        VALUES (
          '${teacherId}',
          'david.thompson@bhsteam.edu',
          'David Thompson',
          '${hashedPassword}',
          true,
          NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          approved = true,
          name = EXCLUDED.name
      `);
      
      console.log("✅ TEACHER AUTH FIX: David Thompson account created");
    }
    
    // Verify all required teachers exist
    const requiredTeachers = [
      ['Jennifer Adams', 'jennifer.adams@bhsteam.edu'],
      ['Sarah Johnson', 'sarah.johnson@bhsteam.edu'],
      ['Michael Davis', 'michael.davis@bhsteam.edu'],
      ['David Thompson', 'david.thompson@bhsteam.edu']
    ];
    
    for (const [name, email] of requiredTeachers) {
      const teacherCheck = await db.execute(`
        SELECT id FROM teacher_auth WHERE email = '${email}'
      `);
      
      if (!teacherCheck.rows || teacherCheck.rows.length === 0) {
        console.log(`🏫 TEACHER AUTH FIX: Creating missing teacher: ${name}`);
        
        const hashedPassword = await bcrypt.hash('teacher123', 10);
        const teacherId = `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db.execute(`
          INSERT INTO teacher_auth (id, email, name, password, approved, created_at)
          VALUES (
            '${teacherId}',
            '${email}',
            '${name}',
            '${hashedPassword}',
            true,
            NOW()
          )
        `);
      }
    }
    
    // Final verification
    const finalCount = await db.execute("SELECT COUNT(*) as count FROM teacher_auth WHERE approved = true");
    const finalTeacherCount = parseInt(finalCount.rows?.[0]?.count || '0');
    console.log(`🏫 TEACHER AUTH FIX: Final approved teacher count: ${finalTeacherCount}`);
    
    console.log("✅ TEACHER AUTH FIX: Teacher authentication verification complete");
    
  } catch (error) {
    console.error("❌ TEACHER AUTH FIX: Error:", error.message);
  }
};