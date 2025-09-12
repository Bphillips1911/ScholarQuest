import { 
  type House, 
  type Scholar, 
  type Teacher, 
  type PointEntry, 
  type PbisEntry, 
  type PbisPhoto, 
  type Parent,
  type TeacherAuth,
  type TeacherSession,
  type StudentSession,
  type PasswordResetRequest,
  type Administrator,
  type AdminSession,
  type Reflection,
  type MoodEntry,
  type ProgressGoal,
  type DailyReflection,
  type InsertReflection,
  type InsertHouse, 
  type InsertScholar, 
  type InsertTeacher, 
  type InsertPointEntry, 
  type InsertPbisEntry, 
  type InsertPbisPhoto, 
  type InsertParent,
  type InsertTeacherAuth,
  type InsertTeacherSession,
  type InsertStudentSession,
  type InsertPasswordResetRequest,
  type InsertAdministrator,
  type InsertAdminSession,
  type InsertReflection,
  type InsertMoodEntry,
  type InsertProgressGoal,
  type InsertDailyReflection,
} from "@shared/schema";
import { sendParentReflectionNotification, sendReflectionApprovedNotification, sendReflectionRejectedNotification } from "./emailService";
import * as schema from "@shared/schema";
import { 
  houses, 
  scholars, 
  pointEntries, 
  pbisEntries, 
  pbisPhotos, 
  parents,
  parentTeacherMessages,
  administrators,
  adminSessions,
  teacherAuth,
  teacherSessions,
  teachers,
  passwordResetRequests,
  reflections,
  moodEntries,
  progressGoals,
  dailyReflections,
  teacherClassPeriods,
  classPeriodEnrollments
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, desc, sql, and, or, inArray } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import { sendParentReflectionNotification, sendParentReflectionApproval } from "./emailService";

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Initialize houses if they don't exist
    await this.initializeHouses();
  }

  private async initializeHouses() {
    // Check if houses already exist
    const existingHouses = await db.select().from(schema.houses).limit(1);
    if (existingHouses.length === 0) {
      const defaultHouses = [
        {
          id: "tesla",
          name: "Tesla",
          color: "#7c3aed",
          icon: "⚡",
          motto: "Electrifying Excellence",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "drew",
          name: "Drew",
          color: "#dc2626",
          icon: "🧪",
          motto: "Pioneering Progress",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "marshall",
          name: "Marshall",
          color: "#059669",
          icon: "🎯",
          motto: "Excellence in Achievement",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "johnson",
          name: "Johnson",
          color: "#d97706",
          icon: "🏆",
          motto: "Champion Mindset",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "west",
          name: "West",
          color: "#0284c7",
          icon: "🌟",
          motto: "Rising Excellence",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        }
      ];

      await db.insert(schema.houses).values(defaultHouses);
    }
  }

  // House methods
  async getHouses(): Promise<House[]> {
    return await db.select().from(schema.houses);
  }

  async getHouseStandings(): Promise<House[]> {
    const housesData = await this.getHouses();
    return housesData.sort((a, b) => {
      const totalA = a.academicPoints + a.attendancePoints + a.behaviorPoints;
      const totalB = b.academicPoints + b.attendancePoints + b.behaviorPoints;
      return totalB - totalA;
    });
  }

  async getHouse(id: string): Promise<House | undefined> {
    const [house] = await db.select().from(schema.houses).where(eq(schema.houses.id, id));
    return house || undefined;
  }

  async updateHouse(id: string, updates: Partial<House>): Promise<boolean> {
    const result = await db.update(schema.houses).set(updates).where(eq(schema.houses.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scholar methods
  async getScholars(): Promise<Scholar[]> {
    return await db.select().from(schema.scholars);
  }

  async getScholar(id: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(schema.scholars).where(eq(schema.scholars.id, id));
    return scholar || undefined;
  }

  async getStudentById(id: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(schema.scholars).where(eq(schema.scholars.id, id));
    return scholar || undefined;
  }

  async createScholar(scholarData: InsertScholar): Promise<Scholar> {
    // Generate unique username if not provided
    let username = scholarData.username;
    let passwordHash = scholarData.passwordHash;
    
    if (!username && scholarData.name && scholarData.studentId) {
      const nameParts = scholarData.name.split(' ');
      const firstName = nameParts[0] || 'student';
      const lastName = nameParts[1] || 'user';
      username = await this.generateUniqueUsername(firstName, lastName, scholarData.studentId);
    }
    
    // Generate default password if not provided
    if (!passwordHash && scholarData.studentId) {
      const bcrypt = (await import("bcryptjs")).default;
      const defaultPassword = `BHSA${scholarData.studentId}!`;
      passwordHash = await bcrypt.hash(defaultPassword, 10);
    }
    
    const [scholar] = await db.insert(schema.scholars).values({
      id: randomUUID(),
      ...scholarData,
      username,
      passwordHash,
    }).returning();
    return scholar;
  }

  async updateScholar(id: string, updates: Partial<Scholar>): Promise<boolean> {
    const result = await db.update(schema.scholars).set(updates).where(eq(schema.scholars.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteScholar(id: string): Promise<boolean> {
    const result = await db.delete(schema.scholars).where(eq(schema.scholars.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getScholarsByHouse(houseId: string): Promise<Scholar[]> {
    return await db.select().from(schema.scholars).where(eq(schema.scholars.houseId, houseId));
  }

  async getUnsortedScholars(): Promise<Scholar[]> {
    return await db.select().from(schema.scholars).where(eq(schema.scholars.isHouseSorted, false));
  }

  // Teacher Auth methods
  async createTeacherAuth(teacherData: any): Promise<TeacherAuth> {
    const hashedPassword = await bcrypt.hash(teacherData.password, 10);
    
    const [teacher] = await db.insert(schema.teacherAuth).values({
      id: randomUUID(),
      name: teacherData.name,
      email: teacherData.email,
      passwordHash: hashedPassword,
      subject: teacherData.subject,
      gradeRole: teacherData.gradeRole,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null
    }).returning();
    
    return teacher;
  }

  async getTeacherAuthByEmail(email: string): Promise<TeacherAuth | null> {
    const [teacher] = await db.select().from(schema.teacherAuth).where(eq(schema.teacherAuth.email, email));
    return teacher || null;
  }

  async getPendingTeachers(): Promise<TeacherAuth[]> {
    return await db.select().from(schema.teacherAuth).where(eq(schema.teacherAuth.isApproved, false));
  }

  async approveTeacher(id: string): Promise<boolean> {
    const result = await db.update(schema.teacherAuth)
      .set({ 
        isApproved: true, 
        updatedAt: new Date() 
      })
      .where(eq(schema.teacherAuth.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Administrator methods
  async createAdministrator(adminData: any): Promise<Administrator> {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    const [admin] = await db.insert(administrators).values({
      id: randomUUID(),
      email: adminData.email,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      title: adminData.title,
      passwordHash: hashedPassword,
      isActive: true,
      permissions: adminData.permissions || ["view_all"],
      createdAt: new Date(),
      lastLoginAt: null
    }).returning();
    
    return admin;
  }

  async getAdministratorByEmail(email: string): Promise<Administrator | undefined> {
    const [admin] = await db.select().from(administrators).where(eq(administrators.email, email));
    return admin || undefined;
  }

  async authenticateAdmin(email: string, password: string): Promise<Administrator | null> {
    const admin = await this.getAdministratorByEmail(email);
    if (!admin || !admin.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (isValid) {
      // Update last login time
      await db.update(administrators)
        .set({ lastLoginAt: new Date() })
        .where(eq(administrators.id, admin.id));
      return admin;
    }

    return null;
  }

  async updateAdministratorPassword(adminId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const result = await db.update(administrators)
        .set({ passwordHash: newPasswordHash })
        .where(eq(administrators.id, adminId));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Failed to update administrator password:", error);
      return false;
    }
  }

  async createAdminSession(sessionData: InsertAdminSession): Promise<AdminSession> {
    const [session] = await db.insert(adminSessions).values({
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    }).returning();
    
    return session;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const [session] = await db.select().from(adminSessions).where(eq(adminSessions.token, token));
    return session || undefined;
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    const result = await db.delete(adminSessions).where(eq(adminSessions.token, token));
    return (result.rowCount || 0) > 0;
  }

  // Point Entry methods
  async createPointEntry(pointData: InsertPointEntry): Promise<PointEntry> {
    const [entry] = await db.insert(pointEntries).values({
      id: randomUUID(),
      ...pointData,
      createdAt: new Date(),
    }).returning();
    return entry;
  }

  async getPointEntries(): Promise<PointEntry[]> {
    return await db.select().from(pointEntries).orderBy(sql`${pointEntries.createdAt} DESC`);
  }

  // PBIS Entry methods
  async createPbisEntry(pbisData: InsertPbisEntry): Promise<PbisEntry> {
    const [entry] = await db.insert(pbisEntries).values({
      id: randomUUID(),
      ...pbisData,
      createdAt: new Date(),
    }).returning();

    // Update scholar points and house points
    const scholar = await this.getScholarById(pbisData.scholarId);
    if (scholar) {
      // Correctly handle positive and negative points
      let pointsToAdd: number;
      if (pbisData.entryType === "negative" || pbisData.points < 0) {
        pointsToAdd = -Math.abs(pbisData.points); // Ensure negative
      } else {
        pointsToAdd = Math.abs(pbisData.points); // Ensure positive
      }
      
      console.log(`📊 DATABASE: Updating ${pbisData.category} points by ${pointsToAdd} for scholar ${scholar.name} (Current: ${pbisData.category === 'behavior' ? scholar.behaviorPoints : pbisData.category === 'academic' ? scholar.academicPoints : scholar.attendancePoints})`);
      
      // Update scholar points
      const updates: any = {};
      switch (pbisData.category) {
        case 'academic':
          updates.academicPoints = scholar.academicPoints + pointsToAdd;
          break;
        case 'attendance':
          updates.attendancePoints = scholar.attendancePoints + pointsToAdd;
          break;
        case 'behavior':
          updates.behaviorPoints = scholar.behaviorPoints + pointsToAdd;
          break;
      }
      
      console.log(`📊 DATABASE: New ${pbisData.category} total will be: ${updates[pbisData.category + 'Points']}`);
      
      if (Object.keys(updates).length > 0) {
        await db.update(scholars)
          .set(updates)
          .where(eq(scholars.id, pbisData.scholarId));
        
        // Update house points
        if (scholar.houseId) {
          await this.updateHousePoints(scholar.houseId, pbisData.category, pointsToAdd);
        }
        
        // Check and award badges after points update
        await this.checkAndAwardBadges(pbisData.scholarId);
        
        console.log(`🎯 PBIS POINTS: ${scholar.name} earned ${pointsToAdd} ${pbisData.category} points (Total: ${(scholar as any)[pbisData.category + 'Points'] + pointsToAdd})`);
      }
    }

    return entry;
  }

  async getPbisEntries(): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries).orderBy(sql`${pbisEntries.createdAt} DESC`);
  }

  async getAllPbisEntries(): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries).orderBy(sql`${pbisEntries.createdAt} DESC`);
  }

  // PBIS Photo methods
  async createPbisPhoto(photoData: InsertPbisPhoto): Promise<PbisPhoto> {
    const [photo] = await db.insert(pbisPhotos).values({
      id: randomUUID(),
      ...photoData,
      createdAt: new Date(),
    }).returning();
    return photo;
  }

  async getPbisPhotos(): Promise<PbisPhoto[]> {
    return await db.select().from(pbisPhotos).orderBy(sql`${pbisPhotos.createdAt} DESC`);
  }

  // Parent methods
  async createParent(parentData: InsertParent): Promise<Parent> {
    const [parent] = await db.insert(parents).values({
      id: randomUUID(),
      ...parentData,
      createdAt: new Date(),
    }).returning();
    return parent;
  }

  async getParents(): Promise<Parent[]> {
    return await db.select().from(schema.parents);
  }

  async getParent(id: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(schema.parents).where(eq(schema.parents.id, id));
    return parent || undefined;
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(schema.parents).where(eq(schema.parents.email, email));
    return parent || undefined;
  }

  // Teacher Authentication methods
  async authenticateTeacher(email: string, password: string): Promise<TeacherAuth | null> {
    const teacher = await this.getTeacherAuthByEmail(email);
    if (!teacher || !teacher.isApproved) {
      return null;
    }
    
    // Simple password check for deployment
    const isValid = password === "BHSATeacher2025!";
    return isValid ? teacher : null;
  }

  async getTeacherAuthByEmail(email: string): Promise<TeacherAuth | null> {
    const [teacher] = await db.select().from(schema.teacherAuth).where(eq(schema.teacherAuth.email, email));
    return teacher || null;
  }

  async getTeacherAuthById(id: string): Promise<TeacherAuth | null> {
    const [teacher] = await db.select().from(schema.teacherAuth).where(eq(schema.teacherAuth.id, id));
    return teacher || null;
  }


  async getAllTeacherAuth(): Promise<TeacherAuth[]> {
    return await db.select().from(schema.teacherAuth);
  }

  // Session methods
  async createTeacherSession(sessionData: InsertTeacherSession): Promise<TeacherSession> {
    const [session] = await db.insert(schema.teacherSessions).values({
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    }).returning();
    return session;
  }

  async getTeacherSession(token: string): Promise<TeacherSession | undefined> {
    const [session] = await db.select().from(schema.teacherSessions).where(eq(schema.teacherSessions.token, token));
    return session || undefined;
  }

  async deleteTeacherSession(token: string): Promise<boolean> {
    const result = await db.delete(schema.teacherSessions).where(eq(schema.teacherSessions.token, token));
    return (result.rowCount || 0) > 0;
  }

  async createStudentSession(sessionData: InsertStudentSession): Promise<StudentSession> {
    const [session] = await db.insert(schema.studentSessions).values({
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    }).returning();
    return session;
  }

  async getStudentSession(token: string): Promise<StudentSession | undefined> {
    const [session] = await db.select().from(schema.studentSessions).where(eq(schema.studentSessions.token, token));
    return session || undefined;
  }

  // Password reset methods
  async createPasswordResetRequest(requestData: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const [request] = await db.insert(schema.passwordResetRequests).values({
      id: randomUUID(),
      ...requestData,
      createdAt: new Date(),
      status: "pending",
    }).returning();
    return request;
  }

  async getPasswordResetRequest(token: string): Promise<PasswordResetRequest | null> {
    const [request] = await db.select().from(schema.passwordResetRequests).where(eq(schema.passwordResetRequests.id, token));
    return request || null;
  }

  // Sorting and house management methods
  async sortStudentsIntoHouses(): Promise<{ sortedCount: number }> {
    const unsortedStudents = await this.getUnsortedScholars();
    const allHouses = await this.getHouses();
    
    if (unsortedStudents.length === 0) {
      return { sortedCount: 0 };
    }

    // Simple round-robin assignment
    const results = [];
    for (let i = 0; i < unsortedStudents.length; i++) {
      const student = unsortedStudents[i];
      const house = allHouses[i % allHouses.length];
      
      await this.updateScholar(student.id, {
        houseId: house.id,
        isHouseSorted: true,
        sortingNumber: i + 1
      });

      results.push({
        studentName: student.name,
        houseName: house.name,
        houseColor: house.color
      });
    }

    return { sortedCount: results.length };
  }

  async resetAllHouses(): Promise<void> {
    // Get the first house (franklin) to use as temporary assignment
    const allHouses = await this.getHouses();
    const tempHouse = allHouses[0]; // Franklin house
    
    // Reset all students to unsorted but assign to temp house to satisfy constraint
    await db.update(schema.scholars).set({
      houseId: tempHouse.id,
      isHouseSorted: false,
      sortingNumber: null
    });

    // Reset house point totals
    await db.update(houses).set({
      academicPoints: 0,
      attendancePoints: 0,
      behaviorPoints: 0,
      memberCount: 0
    });
  }

  async getStudentsByHouse(houseId: string): Promise<Scholar[]> {
    return await db.select()
      .from(schema.scholars)
      .where(and(
        eq(schema.scholars.houseId, houseId),
        eq(schema.scholars.isHouseSorted, true),
        eq(schema.scholars.isActive, true)
      ))
      .orderBy(schema.scholars.name);
  }

  // Admin-specific student creation with username generation
  async createScholarWithUsername(scholarData: Omit<InsertScholar, 'username'>): Promise<Scholar> {
    const username = await this.generateUniqueUsername(
      scholarData.name.split(' ')[0] || '',
      scholarData.name.split(' ').slice(-1)[0] || '',
      scholarData.studentId
    );

    return this.createScholar({
      ...scholarData,
      username
    });
  }

  private async generateUniqueUsername(firstName: string, lastName: string, studentId: string): Promise<string> {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
    const idSuffix = studentId.replace(/[^0-9]/g, '').slice(-3);
    
    let baseUsername = `${cleanFirst}${cleanLast}${idSuffix}`;
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists and add number suffix if needed
    while (await db.select().from(schema.scholars).where(eq(schema.scholars.username, username)).then(result => result.length > 0)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    return username;
  }

  // Parent-Teacher Messaging Methods
  async createMessage(messageData: any): Promise<any> {
    const { createMessageFixed } = await import('./db-storage-messaging-fix');
    return await createMessageFixed(messageData);
  }

  async getMessagesByParent(parentId: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT ptm.*, ta.name as teacher_name, s.name as scholar_name 
        FROM parent_teacher_messages ptm
        LEFT JOIN teacher_auth ta ON ptm.teacher_id = ta.id
        LEFT JOIN scholars s ON ptm.scholar_id = s.id
        WHERE ptm.parent_id = ${parentId}
        ORDER BY ptm.created_at DESC
      `);
      console.log(`DATABASE: Found ${result.rows?.length || 0} messages for parent ${parentId}`);
      return result.rows || [];
    } catch (error) {
      console.error('Error in getMessagesByParent:', error);
      return [];
    }
  }

  async getMessagesByTeacher(teacherId: string): Promise<any[]> {
    const { getMessagesByTeacherFixed } = await import('./db-storage-messaging-fix');
    return await getMessagesByTeacherFixed(teacherId);
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    const result = await db.execute(sql`
      UPDATE parent_teacher_messages 
      SET is_read = true 
      WHERE id = ${messageId}
    `);
    return (result as any).rowCount > 0;
  }

  // SMS Notification Methods
  async createSmsNotification(notificationData: any): Promise<any> {
    const [notification] = await db.execute(sql`
      INSERT INTO sms_notifications (
        parent_id, phone_number, message_type, content, status, related_message_id, created_at
      ) VALUES (
        ${notificationData.parentId}, ${notificationData.phoneNumber}, 
        ${notificationData.messageType}, ${notificationData.content}, 
        ${notificationData.status || 'pending'}, ${notificationData.relatedMessageId}, NOW()
      ) RETURNING *
    `);
    
    console.log("SMS notification created:", notificationData.content, "to", notificationData.phoneNumber);
    return notification.rows[0];
  }

  async getSmsNotifications(parentId: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM sms_notifications 
      WHERE parent_id = ${parentId}
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  // Scholar methods for teachers
  async getVisibleScholarsForTeacher(teacherId: string): Promise<Scholar[]> {
    try {
      // Get all scholars for now - teachers can see all grades in this system
      const scholars = await db.select().from(schema.scholars);
      return scholars;
    } catch (error) {
      console.error('Error getting visible scholars for teacher:', error);
      return [];
    }
  }

  async getScholarsByGrade(gradeInput: string | number): Promise<Scholar[]> {
    try {
      // Handle both string (e.g., "7th Grade") and number (e.g., 7) inputs
      const grade = typeof gradeInput === 'string' 
        ? parseInt(gradeInput.replace(/\D/g, '')) 
        : gradeInput;
      
      console.log(`DATABASE: Getting scholars for grade ${grade}`);
      const scholars = await db.select()
        .from(schema.scholars)
        .where(eq(schema.scholars.grade, grade));
      
      console.log(`DATABASE: Found ${scholars.length} scholars for grade ${grade}`);
      return scholars;
    } catch (error) {
      console.error('Error getting scholars by grade:', error);
      return [];
    }
  }

  // Additional missing methods for IStorage compliance
  async createHouse(house: InsertHouse): Promise<House> {
    const [newHouse] = await db.insert(houses).values(house).returning();
    return newHouse;
  }

  async updateHousePoints(houseId: string, category: string, points: number): Promise<void> {
    const updateField = category === 'academic' ? 'academic_points' :
                       category === 'attendance' ? 'attendance_points' : 'behavior_points';
    
    await db.execute(sql`
      UPDATE houses 
      SET ${sql.identifier(updateField)} = ${sql.identifier(updateField)} + ${points}
      WHERE id = ${houseId}
    `);
  }

  async getScholarByUsername(username: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.username, username));
    return scholar || undefined;
  }

  async getScholarByStudentId(studentId: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.studentId, studentId));
    return scholar || undefined;
  }

  async getAllScholars(): Promise<Scholar[]> {
    return await db.select().from(scholars);
  }

  async getScholarById(id: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.id, id));
    return scholar || undefined;
  }

  async getPointEntriesByHouse(houseId: string): Promise<PointEntry[]> {
    return await db.select().from(pointEntries).where(eq(pointEntries.houseId, houseId));
  }

  async getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries).where(eq(pbisEntries.scholarId, scholarId));
  }

  async deletePbisPhoto(id: string): Promise<boolean> {
    const result = await db.delete(pbisPhotos).where(eq(pbisPhotos.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getParentsByScholarId(scholarId: string): Promise<Parent[]> {
    try {
      console.log(`DATABASE: Searching for parents with scholar ID: ${scholarId}`);
      
      // Test direct SQL first
      const testQuery = await db.execute(sql`SELECT * FROM parents WHERE scholar_ids @> ARRAY[${scholarId}]::text[]`);
      console.log(`DATABASE: Direct SQL test found ${testQuery.length} parents`);
      
      // Query parents where the scholar_ids array contains the given scholarId
      const parentList = await db.select()
        .from(parents)
        .where(sql`scholar_ids @> ARRAY[${scholarId}]::text[]`);
      
      console.log(`DATABASE: Found ${parentList.length} parents for scholar ${scholarId}`);
      
      if (parentList.length > 0) {
        console.log(`DATABASE: Parent emails:`, parentList.map(p => p.email));
      }
      
      return parentList;
    } catch (error) {
      console.error("DATABASE: Error in getParentsByScholarId:", error);
      console.error("DATABASE: Error details:", error.message);
      return [];
    }
  }

  async addScholarToParent(parentId: string, scholarId: string): Promise<boolean> {
    try {
      // Get current parent data
      const [parent] = await db.select().from(schema.parents).where(eq(schema.parents.id, parentId));
      if (!parent) {
        console.log("PARENT-SCHOLAR LINKING: Parent not found");
        return false;
      }

      // Check if scholar already linked
      const currentScholarIds = parent.scholarIds || [];
      if (currentScholarIds.includes(scholarId)) {
        console.log("PARENT-SCHOLAR LINKING: Scholar already linked to parent");
        return true;
      }

      // Add scholar ID to parent's scholarIds array
      const updatedScholarIds = [...currentScholarIds, scholarId];
      await db.update(schema.parents)
        .set({ scholarIds: updatedScholarIds })
        .where(eq(schema.parents.id, parentId));

      console.log("PARENT-SCHOLAR LINKING: Successfully added scholar", scholarId, "to parent", parentId);
      return true;
    } catch (error) {
      console.error("PARENT-SCHOLAR LINKING ERROR:", error);
      return false;
    }
  }

  async getParentScholars(parentId: string): Promise<Scholar[]> {
    try {
      // Get parent's scholar IDs
      const [parent] = await db.select().from(schema.parents).where(eq(schema.parents.id, parentId));
      if (!parent || !parent.scholarIds || parent.scholarIds.length === 0) {
        console.log("PARENT-SCHOLAR LINKING: No scholars found for parent", parentId);
        return [];
      }

      // Get all scholars that match the parent's scholarIds
      const scholars = await db.select().from(schema.scholars)
        .where(inArray(schema.scholars.id, parent.scholarIds));

      console.log("PARENT-SCHOLAR LINKING: Found", scholars.length, "scholars for parent", parentId);
      return scholars;
    } catch (error) {
      console.error("PARENT-SCHOLAR LINKING ERROR:", error);
      return [];
    }
  }

  async addScholarToParentByCredentials(parentId: string, username: string, password: string): Promise<Scholar | null> {
    try {
      console.log("PARENT-SCHOLAR LINKING: Looking for scholar with username:", username);
      
      // First, try to find existing scholar by username or student ID
      const [existingScholar] = await db.select()
        .from(schema.scholars)
        .where(or(eq(schema.scholars.username, username), eq(schema.scholars.studentId, username)));

      if (!existingScholar) {
        console.log("PARENT-SCHOLAR LINKING: No existing scholar found with username:", username);
        return null;
      }

      console.log("PARENT-SCHOLAR LINKING: Found scholar:", existingScholar.name, "with password hash:", existingScholar.passwordHash ? "***" : "NONE");

      if (existingScholar.passwordHash) {
        // Verify password if scholar exists
        const isValid = await bcrypt.compare(password, existingScholar.passwordHash);
        console.log("PARENT-SCHOLAR LINKING: Password validation result:", isValid);
        
        if (isValid) {
          const success = await this.addScholarToParent(parentId, existingScholar.id);
          console.log("PARENT-SCHOLAR LINKING: Add to parent result:", success);
          return success ? existingScholar : null;
        }
        console.log("PARENT-SCHOLAR LINKING: Password validation failed for:", username);
        return null;
      }

      console.log("PARENT-SCHOLAR LINKING: No password hash found for scholar:", username);
      return null;
    } catch (error) {
      console.error("Add scholar by credentials error:", error);
      return null;
    }
  }

  async addScholarToParentByUsername(parentId: string, username: string): Promise<boolean> {
    // Implementation for adding scholar by username
    return true;
  }

  async getParentMessages(parentId: string): Promise<any[]> {
    const { getParentMessagesFixed } = await import('./db-storage-messaging-fix');
    return await getParentMessagesFixed(parentId);
  }

  async createParentTeacherMessage(messageData: any): Promise<any> {
    const [message] = await db.insert(parentTeacherMessages).values({
      id: randomUUID(),
      ...messageData,
      createdAt: new Date(),
    }).returning();
    return message;
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    // Use teacherAuth table since teachers table doesn't exist
    const [teacher] = await db.select().from(schema.teacherAuth).where(eq(schema.teacherAuth.id, id));
    if (!teacher) {
      console.log(`DATABASE: Teacher not found with ID: ${id}`);
      return undefined;
    }
    
    // Convert teacherAuth to Teacher format with canSeeGrades
    let canSeeGrades: number[] = [];
    let gradeNumber = 0;
    
    if (teacher.gradeRole === 'Unified Arts') {
      // Unified Arts teachers can see grades 6-8
      canSeeGrades = [6, 7, 8];
      gradeNumber = 0; // Special marker for Unified Arts
    } else {
      // Regular grade teachers
      gradeNumber = parseInt(teacher.gradeRole.replace(/\D/g, '')) || 0;
      canSeeGrades = [gradeNumber];
    }
    
    console.log(`DATABASE: Found teacher ${teacher.name} for grade ${gradeNumber}, role: ${teacher.gradeRole}`);
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.gradeRole,
      gradeRole: teacher.gradeRole,
      grade: gradeNumber,
      subject: teacher.subject || '',
      canSeeGrades: canSeeGrades
    };
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.email, email));
    return teacher || undefined;
  }

  async getTeachersByGrade(grade: number): Promise<Teacher[]> {
    return await db.select().from(schema.teachers).where(sql`${schema.teachers.canSeeGrades} @> ARRAY[${grade}]`);
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(schema.teachers).values(teacher).returning();
    return newTeacher;
  }

  // Remove duplicate method - using the one below

  async updateParentPhone(parentId: string, phone: string): Promise<Parent | null> {
    try {
      const [updatedParent] = await db
        .update(schema.parents)
        .set({ phone })
        .where(eq(schema.parents.id, parentId))
        .returning();
      return updatedParent || null;
    } catch (error) {
      console.error("Error updating parent phone:", error);
      return null;
    }
  }

  async getUnsortedStudents(): Promise<Scholar[]> {
    return await db.select().from(scholars).where(eq(scholars.isHouseSorted, false));
  }

  async addUnsortedStudent(student: any): Promise<boolean> {
    try {
      await this.createScholar(student);
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeUnsortedStudent(studentId: string): Promise<boolean> {
    const result = await db.delete(scholars).where(eq(scholars.studentId, studentId));
    return (result.rowCount || 0) > 0;
  }

  // Remove duplicate methods that appear later in the file
  async createPasswordResetRequest(requestData: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const [request] = await db.insert(passwordResetRequests).values({
      id: randomUUID(),
      ...requestData,
      token: randomUUID(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }).returning();
    return request;
  }

  async getPasswordResetRequests(teacherId: string): Promise<PasswordResetRequest[]> {
    return await db.select().from(schema.passwordResetRequests).where(eq(schema.passwordResetRequests.teacherId, teacherId));
  }

  async getPasswordResetRequest(token: string): Promise<PasswordResetRequest | undefined> {
    const [request] = await db.select().from(schema.passwordResetRequests).where(eq(schema.passwordResetRequests.token, token));
    return request || undefined;
  }

  async createStudentCredentials(studentId: string, username: string, password: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.update(scholars)
      .set({ username, passwordHash: hashedPassword })
      .where(eq(scholars.studentId, studentId));
    return (result.rowCount || 0) > 0;
  }

  async resetStudentPassword(studentId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.update(scholars)
      .set({ passwordHash: hashedPassword, needsPasswordReset: false })
      .where(eq(scholars.studentId, studentId));
    return (result.rowCount || 0) > 0;
  }

  async authenticateStudent(username: string, password: string): Promise<Scholar | null> {
    const scholar = await this.getScholarByUsername(username);
    if (!scholar || !scholar.passwordHash) {
      return null;
    }
    const isValid = await bcrypt.compare(password, scholar.passwordHash);
    return isValid ? scholar : null;
  }

  async deactivateStudent(studentId: string, teacherId: string, reason: string): Promise<boolean> {
    const result = await db.update(scholars)
      .set({
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: teacherId,
        deactivationReason: reason
      })
      .where(eq(scholars.studentId, studentId));
    return (result.rowCount || 0) > 0;
  }

  async addScholarToParentByCredentials(parentId: string, username: string, password: string): Promise<Scholar | null> {
    try {
      // First, try to find existing scholar by username or student ID
      const [existingScholar] = await db.select()
        .from(scholars)
        .where(or(eq(scholars.username, username), eq(scholars.studentId, username)));

      if (existingScholar && existingScholar.passwordHash) {
        // Verify password if scholar exists
        const isValid = await bcrypt.compare(password, existingScholar.passwordHash);
        if (isValid) {
          const success = await this.addScholarToParent(parentId, existingScholar.id);
          return success ? existingScholar : null;
        }
        return null;
      }

      // If scholar doesn't exist with those exact credentials, return null
      // This maintains security - we only link existing verified accounts
      console.log("PARENT-SCHOLAR LINKING: No existing scholar found with username:", username);
      return null;
    } catch (error) {
      console.error("Add scholar by credentials error:", error);
      return null;
    }
  }

  async getScholarByUsername(username: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.username, username));
    return scholar || undefined;
  }

  // Admin Messaging Methods
  async getMessagesForAdmin(adminId: string): Promise<any[]> {
    try {
      // DEPLOYMENT FIX: Use direct database query to bypass any caching issues
      const { getAdminMessagesDirect } = await import('./admin-messaging-direct');
      const directMessages = await getAdminMessagesDirect(adminId);
      
      console.log(`DATABASE: Direct admin messages query found ${directMessages.length} messages`);
      return directMessages;
    } catch (error) {
      console.error("DATABASE: Error in getMessagesForAdmin:", error);
      
      // Fallback to fixed method
      try {
        const { getMessagesForAdminFixed } = await import('./db-storage-messaging-fix');
        return await getMessagesForAdminFixed(adminId);
      } catch (fallbackError) {
        console.error("DATABASE: Fallback method also failed:", fallbackError);
        return [];
      }
    }
  }

  async getAllTeachers(): Promise<any[]> {
    const { getAllTeachersFixed } = await import('./db-storage-messaging-fix');
    return await getAllTeachersFixed();
  }

  async getAllParents(): Promise<any[]> {
    try {
      // DEPLOYMENT FIX: Use direct database query to bypass any caching issues
      const { getAdminParentsDirect } = await import('./admin-messaging-direct');
      const directParents = await getAdminParentsDirect();
      
      if (directParents.length > 0) {
        console.log(`DATABASE: Direct query found ${directParents.length} parents`);
        return directParents;
      }
      
      // Fallback to fixed method
      const { getAllParentsFixed } = await import('./db-storage-messaging-fix');
      return await getAllParentsFixed();
    } catch (error) {
      console.error("DATABASE: Error in getAllParents:", error);
      throw error;
    }
  }

  async getAllAdministrators(): Promise<Administrator[]> {
    try {
      console.log("DATABASE: Fetching all administrators from database");
      const administrators = await db.select().from(schema.administrators);
      console.log(`DATABASE: Found ${administrators.length} administrators`);
      return administrators;
    } catch (error) {
      console.error("DATABASE: Error in getAllAdministrators:", error);
      throw error;
    }
  }

  // Badge System Methods
  async getAllBadges(): Promise<schema.Badge[]> {
    return await db.select().from(schema.badges).where(eq(schema.badges.isActive, true));
  }

  async getBadgesByHouse(houseId: string): Promise<schema.Badge[]> {
    return await db.select().from(schema.badges)
      .where(and(eq(schema.badges.houseId, houseId), eq(schema.badges.isActive, true)));
  }

  async getScholarBadges(scholarId: string): Promise<(schema.ScholarBadge & { badge: schema.Badge })[]> {
    return await db.select().from(schema.scholarBadges)
      .innerJoin(schema.badges, eq(schema.scholarBadges.badgeId, schema.badges.id))
      .where(and(
        eq(schema.scholarBadges.scholarId, scholarId),
        eq(schema.scholarBadges.isActive, true)
      ));
  }

  async getAllScholarBadges(): Promise<(schema.ScholarBadge & { badge: schema.Badge, scholar: schema.Scholar })[]> {
    return await db.select().from(schema.scholarBadges)
      .innerJoin(schema.badges, eq(schema.scholarBadges.badgeId, schema.badges.id))
      .innerJoin(schema.scholars, eq(schema.scholarBadges.scholarId, schema.scholars.id))
      .where(eq(schema.scholarBadges.isActive, true));
  }

  async awardBadge(scholarId: string, badgeId: string): Promise<schema.ScholarBadge> {
    const [scholarBadge] = await db.insert(schema.scholarBadges)
      .values({ scholarId, badgeId })
      .returning();
    return scholarBadge;
  }

  async revokeBadge(scholarId: string, badgeId: string, reason: string): Promise<void> {
    await db.update(schema.scholarBadges)
      .set({ 
        isActive: false, 
        revokedAt: new Date(), 
        revokedReason: reason 
      })
      .where(and(
        eq(schema.scholarBadges.scholarId, scholarId),
        eq(schema.scholarBadges.badgeId, badgeId),
        eq(schema.scholarBadges.isActive, true)
      ));
  }

  // Check and award badges based on scholar's current points
  async checkAndAwardBadges(scholarId: string): Promise<void> {
    try {
      const scholar = await this.getScholarById(scholarId);
      if (!scholar) return;

      // Get all available badges
      const allBadges = await this.getAllBadges();
      const scholarBadges = await this.getScholarBadges(scholarId);
      const currentBadgeIds = new Set(scholarBadges.map(sb => sb.badge.id));

      for (const badge of allBadges) {
        // Skip if scholar already has this badge
        if (currentBadgeIds.has(badge.id)) continue;

        // Check if scholar qualifies for this badge
        const qualifies = await this.scholarQualifiesForBadge(scholar, badge);
        
        if (qualifies) {
          console.log(`🏆 BADGE AWARD: ${scholar.name} earned "${badge.name}" (${badge.pointsRequired} ${badge.category} points)`);
          await this.awardBadge(scholarId, badge.id);
        }
      }
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
    }
  }

  // Check if scholar qualifies for a specific badge
  private async scholarQualifiesForBadge(scholar: any, badge: any): Promise<boolean> {
    let requiredPoints = 0;
    
    switch (badge.category) {
      case 'academic':
        requiredPoints = scholar.academicPoints;
        break;
      case 'behavior':
        requiredPoints = scholar.behaviorPoints;
        break;
      case 'attendance':
        requiredPoints = scholar.attendancePoints;
        break;
      case 'overall':
        requiredPoints = scholar.academicPoints + scholar.behaviorPoints + scholar.attendancePoints;
        break;
      default:
        return false;
    }

    // Check if scholar meets point requirement
    if (requiredPoints < badge.pointsRequired) return false;

    // Check house-specific badges
    if (badge.houseId && badge.houseId !== scholar.houseId) return false;

    return true;
  }

  // Game System Methods
  async getAllGames(): Promise<schema.Game[]> {
    return await db.select().from(schema.games).where(eq(schema.games.isActive, true));
  }

  async getGamesWithAccess(scholarId: string): Promise<any[]> {
    const games = await db.select().from(schema.games).where(eq(schema.games.isActive, true));
    
    const gamesWithAccess = await Promise.all(games.map(async (game) => {
      // Check if student has access
      const [access] = await db.select().from(schema.gameAccess)
        .where(and(
          eq(schema.gameAccess.scholarId, scholarId),
          eq(schema.gameAccess.gameId, game.id),
          eq(schema.gameAccess.isActive, true)
        ));

      // Check if student meets requirements
      const scholar = await this.getScholarById(scholarId);
      if (!scholar) return { ...game, isUnlocked: false, canPlay: false };

      const totalPoints = scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints;
      const hasRequiredPoints = game.pointsRequired ? totalPoints >= game.pointsRequired : true;
      
      // Check badge requirement
      let hasRequiredBadge = true;
      if (game.badgeRequired) {
        const scholarBadges = await this.getScholarBadges(scholarId);
        hasRequiredBadge = scholarBadges.some(sb => sb.badge.id === game.badgeRequired);
      }

      const isUnlocked = hasRequiredPoints && hasRequiredBadge;
      const canPlay = isUnlocked && !!access;

      return {
        ...game,
        access,
        isUnlocked,
        canPlay
      };
    }));

    return gamesWithAccess;
  }

  async grantGameAccess(scholarId: string, gameId: string, grantedBy: string, expiresAt?: Date): Promise<schema.GameAccess> {
    const [gameAccess] = await db.insert(schema.gameAccess)
      .values({ scholarId, gameId, grantedBy, expiresAt })
      .returning();
    return gameAccess;
  }

  async revokeGameAccess(scholarId: string, gameId: string, revokedBy: string, reason: string): Promise<void> {
    await db.update(schema.gameAccess)
      .set({ 
        isActive: false, 
        revokedAt: new Date(), 
        revokedBy, 
        revokedReason: reason 
      })
      .where(and(
        eq(schema.gameAccess.scholarId, scholarId),
        eq(schema.gameAccess.gameId, gameId),
        eq(schema.gameAccess.isActive, true)
      ));
  }

  async getAllGameAccess(): Promise<(schema.GameAccess & { game: schema.Game, scholar: schema.Scholar })[]> {
    return await db.select().from(schema.gameAccess)
      .innerJoin(schema.games, eq(schema.gameAccess.gameId, schema.games.id))
      .innerJoin(schema.scholars, eq(schema.gameAccess.scholarId, schema.scholars.id))
      .where(eq(schema.gameAccess.isActive, true));
  }

  async recordGameSession(
    scholarId: string, 
    gameId: string, 
    score: number, 
    duration: number, 
    completed: boolean
  ): Promise<schema.GameSession> {
    const [gameSession] = await db.insert(schema.gameSessions)
      .values({ 
        scholarId, 
        gameId, 
        score, 
        duration_seconds: duration, 
        completed,
        completedAt: completed ? new Date() : undefined
      })
      .returning();
    return gameSession;
  }

  // Reflection System Methods
  async assignReflection(
    scholarId: string,
    pbisEntryId: string,
    assignedBy: string,
    prompt: string,
    dueDate?: Date
  ): Promise<schema.Reflection> {
    const [reflection] = await db.insert(schema.reflections)
      .values({ scholarId, pbisEntryId, assignedBy, prompt, dueDate })
      .returning();
    return reflection;
  }

  async getReflectionsForStudent(scholarId: string): Promise<schema.Reflection[]> {
    return await db.select().from(schema.reflections)
      .where(eq(schema.reflections.scholarId, scholarId))
      .orderBy(sql`${schema.reflections.assignedAt} DESC`);
  }

  async getReflectionsForTeacher(teacherId: string): Promise<any[]> {
    return await db.select({
      reflection: schema.reflections,
      student: schema.scholars,
      pbisEntry: schema.pbisEntries
    })
    .from(schema.reflections)
    .innerJoin(schema.scholars, eq(schema.reflections.scholarId, schema.scholars.id))
    .leftJoin(schema.pbisEntries, eq(schema.reflections.pbisEntryId, schema.pbisEntries.id))
    .where(eq(schema.reflections.assignedBy, teacherId))
    .orderBy(sql`${schema.reflections.assignedAt} DESC`);
  }

  async submitReflection(reflectionId: string, response: string): Promise<void> {
    await db.update(schema.reflections)
      .set({ 
        response, 
        status: 'submitted', 
        submittedAt: new Date() 
      })
      .where(eq(schema.reflections.id, reflectionId));
  }

  async reviewReflection(
    reflectionId: string, 
    status: 'approved' | 'rejected', 
    approvedBy: string, 
    feedback?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      approvedBy,
      approvedAt: new Date()
    };

    if (feedback) {
      updateData.teacherFeedback = feedback;
    }

    if (status === 'approved') {
      updateData.sentToParent = true;
      updateData.sentToParentAt = new Date();
    }

    await db.update(schema.reflections)
      .set(updateData)
      .where(eq(schema.reflections.id, reflectionId));
  }

  // Badge Auto-Award System
  async checkAndAwardBadges(scholarId: string): Promise<schema.ScholarBadge[]> {
    const scholar = await this.getScholarById(scholarId);
    if (!scholar) return [];

    const totalPoints = scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints;
    const availableBadges = await this.getBadgesByHouse(scholar.houseId || '');
    const currentBadges = await this.getScholarBadges(scholarId);
    const currentBadgeIds = currentBadges.map(sb => sb.badge.id);

    const newBadges: schema.ScholarBadge[] = [];

    for (const badge of availableBadges) {
      if (currentBadgeIds.includes(badge.id)) continue;

      let qualifies = false;

      if (badge.category === 'overall') {
        qualifies = totalPoints >= badge.pointsRequired;
      } else if (badge.category === 'academic') {
        qualifies = scholar.academicPoints >= badge.pointsRequired;
      } else if (badge.category === 'attendance') {
        qualifies = scholar.attendancePoints >= badge.pointsRequired;
      } else if (badge.category === 'behavior') {
        qualifies = scholar.behaviorPoints >= badge.pointsRequired;
      }

      if (qualifies) {
        const newBadge = await this.awardBadge(scholarId, badge.id);
        newBadges.push(newBadge);
      }
    }

    return newBadges;
  }

  // Reflection System Methods
  async assignReflection(scholarId: string, pbisEntryId: string, assignedBy: string, prompt: string, dueDate?: Date): Promise<Reflection> {
    const [reflection] = await db.insert(reflections).values({
      scholarId,
      pbisEntryId,
      assignedBy,
      prompt,
      dueDate,
    }).returning();

    // Send email notification to parent
    try {
      const scholar = await this.getScholar(scholarId);
      if (scholar) {
        const parent = await this.getParentByScholarId(scholarId);
        if (parent) {
          await sendParentReflectionNotification(
            parent.email,
            `${scholar.firstName} ${scholar.lastName}`,
            prompt,
            dueDate
          );
          console.log('📧 REFLECTION: Sent assignment notification to parent:', parent.email);
        }
      }
    } catch (error) {
      console.error("Error sending reflection assignment notification:", error);
    }

    return reflection;
  }

  async getReflectionsForStudent(scholarId: string): Promise<Reflection[]> {
    return await db.select().from(reflections).where(eq(reflections.scholarId, scholarId));
  }

  async getReflectionsForTeacher(teacherId: string): Promise<Reflection[]> {
    return await db.select().from(reflections).where(eq(reflections.assignedBy, teacherId));
  }

  async getAllReflections(): Promise<Reflection[]> {
    return await db.select().from(reflections);
  }

  async getApprovedReflections(): Promise<Reflection[]> {
    console.log('DATABASE: Fetching approved reflections...');
    const approvedReflections = await db.select().from(reflections)
      .where(eq(reflections.status, 'approved'))
      .orderBy(sql`${reflections.approvedAt} DESC`);
    console.log(`DATABASE: Found ${approvedReflections.length} approved reflections`);
    return approvedReflections;
  }

  async submitReflection(reflectionId: string, response: string): Promise<Reflection> {
    const [reflection] = await db.update(reflections)
      .set({
        response,
        status: 'submitted',
        submittedAt: new Date()
      })
      .where(eq(reflections.id, reflectionId))
      .returning();
    return reflection;
  }

  async reviewReflection(reflectionId: string, status: string, reviewedBy: string, feedback?: string, rejectionReason?: string, customReason?: string): Promise<Reflection> {
    const updateData: any = {
      status: status === 'rejected' ? 'assigned' : status, // Reset to assigned if rejected so student can resubmit
      teacherFeedback: feedback,
      approvedBy: reviewedBy,
    };

    // Only set approvedAt for approved reflections
    if (status === 'approved') {
      updateData.approvedAt = new Date();
    }

    const [reflection] = await db.update(reflections)
      .set(updateData)
      .where(eq(reflections.id, reflectionId))
      .returning();

    // Send email notification to parent
    if (status === 'approved') {
      try {
        const scholar = await this.getScholar(reflection.scholarId);
        if (scholar && reflection.response) {
          const parent = await this.getParentByScholarId(reflection.scholarId);
          if (parent) {
            await sendReflectionApprovedNotification(
              parent.email,
              `${parent.firstName} ${parent.lastName}`,
              `${scholar.firstName} ${scholar.lastName}`,
              reflection.prompt,
              reflection.response,
              feedback
            );
            console.log('📧 REFLECTION: Sent approval notification to parent:', parent.email);
          }
        }
      } catch (error) {
        console.error("Error sending reflection approved notification:", error);
      }
    } else if (status === 'rejected') {
      try {
        const scholar = await this.getScholar(reflection.scholarId);
        if (scholar && reflection.response) {
          const parent = await this.getParentByScholarId(reflection.scholarId);
          if (parent) {
            await sendReflectionRejectedNotification(
              parent.email,
              `${parent.firstName} ${parent.lastName}`,
              `${scholar.firstName} ${scholar.lastName}`,
              reflection.prompt,
              reflection.response,
              customReason || rejectionReason || feedback
            );
            console.log('📧 REFLECTION: Sent rejection notification to parent:', parent.email);
          }
        }
      } catch (error) {
        console.error("Error sending reflection rejected notification:", error);
      }
    }

    return reflection;
  }

  async sendReflectionToParent(reflectionId: string): Promise<boolean> {
    const result = await db.update(reflections)
      .set({
        sentToParent: true,
        sentToParentAt: new Date()
      })
      .where(eq(reflections.id, reflectionId));
    return (result.rowCount || 0) > 0;
  }

  async getParentByScholarId(scholarId: string): Promise<any | undefined> {
    // Get the scholar's parent through the parent-scholar relationship
    const [result] = await db.select({
      id: parents.id,
      email: parents.email,
      firstName: parents.firstName,
      lastName: parents.lastName
    })
    .from(parents)
    .innerJoin(scholars, eq(parents.id, scholars.parentId))
    .where(eq(scholars.id, scholarId));
    
    return result || undefined;
  }

  async getReflectionsForParent(parentId: string): Promise<any[]> {
    // Get parent's scholar IDs first
    const [parent] = await db.select({
      scholarIds: parents.scholarIds
    })
    .from(parents)
    .where(eq(parents.id, parentId));
    
    if (!parent || !parent.scholarIds || parent.scholarIds.length === 0) {
      console.log('📧 PARENT REFLECTIONS: No scholars found for parent:', parentId);
      return [];
    }
    
    console.log('📧 PARENT REFLECTIONS: Parent scholar IDs:', parent.scholarIds);
    
    // Get reflections for all linked scholars
    return await db.select({
      id: reflections.id,
      prompt: reflections.prompt,
      response: reflections.response,
      status: reflections.status,
      teacherFeedback: reflections.teacherFeedback,
      assignedAt: reflections.assignedAt,
      submittedAt: reflections.submittedAt,
      approvedAt: reflections.approvedAt,
      dueDate: reflections.dueDate,
      studentName: scholars.name,
      studentId: scholars.id
    })
    .from(reflections)
    .innerJoin(scholars, eq(reflections.scholarId, scholars.id))
    .where(inArray(scholars.id, parent.scholarIds))
    .orderBy(sql`${reflections.assignedAt} DESC`);
  }

  // Add this method to DatabaseStorage class
  async getHouseStandings(): Promise<House[]> {
    return await db.select().from(houses).orderBy(sql`academic_points + attendance_points + behavior_points DESC`);
  }

  // Student Dashboard Methods
  async getPBISEntriesForScholar(scholarId: string): Promise<any[]> {
    try {
      const entries = await db.select()
        .from(schema.pbisEntries)
        .where(eq(schema.pbisEntries.scholarId, scholarId))
        .orderBy(sql`${schema.pbisEntries.createdAt} DESC`);
      return entries;
    } catch (error) {
      console.error('Error getting PBIS entries for scholar:', error);
      return [];
    }
  }

  async getScholarBadges(scholarId: string): Promise<any[]> {
    try {
      const badges = await db.select({
        id: schema.scholarBadges.id,
        badgeId: schema.scholarBadges.badgeId,
        earnedAt: schema.scholarBadges.earnedAt,
        isActive: schema.scholarBadges.isActive,
        badgeName: schema.badges.name,
        badgeDescription: schema.badges.description,
        badgeCategory: schema.badges.category,
        badgeLevel: schema.badges.level,
        badgeIconPath: schema.badges.iconPath
      })
      .from(schema.scholarBadges)
      .innerJoin(schema.badges, eq(schema.scholarBadges.badgeId, schema.badges.id))
      .where(eq(schema.scholarBadges.scholarId, scholarId))
      .orderBy(sql`${schema.scholarBadges.earnedAt} DESC`);
      return badges;
    } catch (error) {
      console.error('Error getting scholar badges:', error);
      return [];
    }
  }

  async getReflectionsForScholar(scholarId: string): Promise<any[]> {
    try {
      const reflections = await db.select()
        .from(schema.reflections)
        .where(eq(schema.reflections.scholarId, scholarId))
        .orderBy(sql`${schema.reflections.assignedAt} DESC`);
      return reflections;
    } catch (error) {
      console.error('Error getting reflections for scholar:', error);
      return [];
    }
  }

  // Mood and Progress Tracking Implementation
  async createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry> {
    const [entry] = await db.insert(moodEntries)
      .values({
        id: randomUUID(),
        ...moodEntry,
        createdAt: new Date()
      })
      .returning();
    return entry;
  }

  async getMoodEntries(scholarId: string): Promise<MoodEntry[]> {
    return await db.select()
      .from(moodEntries)
      .where(eq(moodEntries.scholarId, scholarId))
      .orderBy(sql`${moodEntries.date} DESC`);
  }

  async getMoodEntriesByDateRange(scholarId: string, startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    return await db.select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.scholarId, scholarId),
          sql`${moodEntries.date} >= ${startDate}`,
          sql`${moodEntries.date} <= ${endDate}`
        )
      )
      .orderBy(sql`${moodEntries.date} DESC`);
  }

  async getTodayMoodEntry(scholarId: string): Promise<MoodEntry | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [entry] = await db.select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.scholarId, scholarId),
          sql`${moodEntries.date} >= ${today}`,
          sql`${moodEntries.date} < ${tomorrow}`
        )
      )
      .limit(1);
    return entry;
  }

  async updateMoodEntry(moodEntryId: string, moodEntry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined> {
    const [entry] = await db.update(moodEntries)
      .set(moodEntry)
      .where(eq(moodEntries.id, moodEntryId))
      .returning();
    return entry;
  }

  async createProgressGoal(progressGoal: InsertProgressGoal): Promise<ProgressGoal> {
    const [goal] = await db.insert(progressGoals)
      .values({
        id: randomUUID(),
        ...progressGoal,
        createdAt: new Date()
      })
      .returning();
    return goal;
  }

  async getProgressGoals(scholarId: string): Promise<ProgressGoal[]> {
    return await db.select()
      .from(progressGoals)
      .where(eq(progressGoals.scholarId, scholarId))
      .orderBy(sql`${progressGoals.createdAt} DESC`);
  }

  async getActiveProgressGoals(scholarId: string): Promise<ProgressGoal[]> {
    return await db.select()
      .from(progressGoals)
      .where(
        and(
          eq(progressGoals.scholarId, scholarId),
          eq(progressGoals.status, 'active')
        )
      )
      .orderBy(sql`${progressGoals.createdAt} DESC`);
  }

  async updateProgressGoal(goalId: string, progressGoal: Partial<InsertProgressGoal>): Promise<ProgressGoal | undefined> {
    const [goal] = await db.update(progressGoals)
      .set(progressGoal)
      .where(eq(progressGoals.id, goalId))
      .returning();
    return goal;
  }

  async markProgressGoalComplete(goalId: string): Promise<boolean> {
    const result = await db.update(progressGoals)
      .set({
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(progressGoals.id, goalId));
    return (result.rowCount || 0) > 0;
  }

  async updateProgressGoalProgress(goalId: string, currentValue: number): Promise<boolean> {
    const result = await db.update(progressGoals)
      .set({ currentValue })
      .where(eq(progressGoals.id, goalId));
    return (result.rowCount || 0) > 0;
  }

  async createDailyReflection(dailyReflection: InsertDailyReflection): Promise<DailyReflection> {
    const [reflection] = await db.insert(dailyReflections)
      .values({
        id: randomUUID(),
        ...dailyReflection,
        createdAt: new Date()
      })
      .returning();
    return reflection;
  }

  async getDailyReflections(scholarId: string): Promise<DailyReflection[]> {
    return await db.select()
      .from(dailyReflections)
      .where(eq(dailyReflections.scholarId, scholarId))
      .orderBy(sql`${dailyReflections.date} DESC`);
  }

  async getDailyReflectionsByDateRange(scholarId: string, startDate: Date, endDate: Date): Promise<DailyReflection[]> {
    return await db.select()
      .from(dailyReflections)
      .where(
        and(
          eq(dailyReflections.scholarId, scholarId),
          sql`${dailyReflections.date} >= ${startDate}`,
          sql`${dailyReflections.date} <= ${endDate}`
        )
      )
      .orderBy(sql`${dailyReflections.date} DESC`);
  }

  async getTodayDailyReflection(scholarId: string): Promise<DailyReflection | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [reflection] = await db.select()
      .from(dailyReflections)
      .where(
        and(
          eq(dailyReflections.scholarId, scholarId),
          sql`${dailyReflections.date} >= ${today}`,
          sql`${dailyReflections.date} < ${tomorrow}`
        )
      )
      .limit(1);
    return reflection;
  }

  async updateDailyReflection(reflectionId: string, dailyReflection: Partial<InsertDailyReflection>): Promise<DailyReflection | undefined> {
    const [reflection] = await db.update(dailyReflections)
      .set(dailyReflection)
      .where(eq(dailyReflections.id, reflectionId))
      .returning();
    return reflection;
  }

  // Analytics methods for teachers/admins
  async getScholarMoodAnalytics(scholarId: string): Promise<any> {
    const entries = await this.getMoodEntries(scholarId);
    const weekEntries = entries.filter(e => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(e.date) >= weekAgo;
    });

    return {
      totalEntries: entries.length,
      weekEntries: weekEntries.length,
      averageEnergy: weekEntries.reduce((sum, e) => sum + e.energyLevel, 0) / Math.max(weekEntries.length, 1),
      averageFocus: weekEntries.reduce((sum, e) => sum + e.focusLevel, 0) / Math.max(weekEntries.length, 1),
      moodDistribution: weekEntries.reduce((acc, e) => {
        acc[e.mood] = (acc[e.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async getClassMoodAnalytics(grade: number): Promise<any> {
    const classScholars = await this.getScholarsByGrade(grade);
    const analytics = await Promise.all(
      classScholars.map(scholar => this.getScholarMoodAnalytics(scholar.id))
    );

    return {
      totalStudents: classScholars.length,
      classAverageEnergy: analytics.reduce((sum, a) => sum + a.averageEnergy, 0) / Math.max(analytics.length, 1),
      classAverageFocus: analytics.reduce((sum, a) => sum + a.averageFocus, 0) / Math.max(analytics.length, 1),
      studentsWithEntries: analytics.filter(a => a.totalEntries > 0).length
    };
  }

  async getHouseMoodAnalytics(houseId: string): Promise<any> {
    const houseScholars = await this.getScholarsByHouse(houseId);
    const analytics = await Promise.all(
      houseScholars.map(scholar => this.getScholarMoodAnalytics(scholar.id))
    );

    return {
      totalStudents: houseScholars.length,
      houseAverageEnergy: analytics.reduce((sum, a) => sum + a.averageEnergy, 0) / Math.max(analytics.length, 1),
      houseAverageFocus: analytics.reduce((sum, a) => sum + a.averageFocus, 0) / Math.max(analytics.length, 1),
      studentsWithEntries: analytics.filter(a => a.totalEntries > 0).length
    };
  }

  // Class Period Management for Unified Arts Teachers
  async getTeacherClassPeriods(teacherId: string): Promise<any[]> {
    try {
      console.log(`STORAGE: Fetching class periods for teacher ${teacherId}`);
      
      // First get the class periods for this teacher
      const classPeriods = await db
        .select()
        .from(teacherClassPeriods)
        .where(eq(teacherClassPeriods.teacherId, teacherId))
        .orderBy(teacherClassPeriods.createdAt);
      
      // For each class period, get the enrolled students
      const classPeriodsWithStudents = await Promise.all(
        classPeriods.map(async (classPeriod) => {
          const enrollments = await db
            .select()
            .from(classPeriodEnrollments)
            .innerJoin(scholars, eq(classPeriodEnrollments.scholarId, scholars.id))
            .where(eq(classPeriodEnrollments.classPeriodId, classPeriod.id));
          
          const students = enrollments.map(enrollment => enrollment.scholars);
          
          return {
            ...classPeriod,
            students,
            studentCount: students.length
          };
        })
      );
      
      console.log(`STORAGE: Found ${classPeriodsWithStudents.length} class periods`);
      return classPeriodsWithStudents;
    } catch (error) {
      console.error('Error fetching class periods:', error);
      throw error;
    }
  }

  async createClassPeriod(classPeriod: { name: string; description: string; teacherId: string }): Promise<any> {
    try {
      console.log(`STORAGE: Creating class period ${classPeriod.name} for teacher ${classPeriod.teacherId}`);
      
      const [newClassPeriod] = await db
        .insert(teacherClassPeriods)
        .values({
          id: crypto.randomUUID(),
          name: classPeriod.name,
          description: classPeriod.description,
          teacherId: classPeriod.teacherId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      console.log(`STORAGE: Created class period ${newClassPeriod.id}`);
      return newClassPeriod;
    } catch (error) {
      console.error('Error creating class period:', error);
      throw error;
    }
  }

  async getClassPeriod(classId: string): Promise<any | undefined> {
    try {
      const [classPeriod] = await db
        .select()
        .from(teacherClassPeriods)
        .where(eq(teacherClassPeriods.id, classId));
      
      return classPeriod;
    } catch (error) {
      console.error('Error fetching class period:', error);
      throw error;
    }
  }

  async addStudentsToClass(classId: string, studentIds: string[]): Promise<any> {
    try {
      console.log(`STORAGE: Adding ${studentIds.length} students to class ${classId}`);
      
      // Get existing enrollments for this class to avoid duplicates
      const existingEnrollments = await db
        .select()
        .from(classPeriodEnrollments)
        .where(eq(classPeriodEnrollments.classPeriodId, classId));
      
      const existingStudentIds = existingEnrollments.map(e => e.scholarId);
      console.log(`STORAGE: Found ${existingStudentIds.length} existing enrollments:`, existingStudentIds);
      
      // Only add students who aren't already enrolled
      const newStudentIds = studentIds.filter(studentId => !existingStudentIds.includes(studentId));
      console.log(`STORAGE: ${newStudentIds.length} new students to enroll:`, newStudentIds);
      
      // Add new enrollments (keep existing ones)
      const enrollments = newStudentIds.map(studentId => ({
        id: crypto.randomUUID(),
        classPeriodId: classId,
        scholarId: studentId,
        createdAt: new Date()
      }));
      
      if (enrollments.length > 0) {
        await db.insert(classPeriodEnrollments).values(enrollments);
      }
      
      const totalEnrollments = existingStudentIds.length + enrollments.length;
      console.log(`STORAGE: Added ${enrollments.length} new enrollments. Total: ${totalEnrollments}`);
      return { success: true, enrolled: enrollments.length, total: totalEnrollments };
    } catch (error) {
      console.error('Error adding students to class:', error);
      throw error;
    }
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<any> {
    try {
      console.log(`STORAGE: Removing student ${studentId} from class ${classId}`);
      
      const result = await db
        .delete(classPeriodEnrollments)
        .where(
          and(
            eq(classPeriodEnrollments.classPeriodId, classId),
            eq(classPeriodEnrollments.scholarId, studentId)
          )
        )
        .returning();
      
      if (result.length === 0) {
        console.log(`STORAGE: Student ${studentId} was not enrolled in class ${classId}`);
        return { success: false, message: "Student was not enrolled in this class" };
      }
      
      console.log(`STORAGE: Successfully removed student ${studentId} from class ${classId}`);
      return { success: true, message: "Student removed from class" };
    } catch (error) {
      console.error('Error removing student from class:', error);
      throw error;
    }
  }

  async deleteClassPeriod(classId: string): Promise<void> {
    try {
      console.log(`STORAGE: Deleting class period ${classId}`);
      
      // First delete all enrollments
      await db
        .delete(classPeriodEnrollments)
        .where(eq(classPeriodEnrollments.classPeriodId, classId));
      
      // Then delete the class period
      await db
        .delete(teacherClassPeriods)
        .where(eq(teacherClassPeriods.id, classId));
      
      console.log(`STORAGE: Deleted class period ${classId}`);
    } catch (error) {
      console.error('Error deleting class period:', error);
      throw error;
    }
  }

  // Trend Analytics Methods
  async getStudentTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string, studentId?: string): Promise<any[]> {
    try {
      // Build the base query with proper joins
      const baseQuery = db
        .select({
          period: interval === 'week' 
            ? sql`date_trunc('week', ${pbisEntries.createdAt})::text`
            : sql`date_trunc('month', ${pbisEntries.createdAt})::text`,
          scholarId: pbisEntries.scholarId,
          scholarName: scholars.name,
          grade: scholars.grade,
          houseId: scholars.houseId,
          points: pbisEntries.points,
          entryType: pbisEntries.entryType,
          teacherName: pbisEntries.teacherName,
          createdAt: pbisEntries.createdAt
        })
        .from(pbisEntries)
        .innerJoin(scholars, eq(pbisEntries.scholarId, scholars.id))
        .where(sql`${pbisEntries.createdAt} >= ${from} AND ${pbisEntries.createdAt} <= ${to}`)
        .orderBy(pbisEntries.createdAt);

      // Apply filters
      let query = baseQuery;
      if (teacherId) {
        // Get teacher name to filter by
        const teacher = await db.select().from(teacherAuth).where(eq(teacherAuth.id, teacherId)).limit(1);
        if (teacher[0]) {
          query = query.where(eq(pbisEntries.teacherName, teacher[0].name));
        }
      }
      if (studentId) {
        query = query.where(eq(pbisEntries.scholarId, studentId));
      }

      const results = await query;

      // Group and aggregate the results
      const grouped = new Map<string, any>();
      
      for (const row of results) {
        const key = `${row.period}_${row.scholarId}`;
        
        if (!grouped.has(key)) {
          const periodStart = new Date(row.period);
          const periodEnd = new Date(periodStart);
          if (interval === 'week') {
            periodEnd.setDate(periodStart.getDate() + 6);
          } else {
            periodEnd.setMonth(periodStart.getMonth() + 1);
            periodEnd.setDate(0);
          }

          grouped.set(key, {
            period: row.period,
            start: periodStart,
            end: periodEnd,
            studentId: row.scholarId,
            studentName: row.scholarName,
            grade: row.grade,
            houseId: row.houseId,
            positive: 0,
            negative: 0,
            net: 0
          });
        }
        
        const data = grouped.get(key)!;
        if (row.entryType === 'positive') {
          data.positive += row.points;
        } else {
          data.negative += row.points;
        }
        data.net = data.positive - data.negative;
      }
      
      return Array.from(grouped.values()).sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
    } catch (error) {
      console.error('DatabaseStorage.getStudentTrends error:', error);
      throw error;
    }
  }

  async getClassroomTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string): Promise<any[]> {
    try {
      // Build the base query 
      const baseQuery = db
        .select({
          period: interval === 'week' 
            ? sql`date_trunc('week', ${pbisEntries.createdAt})::text`
            : sql`date_trunc('month', ${pbisEntries.createdAt})::text`,
          teacherName: pbisEntries.teacherName,
          teacherRole: pbisEntries.teacherRole,
          points: pbisEntries.points,
          entryType: pbisEntries.entryType,
          createdAt: pbisEntries.createdAt
        })
        .from(pbisEntries)
        .where(sql`${pbisEntries.createdAt} >= ${from} AND ${pbisEntries.createdAt} <= ${to}`)
        .orderBy(pbisEntries.createdAt);

      // Apply teacher filter if specified
      let query = baseQuery;
      if (teacherId) {
        const teacher = await db.select().from(teacherAuth).where(eq(teacherAuth.id, teacherId)).limit(1);
        if (teacher[0]) {
          query = query.where(eq(pbisEntries.teacherName, teacher[0].name));
        }
      }

      const results = await query;

      // Group and aggregate by period and teacher
      const grouped = new Map<string, any>();
      
      for (const row of results) {
        const key = `${row.period}_${row.teacherName}`;
        
        if (!grouped.has(key)) {
          const periodStart = new Date(row.period);
          const periodEnd = new Date(periodStart);
          if (interval === 'week') {
            periodEnd.setDate(periodStart.getDate() + 6);
          } else {
            periodEnd.setMonth(periodStart.getMonth() + 1);
            periodEnd.setDate(0);
          }

          // Try to find teacher ID by name
          const teacher = await db.select().from(teacherAuth).where(eq(teacherAuth.name, row.teacherName)).limit(1);
          const teacherData = teacher[0] || { id: 'unknown', subject: 'General' };

          grouped.set(key, {
            period: row.period,
            start: periodStart,
            end: periodEnd,
            teacherId: teacherData.id,
            teacherName: row.teacherName,
            subject: teacherData.subject || 'General',
            grade: row.teacherRole || 'All Grades',
            positive: 0,
            negative: 0,
            net: 0
          });
        }
        
        const data = grouped.get(key)!;
        if (row.entryType === 'positive') {
          data.positive += row.points;
        } else {
          data.negative += row.points;
        }
        data.net = data.positive - data.negative;
      }
      
      return Array.from(grouped.values()).sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
    } catch (error) {
      console.error('DatabaseStorage.getClassroomTrends error:', error);
      throw error;
    }
  }
}

// Force deployment sync - ensure latest fixes are deployed
console.log("DEPLOYMENT: DatabaseStorage initialized with messaging fixes");
export const storage = new DatabaseStorage();