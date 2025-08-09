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
  passwordResetRequests
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Houses
  getHouses(): Promise<House[]>;
  getHouse(id: string): Promise<House | undefined>;
  createHouse(house: InsertHouse): Promise<House>;
  updateHousePoints(houseId: string, category: string, points: number): Promise<void>;
  
  // Scholars
  getScholarsByHouse(houseId: string): Promise<Scholar[]>;
  getScholarsByGrade(grade: number): Promise<Scholar[]>;
  getScholar(id: string): Promise<Scholar | undefined>;
  getScholarByUsername(username: string): Promise<Scholar | undefined>;
  getScholarByStudentId(studentId: string): Promise<Scholar | undefined>;
  getAllScholars(): Promise<Scholar[]>;
  createScholar(scholar: InsertScholar): Promise<Scholar>;
  updateScholarPoints(scholarId: string, category: string, points: number): Promise<void>;
  
  // Teachers
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  getTeachersByGrade(grade: number): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  getVisibleScholarsForTeacher(teacherId: string): Promise<Scholar[]>;
  
  // Point Entries
  getPointEntries(): Promise<PointEntry[]>;
  getPointEntriesByHouse(houseId: string): Promise<PointEntry[]>;
  createPointEntry(entry: InsertPointEntry): Promise<PointEntry>;
  
  // PBIS Entries
  getPbisEntries(): Promise<PbisEntry[]>;
  getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]>;
  createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry>;
  getAllScholars(): Promise<Scholar[]>;
  
  // PBIS Photos
  getPbisPhotos(): Promise<PbisPhoto[]>;
  createPbisPhoto(photo: InsertPbisPhoto): Promise<PbisPhoto>;
  deletePbisPhoto(id: string): Promise<boolean>;
  
  // Parents
  getParent(id: string): Promise<Parent | undefined>;
  getParentByEmail(email: string): Promise<Parent | undefined>;
  createParent(parent: InsertParent): Promise<Parent>;
  addScholarToParent(parentId: string, scholarId: string): Promise<boolean>;
  getParentScholars(parentId: string): Promise<Scholar[]>;
  
  // Teacher Authentication
  createTeacherAuth(teacher: InsertTeacherAuth): Promise<TeacherAuth>;
  getTeacherAuthByEmail(email: string): Promise<TeacherAuth | undefined>;
  getAllTeacherAuth(): Promise<TeacherAuth[]>;
  getPendingTeachers(): Promise<TeacherAuth[]>;
  approveTeacher(teacherId: string): Promise<boolean>;
  createTeacherSession(session: InsertTeacherSession): Promise<TeacherSession>;
  getTeacherSession(token: string): Promise<TeacherSession | undefined>;
  deleteTeacherSession(token: string): Promise<boolean>;

  // Student Authentication  
  createStudentCredentials(scholarId: string, teacherId: string): Promise<{ username: string; password: string }>;
  authenticateStudent(username: string, password: string): Promise<Scholar | null>;
  requestPasswordReset(username: string): Promise<boolean>;
  createStudentSession(session: InsertStudentSession): Promise<StudentSession>;
  getStudentSession(token: string): Promise<StudentSession | undefined>;
  deleteStudentSession(token: string): Promise<boolean>;
  createPasswordResetRequest(request: InsertPasswordResetRequest): Promise<PasswordResetRequest>;
  getPasswordResetRequests(teacherId: string): Promise<PasswordResetRequest[]>;
  resetStudentPassword(studentId: string, newPassword: string): Promise<boolean>;
  
  // House Sorting
  getUnsortedStudents(): Promise<Scholar[]>;
  addUnsortedStudent(student: InsertScholar): Promise<Scholar>;
  removeUnsortedStudent(studentId: string): Promise<boolean>;
  sortStudentsIntoHouses(): Promise<{ sortedCount: number }>;
  resetAllHouses(): Promise<void>;
  
  // Utility
  getHouseStandings(): Promise<House[]>;
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
  private parentScholars: Map<string, string[]>; // parentId -> scholarIds

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
    this.parentScholars = new Map();
    
    // Initialize with the five houses and sample scholars and teachers
    this.initializeHouses();
    this.initializeScholars();
    this.initializeTeachers();
    
    // Initialize teacher auth accounts after regular setup
    setTimeout(() => {
      this.initializeTeacherAuth().then(() => {
        console.log("Teacher auth accounts initialized");
        this.createDemoStudentCredentials();
      });
    }, 100);
  }

  private initializeHouses() {
    const initialHouses: House[] = [
      {
        id: "franklin",
        name: "House of Franklin",
        color: "#DC2626",
        icon: "shield-alt",
        motto: "Leadership • Innovation • Integrity",
        academicPoints: 845,
        attendancePoints: 672,
        behaviorPoints: 968,
        memberCount: 124,
      },
      {
        id: "courie",
        name: "House of Courie",
        color: "#7C3AED",
        icon: "star",
        motto: "Courage • Determination • Excellence",
        academicPoints: 798,
        attendancePoints: 621,
        behaviorPoints: 922,
        memberCount: 118,
      },
      {
        id: "west",
        name: "House of West",
        color: "#059669",
        icon: "leaf",
        motto: "Growth • Wisdom • Collaboration",
        academicPoints: 776,
        attendancePoints: 654,
        behaviorPoints: 868,
        memberCount: 122,
      },
      {
        id: "blackwell",
        name: "House of Blackwell",
        color: "#1F2937",
        icon: "mountain",
        motto: "Strength • Perseverance • Honor",
        academicPoints: 734,
        attendancePoints: 598,
        behaviorPoints: 824,
        memberCount: 119,
      },
      {
        id: "berruguete",
        name: "House of Berruguete",
        color: "#EA580C",
        icon: "lion",
        motto: "Creativity • Passion • Innovation",
        academicPoints: 694,
        attendancePoints: 589,
        behaviorPoints: 806,
        memberCount: 117,
      },
    ];

    initialHouses.forEach(house => this.houses.set(house.id, house));
  }

  private async initializeScholars() {
    const sampleScholars = [
      { 
        name: "Emma Johnson", 
        studentId: "BH6001", 
        houseId: "franklin", 
        grade: 6,
        isHouseSorted: true,
        sortingNumber: 1,
        addedByTeacher: null,
        username: null,
        passwordHash: null,
        teacherId: null,
        needsPasswordReset: false
      },
      { 
        name: "Liam Williams", 
        studentId: "BH6002", 
        houseId: "courie", 
        grade: 6,
        isHouseSorted: true,
        sortingNumber: 2,
        addedByTeacher: null,
        username: null,
        passwordHash: null,
        teacherId: null,
        needsPasswordReset: false
      },
      { 
        name: "Sophia Brown", 
        studentId: "BH6003", 
        houseId: "west", 
        grade: 6,
        isHouseSorted: true,
        sortingNumber: 3,
        addedByTeacher: null,
        username: null,
        passwordHash: null,
        teacherId: null,
        needsPasswordReset: false
      },
      { 
        name: "Noah Davis", 
        studentId: "BH6004", 
        houseId: "blackwell", 
        grade: 6,
        isHouseSorted: true,
        sortingNumber: 4,
        addedByTeacher: null,
        username: null,
        passwordHash: null,
        teacherId: null,
        needsPasswordReset: false
      },
      { name: "Isabella Miller", studentId: "BH6005", houseId: "berruguete", grade: 6 },
      { name: "James Wilson", studentId: "BH7001", houseId: "franklin", grade: 7 },
      { name: "Olivia Moore", studentId: "BH7002", houseId: "courie", grade: 7 },
      { name: "Benjamin Taylor", studentId: "BH7003", houseId: "west", grade: 7 },
      { name: "Charlotte Anderson", studentId: "BH7004", houseId: "blackwell", grade: 7 },
      { name: "Alexander Thomas", studentId: "BH7005", houseId: "berruguete", grade: 7 },
      { name: "Mia Jackson", studentId: "BH8001", houseId: "franklin", grade: 8 },
      { name: "Ethan White", studentId: "BH8002", houseId: "courie", grade: 8 },
      { name: "Amelia Harris", studentId: "BH8003", houseId: "west", grade: 8 },
      { name: "Mason Martin", studentId: "BH8004", houseId: "blackwell", grade: 8 },
      { name: "Harper Thompson", studentId: "BH8005", houseId: "berruguete", grade: 8 },
    ];

    for (const scholar of sampleScholars) {
      const id = randomUUID();
      const newScholar: Scholar = {
        id,
        name: scholar.name,
        studentId: scholar.studentId,
        houseId: scholar.houseId,
        grade: scholar.grade,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        createdAt: new Date(),
      };
      this.scholars.set(id, newScholar);
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
      { name: "Counselor Kirkland", email: "counselor@bhsteam.edu", role: "Counselor", subject: "School Counselor", canSeeGrades: [6, 7, 8] },
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

  async getAllScholars(): Promise<Scholar[]> {
    return Array.from(this.scholars.values());
  }

  async createScholar(scholar: InsertScholar): Promise<Scholar> {
    const id = randomUUID();
    const newScholar: Scholar = {
      ...scholar,
      id,
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

  async getScholarsByGrade(grade: number): Promise<Scholar[]> {
    return Array.from(this.scholars.values()).filter(scholar => scholar.grade === grade);
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
      visibleGrades.includes(scholar.grade)
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

  async getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]> {
    return Array.from(this.pbisEntries.values()).filter(entry => entry.scholarId === scholarId);
  }

  async createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry> {
    const id = randomUUID();
    const newEntry: PbisEntry = {
      ...entry,
      id,
      reason: entry.reason || null,
      category: entry.category || "behavior",
      subcategory: entry.subcategory || "positive_attitude",
      createdAt: new Date(),
    };
    this.pbisEntries.set(id, newEntry);
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
    this.parents.set(id, newParent);
    return newParent;
  }

  async addScholarToParent(parentId: string, scholarId: string): Promise<boolean> {
    const parent = this.parents.get(parentId);
    const scholar = this.scholars.get(scholarId);
    
    if (!parent || !scholar) return false;
    
    const scholarIds = parent.scholarIds || [];
    if (!scholarIds.includes(scholarId)) {
      const updatedParent = {
        ...parent,
        scholarIds: [...scholarIds, scholarId],
      };
      this.parents.set(parentId, updatedParent);
    }
    return true;
  }



  async getParentScholars(parentId: string): Promise<Scholar[]> {
    const scholarIds = this.parentScholars.get(parentId) || [];
    const scholars: Scholar[] = [];
    for (const scholarId of scholarIds) {
      const scholar = this.scholars.get(scholarId);
      if (scholar) {
        scholars.push(scholar);
      }
    }
    return scholars;
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
      },
      {
        email: "principal@bhsteam.edu",
        name: "Dr. Phillips",
        gradeRole: "Administrator", 
        subject: "Administration",
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

  async getUnsortedStudents(): Promise<Scholar[]> {
    try {
      const scholars = Array.from(this.scholars.values());
      return scholars.filter(scholar => scholar.isHouseSorted === false || scholar.isHouseSorted === undefined);
    } catch (error) {
      console.error("Error in getUnsortedStudents:", error);
      return [];
    }
  }

  async addUnsortedStudent(student: InsertScholar): Promise<Scholar> {
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
    this.scholars.set(id, newScholar);
    return newScholar;
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
}

export class DatabaseStorage implements IStorage {
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
    return await db.select().from(pointEntries).orderBy(desc(pointEntries.createdAt));
  }

  async getPointEntriesByHouse(houseId: string): Promise<PointEntry[]> {
    return await db.select().from(pointEntries)
      .where(eq(pointEntries.houseId, houseId))
      .orderBy(desc(pointEntries.createdAt));
  }

  async getPointEntriesByScholar(scholarId: string): Promise<PointEntry[]> {
    return await db.select().from(pointEntries)
      .where(eq(pointEntries.scholarId, scholarId))
      .orderBy(desc(pointEntries.createdAt));
  }

  async createPointEntry(entry: InsertPointEntry): Promise<PointEntry> {
    const [newEntry] = await db.insert(pointEntries).values(entry).returning();
    return newEntry;
  }

  // PBIS Entries
  async getPbisEntries(): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries).orderBy(desc(pbisEntries.createdAt));
  }

  async getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]> {
    return await db.select().from(pbisEntries)
      .where(eq(pbisEntries.scholarId, scholarId))
      .orderBy(desc(pbisEntries.createdAt));
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
    return await db.select().from(houses).orderBy(
      desc(sql`${houses.academicPoints} + ${houses.attendancePoints} + ${houses.behaviorPoints}`)
    );
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
}

export const storage = new DatabaseStorage();
