import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const houses = pgTable("houses", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  motto: text("motto").notNull(),
  academicPoints: integer("academic_points").notNull().default(0),
  attendancePoints: integer("attendance_points").notNull().default(0),
  behaviorPoints: integer("behavior_points").notNull().default(0),
  memberCount: integer("member_count").notNull().default(0),
});

export const scholars = pgTable("scholars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  studentId: text("student_id").notNull().unique(),
  houseId: varchar("house_id").references(() => houses.id),
  grade: integer("grade").notNull(), // 6, 7, or 8
  academicPoints: integer("academic_points").notNull().default(0),
  attendancePoints: integer("attendance_points").notNull().default(0),
  behaviorPoints: integer("behavior_points").notNull().default(0),
  isHouseSorted: boolean("is_house_sorted").notNull().default(false),
  sortingNumber: integer("sorting_number"),
  addedByTeacher: varchar("added_by_teacher"),
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  teacherId: varchar("teacher_id").references(() => teacherAuth.id),
  needsPasswordReset: boolean("needs_password_reset").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(), // '6th Grade', '7th Grade', '8th Grade', 'Unified Arts', 'Administration', 'Counselor'
  subject: text("subject"), // For unified arts teachers: 'Library', 'Computer Science', 'Art', 'PE', 'Band', 'Theater', 'STEM Tech', 'Choir'
  canSeeGrades: integer("can_see_grades").array().default([]), // Array of grade levels this teacher can see [6,7,8]
  createdAt: timestamp("created_at").defaultNow(),
});

export const pointEntries = pgTable("point_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  houseId: varchar("house_id").notNull().references(() => houses.id),
  scholarId: varchar("scholar_id").references(() => scholars.id),
  category: text("category").notNull(), // 'academic', 'attendance', 'behavior'
  points: integer("points").notNull(),
  reason: text("reason"),
  addedBy: text("added_by").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pbisEntries = pgTable("pbis_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  teacherName: text("teacher_name").notNull(),
  teacherRole: text("teacher_role").notNull(), // '6th Grade', '7th Grade', '8th Grade', 'Unified Arts', 'Administration', 'Counselor'
  points: integer("points").notNull().default(1),
  reason: text("reason"),
  mustangTrait: text("mustang_trait").notNull(), // M-Motivated, U-Understanding, S-Safe, T-Teamwork, A-Accountable, N-Noble, G-Growth
  category: text("category").notNull(), // 'attendance', 'behavior', 'academic'
  subcategory: text("subcategory").notNull(), // Specific reason within each category
  createdAt: timestamp("created_at").defaultNow(),
});

export const pbisPhotos = pgTable("pbis_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  description: text("description"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const parents = pgTable("parents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone"),
  scholarIds: text("scholar_ids").array().default([]), // Array of scholar IDs this parent can view
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherAuth = pgTable("teacher_auth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  gradeRole: text("grade_role").notNull(), // '6th Grade', '7th Grade', '8th Grade', 'Unified Arts', 'Administration', 'Counselor'
  passwordHash: varchar("password_hash").notNull(),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const teacherSessions = pgTable("teacher_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teacherAuth.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentSessions = pgTable("student_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => scholars.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetRequests = pgTable("password_reset_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => scholars.id),
  teacherId: varchar("teacher_id").notNull().references(() => teacherAuth.id),
  status: varchar("status").notNull().default("pending"), // 'pending', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const administrators = pgTable("administrators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  title: varchar("title").notNull(), // 'Principal', 'Assistant Principal', 'Counselor'
  passwordHash: varchar("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  permissions: text("permissions").array().default([]), // Array of permissions: ['view_all', 'manage_teachers', 'manage_students', 'manage_houses', 'view_reports']
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => administrators.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHouseSchema = createInsertSchema(houses).omit({
  academicPoints: true,
  attendancePoints: true,
  behaviorPoints: true,
  memberCount: true,
});

export const insertScholarSchema = createInsertSchema(scholars).omit({
  id: true,
  academicPoints: true,
  attendancePoints: true,
  behaviorPoints: true,
  createdAt: true,
}).extend({
  grade: z.number().min(6).max(8),
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["6th Grade", "7th Grade", "8th Grade", "Unified Arts", "Administration", "Counselor"]),
  subject: z.string().optional(),
});

export const insertPointEntrySchema = createInsertSchema(pointEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  category: z.enum(["academic", "attendance", "behavior"]),
  points: z.number().min(1).max(100),
});

export const insertPbisEntrySchema = createInsertSchema(pbisEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  teacherRole: z.enum(["6th Grade", "7th Grade", "8th Grade", "Unified Arts", "Administration", "Counselor"]),
  points: z.number().min(-3).max(10),
  mustangTrait: z.enum(["Make good choices", "Use kind words", "Show school pride", "Tolerant of others", "Aim for excellence", "Need to be responsible", "Give 100% everyday"]),
  category: z.enum(["attendance", "behavior", "academic", "recognition", "negative_behavior"]),
  subcategory: z.string().min(1),
});

export const insertAdministratorSchema = createInsertSchema(administrators).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  lastLoginAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(8),
  title: z.enum(["Principal", "Assistant Principal", "Counselor"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type House = typeof houses.$inferSelect;
export type Scholar = typeof scholars.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type PointEntry = typeof pointEntries.$inferSelect;
export type PbisEntry = typeof pbisEntries.$inferSelect;
export type PbisPhoto = typeof pbisPhotos.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type TeacherAuth = typeof teacherAuth.$inferSelect;
export type TeacherSession = typeof teacherSessions.$inferSelect;
export type StudentSession = typeof studentSessions.$inferSelect;
export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type Administrator = typeof administrators.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;

export type InsertHouse = typeof houses.$inferInsert;
export type InsertScholar = typeof scholars.$inferInsert;
export type InsertTeacher = typeof teachers.$inferInsert;
export type InsertPointEntry = typeof pointEntries.$inferInsert;
export type InsertPbisEntry = typeof pbisEntries.$inferInsert;
export type InsertPbisPhoto = typeof pbisPhotos.$inferInsert;
export type InsertParent = typeof parents.$inferInsert;
export type InsertTeacherAuth = typeof teacherAuth.$inferInsert;
export type InsertTeacherSession = typeof teacherSessions.$inferInsert;
export type InsertStudentSession = typeof studentSessions.$inferInsert;
export type InsertPasswordResetRequest = typeof passwordResetRequests.$inferInsert;
export type InsertAdministrator = typeof administrators.$inferInsert;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

export const insertPbisPhotoSchema = createInsertSchema(pbisPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  createdAt: true,
  isVerified: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const insertTeacherAuthSchema = createInsertSchema(teacherAuth).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  isApproved: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(6),
  gradeRole: z.enum(["6th Grade", "7th Grade", "8th Grade", "Unified Arts", "Administration", "Counselor"]),
  subject: z.string().optional(),
});

export const insertTeacherSessionSchema = createInsertSchema(teacherSessions).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSessionSchema = createInsertSchema(studentSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetRequestSchema = createInsertSchema(passwordResetRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type House = typeof houses.$inferSelect;
export type Scholar = typeof scholars.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type PointEntry = typeof pointEntries.$inferSelect;
export type PbisEntry = typeof pbisEntries.$inferSelect;
export type PbisPhoto = typeof pbisPhotos.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type InsertHouse = z.infer<typeof insertHouseSchema>;
export type InsertScholar = z.infer<typeof insertScholarSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertPointEntry = z.infer<typeof insertPointEntrySchema>;
export type InsertPbisEntry = z.infer<typeof insertPbisEntrySchema>;
export type InsertPbisPhoto = z.infer<typeof insertPbisPhotoSchema>;
export type InsertParent = z.infer<typeof insertParentSchema>;
export type InsertTeacherAuth = z.infer<typeof insertTeacherAuthSchema>;
export type TeacherAuth = typeof teacherAuth.$inferSelect;
export type InsertTeacherSession = z.infer<typeof insertTeacherSessionSchema>;
export type TeacherSession = typeof teacherSessions.$inferSelect;
export type StudentSession = typeof studentSessions.$inferSelect;
export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertStudentSession = z.infer<typeof insertStudentSessionSchema>;
export type InsertPasswordResetRequest = z.infer<typeof insertPasswordResetRequestSchema>;
