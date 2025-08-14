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
  houses, 
  scholars, 
  teachers, 
  pointEntries, 
  pbisEntries, 
  pbisPhotos, 
  parents,
  teacherAuth,
  teacherSessions,
  studentSessions,
  passwordResetRequests,
  administrators,
  adminSessions
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, desc, sql } from "drizzle-orm";
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
    const existingHouses = await db.select().from(houses).limit(1);
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

      await db.insert(houses).values(defaultHouses);
    }
  }

  // House methods
  async getHouses(): Promise<House[]> {
    return await db.select().from(houses);
  }

  async getHouse(id: string): Promise<House | undefined> {
    const [house] = await db.select().from(houses).where(eq(houses.id, id));
    return house || undefined;
  }

  async updateHouse(id: string, updates: Partial<House>): Promise<boolean> {
    const result = await db.update(houses).set(updates).where(eq(houses.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scholar methods
  async getScholars(): Promise<Scholar[]> {
    return await db.select().from(scholars);
  }

  async getScholar(id: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.id, id));
    return scholar || undefined;
  }

  async createScholar(scholarData: InsertScholar): Promise<Scholar> {
    const [scholar] = await db.insert(scholars).values({
      id: randomUUID(),
      ...scholarData,
    }).returning();
    return scholar;
  }

  async updateScholar(id: string, updates: Partial<Scholar>): Promise<boolean> {
    const result = await db.update(scholars).set(updates).where(eq(scholars.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteScholar(id: string): Promise<boolean> {
    const result = await db.delete(scholars).where(eq(scholars.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getScholarsByHouse(houseId: string): Promise<Scholar[]> {
    return await db.select().from(scholars).where(eq(scholars.houseId, houseId));
  }

  async getUnsortedScholars(): Promise<Scholar[]> {
    return await db.select().from(scholars).where(eq(scholars.isHouseSorted, false));
  }

  // Teacher Auth methods
  async createTeacherAuth(teacherData: any): Promise<TeacherAuth> {
    const hashedPassword = await bcrypt.hash(teacherData.password, 10);
    
    const [teacher] = await db.insert(teacherAuth).values({
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
    const [teacher] = await db.select().from(teacherAuth).where(eq(teacherAuth.email, email));
    return teacher || null;
  }

  async getPendingTeachers(): Promise<TeacherAuth[]> {
    return await db.select().from(teacherAuth).where(eq(teacherAuth.isApproved, false));
  }

  async approveTeacher(id: string): Promise<boolean> {
    const result = await db.update(teacherAuth)
      .set({ 
        isApproved: true, 
        updatedAt: new Date() 
      })
      .where(eq(teacherAuth.id, id));
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
    return await db.select().from(parents);
  }

  async getParent(id: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent || undefined;
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.email, email));
    return parent || undefined;
  }

  // Session methods
  async createTeacherSession(sessionData: InsertTeacherSession): Promise<TeacherSession> {
    const [session] = await db.insert(teacherSessions).values({
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    }).returning();
    return session;
  }

  async getTeacherSession(token: string): Promise<TeacherSession | undefined> {
    const [session] = await db.select().from(teacherSessions).where(eq(teacherSessions.token, token));
    return session || undefined;
  }

  async deleteTeacherSession(token: string): Promise<boolean> {
    const result = await db.delete(teacherSessions).where(eq(teacherSessions.token, token));
    return (result.rowCount || 0) > 0;
  }

  async createStudentSession(sessionData: InsertStudentSession): Promise<StudentSession> {
    const [session] = await db.insert(studentSessions).values({
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    }).returning();
    return session;
  }

  async getStudentSession(token: string): Promise<StudentSession | undefined> {
    const [session] = await db.select().from(studentSessions).where(eq(studentSessions.token, token));
    return session || undefined;
  }

  // Password reset methods
  async createPasswordResetRequest(requestData: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const [request] = await db.insert(passwordResetRequests).values({
      id: randomUUID(),
      ...requestData,
      createdAt: new Date(),
      status: "pending",
    }).returning();
    return request;
  }

  async getPasswordResetRequest(token: string): Promise<PasswordResetRequest | null> {
    const [request] = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.id, token));
    return request || null;
  }

  // Sorting and house management methods
  async sortStudentsIntoHouses(): Promise<{ sortedCount: number }> {
    const unsortedStudents = await this.getUnsortedScholars();
    const allHouses = await this.getHouses();
    
    if (unsortedStudents.length === 0) {
      return { message: "No unsorted students found", results: [] };
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
    await db.update(scholars).set({
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
    while (await db.select().from(scholars).where(eq(scholars.username, username)).then(result => result.length > 0)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    return username;
  }

  // Parent-Teacher Messaging Methods
  async createMessage(messageData: any): Promise<any> {
    try {
      const [message] = await db.execute(sql`
        INSERT INTO parent_teacher_messages (
          parent_id, teacher_id, admin_id, scholar_id, sender_type, 
          recipient_type, subject, message, is_read, thread_id, priority, 
          notification_sent, created_at
        ) VALUES (
          ${messageData.parentId}, ${messageData.teacherId}, ${messageData.adminId}, 
          ${messageData.scholarId}, ${messageData.senderType}, ${messageData.recipientType}, 
          ${messageData.subject}, ${messageData.message}, ${messageData.isRead || false}, 
          ${messageData.threadId}, ${messageData.priority || 'normal'}, 
          ${messageData.notificationSent || false}, NOW()
        ) RETURNING *
      `);

      // Create SMS notification if parent has phone number
      if (messageData.senderType === 'teacher' && messageData.recipientType === 'parent') {
        const parentResult = await db.execute(sql`
          SELECT phone FROM parents WHERE id = ${messageData.parentId}
        `);
        
        if (parentResult.rows[0]?.phone) {
          await this.createSmsNotification({
            parentId: messageData.parentId,
            phoneNumber: parentResult.rows[0].phone,
            messageType: 'teacher_message',
            content: `New message from teacher: ${messageData.subject}`,
            relatedMessageId: message.rows[0].id
          });
        }
      }

      return message.rows[0];
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
}

export const storage = new DatabaseStorage();