import { db } from "./db";
import { teacherAuth } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const addMissingTeachers = async () => {
  console.log("🏫 MISSING TEACHERS FIX: Adding missing teacher accounts");
  
  const missingTeachers = [
    { name: 'Geralyn Buford', email: 'geralyn.buford@bhsteam.edu', gradeRole: '6th Grade', subject: 'ELA' },
    { name: 'Aleisha Lewis', email: 'aleisha.lewis@bhsteam.edu', gradeRole: '7th Grade', subject: 'Math' },
    { name: 'Destine Wilson', email: 'destine.wilson@bhsteam.edu', gradeRole: '8th Grade', subject: 'Science' },
    { name: 'Keijka Brown', email: 'keijka.brown@bhsteam.edu', gradeRole: '6th Grade', subject: 'Social Studies' },
    { name: 'Isabella Patton', email: 'isabella.patton@bhsteam.edu', gradeRole: '7th Grade', subject: 'ELA' },
    { name: 'Camisha Spencer', email: 'camisha.spencer@bhsteam.edu', gradeRole: '8th Grade', subject: 'Math' },
    { name: 'Javen Radney', email: 'javen.radney@bhsteam.edu', gradeRole: 'Unified Arts', subject: 'PE' },
    { name: 'Kenneth Shepherd', email: 'kenneth.shepherd@bhsteam.edu', gradeRole: 'Unified Arts', subject: 'Music' },
    { name: 'Kelli Curry', email: 'kelli.curry@bhsteam.edu', gradeRole: 'Counselor', subject: 'Guidance' },
    { name: 'Stanley Powell', email: 'stanley.powell@bhsteam.edu', gradeRole: 'Administration', subject: 'Principal' },
    { name: 'April Eatmon', email: 'april.eatmon@bhsteam.edu', gradeRole: '6th Grade', subject: 'Math' }
  ];

  try {
    const hashedPassword = await bcrypt.hash('BHSATeacher2025!', 10);
    
    for (const teacher of missingTeachers) {
      // Check if teacher already exists
      const existing = await db.select()
        .from(teacherAuth)
        .where(eq(teacherAuth.email, teacher.email));
      
      if (existing.length === 0) {
        console.log(`🏫 ADDING: ${teacher.name} (${teacher.email})`);
        
        const teacherId = `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await db.insert(teacherAuth).values({
          id: teacherId,
          name: teacher.name,
          email: teacher.email,
          gradeRole: teacher.gradeRole,
          subject: teacher.subject,
          passwordHash: hashedPassword,
          isApproved: true,
          createdAt: new Date()
        });
        
        console.log(`✅ ADDED: ${teacher.name}`);
      } else {
        console.log(`⏭️ EXISTS: ${teacher.name} already in database`);
      }
    }
    
    // Check final count
    const finalCount = await db.select().from(teacherAuth);
    console.log(`🏫 FINAL: ${finalCount.length} teachers in database`);
    
  } catch (error) {
    console.error("🏫 ERROR adding missing teachers:", error);
  }
};