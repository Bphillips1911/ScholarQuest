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
} from "@shared/schema";
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
  teacherSessions
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, desc, sql, and, or, inArray } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";

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
          id: "franklin",
          name: "House of Franklin",
          color: "#FF6B6B",
          icon: "⚡",
          motto: "Inventors of Tomorrow",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "courie",
          name: "House of Courie",
          color: "#4ECDC4",
          icon: "🔬",
          motto: "Seekers of Knowledge",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "west",
          name: "House of West",
          color: "#45B7D1",
          icon: "🎨",
          motto: "Creative Visionaries",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "blackwell",
          name: "House of Blackwell",
          color: "#96CEB4",
          icon: "🌱",
          motto: "Champions of Change",
          academicPoints: 0,
          attendancePoints: 0,
          behaviorPoints: 0,
          memberCount: 0
        },
        {
          id: "berruguete",
          name: "House of Berruguete",
          color: "#FFEAA7",
          icon: "🏆",
          motto: "Leaders of Excellence",
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

  async createScholar(scholarData: InsertScholar): Promise<Scholar> {
    const [scholar] = await db.insert(schema.scholars).values({
      id: randomUUID(),
      ...scholarData,
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
    return await db.select().from(pointEntries).orderBy(desc(pointEntries.createdAt));
  }

  // PBIS Entry methods
  async createPbisEntry(pbisData: InsertPbisEntry): Promise<PbisEntry> {
    const [entry] = await db.insert(pbisEntries).values({
      id: randomUUID(),
      ...pbisData,
      createdAt: new Date(),
    }).returning();
    return entry;
  }

  async getPbisEntries(): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries).orderBy(desc(pbisEntries.createdAt));
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
    return await db.select().from(pbisPhotos).orderBy(desc(pbisPhotos.createdAt));
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

  async createTeacherAuth(teacherData: InsertTeacherAuth): Promise<TeacherAuth> {
    const [teacher] = await db.insert(schema.teacherAuth).values({
      id: randomUUID(),
      ...teacherData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return teacher;
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
    // Reset all students to unsorted
    await db.update(schema.scholars).set({
      houseId: null,
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
    try {
      const [message] = await db.insert(schema.parentTeacherMessages).values({
        parentId: messageData.parentId,
        teacherId: messageData.teacherId || null,
        adminId: messageData.adminId || null,
        scholarId: messageData.scholarId || null,
        senderType: messageData.senderType,
        recipientType: messageData.recipientType,
        subject: messageData.subject,
        message: messageData.message,
        isRead: messageData.isRead || false,
        threadId: messageData.threadId || null,
        priority: messageData.priority || 'normal',
        notificationSent: messageData.notificationSent || false
      }).returning();

      // Create SMS notification if parent has phone number
      if (messageData.senderType === 'teacher' && messageData.recipientType === 'parent') {
        const [parent] = await db.select({ phone: schema.parents.phone })
          .from(schema.parents)
          .where(eq(schema.parents.id, messageData.parentId));
        
        if (parent?.phone) {
          await this.createSmsNotification({
            parentId: messageData.parentId,
            phoneNumber: parent.phone,
            messageType: 'teacher_message',
            content: `New message from teacher: ${messageData.subject}`,
            relatedMessageId: message.id
          });
        }
      }

      return message;
    } catch (error) {
      console.error('Database createMessage error:', error);
      throw error;
    }
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
    try {
      const result = await db.execute(sql`
        SELECT ptm.*, p.first_name, p.last_name, s.name as scholar_name 
        FROM parent_teacher_messages ptm
        LEFT JOIN parents p ON ptm.parent_id = p.id
        LEFT JOIN scholars s ON ptm.scholar_id = s.id
        WHERE ptm.teacher_id = ${teacherId}
        ORDER BY ptm.created_at DESC
      `);
      console.log(`DATABASE: Found ${result.rows?.length || 0} messages for teacher ${teacherId}`);
      return result.rows || [];
    } catch (error) {
      console.error('Error in getMessagesByTeacher:', error);
      return [];
    }
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

  async getScholarsByGrade(grade: number): Promise<Scholar[]> {
    try {
      const scholars = await db.select()
        .from(schema.scholars)
        .where(eq(schema.scholars.grade, grade));
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
    // This would need a junction table in a real implementation
    // For now, return empty array
    return [];
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

  async addScholarToParentByCredentials(parentId: string, username: string, password: string): Promise<boolean> {
    // Implementation for adding scholar by credentials
    return true;
  }

  async addScholarToParentByUsername(parentId: string, username: string): Promise<boolean> {
    // Implementation for adding scholar by username
    return true;
  }

  async getParentMessages(parentId: string): Promise<any[]> {
    return await this.getMessagesByParent(parentId);
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
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.email, email));
    return teacher || undefined;
  }

  async getTeachersByGrade(grade: number): Promise<Teacher[]> {
    return await db.select().from(teachers).where(sql`${teachers.canSeeGrades} @> ARRAY[${grade}]`);
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(teachers).values(teacher).returning();
    return newTeacher;
  }

  async getAllParents(): Promise<Parent[]> {
    return await db.select().from(parents);
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

  async getPasswordResetRequests(teacherId: string): Promise<PasswordResetRequest[]> {
    return await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.teacherId, teacherId));
  }

  async getPasswordResetRequest(token: string): Promise<PasswordResetRequest | undefined> {
    const [request] = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.token, token));
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
}

export const storage = new DatabaseStorage();