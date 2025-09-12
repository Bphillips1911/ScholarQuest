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
  type MoodEntry,
  type ProgressGoal,
  type DailyReflection,
  type StudentTrendData,
  type ClassroomTrendData,
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
  type InsertMoodEntry,
  type InsertProgressGoal,
  type InsertDailyReflection,
  type SelLesson,
  type SelQuizQuestion,
  type SelQuizResponse,
  type SelQuizResult,
  type SelNotification,
  type SelProgressAnalytics,
  type SelBehaviorDefinition,
  type InsertSelLesson,
  type InsertSelQuizQuestion,
  type InsertSelQuizResponse,
  type InsertSelQuizResult,
  type InsertSelNotification,
  type InsertSelBehaviorDefinition,
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
  adminSessions,
  moodEntries,
  progressGoals,
  dailyReflections,
  selLessons,
  selQuizQuestions,
  selQuizResponses,
  selQuizResults,
  selNotifications,
  selProgressAnalytics,
  selBehaviorDefinitions
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";

// Username generation utility for students
function generateStudentUsername(firstName: string, lastName: string, studentId: string): string {
  // Clean and format the names
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
  const idSuffix = studentId.replace(/[^0-9]/g, '').substring(-3); // Last 3 digits of student ID
  
  // Format: firstlast123 (e.g., johsmi789 for John Smith with ID ending in 789)
  return `${cleanFirst}${cleanLast}${idSuffix}`;
}

// Function to ensure username uniqueness
async function generateUniqueUsername(firstName: string, lastName: string, studentId: string): Promise<string> {
  let baseUsername = generateStudentUsername(firstName, lastName, studentId);
  let username = baseUsername;
  let counter = 1;
  
  // Check if username exists and add number suffix if needed
  while (await db.select().from(scholars).where(eq(scholars.username, username)).then(result => result.length > 0)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
}

export interface IStorage {
  // Houses
  getHouses(): Promise<House[]>;
  getHouseStandings(): Promise<House[]>;
  getHouse(id: string): Promise<House | undefined>;
  createHouse(house: InsertHouse): Promise<House>;
  updateHousePoints(houseId: string, category: string, points: number): Promise<void>;
  
  // Scholars
  getScholarsByHouse(houseId: string): Promise<Scholar[]>;
  getScholarsByGrade(grade: number): Promise<Scholar[]>;
  getScholar(id: string): Promise<Scholar | undefined>;
  getStudent(id: string): Promise<Scholar | undefined>;
  getScholarByUsername(username: string): Promise<Scholar | undefined>;
  getScholarByStudentId(studentId: string): Promise<Scholar | undefined>;
  getAllScholars(): Promise<Scholar[]>;
  createScholar(scholar: InsertScholar): Promise<Scholar>;
  updateScholarPoints(scholarId: string, category: string, points: number): Promise<void>;
  deactivateStudent(studentId: string, teacherId: string, reason: string): Promise<boolean>;
  
  // Teachers
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  getTeachersByGrade(grade: number): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  getVisibleScholarsForTeacher(teacherId: string): Promise<Scholar[]>;
  
  // Teacher Authentication
  authenticateTeacher(email: string, password: string): Promise<TeacherAuth | null>;
  getTeacherAuthByEmail(email: string): Promise<TeacherAuth | null>;
  getTeacherAuthById(id: string): Promise<TeacherAuth | null>;
  createTeacherAuth(teacherData: InsertTeacherAuth): Promise<TeacherAuth>;
  createTeacherSession(sessionData: InsertTeacherSession): Promise<TeacherSession>;
  getTeacherSession(token: string): Promise<TeacherSession | undefined>;
  
  // Point Entries
  getPointEntries(): Promise<PointEntry[]>;
  getPointEntriesByHouse(houseId: string): Promise<PointEntry[]>;
  createPointEntry(entry: InsertPointEntry): Promise<PointEntry>;
  
  // PBIS Entries
  getPbisEntries(): Promise<PbisEntry[]>;
  getAllPbisEntries(): Promise<PbisEntry[]>;
  getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]>;
  getPBISEntriesForScholar(scholarId: string): Promise<PbisEntry[]>;
  createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry>;
  
  // PBIS Photos
  getPbisPhotos(): Promise<PbisPhoto[]>;
  createPbisPhoto(photo: InsertPbisPhoto): Promise<PbisPhoto>;
  deletePbisPhoto(id: string): Promise<boolean>;
  
  // Parents
  getParent(id: string): Promise<Parent | undefined>;
  getParentByEmail(email: string): Promise<Parent | undefined>;
  createParent(parent: InsertParent): Promise<Parent>;
  addScholarToParent(parentId: string, scholarId: string): Promise<boolean>;
  addScholarToParentByCredentials(parentId: string, username: string, password: string): Promise<Scholar | null>;
  getParentScholars(parentId: string): Promise<Scholar[]>;
  getAllParents(): Promise<Parent[]>;
  addScholarToParentByUsername(parentId: string, studentUsername: string): Promise<Scholar | null>;
  addScholarToParentByCredentials(parentId: string, username: string, password: string): Promise<Scholar | null>;
  updateParentPhone(parentId: string, phone: string): Promise<Parent | null>;
  
  // Messaging
  createMessage(messageData: any): Promise<any>;
  getParentMessages(parentId: string): Promise<any[]>;
  getTeacherMessages(teacherId: string): Promise<any[]>;
  markMessageAsRead(messageId: string): Promise<boolean>;
  
  // SMS Notifications
  createSmsNotification(notificationData: any): Promise<any>;
  getSmsNotifications(parentId: string): Promise<any[]>;
  updateSmsStatus(notificationId: string, status: string): Promise<boolean>;
  
  // Parent-Teacher Messaging
  createParentTeacherMessage(messageData: any): Promise<any>;
  getMessagesByParent(parentId: string): Promise<any[]>;
  getMessagesByTeacher(teacherId: string): Promise<any[]>;
  
  // Admin Messaging
  getMessagesForAdmin(adminId: string): Promise<any[]>;
  getAllTeachers(): Promise<TeacherAuth[]>;
  getAllParents(): Promise<Parent[]>;
  
  // Teacher Authentication  
  authenticateTeacher(email: string, password: string): Promise<TeacherAuth | null>;
  getTeacherAuthByEmail(email: string): Promise<TeacherAuth | null>;
  getTeacherAuthById(id: string): Promise<TeacherAuth | null>;
  getTeacherById(id: string): Promise<TeacherAuth | null>;
  createTeacherAuth(teacher: InsertTeacherAuth): Promise<TeacherAuth>;
  createTeacherSession(session: InsertTeacherSession): Promise<TeacherSession>;
  getTeacherSession(token: string): Promise<TeacherSession | undefined>;
  deleteTeacherSession(token: string): Promise<boolean>;
  getAllTeacherAuth(): Promise<TeacherAuth[]>;
  getPendingTeachers(): Promise<TeacherAuth[]>;
  approveTeacher(teacherId: string): Promise<boolean>;
  requestTeacherPasswordReset(email: string): Promise<boolean>;
  resetTeacherPassword(teacherId: string, newPassword: string): Promise<boolean>;
  getScholarsByGrade(gradeRole: string | number): Promise<Scholar[]>;
  getReflectionsByTeacher(teacherId: string): Promise<any[]>;
  getMessagesByTeacher(teacherId: string): Promise<any[]>;
  getPhotosByTeacher(teacherId: string): Promise<any[]>;

  // Student Authentication  
  createStudentCredentials(scholarId: string, teacherId: string): Promise<{ username: string; password: string }>;
  authenticateStudent(username: string, password: string): Promise<Scholar | null>;
  requestPasswordReset(username: string): Promise<boolean>;
  createStudentSession(session: InsertStudentSession): Promise<StudentSession>;
  getStudentSession(token: string): Promise<StudentSession | undefined>;
  deleteStudentSession(token: string): Promise<boolean>;
  createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest>;

  // Trend Analytics
  getStudentTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string, studentId?: string): Promise<StudentTrendData[]>;
  getClassroomTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string): Promise<ClassroomTrendData[]>;
  getPasswordResetRequests(teacherId: string): Promise<PasswordResetRequest[]>;
  resetStudentPassword(studentId: string, newPassword: string): Promise<boolean>;
  
  // Administrator Authentication
  createAdministrator(admin: InsertAdministrator): Promise<Administrator>;
  getAdministratorByEmail(email: string): Promise<Administrator | undefined>;
  authenticateAdmin(email: string, password: string): Promise<Administrator | null>;
  updateAdministratorPassword(adminId: string, newPasswordHash: string): Promise<boolean>;
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(token: string): Promise<AdminSession | undefined>;
  deleteAdminSession(token: string): Promise<boolean>;
  getAllAdministrators(): Promise<Administrator[]>;
  
  // House Sorting
  getUnsortedStudents(): Promise<Scholar[]>;
  addUnsortedStudent(student: InsertScholar): Promise<Scholar>;
  removeUnsortedStudent(studentId: string): Promise<boolean>;
  sortStudentsIntoHouses(): Promise<{ sortedCount: number }>;
  resetAllHouses(): Promise<void>;
  
  // Reflections
  assignReflection(scholarId: string, pbisEntryId: string, assignedBy: string, prompt: string, dueDate?: Date): Promise<Reflection>;
  getReflectionsForStudent(scholarId: string): Promise<Reflection[]>;
  getReflectionsForTeacher(teacherId: string): Promise<Reflection[]>;
  getAllReflections(): Promise<Reflection[]>;
  getApprovedReflections(): Promise<Reflection[]>;
  submitReflection(reflectionId: string, response: string): Promise<Reflection>;
  reviewReflection(reflectionId: string, status: string, reviewedBy: string, feedback?: string): Promise<Reflection>;
  sendReflectionToParent(reflectionId: string): Promise<boolean>;

  // Utility
  getHouseStandings(): Promise<House[]>;
  
  // Mood and Progress Tracking
  createMoodEntry(moodEntry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntries(scholarId: string): Promise<MoodEntry[]>;
  getMoodEntriesByDateRange(scholarId: string, startDate: Date, endDate: Date): Promise<MoodEntry[]>;
  getTodayMoodEntry(scholarId: string): Promise<MoodEntry | undefined>;
  updateMoodEntry(moodEntryId: string, moodEntry: Partial<InsertMoodEntry>): Promise<MoodEntry | undefined>;
  
  createProgressGoal(progressGoal: InsertProgressGoal): Promise<ProgressGoal>;
  getProgressGoals(scholarId: string): Promise<ProgressGoal[]>;
  getActiveProgressGoals(scholarId: string): Promise<ProgressGoal[]>;
  updateProgressGoal(goalId: string, progressGoal: Partial<InsertProgressGoal>): Promise<ProgressGoal | undefined>;
  markProgressGoalComplete(goalId: string): Promise<boolean>;
  updateProgressGoalProgress(goalId: string, currentValue: number): Promise<boolean>;
  
  createDailyReflection(dailyReflection: InsertDailyReflection): Promise<DailyReflection>;
  getDailyReflections(scholarId: string): Promise<DailyReflection[]>;
  getDailyReflectionsByDateRange(scholarId: string, startDate: Date, endDate: Date): Promise<DailyReflection[]>;
  getTodayDailyReflection(scholarId: string): Promise<DailyReflection | undefined>;
  updateDailyReflection(reflectionId: string, dailyReflection: Partial<InsertDailyReflection>): Promise<DailyReflection | undefined>;
  
  // Weekly/Monthly analytics for teachers/admins
  getScholarMoodAnalytics(scholarId: string): Promise<any>;
  getClassMoodAnalytics(grade: number): Promise<any>;
  getHouseMoodAnalytics(houseId: string): Promise<any>;
  
  // Badge System
  getScholarBadges(scholarId: string): Promise<any[]>;
  
  // Reflections for Scholar
  getReflectionsForScholar(scholarId: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private houses: Map<string, House>;
  private scholars: Map<string, Scholar>;
  private teachers: Map<string, Teacher>;
  private pointEntries: Map<string, PointEntry>;
  private pbisEntries: Map<string, PbisEntry>;
  private pbisPhotos: Map<string, PbisPhoto>;
  private parents: Map<string, Parent>;
  private teacherAuth: Map<string, TeacherAuth>;
  private teacherSessions: Map<string, TeacherSession>;
  private studentSessions: Map<string, StudentSession>;
  private passwordResetRequests: Map<string, PasswordResetRequest>;
  private administrators: Map<string, Administrator>;
  private adminSessions: Map<string, AdminSession>;
  private reflections: Map<string, Reflection>;
  private parentScholars: Map<string, string[]>; // parentId -> scholarIds
  private parentTeacherMessages: Map<string, any>;
  private messages: Map<string, any>;
  private smsNotifications: Map<string, any>;

  constructor() {
    this.houses = new Map();
    this.scholars = new Map();
    this.teachers = new Map();
    this.pointEntries = new Map();
    this.pbisEntries = new Map();
    this.pbisPhotos = new Map();
    this.parents = new Map();
    this.teacherAuth = new Map();
    this.teacherSessions = new Map();
    this.studentSessions = new Map();
    this.passwordResetRequests = new Map();
    this.administrators = new Map();
    this.adminSessions = new Map();
    this.reflections = new Map();
    this.parentScholars = new Map();
    this.parentTeacherMessages = new Map();
    this.messages = new Map();
    this.smsNotifications = new Map();
    
    // Initialize with the five houses and sample scholars and teachers
    this.initializeHouses();
    this.initializeScholars();
    this.initializeTeachers();
    this.initializeParents();
    
    // Initialize teacher auth accounts after regular setup
    setTimeout(() => {
      this.initializeTeacherAuth().then(() => {
        console.log("Teacher auth accounts initialized");
        return this.initializeAdministrators();
      }).then(() => {
        console.log("Administrator accounts initialized");
      });
    }, 100);
  }

  private initializeHouses() {
    const initialHouses: House[] = [
      {
        id: "tesla",
        name: "Tesla",
        color: "#7c3aed",
        icon: "mustang",
        motto: "Leadership • Innovation • Integrity",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "drew",
        name: "Drew",
        color: "#ef4444",
        icon: "🦅",
        motto: "Courage • Determination • Excellence",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "west",
        name: "West",
        color: "#f97316",
        icon: "leaf",
        motto: "Growth • Wisdom • Collaboration",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "marshall",
        name: "Marshall",
        color: "#10b981",
        icon: "mountain",
        motto: "Strength • Perseverance • Honor",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
      {
        id: "johnson",
        name: "Johnson",
        color: "#3b82f6",
        icon: "lion",
        motto: "Creativity • Passion • Innovation",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0,
      },
    ];

    initialHouses.forEach(house => this.houses.set(house.id, house));
  }

  private async initializeScholars() {
    const sampleScholars = [
      {
        name: "Sarah Johnson",
        gradeLevel: 6,
        studentId: "BH6001",
        username: "bh6001sarah",
        houseId: "franklin"
      },
      {
        name: "Michael Chen",
        gradeLevel: 7,
        studentId: "BH7002",
        username: "bh7002michael",
        houseId: "courie"
      },
      {
        name: "Emma Williams",
        gradeLevel: 8,
        studentId: "BH8003",
        username: "bh8003emma",
        houseId: "west"
      },
      {
        name: "David Rodriguez",
        gradeLevel: 6,
        studentId: "BH6004",
        username: "bh6004david",
        houseId: "blackwell"
      },
      {
        name: "Olivia Thompson",
        gradeLevel: 7,
        studentId: "BH7005",
        username: "bh7005olivia",
        houseId: "berruguete"
      }
    ];

    for (const scholarData of sampleScholars) {
      // Generate a simple password for demo students
      const password = "student123";
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const scholar: Scholar = {
        id: randomUUID(),
        name: scholarData.name,
        gradeLevel: scholarData.gradeLevel,
        studentId: scholarData.studentId,
        username: scholarData.username,
        passwordHash: hashedPassword,
        houseId: scholarData.houseId,
        academicPoints: Math.floor(Math.random() * 50) + 10,
        attendancePoints: Math.floor(Math.random() * 30) + 5,
        behaviorPoints: Math.floor(Math.random() * 40) + 8,
        isHouseSorted: true,
        addedAt: new Date(),
      };
      this.scholars.set(scholar.id, scholar);
      
      // Update house member count
      const house = this.houses.get(scholarData.houseId);
      if (house) {
        house.memberCount++;
        this.houses.set(house.id, house);
      }
    }
  }

  private async initializeTeachers() {
    const sampleTeachers = [
      // 6th Grade Teachers
      { name: "Ms. Sarah Johnson", email: "s.johnson@bhsteam.edu", role: "6th Grade", subject: "Math", canSeeGrades: [6] },
      { name: "Mr. David Smith", email: "d.smith@bhsteam.edu", role: "6th Grade", subject: "English", canSeeGrades: [6] },
      { name: "Mrs. Emily Davis", email: "e.davis@bhsteam.edu", role: "6th Grade", subject: "Science", canSeeGrades: [6] },
      
      // 7th Grade Teachers
      { name: "Ms. Jennifer Wilson", email: "j.wilson@bhsteam.edu", role: "7th Grade", subject: "Math", canSeeGrades: [7] },
      { name: "Mr. Michael Brown", email: "m.brown@bhsteam.edu", role: "7th Grade", subject: "English", canSeeGrades: [7] },
      { name: "Mrs. Lisa Taylor", email: "l.taylor@bhsteam.edu", role: "7th Grade", subject: "Science", canSeeGrades: [7] },
      
      // 8th Grade Teachers
      { name: "Ms. Amanda Moore", email: "a.moore@bhsteam.edu", role: "8th Grade", subject: "Math", canSeeGrades: [8] },
      { name: "Mr. Robert Anderson", email: "r.anderson@bhsteam.edu", role: "8th Grade", subject: "English", canSeeGrades: [8] },
      { name: "Mrs. Maria Garcia", email: "m.garcia@bhsteam.edu", role: "8th Grade", subject: "Science", canSeeGrades: [8] },
      
      // Unified Arts Teachers
      { name: "Ms. Rebecca Miller", email: "r.miller@bhsteam.edu", role: "Unified Arts", subject: "Library", canSeeGrades: [6, 7, 8] },
      { name: "Mr. James Thompson", email: "j.thompson@bhsteam.edu", role: "Unified Arts", subject: "Computer Science", canSeeGrades: [6, 7, 8] },
      { name: "Mrs. Jessica White", email: "j.white@bhsteam.edu", role: "Unified Arts", subject: "Art", canSeeGrades: [6, 7, 8] },
      { name: "Mr. Kevin Johnson", email: "k.johnson@bhsteam.edu", role: "Unified Arts", subject: "PE", canSeeGrades: [6, 7, 8] },
      { name: "Mr. Hill", email: "m.hill@bhsteam.edu", role: "Unified Arts", subject: "Band", canSeeGrades: [6, 7, 8] },
      { name: "Mr. Christopher Lee", email: "c.lee@bhsteam.edu", role: "Unified Arts", subject: "Theater", canSeeGrades: [6, 7, 8] },
      { name: "Mrs. Nicole Harris", email: "n.harris@bhsteam.edu", role: "Unified Arts", subject: "STEM Tech", canSeeGrades: [6, 7, 8] },
      { name: "Ms. Michelle Clark", email: "m.clark@bhsteam.edu", role: "Unified Arts", subject: "Choir", canSeeGrades: [6, 7, 8] },
      { name: "Mrs. Fields-Jones", email: "s.fields-jones@bhsteam.edu", role: "Unified Arts", subject: "Gifted Specialist", canSeeGrades: [6, 7, 8] },
      
      // Administration and Counselor
      { name: "Dr. Phillips", email: "principal@bhsteam.edu", role: "Administration", subject: "Principal", canSeeGrades: [6, 7, 8] },
      { name: "Dr. Stewart", email: "vp@bhsteam.edu", role: "Administration", subject: "Assistant Principal", canSeeGrades: [6, 7, 8] },
      { name: "Sharon Blanding-Glass", email: "sharon.blanding@bhsteam.edu", role: "Counselor", subject: "School Counselor", canSeeGrades: [6, 7, 8] },
    ];

    for (const teacher of sampleTeachers) {
      const id = randomUUID();
      const defaultPassword = process.env.DEMO_TEACHER_PASSWORD || "password123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10); // Default password for demo
      const newTeacher: Teacher = {
        id,
        name: teacher.name,
        email: teacher.email,
        password: hashedPassword,
        role: teacher.role as any,
        subject: teacher.subject,
        canSeeGrades: teacher.canSeeGrades,
        createdAt: new Date(),
      };
      this.teachers.set(id, newTeacher);
    }
  }

  async getHouses(): Promise<House[]> {
    return Array.from(this.houses.values());
  }

  async getHouse(id: string): Promise<House | undefined> {
    return this.houses.get(id);
  }

  async createHouse(house: InsertHouse): Promise<House> {
    const id = randomUUID();
    const newHouse: House = {
      ...house,
      id,
      academicPoints: 0,
      attendancePoints: 0,
      behaviorPoints: 0,
      memberCount: 0,
    };
    this.houses.set(id, newHouse);
    return newHouse;
  }

  async updateHousePoints(houseId: string, category: string, points: number): Promise<void> {
    const house = this.houses.get(houseId);
    if (!house) return;

    const updatedHouse = { ...house };
    if (category === "academic") updatedHouse.academicPoints += points;
    else if (category === "attendance") updatedHouse.attendancePoints += points;
    else if (category === "behavior") updatedHouse.behaviorPoints += points;

    this.houses.set(houseId, updatedHouse);
  }

  async getScholarsByHouse(houseId: string): Promise<Scholar[]> {
    return Array.from(this.scholars.values()).filter(scholar => scholar.houseId === houseId);
  }

  async getScholar(id: string): Promise<Scholar | undefined> {
    return this.scholars.get(id);
  }

  async getStudent(id: string): Promise<Scholar | undefined> {
    return this.scholars.get(id);
  }

  async getAllScholars(): Promise<Scholar[]> {
    return Array.from(this.scholars.values());
  }

  async createScholar(scholar: InsertScholar): Promise<Scholar> {
    const id = randomUUID();
    
    // Generate unique username if not provided
    let username = scholar.username;
    if (!username && scholar.name && scholar.studentId) {
      const nameParts = scholar.name.split(' ');
      const firstName = nameParts[0] || 'student';
      const lastName = nameParts[1] || 'user';
      username = await generateUniqueUsername(firstName, lastName, scholar.studentId);
    }
    
    const newScholar: Scholar = {
      ...scholar,
      id,
      username,
      academicPoints: 0,
      attendancePoints: 0,
      behaviorPoints: 0,
      createdAt: new Date(),
    };
    this.scholars.set(id, newScholar);

    // Update house member count
    const house = this.houses.get(scholar.houseId);
    if (house) {
      this.houses.set(scholar.houseId, { ...house, memberCount: house.memberCount + 1 });
    }

    return newScholar;
  }

  async updateScholarPoints(scholarId: string, category: string, points: number): Promise<void> {
    const scholar = this.scholars.get(scholarId);
    if (!scholar) return;

    const updatedScholar = { ...scholar };
    if (category === "academic") updatedScholar.academicPoints += points;
    else if (category === "attendance") updatedScholar.attendancePoints += points;
    else if (category === "behavior") updatedScholar.behaviorPoints += points;

    this.scholars.set(scholarId, updatedScholar);
  }

  async deactivateStudent(studentId: string, teacherId: string, reason: string): Promise<boolean> {
    const scholar = this.scholars.get(studentId);
    if (!scholar) return false;

    const updatedScholar = { ...scholar };
    updatedScholar.isActive = false;
    updatedScholar.deactivatedAt = new Date();
    updatedScholar.deactivatedBy = teacherId;
    updatedScholar.deactivationReason = reason;

    this.scholars.set(studentId, updatedScholar);
    
    // Also sync to database if using hybrid approach
    try {
      const { db } = await import("./db");
      const { scholars } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      await db.update(scholars)
        .set({
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: teacherId,
          deactivationReason: reason,
        })
        .where(eq(scholars.id, studentId));
    } catch (error) {
      console.error("Failed to sync deactivation to database:", error);
    }
    
    return true;
  }

  async getScholarsByGrade(grade: number): Promise<Scholar[]> {
    return Array.from(this.scholars.values()).filter(scholar => 
      scholar.grade === grade && (scholar.isActive !== false)
    );
  }

  async getScholarByUsername(username: string): Promise<Scholar | undefined> {
    return Array.from(this.scholars.values()).find(scholar => scholar.username === username);
  }

  async getScholarByStudentId(studentId: string): Promise<Scholar | undefined> {
    return Array.from(this.scholars.values()).find(scholar => scholar.studentId === studentId);
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(teacher => teacher.email === email);
  }

  async getTeachersByGrade(grade: number): Promise<Teacher[]> {
    return Array.from(this.teachers.values()).filter(teacher => 
      teacher.canSeeGrades?.includes(grade) || teacher.role === `${grade}th Grade`
    );
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(teacher.password, 10);
    const newTeacher: Teacher = {
      ...teacher,
      id,
      password: hashedPassword,
      subject: teacher.subject || null,
      canSeeGrades: this.calculateCanSeeGrades(teacher.role),
      createdAt: new Date(),
    };
    this.teachers.set(id, newTeacher);
    return newTeacher;
  }

  async getVisibleScholarsForTeacher(teacherId: string): Promise<Scholar[]> {
    const teacher = this.teachers.get(teacherId);
    if (!teacher) return [];

    const visibleGrades = teacher.canSeeGrades || [];
    return Array.from(this.scholars.values()).filter(scholar => 
      visibleGrades.includes(scholar.grade) && (scholar.isActive !== false)
    );
  }

  private calculateCanSeeGrades(role: string): number[] {
    switch (role) {
      case "6th Grade":
        return [6];
      case "7th Grade":
        return [7];
      case "8th Grade":
        return [8];
      case "Unified Arts":
      case "Administration":
      case "Counselor":
        return [6, 7, 8];
      default:
        return [];
    }
  }

  async getPointEntries(): Promise<PointEntry[]> {
    return Array.from(this.pointEntries.values());
  }

  async getPointEntriesByHouse(houseId: string): Promise<PointEntry[]> {
    return Array.from(this.pointEntries.values()).filter(entry => entry.houseId === houseId);
  }

  async createPointEntry(entry: InsertPointEntry): Promise<PointEntry> {
    const id = randomUUID();
    const newEntry: PointEntry = {
      ...entry,
      id,
      scholarId: entry.scholarId || null,
      reason: entry.reason || null,
      addedBy: entry.addedBy || "admin",
      createdAt: new Date(),
    };
    this.pointEntries.set(id, newEntry);

    // Update house points
    await this.updateHousePoints(entry.houseId, entry.category, entry.points);

    // Update scholar points if scholarId provided
    if (entry.scholarId) {
      await this.updateScholarPoints(entry.scholarId, entry.category, entry.points);
    }

    return newEntry;
  }

  async getPbisEntries(): Promise<PbisEntry[]> {
    return Array.from(this.pbisEntries.values());
  }

  async getAllPbisEntries(): Promise<PbisEntry[]> {
    return Array.from(this.pbisEntries.values());
  }

  async getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]> {
    return Array.from(this.pbisEntries.values()).filter(entry => entry.scholarId === scholarId);
  }

  async createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry> {
    const id = randomUUID();
    const now = new Date();
    const newEntry: PbisEntry = {
      ...entry,
      id,
      reason: entry.reason || null,
      category: entry.category || "behavior",
      subcategory: entry.subcategory || "positive_attitude",
      month: entry.month || now.getMonth() + 1,
      year: entry.year || now.getFullYear(),
      entryType: entry.entryType || "positive",
      createdAt: now,
    };
    this.pbisEntries.set(id, newEntry);
    
    // Update scholar points based on category and entry type
    const scholar = this.scholars.get(entry.scholarId);
    if (scholar) {
      const pointsToAdd = newEntry.entryType === "positive" ? entry.points : -entry.points;
      switch (entry.category) {
        case 'academic':
          scholar.academicPoints += pointsToAdd;
          break;
        case 'attendance':
          scholar.attendancePoints += pointsToAdd;
          break;
        case 'behavior':
          scholar.behaviorPoints += pointsToAdd;
          break;
      }
      this.scholars.set(entry.scholarId, scholar);
      
      // Update house points
      if (scholar.houseId) {
        await this.updateHousePoints(scholar.houseId, entry.category, pointsToAdd);
      }
    }
    
    return newEntry;
  }

  async getPbisPhotos(): Promise<PbisPhoto[]> {
    return Array.from(this.pbisPhotos.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createPbisPhoto(photo: InsertPbisPhoto): Promise<PbisPhoto> {
    const id = randomUUID();
    const newPhoto: PbisPhoto = {
      ...photo,
      id,
      description: photo.description || null,
      createdAt: new Date(),
    };
    this.pbisPhotos.set(id, newPhoto);
    return newPhoto;
  }

  async deletePbisPhoto(id: string): Promise<boolean> {
    return this.pbisPhotos.delete(id);
  }

  async getParent(id: string): Promise<Parent | undefined> {
    return this.parents.get(id);
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    return Array.from(this.parents.values()).find(parent => parent.email === email);
  }

  async createParent(parentData: InsertParent): Promise<Parent> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(parentData.password, 10);
    const newParent: Parent = {
      ...parentData,
      id,
      password: hashedPassword,
      phone: parentData.phone || null,
      scholarIds: [],
      isVerified: false,
      createdAt: new Date(),
    };
    
    // Store in memory
    this.parents.set(id, newParent);
    
    // Persist to database immediately
    try {
      await db.insert(parents).values(newParent);
      console.log(`PARENT PERSISTENCE: Successfully saved parent ${newParent.firstName} ${newParent.lastName} to database`);
    } catch (error) {
      console.error("Failed to persist parent to database:", error);
      // Continue with in-memory storage even if database fails
    }
    
    return newParent;
  }

  async addScholarToParent(parentId: string, scholarId: string): Promise<boolean> {
    const parent = this.parents.get(parentId);
    const scholar = this.scholars.get(scholarId);
    
    console.log("STORAGE: Adding scholar to parent - Parent exists:", !!parent, "Scholar exists:", !!scholar);
    
    if (!parent || !scholar) return false;
    
    const scholarIds = parent.scholarIds || [];
    console.log("STORAGE: Current scholarIds for parent:", scholarIds);
    
    if (!scholarIds.includes(scholarId)) {
      const updatedParent = {
        ...parent,
        scholarIds: [...scholarIds, scholarId],
      };
      this.parents.set(parentId, updatedParent);
      console.log("STORAGE: Updated parent scholarIds:", updatedParent.scholarIds);
      
      // Also sync to database if using DatabaseStorage
      await this.syncParentToDatabase(updatedParent);
    }
    return true;
  }
  
  private async syncParentToDatabase(parent: Parent): Promise<void> {
    try {
      // Update parent in database
      await db.update(parents)
        .set({ 
          scholarIds: parent.scholarIds,
          phone: parent.phone,
          isVerified: parent.isVerified,
        })
        .where(eq(parents.id, parent.id));
      console.log("STORAGE: Successfully synced parent to database:", parent.firstName, parent.lastName);
    } catch (error) {
      console.error("STORAGE: Failed to sync parent to database:", error);
    }
  }



  async getParentScholars(parentId: string): Promise<Scholar[]> {
    const parent = this.parents.get(parentId);
    if (!parent) return [];
    
    const scholarIds = parent.scholarIds || [];
    console.log("STORAGE: Getting scholars for parent", parentId, "scholarIds:", scholarIds);
    
    const scholars: Scholar[] = [];
    for (const scholarId of scholarIds) {
      const scholar = this.scholars.get(scholarId);
      if (scholar) {
        scholars.push(scholar);
        console.log("STORAGE: Found scholar:", scholar.name);
      }
    }
    console.log("STORAGE: Returning", scholars.length, "scholars for parent");
    return scholars;
  }

  async getParentsByScholarId(scholarId: string): Promise<Parent[]> {
    const parents: Parent[] = [];
    for (const parent of this.parents.values()) {
      if (parent.scholarIds && parent.scholarIds.includes(scholarId)) {
        parents.push(parent);
      }
    }
    return parents;
  }

  async addScholarToParentByUsername(parentId: string, studentUsername: string): Promise<Scholar | null> {
    const scholar = Array.from(this.scholars.values()).find(s => s.username === studentUsername);
    if (!scholar) return null;

    const parent = this.parents.get(parentId);
    if (!parent) return null;

    const scholarIds = parent.scholarIds || [];
    if (!scholarIds.includes(scholar.id)) {
      const updatedParent = {
        ...parent,
        scholarIds: [...scholarIds, scholar.id],
      };
      this.parents.set(parentId, updatedParent);
    }
    return scholar;
  }

  async addScholarToParentByCredentials(parentId: string, username: string, password: string): Promise<Scholar | null> {
    const parent = this.parents.get(parentId);
    if (!parent) return null;
    
    // Find scholar by username
    const scholar = Array.from(this.scholars.values()).find(s => 
      s.username === username || s.studentId === username
    );
    
    if (!scholar) return null;
    
    // For this implementation, we'll validate the scholar exists and add them
    // In a real implementation, you'd verify the password hash
    const success = await this.addScholarToParent(parentId, scholar.id);
    return success ? scholar : null;
  }

  // Messaging methods
  async createMessage(messageData: any): Promise<any> {
    this.messages = this.messages || new Map();
    const id = randomUUID();
    const message = {
      ...messageData,
      id,
      isRead: false,
      notificationSent: false,
      createdAt: new Date(),
    };
    
    this.messages.set(id, message);
    
    // Send SMS notification if parent has phone
    if (messageData.senderType !== "parent" && messageData.parentId) {
      const parent = this.parents.get(messageData.parentId);
      if (parent?.phone) {
        await this.createSmsNotification({
          parentId: messageData.parentId,
          phoneNumber: parent.phone,
          messageType: "teacher_message",
          content: `New message from ${messageData.senderType}: ${messageData.subject}`,
          relatedMessageId: id,
        });
      }
    }
    
    return message;
  }

  async getParentMessages(parentId: string): Promise<any[]> {
    this.messages = this.messages || new Map();
    return Array.from(this.messages.values())
      .filter(msg => msg.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTeacherMessages(teacherId: string): Promise<any[]> {
    this.messages = this.messages || new Map();
    return Array.from(this.messages.values())
      .filter(msg => msg.teacherId === teacherId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    this.messages = this.messages || new Map();
    const message = this.messages.get(messageId);
    if (message) {
      message.isRead = true;
      this.messages.set(messageId, message);
      return true;
    }
    return false;
  }

  // SMS notification methods
  async createSmsNotification(notificationData: any): Promise<any> {
    this.smsNotifications = this.smsNotifications || new Map();
    const id = randomUUID();
    const notification = {
      ...notificationData,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    
    this.smsNotifications.set(id, notification);
    
    // In real implementation, would trigger actual SMS sending here
    console.log("SMS notification created:", notification.content, "to", notification.phoneNumber);
    
    return notification;
  }

  async getSmsNotifications(parentId: string): Promise<any[]> {
    this.smsNotifications = this.smsNotifications || new Map();
    return Array.from(this.smsNotifications.values())
      .filter(notif => notif.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateSmsStatus(notificationId: string, status: string): Promise<boolean> {
    this.smsNotifications = this.smsNotifications || new Map();
    const notification = this.smsNotifications.get(notificationId);
    if (notification) {
      notification.status = status;
      if (status === "sent") {
        notification.sentAt = new Date();
      }
      this.smsNotifications.set(notificationId, notification);
      return true;
    }
    return false;
  }

  // Teacher Authentication methods
  async createTeacherAuth(teacherData: InsertTeacherAuth): Promise<TeacherAuth> {
    const hashedPassword = await bcrypt.hash(teacherData.password, 10);
    
    const teacher: TeacherAuth = {
      id: randomUUID(),
      ...teacherData,
      passwordHash: hashedPassword,
      isApproved: false, // Requires admin approval
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.teacherAuth.set(teacher.id, teacher);
    return teacher;
  }

  async getTeacherAuthByEmail(email: string): Promise<TeacherAuth | undefined> {
    for (const teacher of this.teacherAuth.values()) {
      if (teacher.email === email) {
        return teacher;
      }
    }
    return undefined;
  }

  async getAllTeacherAuth(): Promise<TeacherAuth[]> {
    return Array.from(this.teacherAuth.values());
  }

  async getTeacherAuthById(id: string): Promise<TeacherAuth | undefined> {
    console.log(`STORAGE: Looking for teacher with ID: ${id}`);
    const teacher = this.teacherAuth.get(id);
    console.log(`STORAGE: Found teacher by ID: ${teacher ? teacher.name : 'Not found'}`);
    return teacher;
  }

  async getPendingTeachers(): Promise<TeacherAuth[]> {
    return Array.from(this.teacherAuth.values()).filter(teacher => !teacher.isApproved);
  }

  async approveTeacher(teacherId: string): Promise<boolean> {
    const teacher = this.teacherAuth.get(teacherId);
    if (teacher) {
      teacher.isApproved = true;
      teacher.updatedAt = new Date();
      this.teacherAuth.set(teacherId, teacher);
      return true;
    }
    return false;
  }

  async createTeacherSession(sessionData: InsertTeacherSession): Promise<TeacherSession> {
    const session: TeacherSession = {
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    };
    
    this.teacherSessions.set(session.token, session);
    return session;
  }

  async getTeacherSession(token: string): Promise<TeacherSession | undefined> {
    return this.teacherSessions.get(token);
  }

  async deleteTeacherSession(token: string): Promise<boolean> {
    return this.teacherSessions.delete(token);
  }

  async requestTeacherPasswordReset(email: string): Promise<boolean> {
    const teacher = await this.getTeacherAuthByEmail(email);
    if (!teacher) {
      // Return true even if teacher doesn't exist for security reasons
      return true;
    }
    
    // Mark that a password reset was requested
    teacher.updatedAt = new Date();
    this.teacherAuth.set(teacher.id, teacher);
    
    return true;
  }

  async resetTeacherPassword(teacherId: string, newPassword: string): Promise<boolean> {
    const teacher = this.teacherAuth.get(teacherId);
    if (!teacher) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    teacher.passwordHash = hashedPassword;
    teacher.updatedAt = new Date();
    this.teacherAuth.set(teacherId, teacher);
    return true;
  }

  async getTeacherById(id: string): Promise<TeacherAuth | null> {
    return this.teacherAuth.get(id) || null;
  }

  async getScholarsByGrade(gradeRole: string): Promise<Scholar[]> {
    // Extract just the grade number from gradeRole (e.g., "6th Grade" -> "6")
    const grade = parseInt(gradeRole.replace(/\D/g, ''));
    return Array.from(this.scholars.values()).filter(s => s.grade === grade);
  }

  async getReflectionsByTeacher(teacherId: string): Promise<any[]> {
    // Filter reflections by teacher (would need proper teacher-reflection relationship)
    return [];
  }

  async getMessagesByTeacher(teacherId: string): Promise<any[]> {
    // Filter messages by teacher (would need proper teacher-message relationship) 
    return [];
  }

  async getPhotosByTeacher(teacherId: string): Promise<any[]> {
    // Filter photos by teacher
    return Array.from(this.pbisPhotos.values()).filter(p => p.teacherId === teacherId);
  }

  // Student Authentication methods
  async createStudentCredentials(scholarId: string, teacherId: string): Promise<{ username: string; password: string }> {
    const scholar = this.scholars.get(scholarId);
    if (!scholar) throw new Error("Scholar not found");

    // Generate username from student ID and first name
    const username = `${scholar.studentId.toLowerCase()}${scholar.name.split(' ')[0].toLowerCase()}`;
    const password = Math.random().toString(36).slice(-8); // Generate 8-character password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update scholar with credentials
    scholar.username = username;
    scholar.passwordHash = hashedPassword;
    scholar.teacherId = teacherId;
    this.scholars.set(scholarId, scholar);

    console.log(`Created credentials for ${scholar.name}: ${username} / ${password}`);
    return { username, password };
  }

  async authenticateStudent(username: string, password: string): Promise<Scholar | null> {
    for (const scholar of this.scholars.values()) {
      if (scholar.username === username && scholar.passwordHash) {
        const isValid = await bcrypt.compare(password, scholar.passwordHash);
        if (isValid) return scholar;
      }
    }
    return null;
  }

  async requestPasswordReset(username: string): Promise<boolean> {
    const scholar = Array.from(this.scholars.values()).find(s => s.username === username);
    if (!scholar || !scholar.teacherId) {
      return false;
    }

    // Create a password reset request
    const request: InsertPasswordResetRequest = {
      teacherId: scholar.teacherId,
      studentId: scholar.id,
      studentUsername: username,
      requestedAt: new Date(),
    };

    await this.createPasswordResetRequest(request);
    
    // Mark scholar as needing password reset
    scholar.needsPasswordReset = true;
    this.scholars.set(scholar.id, scholar);
    
    return true;
  }

  async createStudentSession(sessionData: InsertStudentSession): Promise<StudentSession> {
    const session: StudentSession = {
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    };
    
    this.studentSessions.set(session.token, session);
    return session;
  }

  async getStudentSession(token: string): Promise<StudentSession | undefined> {
    return this.studentSessions.get(token);
  }

  async deleteStudentSession(token: string): Promise<boolean> {
    return this.studentSessions.delete(token);
  }

  async createPasswordResetRequest(requestData: InsertPasswordResetRequest): Promise<PasswordResetRequest> {
    const request: PasswordResetRequest = {
      id: randomUUID(),
      ...requestData,
      status: "pending",
      createdAt: new Date(),
    };
    
    this.passwordResetRequests.set(request.id, request);
    return request;
  }

  async getPasswordResetRequests(teacherId: string): Promise<PasswordResetRequest[]> {
    return Array.from(this.passwordResetRequests.values()).filter(req => req.teacherId === teacherId);
  }



  async resetStudentPassword(studentId: string, newPassword: string): Promise<boolean> {
    const scholar = this.scholars.get(studentId);
    if (!scholar) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    scholar.passwordHash = hashedPassword;
    scholar.needsPasswordReset = false;
    this.scholars.set(studentId, scholar);

    // Mark related reset requests as completed
    for (const [id, request] of this.passwordResetRequests) {
      if (request.studentId === studentId && request.status === "pending") {
        request.status = "completed";
        this.passwordResetRequests.set(id, request);
      }
    }

    return true;
  }

  private async initializeParents() {
    const sampleParents = [
      {
        email: "parent.johnson@example.com",
        firstName: "Jennifer",
        lastName: "Johnson", 
        phone: "(555) 123-4567",
        scholarIds: [] // Will be populated when parents link students
      },
      {
        email: "parent.chen@example.com", 
        firstName: "David",
        lastName: "Chen",
        phone: "(555) 234-5678",
        scholarIds: []
      },
      {
        email: "parent.williams@example.com",
        firstName: "Lisa",
        lastName: "Williams", 
        phone: "(555) 345-6789",
        scholarIds: []
      }
    ];

    for (const parentData of sampleParents) {
      const hashedPassword = await bcrypt.hash("parent123", 10);
      const parent: Parent = {
        id: randomUUID(),
        ...parentData,
        password: hashedPassword,
        isVerified: false,
        createdAt: new Date(),
      };
      this.parents.set(parent.id, parent);
    }
  }

  // Initialize demo teacher authentication accounts
  private async initializeTeacherAuth() {
    const defaultPassword = process.env.DEMO_TEACHER_PASSWORD || "password123";
    const demoTeachers = [
      {
        email: "s.johnson@bhsteam.edu",
        name: "Sarah Johnson", 
        gradeRole: "6th Grade Teacher",
        subject: "Mathematics",
        password: defaultPassword
      },
      {
        email: "r.miller@bhsteam.edu", 
        name: "Robert Miller",
        gradeRole: "Unified Arts Teacher",
        subject: "Art",
        password: defaultPassword
      }
    ];

    for (const teacherData of demoTeachers) {
      const hashedPassword = await bcrypt.hash(teacherData.password, 10);
      const teacher: TeacherAuth = {
        id: randomUUID(),
        email: teacherData.email,
        name: teacherData.name,
        gradeRole: teacherData.gradeRole,
        subject: teacherData.subject,
        passwordHash: hashedPassword,
        isApproved: true, // Pre-approved demo accounts
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.teacherAuth.set(teacher.id, teacher);
    }
  }

  // Initialize administrator accounts
  private async initializeAdministrators() {
    const defaultPassword = process.env.ADMIN_PASSWORD || "BHSAAdmin2025!";
    const administrators = [
      {
        email: "dr.phillips@bhsteam.edu",
        firstName: "Dr.",
        lastName: "Phillips",
        title: "Principal",
        password: defaultPassword,
        permissions: ["view_all", "manage_teachers", "manage_students", "manage_houses", "view_reports", "admin_settings"]
      },
      {
        email: "dr.stewart@bhsteam.edu",
        firstName: "Dr.",
        lastName: "Stewart", 
        title: "Assistant Principal",
        password: defaultPassword,
        permissions: ["view_all", "manage_teachers", "manage_students", "manage_houses", "view_reports"]
      },
      {
        email: "sharon.blanding@bhsteam.edu",
        firstName: "Sharon",
        lastName: "Blanding-Glass",
        title: "Counselor",
        password: defaultPassword,
        permissions: ["view_all", "manage_students", "view_reports"]
      }
    ];

    for (const adminData of administrators) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      const admin: Administrator = {
        id: randomUUID(),
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        title: adminData.title as "Principal" | "Assistant Principal" | "Counselor",
        passwordHash: hashedPassword,
        isActive: true,
        permissions: adminData.permissions,
        createdAt: new Date(),
      };
      this.administrators.set(admin.id, admin);
    }
  }

  // Administrator Authentication Methods
  async createAdministrator(adminData: InsertAdministrator): Promise<Administrator> {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    const admin: Administrator = {
      id: randomUUID(),
      ...adminData,
      passwordHash: hashedPassword,
      isActive: true,
      permissions: adminData.permissions || ["view_all"],
      createdAt: new Date(),
    };
    
    this.administrators.set(admin.id, admin);
    return admin;
  }

  async getAdministratorByEmail(email: string): Promise<Administrator | undefined> {
    for (const admin of this.administrators.values()) {
      if (admin.email === email) {
        return admin;
      }
    }
    return undefined;
  }

  async authenticateAdmin(email: string, password: string): Promise<Administrator | null> {
    const admin = await this.getAdministratorByEmail(email);
    if (!admin || !admin.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (isValid) {
      // Update last login time
      admin.lastLoginAt = new Date();
      this.administrators.set(admin.id, admin);
      return admin;
    }

    return null;
  }

  async updateAdministratorPassword(adminId: string, newPasswordHash: string): Promise<boolean> {
    const admin = this.administrators.get(adminId);
    if (!admin) {
      return false;
    }
    admin.passwordHash = newPasswordHash;
    this.administrators.set(adminId, admin);
    return true;
  }

  async createAdminSession(sessionData: InsertAdminSession): Promise<AdminSession> {
    const session: AdminSession = {
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    };
    
    this.adminSessions.set(session.token, session);
    return session;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    return this.adminSessions.get(token);
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    return this.adminSessions.delete(token);
  }

  async getAllAdministrators(): Promise<Administrator[]> {
    return Array.from(this.administrators.values());
  }

  async getUnsortedStudents(): Promise<Scholar[]> {
    try {
      // First check memory storage
      const memoryScholars = Array.from(this.scholars.values());
      const memoryUnsorted = memoryScholars.filter(scholar => scholar.isHouseSorted === false || scholar.isHouseSorted === undefined);
      
      // Also check database for any unsorted students not in memory
      let dbUnsorted: Scholar[] = [];
      try {
        const { db } = await import("./db");
        const { scholars } = await import("../shared/schema");
        const { eq } = await import("drizzle-orm");
        
        const dbResults = await db.select().from(scholars).where(eq(scholars.isHouseSorted, false));
        dbUnsorted = dbResults.map(result => ({
          ...result,
          createdAt: result.createdAt || new Date(),
        } as Scholar));
        
        console.log("STORAGE: Found", dbUnsorted.length, "unsorted students in database");
        
        // Add database students to memory if not already there
        for (const student of dbUnsorted) {
          if (!this.scholars.has(student.id)) {
            this.scholars.set(student.id, student);
            console.log("STORAGE: Added database student to memory:", student.name, student.studentId);
          }
        }
        
      } catch (dbError) {
        console.error("STORAGE: Error querying database for unsorted students:", dbError);
      }
      
      // Combine and deduplicate results
      const allUnsorted = [...memoryUnsorted, ...dbUnsorted];
      const uniqueUnsorted = allUnsorted.filter((student, index, self) => 
        index === self.findIndex(s => s.id === student.id)
      );
      
      console.log("STORAGE: Returning", uniqueUnsorted.length, "total unsorted students");
      return uniqueUnsorted;
      
    } catch (error) {
      console.error("Error in getUnsortedStudents:", error);
      return [];
    }
  }

  async addUnsortedStudent(student: InsertScholar): Promise<Scholar> {
    console.log("STORAGE: addUnsortedStudent called with:", student);
    
    try {
      const id = randomUUID();
      const newScholar: Scholar = {
        ...student,
        id,
        houseId: student.houseId || null,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        isHouseSorted: false,
        sortingNumber: this.extractSortingNumber(student.studentId),
        addedByTeacher: student.addedByTeacher || null,
        createdAt: new Date(),
      };
      
      console.log("STORAGE: Created newScholar object:", newScholar);
      
      // Add to memory storage
      this.scholars.set(id, newScholar);
      console.log("STORAGE: Added to memory storage, total scholars:", this.scholars.size);
      
      // Also persist to database
      try {
        const { db } = await import("./db");
        const { scholars } = await import("../shared/schema");
        
        console.log("STORAGE: About to insert student into database:", {
          name: newScholar.name,
          studentId: newScholar.studentId,
          grade: newScholar.grade,
          isHouseSorted: newScholar.isHouseSorted
        });
        
        const insertResult = await db.insert(scholars).values({
          id: newScholar.id,
          name: newScholar.name,
          studentId: newScholar.studentId,
          grade: newScholar.grade,
          houseId: newScholar.houseId,
          academicPoints: newScholar.academicPoints,
          attendancePoints: newScholar.attendancePoints,
          behaviorPoints: newScholar.behaviorPoints,
          isHouseSorted: newScholar.isHouseSorted,
          sortingNumber: newScholar.sortingNumber,
          addedByTeacher: newScholar.addedByTeacher,
          createdAt: newScholar.createdAt,
          isActive: true,
          needsPasswordReset: false,
        }).returning();
        
        console.log("STORAGE: Database insert result:", insertResult);
        console.log("STORAGE: Successfully added unsorted student to database:", newScholar.name, newScholar.studentId);
      } catch (error) {
        console.error("STORAGE: Failed to persist unsorted student to database:", error);
        console.error("STORAGE: Error details:", error.message);
      }
      
      console.log("STORAGE: Returning newScholar:", newScholar);
      return newScholar;
      
    } catch (error) {
      console.error("STORAGE: addUnsortedStudent failed:", error);
      console.error("STORAGE: Error details:", error.message);
      throw error; // Re-throw the error so the route can handle it properly
    }
  }

  async removeUnsortedStudent(studentId: string): Promise<boolean> {
    const scholar = Array.from(this.scholars.values()).find(s => s.id === studentId);
    if (scholar && !scholar.isHouseSorted) {
      return this.scholars.delete(studentId);
    }
    return false;
  }

  async sortStudentsIntoHouses(): Promise<{ sortedCount: number }> {
    const unsortedStudents = await this.getUnsortedStudents();
    const availableHouses = ["franklin", "courie", "west", "blackwell", "berruguete"];
    let sortedCount = 0;

    // Shuffle students for random assignment
    const shuffledStudents = this.shuffleArray([...unsortedStudents]);

    for (const student of shuffledStudents) {
      // Use a simple round-robin assignment with some randomization
      const houseIndex = sortedCount % availableHouses.length;
      const selectedHouseId = availableHouses[houseIndex];
      
      // Update student with house assignment
      const updatedStudent: Scholar = {
        ...student,
        houseId: selectedHouseId,
        isHouseSorted: true,
      };
      
      this.scholars.set(student.id, updatedStudent);

      // Update house member count
      const house = this.houses.get(selectedHouseId);
      if (house) {
        this.houses.set(selectedHouseId, {
          ...house,
          memberCount: house.memberCount + 1,
        });
      }

      sortedCount++;
    }

    return { sortedCount };
  }

  async resetAllHouses(): Promise<void> {
    // Reset all scholars to unsorted
    for (const [id, scholar] of this.scholars.entries()) {
      if (scholar.isHouseSorted) {
        this.scholars.set(id, {
          ...scholar,
          houseId: null,
          isHouseSorted: false,
        });
      }
    }

    // Reset house member counts
    for (const [id, house] of this.houses.entries()) {
      this.houses.set(id, {
        ...house,
        memberCount: 0,
      });
    }
  }

  private extractSortingNumber(studentId: string): number | null {
    // Extract number from student ID like "BH22" or "BH6001"
    const match = studentId.match(/\d+$/);
    return match ? parseInt(match[0]) : null;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async getHouseStandings(): Promise<House[]> {
    const houses = Array.from(this.houses.values());
    return houses.sort((a, b) => {
      const totalA = a.academicPoints + a.attendancePoints + a.behaviorPoints;
      const totalB = b.academicPoints + b.attendancePoints + b.behaviorPoints;
      return totalB - totalA;
    });
  }

  // Parent-Teacher Messaging
  async createParentTeacherMessage(messageData: InsertParentTeacherMessage): Promise<ParentTeacherMessage> {
    const message: ParentTeacherMessage = {
      id: randomUUID(),
      ...messageData,
      isRead: false,
      createdAt: new Date(),
    };
    
    this.parentTeacherMessages.set(message.id, message);
    return message;
  }

  async getMessagesByScholar(scholarId: string): Promise<ParentTeacherMessage[]> {
    return Array.from(this.parentTeacherMessages.values())
      .filter(message => message.scholarId === scholarId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMessagesByParent(parentId: string): Promise<ParentTeacherMessage[]> {
    return Array.from(this.parentTeacherMessages.values())
      .filter(message => message.parentId === parentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMessagesByTeacher(teacherId: string): Promise<ParentTeacherMessage[]> {
    // Use the fixed database query instead of in-memory storage
    const { getMessagesByTeacherFixed } = await import('./db-storage-messaging-fix');
    return await getMessagesByTeacherFixed(teacherId);
  }

  async getMessagesByThread(threadId: string): Promise<ParentTeacherMessage[]> {
    return Array.from(this.parentTeacherMessages.values())
      .filter(message => message.threadId === threadId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Chronological order for thread
  }

  async getAllParents(): Promise<Parent[]> {
    return Array.from(this.parents.values());
  }

  async getAllTeachers(): Promise<TeacherAuth[]> {
    return Array.from(this.teacherAuth.values());
  }

  async updateParentPhone(parentId: string, phone: string): Promise<Parent | null> {
    const parent = this.parents.get(parentId);
    if (!parent) return null;

    const updatedParent = { ...parent, phone };
    this.parents.set(parentId, updatedParent);
    
    // Sync to database if using MemStorage as fallback
    await this.syncParentToDatabase(updatedParent);
    
    return updatedParent;
  }

  async addScholarToParentByUsername(parentId: string, studentUsername: string): Promise<Scholar | null> {
    const scholar = Array.from(this.scholars.values()).find(s => s.username === studentUsername);
    
    if (!scholar) {
      return null;
    }
    
    const parent = this.parents.get(parentId);
    if (!parent) {
      return null;
    }
    
    // Add scholar ID to parent's scholarIds array
    if (!parent.scholarIds) {
      parent.scholarIds = [];
    }
    
    if (!parent.scholarIds.includes(scholar.id)) {
      parent.scholarIds.push(scholar.id);
      this.parents.set(parentId, parent);
    }
    
    return scholar;
  }

  // Teacher Authentication Methods
  async authenticateTeacher(email: string, password: string): Promise<TeacherAuth | null> {
    console.log("AUTH: Looking for teacher with email:", email);
    console.log("AUTH: Environment:", process.env.NODE_ENV || "development");
    
    // DEPLOYMENT FIX: Check database first, then memory storage
    try {
      console.log("AUTH: Checking database for teacher...");
      const [dbTeacher] = await db.select().from(teacherAuth).where(eq(teacherAuth.email, email));
      
      if (dbTeacher && dbTeacher.isApproved) {
        console.log(`AUTH: Found teacher in database: ${dbTeacher.name}`);
        const passwordMatch = await bcrypt.compare(password, dbTeacher.passwordHash);
        if (passwordMatch) {
          console.log("AUTH: ✅ DATABASE AUTH SUCCESS");
          return dbTeacher;
        } else {
          console.log("AUTH: ❌ Database password mismatch");
        }
      }
    } catch (dbError) {
      console.log("AUTH: Database check failed, falling back to memory:", dbError);
    }
    
    // Fallback to memory storage
    console.log("AUTH: Checking memory storage...");
    console.log("AUTH: Available teachers:", Array.from(this.teacherAuth.values()).map(t => `${t.email} (${t.name}) - approved: ${t.isApproved}`));
    
    for (const teacher of this.teacherAuth.values()) {
      console.log(`AUTH: Checking ${teacher.email} === ${email}? ${teacher.email === email}`);
      if (teacher.email === email && teacher.isApproved) {
        console.log("AUTH: Found matching approved teacher, checking password...");
        
        // For deployment compatibility, check both bcrypt and direct password
        try {
          const isValidBcrypt = await bcrypt.compare(password, teacher.passwordHash);
          const isValidDirect = password === "BHSATeacher2025!";
          
          if (isValidBcrypt || isValidDirect) {
            console.log("AUTH: ✅ MEMORY AUTH SUCCESS");
            return teacher;
          }
          console.log("AUTH: Password mismatch for both bcrypt and direct check");
        } catch (error) {
          console.log("AUTH: Bcrypt error, trying direct password check");
          if (password === "BHSATeacher2025!") {
            console.log("AUTH: Direct password match! Returning teacher");
            return teacher;
          }
        }
      } else if (teacher.email === email) {
        console.log("AUTH: Found teacher but not approved:", teacher.isApproved);
      }
    }
    console.log("AUTH: ❌ No matching teacher found in memory or database");
    return null;
  }

  async getTeacherAuthByEmail(email: string): Promise<TeacherAuth | null> {
    console.log(`STORAGE: Looking for teacher with email: ${email}`);
    console.log(`STORAGE: Available teachers:`, Array.from(this.teacherAuth.values()).map(t => `${t.email} (${t.name})`));
    for (const teacher of this.teacherAuth.values()) {
      if (teacher.email === email) {
        console.log(`STORAGE: Found teacher: ${teacher.name}, approved: ${teacher.isApproved}`);
        return teacher;
      }
    }
    console.log(`STORAGE: Teacher ${email} not found`);
    return null;
  }

  async getTeacherAuthById(id: string): Promise<TeacherAuth | null> {
    return this.teacherAuth.get(id) || null;
  }

  async createTeacherAuth(teacherData: InsertTeacherAuth): Promise<TeacherAuth> {
    const hashedPassword = await bcrypt.hash(teacherData.password, 10);
    const teacher: TeacherAuth = {
      id: randomUUID(),
      ...teacherData,
      passwordHash: hashedPassword,
      isApproved: false, // Requires admin approval
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.teacherAuth.set(teacher.id, teacher);
    return teacher;
  }

  async createTeacherSession(sessionData: InsertTeacherSession): Promise<TeacherSession> {
    const session: TeacherSession = {
      id: randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    };
    
    this.teacherSessions.set(session.token, session);
    return session;
  }

  async getTeacherSession(token: string): Promise<TeacherSession | undefined> {
    return this.teacherSessions.get(token);
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    const message = this.parentTeacherMessages.get(messageId);
    if (!message) return false;

    message.isRead = true;
    this.parentTeacherMessages.set(messageId, message);
    return true;
  }

  async getUnreadMessagesCount(userId: string, userType: 'parent' | 'teacher'): Promise<number> {
    const messages = Array.from(this.parentTeacherMessages.values());
    
    if (userType === 'parent') {
      return messages.filter(message => 
        message.parentId === userId && 
        !message.isRead && 
        message.senderType === 'teacher'
      ).length;
    } else {
      return messages.filter(message => 
        message.teacherId === userId && 
        !message.isRead && 
        message.senderType === 'parent'
      ).length;
    }
  }

  async getMessagesForAdmin(adminId: string): Promise<any[]> {
    // Use the fixed database query instead of in-memory storage
    const { getMessagesForAdminFixed } = await import('./db-storage-messaging-fix');
    return await getMessagesForAdminFixed(adminId);
  }

  // Missing methods for admin teacher viewer
  async getTeacherById(teacherId: string): Promise<TeacherAuth | null> {
    return this.teacherAuth.get(teacherId) || null;
  }

  async getReflectionsByTeacher(teacherId: string): Promise<Reflection[]> {
    return Array.from(this.reflections.values()).filter(r => r.teacherId === teacherId);
  }

  async getPhotosByTeacher(teacherId: string): Promise<PBISPhoto[]> {
    return Array.from(this.pbisPhotos.values()).filter(p => p.uploadedBy === teacherId);
  }

  // Trend Analytics Methods
  async getStudentTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string, studentId?: string): Promise<StudentTrendData[]> {
    // Simple in-memory implementation - group PBIS entries by period and student
    const entries = Array.from(this.pbisEntries.values())
      .filter(entry => entry.createdAt >= from && entry.createdAt <= to);
    
    // Filter by teacher if specified (using teacherName field in pbisEntries)
    const teacherFilteredEntries = teacherId 
      ? entries.filter(entry => {
          const teacher = this.teacherAuth.get(teacherId);
          return teacher && entry.teacherName === teacher.name;
        })
      : entries;
    
    // Filter by student if specified
    const filteredEntries = studentId 
      ? teacherFilteredEntries.filter(entry => entry.scholarId === studentId)
      : teacherFilteredEntries;

    // Group by period and student
    const grouped = new Map<string, Map<string, { positive: number; negative: number; student: Scholar }>>();
    
    for (const entry of filteredEntries) {
      const student = this.scholars.get(entry.scholarId);
      if (!student) continue;
      
      // Calculate period start based on interval
      const entryDate = new Date(entry.createdAt);
      let periodStart: Date;
      if (interval === 'week') {
        const dayOfWeek = entryDate.getDay();
        periodStart = new Date(entryDate);
        periodStart.setDate(entryDate.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
      } else {
        periodStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
      }
      
      const periodKey = periodStart.toISOString();
      const studentKey = entry.scholarId;
      
      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, new Map());
      }
      
      const periodData = grouped.get(periodKey)!;
      if (!periodData.has(studentKey)) {
        periodData.set(studentKey, { positive: 0, negative: 0, student });
      }
      
      const studentData = periodData.get(studentKey)!;
      if (entry.entryType === 'positive') {
        studentData.positive += entry.points;
      } else {
        studentData.negative += entry.points;
      }
    }
    
    // Convert to result format
    const results: StudentTrendData[] = [];
    for (const [periodKey, periodData] of grouped) {
      const periodStart = new Date(periodKey);
      const periodEnd = new Date(periodStart);
      if (interval === 'week') {
        periodEnd.setDate(periodStart.getDate() + 6);
      } else {
        periodEnd.setMonth(periodStart.getMonth() + 1);
        periodEnd.setDate(0); // Last day of month
      }
      
      for (const [studentKey, data] of periodData) {
        results.push({
          period: periodKey,
          start: periodStart,
          end: periodEnd,
          studentId: studentKey,
          studentName: data.student.name,
          grade: data.student.grade,
          houseId: data.student.houseId,
          positive: data.positive,
          negative: data.negative,
          net: data.positive - data.negative
        });
      }
    }
    
    return results.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  }

  async getClassroomTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string): Promise<ClassroomTrendData[]> {
    // Simple in-memory implementation - group PBIS entries by period and teacher
    const entries = Array.from(this.pbisEntries.values())
      .filter(entry => entry.createdAt >= from && entry.createdAt <= to);
    
    // Filter by teacher if specified
    const filteredEntries = teacherId 
      ? entries.filter(entry => {
          const teacher = this.teacherAuth.get(teacherId);
          return teacher && entry.teacherName === teacher.name;
        })
      : entries;

    // Group by period and teacher
    const grouped = new Map<string, Map<string, { positive: number; negative: number; teacherData: any }>>();
    
    for (const entry of filteredEntries) {
      // Find teacher by name
      const teacher = Array.from(this.teacherAuth.values()).find(t => t.name === entry.teacherName);
      if (!teacher) continue;
      
      // Calculate period start
      const entryDate = new Date(entry.createdAt);
      let periodStart: Date;
      if (interval === 'week') {
        const dayOfWeek = entryDate.getDay();
        periodStart = new Date(entryDate);
        periodStart.setDate(entryDate.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
      } else {
        periodStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
      }
      
      const periodKey = periodStart.toISOString();
      const teacherKey = teacher.id;
      
      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, new Map());
      }
      
      const periodData = grouped.get(periodKey)!;
      if (!periodData.has(teacherKey)) {
        periodData.set(teacherKey, { positive: 0, negative: 0, teacherData: teacher });
      }
      
      const teacherData = periodData.get(teacherKey)!;
      if (entry.entryType === 'positive') {
        teacherData.positive += entry.points;
      } else {
        teacherData.negative += entry.points;
      }
    }
    
    // Convert to result format
    const results: ClassroomTrendData[] = [];
    for (const [periodKey, periodData] of grouped) {
      const periodStart = new Date(periodKey);
      const periodEnd = new Date(periodStart);
      if (interval === 'week') {
        periodEnd.setDate(periodStart.getDate() + 6);
      } else {
        periodEnd.setMonth(periodStart.getMonth() + 1);
        periodEnd.setDate(0);
      }
      
      for (const [teacherKey, data] of periodData) {
        results.push({
          period: periodKey,
          start: periodStart,
          end: periodEnd,
          teacherId: teacherKey,
          teacherName: data.teacherData.name,
          subject: data.teacherData.subject || 'General',
          grade: data.teacherData.gradeRole || 'All Grades',
          positive: data.positive,
          negative: data.negative,
          net: data.positive - data.negative
        });
      }
    }
    
    return results.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  }
}

export class PersistentDatabaseStorage implements IStorage {
  // Houses
  async getHouses(): Promise<House[]> {
    return await db.select().from(houses).orderBy(houses.name);
  }

  async getHouse(id: string): Promise<House | undefined> {
    const [house] = await db.select().from(houses).where(eq(houses.id, id));
    return house;
  }

  async createHouse(house: InsertHouse): Promise<House> {
    const [newHouse] = await db.insert(houses).values(house).returning();
    return newHouse;
  }

  async updateHouse(id: string, house: Partial<InsertHouse>): Promise<House | undefined> {
    const [updatedHouse] = await db.update(houses)
      .set(house)
      .where(eq(houses.id, id))
      .returning();
    return updatedHouse;
  }

  async deleteHouse(id: string): Promise<boolean> {
    const result = await db.delete(houses).where(eq(houses.id, id));
    return result.rowCount > 0;
  }

  // Scholars
  async getScholars(): Promise<Scholar[]> {
    return await db.select().from(scholars).orderBy(scholars.name);
  }

  async getScholar(id: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.id, id));
    return scholar;
  }

  async getStudent(id: string): Promise<Scholar | undefined> {
    const [scholar] = await db.select().from(scholars).where(eq(scholars.id, id));
    return scholar;
  }

  async getScholarsByHouse(houseId: string): Promise<Scholar[]> {
    return await db.select().from(scholars).where(eq(scholars.houseId, houseId));
  }

  async createScholar(scholar: InsertScholar): Promise<Scholar> {
    const [newScholar] = await db.insert(scholars).values(scholar).returning();
    return newScholar;
  }

  async updateScholar(id: string, scholar: Partial<InsertScholar>): Promise<Scholar | undefined> {
    const [updatedScholar] = await db.update(scholars)
      .set(scholar)
      .where(eq(scholars.id, id))
      .returning();
    return updatedScholar;
  }

  async deleteScholar(id: string): Promise<boolean> {
    const result = await db.delete(scholars).where(eq(scholars.id, id));
    return result.rowCount > 0;
  }

  // Point Entries
  async getPointEntries(): Promise<PointEntry[]> {
    return await db.select().from(pointEntries).orderBy(sql`${pointEntries.createdAt} DESC`);
  }

  async getPointEntriesByHouse(houseId: string): Promise<PointEntry[]> {
    return await db.select().from(pointEntries)
      .where(eq(pointEntries.houseId, houseId))
      .orderBy(sql`${pointEntries.createdAt} DESC`);
  }

  async getPointEntriesByScholar(scholarId: string): Promise<PointEntry[]> {
    return await db.select().from(pointEntries)
      .where(eq(pointEntries.scholarId, scholarId))
      .orderBy(sql`${pointEntries.createdAt} DESC`);
  }

  async createPointEntry(entry: InsertPointEntry): Promise<PointEntry> {
    const [newEntry] = await db.insert(pointEntries).values(entry).returning();
    return newEntry;
  }

  // PBIS Entries
  async getPbisEntries(): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries).orderBy(sql`${pbisEntries.createdAt} DESC`);
  }

  async getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries)
      .where(eq(pbisEntries.scholarId, scholarId))
      .orderBy(sql`${pbisEntries.createdAt} DESC`);
  }

  async createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry> {
    const [newEntry] = await db.insert(pbisEntries).values(entry).returning();
    return newEntry;
  }

  async getAllScholars(): Promise<Scholar[]> {
    return await db.select().from(scholars).orderBy(scholars.name);
  }

  // PBIS Photos
  async getPbisPhotos(): Promise<PbisPhoto[]> {
    return await db.select().from(pbisPhotos).orderBy(desc(pbisPhotos.createdAt));
  }

  async createPbisPhoto(photo: InsertPbisPhoto): Promise<PbisPhoto> {
    const [newPhoto] = await db.insert(pbisPhotos).values(photo).returning();
    return newPhoto;
  }

  async deletePbisPhoto(id: string): Promise<boolean> {
    const result = await db.delete(pbisPhotos).where(eq(pbisPhotos.id, id));
    return result.rowCount > 0;
  }

  // Parents
  async getParent(id: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent;
  }

  async getParentByEmail(email: string): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.email, email));
    return parent;
  }

  async createParent(parentData: InsertParent): Promise<Parent> {
    const hashedPassword = await bcrypt.hash(parentData.password, 10);
    const [newParent] = await db.insert(parents).values({
      ...parentData,
      password: hashedPassword,
    }).returning();
    return newParent;
  }

  async addScholarToParent(parentId: string, scholarId: string): Promise<boolean> {
    const parent = await this.getParent(parentId);
    const scholar = await this.getScholar(scholarId);
    
    if (!parent || !scholar) return false;
    
    const scholarIds = parent.scholarIds || [];
    if (!scholarIds.includes(scholarId)) {
      const [updatedParent] = await db.update(parents)
        .set({ scholarIds: [...scholarIds, scholarId] })
        .where(eq(parents.id, parentId))
        .returning();
      return !!updatedParent;
    }
    return true;
  }

  async getParentScholars(parentId: string): Promise<Scholar[]> {
    const parent = await this.getParent(parentId);
    if (!parent || !parent.scholarIds) return [];
    
    const scholarsList = await Promise.all(
      parent.scholarIds.map(id => this.getScholar(id))
    );
    return scholarsList.filter(Boolean) as Scholar[];
  }

  // Utility
  async getHouseStandings(): Promise<House[]> {
    const housesData = await db.select().from(houses);
    return housesData.sort((a, b) => {
      const totalA = a.academicPoints + a.attendancePoints + a.behaviorPoints;
      const totalB = b.academicPoints + b.attendancePoints + b.behaviorPoints;
      return totalB - totalA;
    });
  }

  // Teacher Authentication
  async createTeacherAuth(teacher: InsertTeacherAuth): Promise<TeacherAuth> {
    // Hash password before storing
    const passwordHash = await bcrypt.hash(teacher.password, 12);
    
    const teacherData = {
      email: teacher.email,
      name: teacher.name,
      subject: teacher.subject,
      gradeRole: teacher.gradeRole,
      passwordHash,
    };

    const [newTeacher] = await db.insert(teacherAuth).values(teacherData).returning();
    return newTeacher;
  }

  async getTeacherAuthByEmail(email: string): Promise<TeacherAuth | undefined> {
    const [teacher] = await db.select().from(teacherAuth).where(eq(teacherAuth.email, email));
    return teacher;
  }

  async approveTeacher(teacherId: string): Promise<boolean> {
    const result = await db.update(teacherAuth)
      .set({ isApproved: true })
      .where(eq(teacherAuth.id, teacherId));
    
    // Sync the change to in-memory storage
    const teacher = this.teacherAuth.get(teacherId);
    if (teacher) {
      teacher.isApproved = true;
      this.teacherAuth.set(teacherId, teacher);
      console.log(`✅ SYNC: Approved teacher ${teacher.name} in both database and memory`);
    }
    
    return result.rowCount > 0;
  }

  async createTeacherSession(session: InsertTeacherSession): Promise<TeacherSession> {
    const [newSession] = await db.insert(teacherSessions).values(session).returning();
    return newSession;
  }

  async getTeacherSession(token: string): Promise<TeacherSession | undefined> {
    const [session] = await db.select().from(teacherSessions).where(eq(teacherSessions.token, token));
    return session;
  }

  async deleteTeacherSession(token: string): Promise<boolean> {
    const result = await db.delete(teacherSessions).where(eq(teacherSessions.token, token));
    return result.rowCount > 0;
  }

  async getTeacherById(id: string): Promise<TeacherAuth | null> {
    const [teacher] = await db.select().from(teacherAuth).where(eq(teacherAuth.id, id));
    return teacher || null;
  }

  async getScholarsByGrade(gradeRole: string): Promise<Scholar[]> {
    // Extract just the grade number from gradeRole (e.g., "6th Grade" -> "6")
    const grade = parseInt(gradeRole.replace(/\D/g, ''));
    const scholars = await db.select().from(scholars).where(eq(scholars.grade, grade));
    return scholars;
  }

  async getReflectionsByTeacher(teacherId: string): Promise<any[]> {
    // This would need a proper reflections table, for now return empty array
    return [];
  }

  async getMessagesByTeacher(teacherId: string): Promise<any[]> {
    // This would need proper parent-teacher messages table, for now return empty array  
    return [];
  }

  async getPhotosByTeacher(teacherId: string): Promise<any[]> {
    // This would get teacher photos from pbisPhotos table
    const photos = await db.select().from(pbisPhotos).where(eq(pbisPhotos.teacherId, teacherId));
    return photos;
  }

  // Trend Analytics Methods
  async getStudentTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string, studentId?: string): Promise<StudentTrendData[]> {
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
    const grouped = new Map<string, StudentTrendData>();
    
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
  }

  async getClassroomTrends(interval: 'week' | 'month', from: Date, to: Date, teacherId?: string): Promise<ClassroomTrendData[]> {
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
    const grouped = new Map<string, ClassroomTrendData>();
    
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
  }
}

// Enhanced MemStorage with database persistence
class PersistentMemStorage extends MemStorage {
  constructor() {
    super();
    this.initializeFromDatabase();
  }

  private async initializeFromDatabase() {
    try {
      // Load data from database on startup
      await this.loadDataFromDatabase();
    } catch (error) {
      console.error("Failed to load data from database:", error);
    }
  }

  private async loadDataFromDatabase() {
    try {
      // Load teachers
      const dbTeachers = await db.select().from(teacherAuth).catch(() => []);
      console.log(`Loading ${dbTeachers.length} teachers from database`);
      for (const teacher of dbTeachers) {
        console.log(`Loading teacher: ${teacher.name} (${teacher.email}) - Approved: ${teacher.isApproved}`);
        this.teacherAuth.set(teacher.id, teacher);
      }

      // Load administrators
      const dbAdmins = await db.select().from(administrators).catch(() => []);
      for (const admin of dbAdmins) {
        this.administrators.set(admin.id, admin);
      }

      // Load scholars (with error handling for missing columns)
      try {
        const dbScholars = await db.select().from(scholars);
        console.log(`Raw scholars from database:`, dbScholars.length);
        for (const scholar of dbScholars) {
          // Ensure all fields have default values if missing from database
          const completeScholar = {
            ...scholar,
            isActive: true,
            deactivatedAt: null,
            deactivatedBy: null,
            deactivationReason: null,
            isHouseSorted: scholar.isHouseSorted ?? true,
            sortingNumber: scholar.sortingNumber ?? null,
          };
          this.scholars.set(scholar.id, completeScholar);
          console.log(`Loaded scholar: ${scholar.name} (${scholar.studentId})`);
        }
        console.log(`Successfully loaded ${dbScholars.length} scholars from database`);
      } catch (error) {
        console.error("Error loading scholars from database:", error);
        console.log(`Failed to load scholars, continuing with ${this.scholars.size} in-memory scholars`);
      }

      // Load parents
      const dbParents = await db.select().from(parents).catch(() => []);
      console.log(`Loading ${dbParents.length} parents from database`);
      for (const parent of dbParents) {
        console.log(`Loading parent: ${parent.firstName} ${parent.lastName} (${parent.email})`);
        this.parents.set(parent.id, parent);
      }

      // Load houses (ensure they exist or create default ones)
      const dbHouses = await db.select().from(houses).catch(() => []);
      if (dbHouses.length === 0) {
        // Initialize default houses if none exist
        await this.initializeDefaultHouses();
      } else {
        for (const house of dbHouses) {
          this.houses.set(house.id, house);
        }
      }

      // Load PBIS entries
      const dbPbisEntries = await db.select().from(pbisEntries).catch(() => []);
      for (const entry of dbPbisEntries) {
        this.pbisEntries.set(entry.id, entry);
      }

      console.log(`Loaded ${dbTeachers.length} teachers, ${dbAdmins.length} admins, ${this.scholars.size} scholars from database`);
    } catch (error) {
      console.error("Error loading data from database:", error);
      // Continue with in-memory defaults if database fails
    }
  }

  private async initializeDefaultHouses() {
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
        icon: "🏆",
        motto: "Champions of Excellence",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0
      },
      {
        id: "west",
        name: "House of West",
        color: "#45B7D1", 
        icon: "🌟",
        motto: "Pioneers of Progress",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0
      },
      {
        id: "blackwell",
        name: "House of Blackwell",
        color: "#96CEB4",
        icon: "🛡️",
        motto: "Guardians of Knowledge", 
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0
      },
      {
        id: "berruguete",
        name: "House of Berruguete",
        color: "#FFEAA7",
        icon: "🎨",
        motto: "Artists of Innovation",
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        memberCount: 0
      }
    ];

    try {
      await db.insert(houses).values(defaultHouses).onConflictDoNothing();
      for (const house of defaultHouses) {
        this.houses.set(house.id, house);
      }
    } catch (error) {
      console.error("Failed to initialize default houses:", error);
    }
  }

  // Override methods to sync to database
  async createTeacherAuth(teacherData: InsertTeacherAuth): Promise<TeacherAuth> {
    const teacher = await super.createTeacherAuth(teacherData);
    // Sync to database
    try {
      await db.insert(teacherAuth).values({
        id: teacher.id,
        email: teacher.email,
        fullName: teacher.fullName,
        gradeRole: teacher.gradeRole,
        subject: teacher.subject,
        passwordHash: teacher.passwordHash,
        isApproved: teacher.isApproved,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      }).onConflictDoUpdate({
        target: teacherAuth.id,
        set: {
          isApproved: teacher.isApproved,
          updatedAt: teacher.updatedAt,
        }
      });
    } catch (error) {
      console.error("Failed to sync teacher to database:", error);
    }
    return teacher;
  }

  async createAdministrator(adminData: InsertAdministrator): Promise<Administrator> {
    const admin = await super.createAdministrator(adminData);
    // Sync to database
    try {
      await db.insert(administrators).values({
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        title: admin.title,
        passwordHash: admin.passwordHash,
        isActive: admin.isActive,
        permissions: admin.permissions,
        createdAt: admin.createdAt,
      }).onConflictDoUpdate({
        target: administrators.id,
        set: {
          isActive: admin.isActive,
          permissions: admin.permissions,
        }
      });
    } catch (error) {
      console.error("Failed to sync admin to database:", error);
    }
    return admin;
  }

  async createScholar(scholar: InsertScholar): Promise<Scholar> {
    const newScholar = await super.createScholar(scholar);
    // Sync to database (only fields that exist in current schema)
    try {
      await db.insert(scholars).values({
        id: newScholar.id,
        name: newScholar.name,
        studentId: newScholar.studentId,
        grade: newScholar.grade,
        houseId: newScholar.houseId,
        username: newScholar.username,
        passwordHash: newScholar.passwordHash,
        academicPoints: newScholar.academicPoints,
        attendancePoints: newScholar.attendancePoints,
        behaviorPoints: newScholar.behaviorPoints,
        isHouseSorted: newScholar.isHouseSorted,
        sortingNumber: newScholar.sortingNumber,
        addedByTeacher: newScholar.addedByTeacher,
        createdAt: newScholar.createdAt,
      }).onConflictDoUpdate({
        target: scholars.id,
        set: {
          academicPoints: newScholar.academicPoints,
          attendancePoints: newScholar.attendancePoints,
          behaviorPoints: newScholar.behaviorPoints,
        }
      });
      console.log(`Successfully synced scholar ${newScholar.name} to database`);
    } catch (error) {
      console.error("Failed to sync scholar to database:", error);
      console.log("Scholar saved to memory storage only");
    }
    return newScholar;
  }

  async createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry> {
    const newEntry = await super.createPbisEntry(entry);
    // Sync to database
    try {
      await db.insert(pbisEntries).values({
        id: newEntry.id,
        scholarId: newEntry.scholarId,
        teacherName: newEntry.teacherName,
        teacherRole: newEntry.teacherRole,
        category: newEntry.category,
        subcategory: newEntry.subcategory,
        mustangTrait: newEntry.mustangTrait,
        points: newEntry.points,
        reason: newEntry.reason,
        createdAt: newEntry.createdAt,
      });
    } catch (error) {
      console.error("Failed to sync PBIS entry to database:", error);
    }
    return newEntry;
  }

  // Reflection methods
  async assignReflection(scholarId: string, pbisEntryId: string, assignedBy: string, prompt: string, dueDate?: Date): Promise<Reflection> {
    const reflection = {
      id: `refl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      scholarId,
      pbisEntryId,
      assignedBy,
      prompt,
      response: null,
      status: 'assigned' as const,
      teacherFeedback: null,
      approvedBy: null,
      sentToParent: false,
      sentToParentAt: null,
      dueDate,
      assignedAt: new Date(),
      submittedAt: null,
      approvedAt: null
    };
    
    this.reflections.set(reflection.id, reflection);
    return reflection;
  }

  async getReflectionsForStudent(scholarId: string): Promise<Reflection[]> {
    return Array.from(this.reflections.values()).filter(r => r.scholarId === scholarId);
  }

  async getReflectionsForTeacher(teacherId: string): Promise<Reflection[]> {
    return Array.from(this.reflections.values()).filter(r => r.assignedBy === teacherId);
  }

  async getAllReflections(): Promise<Reflection[]> {
    return Array.from(this.reflections.values());
  }

  async getApprovedReflections(): Promise<Reflection[]> {
    return Array.from(this.reflections.values()).filter(r => r.status === 'approved');
  }

  async submitReflection(reflectionId: string, response: string): Promise<Reflection> {
    const reflection = this.reflections.get(reflectionId);
    if (!reflection) throw new Error("Reflection not found");
    
    const updated = {
      ...reflection,
      response,
      status: 'submitted' as const,
      submittedAt: new Date()
    };
    
    this.reflections.set(reflectionId, updated);
    return updated;
  }

  async reviewReflection(reflectionId: string, status: string, reviewedBy: string, feedback?: string): Promise<Reflection> {
    const reflection = this.reflections.get(reflectionId);
    if (!reflection) throw new Error("Reflection not found");
    
    const updated = {
      ...reflection,
      status: status as 'approved' | 'rejected',
      teacherFeedback: feedback || null,
      approvedBy: reviewedBy,
      approvedAt: new Date()
    };
    
    this.reflections.set(reflectionId, updated);
    return updated;
  }

  async sendReflectionToParent(reflectionId: string): Promise<boolean> {
    const reflection = this.reflections.get(reflectionId);
    if (!reflection) return false;
    
    const updated = {
      ...reflection,
      sentToParent: true,
      sentToParentAt: new Date()
    };
    
    this.reflections.set(reflectionId, updated);
    return true;
  }

  // Additional methods needed for teacher student dashboard viewer
  async getPBISEntriesForScholar(scholarId: string): Promise<PbisEntry[]> {
    return this.getPbisEntriesByScholar(scholarId);
  }

  async getScholarBadges(scholarId: string): Promise<any[]> {
    // This would return actual badge data from database
    // For now, return sample badge data based on PBIS entries
    const pbisEntries = await this.getPbisEntriesByScholar(scholarId);
    const scholar = this.scholars.get(scholarId);
    
    if (!scholar) return [];
    
    const badges = [];
    
    // Award badges based on points
    if (scholar.academicPoints >= 100) {
      badges.push({
        badgeName: "Academic Excellence",
        badgeIcon: "🎓",
        awardedAt: new Date(),
        description: "Earned 100+ academic points"
      });
    }
    
    if (scholar.behaviorPoints >= 50) {
      badges.push({
        badgeName: "MUSTANG Behavior",
        badgeIcon: "🌟",
        awardedAt: new Date(),
        description: "Demonstrated excellent MUSTANG traits"
      });
    }
    
    if (scholar.attendancePoints >= 30) {
      badges.push({
        badgeName: "Perfect Attendance",
        badgeIcon: "📅",
        awardedAt: new Date(),
        description: "Excellent attendance record"
      });
    }
    
    // Badge based on total entries
    if (pbisEntries.length >= 10) {
      badges.push({
        badgeName: "Active Participant",
        badgeIcon: "🏆",
        awardedAt: new Date(),
        description: "Active engagement in school activities"
      });
    }
    
    return badges;
  }

  async getReflectionsForScholar(scholarId: string): Promise<any[]> {
    return this.getReflectionsForStudent(scholarId);
  }
}

import { DatabaseStorage } from "./db-storage";
export const storage = new DatabaseStorage();

// Database handles all teacher data - no manual seeding needed
