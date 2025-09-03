import { db } from "./db";
import { teacherAuth } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const addMissingTeachers = async () => {
  console.log("🏫 MISSING TEACHERS FIX: Adding missing teacher accounts");
  
  const missingTeachers = [
    { name: 'Geralyn Buford', email: 'gbuford@bhm.k12.al.us', gradeRole: '6th Grade', subject: 'Science' },
    { name: 'Aleisha Lewis', email: 'alewis11@bhm.k12.al.us', gradeRole: '6th Grade', subject: 'Math' },
    { name: 'Destine Wilson', email: 'wilson.estine23@icloud.com', gradeRole: '7th Grade', subject: 'Social Studies' },
    { name: 'Keijka Brown', email: 'kbrown12@bhm.k12.al.us', gradeRole: '6th Grade', subject: 'ELA' },
    { name: 'Isabella Patton', email: 'ipatten@bhm.k12.al.us', gradeRole: '7th Grade', subject: 'Science' },
    { name: 'Camisha Spencer', email: 'cspencer@bhm.k12.al.us', gradeRole: '8th Grade', subject: 'Special Education' },
    { name: 'Javen Radney', email: 'jradney@bhm.k12.al.us', gradeRole: 'Unified Arts', subject: 'Choir' },
    { name: 'Kenneth Shepherd', email: 'kshepherd2@bhm.k12.al.us', gradeRole: 'Unified Arts', subject: 'Physical Education' },
    { name: 'Kelli Curry', email: 'kcurry2@bhm.k12.al.us', gradeRole: '8th Grade', subject: 'Science' },
    { name: 'Stanley Powell', email: 'spowell@bhm.k12.al.us', gradeRole: '8th Grade', subject: 'Social Studies' },
    { name: 'April Eatmon', email: 'aeatmon@bhm.k12.al.us', gradeRole: '6th Grade', subject: 'Social Studies' }
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