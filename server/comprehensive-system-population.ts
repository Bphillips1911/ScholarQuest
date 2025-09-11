/**
 * COMPREHENSIVE SYSTEM POPULATION
 * 
 * Populates the system with all missing data to fix all the blank tabs and functionality.
 * This addresses the user's feedback about missing students, games, badges, SEL content, etc.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function comprehensiveSystemPopulation() {
  console.log("🚀 COMPREHENSIVE SYSTEM POPULATION: Starting full system data population...");
  
  try {
    // Step 1: Add many more students (25 total across all houses)
    console.log("👥 POPULATION: Adding comprehensive student roster...");
    
    const studentPasswordHash = await bcrypt.hash("student123", 10);
    
    // Current houses: Tesla, Drew, Marshall, Johnson, West
    const additionalStudents = [
      // Tesla House (5 more students)
      { id: 'tesla-student-006', name: 'Emma Tesla Scholar', student_id: 'ET006', house: 'tesla', grade: 6, username: 'emmtel06' },
      { id: 'tesla-student-007', name: 'James Innovation Kid', student_id: 'JI007', house: 'tesla', grade: 7, username: 'jaminn07' },
      { id: 'tesla-student-008', name: 'Sophia Electric Girl', student_id: 'SE008', house: 'tesla', grade: 8, username: 'sopele08' },
      { id: 'tesla-student-009', name: 'Liam Spark Boy', student_id: 'LS009', house: 'tesla', grade: 6, username: 'liaspa09' },
      { id: 'tesla-student-010', name: 'Olivia Current Girl', student_id: 'OC010', house: 'tesla', grade: 7, username: 'olicur10' },
      
      // Drew House (5 more students)
      { id: 'drew-student-006', name: 'Noah Healing Spirit', student_id: 'NH006', house: 'drew', grade: 8, username: 'noahea06' },
      { id: 'drew-student-007', name: 'Ava Compassion Heart', student_id: 'AC007', house: 'drew', grade: 6, username: 'avacom07' },
      { id: 'drew-student-008', name: 'Mason Care Giver', student_id: 'MC008', house: 'drew', grade: 7, username: 'mascar08' },
      { id: 'drew-student-009', name: 'Isabella Help Hand', student_id: 'IH009', house: 'drew', grade: 8, username: 'isahel09' },
      { id: 'drew-student-010', name: 'Ethan Doctor Jr', student_id: 'ED010', house: 'drew', grade: 6, username: 'ethdoc10' },
      
      // Marshall House (5 more students)
      { id: 'marshall-student-006', name: 'Charlotte Justice Seeker', student_id: 'CJ006', house: 'marshall', grade: 7, username: 'chajus06' },
      { id: 'marshall-student-007', name: 'Lucas Equality Fighter', student_id: 'LE007', house: 'marshall', grade: 8, username: 'lucequ07' },
      { id: 'marshall-student-008', name: 'Amelia Rights Defender', student_id: 'AR008', house: 'marshall', grade: 6, username: 'amerig08' },
      { id: 'marshall-student-009', name: 'Benjamin Fair Judge', student_id: 'BF009', house: 'marshall', grade: 7, username: 'benfai09' },
      { id: 'marshall-student-010', name: 'Harper Law Student', student_id: 'HL010', house: 'marshall', grade: 8, username: 'harlaw10' },
      
      // Johnson House (5 more students)
      { id: 'johnson-student-006', name: 'Alexander Math Genius', student_id: 'AM006', house: 'johnson', grade: 6, username: 'alemat06' },
      { id: 'johnson-student-007', name: 'Mia Calculator Queen', student_id: 'MC007', house: 'johnson', grade: 8, username: 'miacal07' },
      { id: 'johnson-student-008', name: 'Henry Number Wizard', student_id: 'HN008', house: 'johnson', grade: 7, username: 'hennum08' },
      { id: 'johnson-student-009', name: 'Luna Equation Solver', student_id: 'LE009', house: 'johnson', grade: 6, username: 'lunequ09' },
      { id: 'johnson-student-010', name: 'Owen Algorithm Kid', student_id: 'OA010', house: 'johnson', grade: 8, username: 'owealg10' },
      
      // West House (5 more students) 
      { id: 'west-student-006', name: 'Aria Leadership Star', student_id: 'AL006', house: 'west', grade: 7, username: 'arilead06' },
      { id: 'west-student-007', name: 'Sebastian Excellence Boy', student_id: 'SE007', house: 'west', grade: 6, username: 'sebexc07' },
      { id: 'west-student-008', name: 'Zoe Champion Girl', student_id: 'ZC008', house: 'west', grade: 8, username: 'zoecha08' },
      { id: 'west-student-009', name: 'Gabriel Winner Kid', student_id: 'GW009', house: 'west', grade: 7, username: 'gabwin09' },
      { id: 'west-student-010', name: 'Chloe Victory Star', student_id: 'CV010', house: 'west', grade: 6, username: 'chovic10' }
    ];
    
    for (const student of additionalStudents) {
      await db.execute(sql`
        INSERT INTO scholars (id, name, student_id, house_id, grade, academic_points, attendance_points, behavior_points, bhsa_mustang_traits_points, is_house_sorted, username, password_hash, is_active, created_at) 
        VALUES (${student.id}, ${student.name}, ${student.student_id}, ${student.house}, ${student.grade}, 0, 0, 0, 0, true, ${student.username}, ${studentPasswordHash}, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    console.log(`   ✅ Added ${additionalStudents.length} additional students`);
    
    // Step 2: Add Games
    console.log("🎮 POPULATION: Adding games library...");
    
    const games = [
      { id: 'math-racing-game', name: 'Math Racing', description: 'Race cars by solving math problems quickly!', category: 'Educational' },
      { id: 'word-puzzle-adventure', name: 'Word Puzzle Adventure', description: 'Explore worlds by creating words from letters', category: 'Educational' },
      { id: 'science-lab-simulator', name: 'Science Lab Simulator', description: 'Conduct virtual science experiments safely', category: 'Educational' },
      { id: 'geography-explorer', name: 'Geography Explorer', description: 'Travel the world and learn about different countries', category: 'Educational' },
      { id: 'reading-quest', name: 'Reading Quest', description: 'Epic adventures unlocked by reading comprehension', category: 'Educational' },
      { id: 'logic-puzzle-master', name: 'Logic Puzzle Master', description: 'Challenge your mind with brain-bending puzzles', category: 'Puzzle' },
      { id: 'strategy-kingdom', name: 'Strategy Kingdom', description: 'Build and manage your own medieval kingdom', category: 'Strategy' },
      { id: 'sports-champion', name: 'Sports Champion', description: 'Compete in various virtual sports competitions', category: 'Sports' }
    ];
    
    for (const game of games) {
      await db.execute(sql`
        INSERT INTO games (id, name, description, is_active, created_at) 
        VALUES (${game.id}, ${game.name}, ${game.description}, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    console.log(`   ✅ Added ${games.length} games to library`);
    
    // Step 3: Add Badges
    console.log("🏆 POPULATION: Adding badges system...");
    
    const badges = [
      { id: 'academic-star', name: 'Academic Star', description: 'Earned 100 academic points', category: 'Academic', points_required: 100, rarity: 'common' },
      { id: 'attendance-hero', name: 'Attendance Hero', description: 'Perfect attendance for a month', category: 'Attendance', points_required: 50, rarity: 'uncommon' },
      { id: 'behavior-champion', name: 'Behavior Champion', description: 'Outstanding behavior for a week', category: 'Behavior', points_required: 25, rarity: 'common' },
      { id: 'house-pride', name: 'House Pride', description: 'Show exceptional house spirit', category: 'House', points_required: 30, rarity: 'common' },
      { id: 'reading-wizard', name: 'Reading Wizard', description: 'Read 10 books this semester', category: 'Academic', points_required: 75, rarity: 'uncommon' },
      { id: 'math-genius', name: 'Math Genius', description: 'Perfect scores on 5 math tests', category: 'Academic', points_required: 150, rarity: 'rare' },
      { id: 'science-explorer', name: 'Science Explorer', description: 'Complete 5 science experiments', category: 'Academic', points_required: 125, rarity: 'uncommon' },
      { id: 'kindness-ambassador', name: 'Kindness Ambassador', description: 'Show exceptional kindness to peers', category: 'Behavior', points_required: 40, rarity: 'uncommon' },
      { id: 'leadership-star', name: 'Leadership Star', description: 'Demonstrate leadership qualities', category: 'Behavior', points_required: 80, rarity: 'rare' },
      { id: 'teamwork-champion', name: 'Teamwork Champion', description: 'Excel in group projects', category: 'Behavior', points_required: 60, rarity: 'uncommon' }
    ];
    
    for (const badge of badges) {
      await db.execute(sql`
        INSERT INTO badges (id, name, description, category, points_required, rarity, is_active) 
        VALUES (${badge.id}, ${badge.name}, ${badge.description}, ${badge.category}, ${badge.points_required}, ${badge.rarity}, true)
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    console.log(`   ✅ Added ${badges.length} badges to system`);
    
    // Step 4: Add SEL Lessons
    console.log("🧠 POPULATION: Adding SEL (Social Emotional Learning) content...");
    
    const selLessons = [
      { id: 'sel-kindness-lesson', title: 'Understanding Kindness', description: 'Learn about showing kindness to others', grade_level: 6 },
      { id: 'sel-empathy-lesson', title: 'Building Empathy', description: 'Understand and share feelings with others', grade_level: 7 },
      { id: 'sel-responsibility-lesson', title: 'Taking Responsibility', description: 'Learn to be accountable for your actions', grade_level: 8 },
      { id: 'sel-teamwork-lesson', title: 'Working Together', description: 'Collaborate effectively with classmates', grade_level: 6 },
      { id: 'sel-resilience-lesson', title: 'Building Resilience', description: 'Bounce back from challenges and setbacks', grade_level: 7 },
      { id: 'sel-communication-lesson', title: 'Clear Communication', description: 'Express yourself clearly and listen actively', grade_level: 8 }
    ];
    
    for (const lesson of selLessons) {
      await db.execute(sql`
        INSERT INTO sel_lessons (id, title, description, grade_level, is_active, created_at) 
        VALUES (${lesson.id}, ${lesson.title}, ${lesson.description}, ${lesson.grade_level}, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    console.log(`   ✅ Added ${selLessons.length} SEL lessons`);
    
    // Step 5: Add Sample Point Entries (to show activity)
    console.log("📊 POPULATION: Adding sample point entries...");
    
    // Add some point entries for existing students
    const studentIds = ['hulk-student-001', 'tiffany-student-002', 'michael-student-003'];
    const teacherIds = ['david-teacher-001', 'sarah-teacher-002', 'jennifer-teacher-003'];
    
    for (let i = 0; i < 15; i++) {
      const studentId = studentIds[i % studentIds.length];
      const teacherId = teacherIds[i % teacherIds.length];
      const categories = ['academic', 'attendance', 'behavior', 'bhsa_mustang_traits'];
      const category = categories[i % categories.length];
      const points = Math.floor(Math.random() * 10) + 1; // 1-10 points
      const reasons = [
        'Excellent participation in class',
        'Helped a classmate with homework', 
        'Perfect attendance this week',
        'Outstanding project presentation',
        'Showed great leadership',
        'Demonstrated kindness to others'
      ];
      const reason = reasons[i % reasons.length];
      
      await db.execute(sql`
        INSERT INTO point_entries (id, scholar_id, teacher_id, points, category, reason, timestamp) 
        VALUES (gen_random_uuid(), ${studentId}, ${teacherId}, ${points}, ${category}, ${reason}, NOW() - INTERVAL '${i} days')
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    console.log("   ✅ Added sample point entries");
    
    // Step 6: Add Sample Parent-Teacher Messages
    console.log("💬 POPULATION: Adding sample parent-teacher messages...");
    
    const parentIds = ['tiffany-parent-001', 'hulk-parent-002', 'demo-parent-003'];
    
    for (let i = 0; i < 6; i++) {
      const parentId = parentIds[i % parentIds.length];
      const teacherId = teacherIds[i % teacherIds.length];
      const scholarId = studentIds[i % studentIds.length];
      const senderType = i % 2 === 0 ? 'teacher' : 'parent';
      const subjects = [
        'Great progress this week!',
        'Question about homework',
        'Thank you for the update',
        'Scheduling parent conference',
        'Student achievement celebration',
        'Behavioral improvement plan'
      ];
      const messages = [
        'Your child has shown excellent improvement in math this week. Keep up the great work!',
        'Could you please clarify the expectations for the science project due next week?',
        'Thank you for keeping me informed about the situation. We will continue to monitor progress.',
        'I would like to schedule a brief conference to discuss your child\'s academic progress.',
        'I wanted to share some wonderful news about your child\'s recent achievements in class!',
        'Let\'s work together to create a positive behavior plan that supports your child\'s success.'
      ];
      
      await db.execute(sql`
        INSERT INTO parent_teacher_messages (id, parent_id, teacher_id, scholar_id, sender_type, subject, message, is_read, sent_at) 
        VALUES (gen_random_uuid(), ${parentId}, ${teacherId}, ${scholarId}, ${senderType}, ${subjects[i]}, ${messages[i]}, ${Math.random() > 0.5}, NOW() - INTERVAL '${i} days')
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    console.log("   ✅ Added sample parent-teacher messages");
    
    // Step 7: Add Sample Reflections
    console.log("🤔 POPULATION: Adding sample reflections...");
    
    for (let i = 0; i < 4; i++) {
      const studentId = studentIds[i % studentIds.length];
      const teacherId = teacherIds[i % teacherIds.length];
      const parentId = parentIds[i % parentIds.length];
      const incidents = [
        'Student was disruptive during math class',
        'Student forgot homework three times this week',
        'Student had difficulty working in group project',
        'Student was not following classroom rules'
      ];
      const responses = [
        'I understand that my behavior was inappropriate and I will focus better next time.',
        'I need to use my planner better to remember all my assignments.',
        'I will practice better communication and listening skills with my teammates.',
        'I will follow all classroom rules and ask for help when I need it.'
      ];
      const statuses = ['pending', 'approved', 'needs_revision'];
      
      await db.execute(sql`
        INSERT INTO reflections (id, scholar_id, teacher_id, parent_id, incident_description, scholar_response, status, created_at) 
        VALUES (gen_random_uuid(), ${studentId}, ${teacherId}, ${parentId}, ${incidents[i]}, ${responses[i]}, ${statuses[i % statuses.length]}, NOW() - INTERVAL '${i} days')
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    console.log("   ✅ Added sample reflections");
    
    // Step 8: Final verification
    console.log("✅ POPULATION: Verifying comprehensive system population...");
    
    const studentCount = await db.execute(sql`SELECT COUNT(*) as count FROM scholars`);
    const gameCount = await db.execute(sql`SELECT COUNT(*) as count FROM games`);
    const badgeCount = await db.execute(sql`SELECT COUNT(*) as count FROM badges`);
    const selCount = await db.execute(sql`SELECT COUNT(*) as count FROM sel_lessons`);
    const messageCount = await db.execute(sql`SELECT COUNT(*) as count FROM parent_teacher_messages`);
    const reflectionCount = await db.execute(sql`SELECT COUNT(*) as count FROM reflections`);
    
    const totalStudents = studentCount.rows[0].count;
    const totalGames = gameCount.rows[0].count;
    const totalBadges = badgeCount.rows[0].count;
    const totalSEL = selCount.rows[0].count;
    const totalMessages = messageCount.rows[0].count;
    const totalReflections = reflectionCount.rows[0].count;
    
    console.log(`   📊 FINAL COUNTS:`);
    console.log(`   👥 Students: ${totalStudents}`);
    console.log(`   🎮 Games: ${totalGames}`);
    console.log(`   🏆 Badges: ${totalBadges}`);
    console.log(`   🧠 SEL Lessons: ${totalSEL}`);
    console.log(`   💬 Messages: ${totalMessages}`);
    console.log(`   🤔 Reflections: ${totalReflections}`);
    
    console.log("🎉 COMPREHENSIVE SYSTEM POPULATION: Complete!");
    
    return {
      success: true,
      message: "Comprehensive system population completed successfully",
      data: {
        totalStudents,
        totalGames,
        totalBadges,
        totalSEL,
        totalMessages,
        totalReflections
      },
      isFullyPopulated: totalStudents >= 25 && totalGames >= 5 && totalBadges >= 5
    };
    
  } catch (error) {
    console.error("🚀 COMPREHENSIVE SYSTEM POPULATION ERROR:", error);
    throw error;
  }
}