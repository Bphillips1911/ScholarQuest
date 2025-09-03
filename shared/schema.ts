import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export gamified learning tables from separate schema file
export * from "./sticker-schema";

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
  isActive: boolean("is_active").notNull().default(true), // For student deactivation
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedBy: varchar("deactivated_by"), // Teacher who deactivated the student
  deactivationReason: text("deactivation_reason"), // Reason for deactivation (e.g., "Student transferred to another school")
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
  month: integer("month").notNull(), // 1-12 for tracking monthly data
  year: integer("year").notNull(), // Year for tracking
  entryType: text("entry_type").notNull().default("positive"), // 'positive' or 'negative' 
  createdAt: timestamp("created_at").defaultNow(),
});

// Badge system for PBIS achievements
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Bronze Scholar", "Silver Champion", "Gold Mustang", etc.
  description: text("description").notNull(),
  houseId: varchar("house_id").references(() => houses.id), // House-specific badges
  category: text("category").notNull(), // 'academic', 'attendance', 'behavior', 'overall'
  pointsRequired: integer("points_required").notNull(), // Points needed to earn badge
  level: integer("level").notNull(), // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Diamond
  iconPath: text("icon_path").notNull(), // Path to badge graphic
  animationType: text("animation_type").default("pulse"), // 'pulse', 'glow', 'rotate', 'bounce'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scholar badges earned/lost
export const scholarBadges = pgTable("scholar_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
  isActive: boolean("is_active").notNull().default(true), // Can be revoked if points lost
  revokedAt: timestamp("revoked_at"),
  revokedReason: text("revoked_reason"),
});

// Interactive games system
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'sports', 'puzzle', 'arcade', 'strategy'
  difficulty: text("difficulty").notNull().default("easy"), // 'easy', 'medium', 'hard'
  badgeRequired: varchar("badge_required").references(() => badges.id), // Badge needed to unlock
  pointsRequired: integer("points_required").default(0), // Alternative: points needed to unlock
  iconPath: text("icon_path").notNull(),
  gamePath: text("game_path").notNull(), // Path to game component
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game access permissions granted by teachers
export const gameAccess = pgTable("game_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  gameId: varchar("game_id").notNull().references(() => games.id),
  grantedBy: varchar("granted_by").notNull().references(() => teacherAuth.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration
  isActive: boolean("is_active").notNull().default(true),
  revokedAt: timestamp("revoked_at"),
  revokedBy: varchar("revoked_by").references(() => teacherAuth.id),
  revokedReason: text("revoked_reason"),
});

// Scholar game sessions
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  gameId: varchar("game_id").notNull().references(() => games.id),
  score: integer("score").default(0),
  duration: integer("duration_seconds").default(0), // Game session length
  completed: boolean("completed").notNull().default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Reflection system for negative behaviors
export const reflections = pgTable("reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  pbisEntryId: varchar("pbis_entry_id").notNull().references(() => pbisEntries.id), // Linked to negative PBIS entry
  assignedBy: varchar("assigned_by").notNull().references(() => teacherAuth.id),
  prompt: text("prompt").notNull(), // Teacher's reflection prompt/question
  response: text("response"), // Student's reflection response
  status: text("status").notNull().default("assigned"), // 'assigned', 'submitted', 'approved', 'rejected'
  teacherFeedback: text("teacher_feedback"), // Teacher's comments
  approvedBy: varchar("approved_by").references(() => teacherAuth.id),
  sentToParent: boolean("sent_to_parent").notNull().default(false),
  sentToParentAt: timestamp("sent_to_parent_at"),
  dueDate: timestamp("due_date"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
});

// Export types for all new tables
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;
export type ScholarBadge = typeof scholarBadges.$inferSelect;
export type InsertScholarBadge = typeof scholarBadges.$inferInsert;
export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type GameAccess = typeof gameAccess.$inferSelect;
export type InsertGameAccess = typeof gameAccess.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;
export type Reflection = typeof reflections.$inferSelect;
export type InsertReflection = typeof reflections.$inferInsert;

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
  preferredLanguage: varchar("preferred_language").notNull().default("en"), // 'en' for English, 'es' for Spanish
  scholarIds: text("scholar_ids").array().default([]), // Array of scholar IDs this parent can view
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const parentTeacherMessages = pgTable("parent_teacher_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => parents.id),
  teacherId: varchar("teacher_id").references(() => teacherAuth.id), // Optional for parent-to-admin messages
  adminId: varchar("admin_id").references(() => administrators.id), // For parent-to-admin messages
  scholarId: varchar("scholar_id").references(() => scholars.id), // Optional for general inquiries
  senderType: varchar("sender_type").notNull(), // 'parent', 'teacher', or 'admin'
  recipientType: varchar("recipient_type").notNull(), // 'parent', 'teacher', or 'admin'
  subject: text("subject").notNull(),
  message: text("message").notNull(), // Minimum 10 characters for basic validation
  isRead: boolean("is_read").default(false),
  threadId: varchar("thread_id"), // For grouping related messages
  priority: varchar("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  notificationSent: boolean("notification_sent").default(false), // Track SMS/email notifications
  createdAt: timestamp("created_at").defaultNow(),
});

// SMS Notifications Table
export const smsNotifications = pgTable("sms_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => parents.id),
  phoneNumber: varchar("phone_number").notNull(),
  messageType: varchar("message_type").notNull(), // 'teacher_message', 'pbis_achievement', 'house_update', 'general'
  content: text("content").notNull(),
  status: varchar("status").default("pending"), // 'pending', 'sent', 'failed', 'delivered'
  relatedMessageId: varchar("related_message_id").references(() => parentTeacherMessages.id),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
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
  title: varchar("title").notNull(), // 'Principal', 'Assistant Principal', 'Counselor', 'Database Manager'
  passwordHash: varchar("password_hash").notNull(),
  isActive: boolean("is_active").default(true),
  isApproved: boolean("is_approved").default(false), // Requires approval before access
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

// Story submissions table for teacher review of AI feedback
export const storySubmissions = pgTable("story_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => scholars.id),
  studentName: text("student_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  prompt: text("prompt"),
  gradeLevel: integer("grade_level").notNull(),
  wordCount: integer("word_count").notNull(),
  aiFeedback: jsonb("ai_feedback").notNull(), // Store the AI feedback response
  teacherReviewed: boolean("teacher_reviewed").notNull().default(false),
  teacherNotes: text("teacher_notes"),
  reviewedBy: varchar("reviewed_by").references(() => teacherAuth.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
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
  isActive: true,
  deactivatedAt: true,
  deactivatedBy: true,
  deactivationReason: true,
  createdAt: true,
}).extend({
  grade: z.number().min(6).max(8),
  name: z.string().min(1),
  studentId: z.string().min(1),
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
  category: z.enum(["attendance", "behavior", "academic", "universal_positive", "universal_negative"]),
  subcategory: z.string().min(1),
});

export const insertAdministratorSchema = createInsertSchema(administrators).omit({
  id: true,
  passwordHash: true,
  isApproved: true,
  createdAt: true,
  lastLoginAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(8),
  title: z.enum(["Principal", "Assistant Principal", "Counselor", "Database Manager"]),
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
// Teacher type is based on TeacherAuth with additional computed fields
export interface Teacher {
  id: string;
  name: string;
  email: string;
  grade: number;
  subject: string;
  canSeeGrades: number[];
}
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
export type StorySubmission = typeof storySubmissions.$inferSelect;

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
export type InsertStorySubmission = typeof storySubmissions.$inferInsert;

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
  preferredLanguage: z.enum(["en", "es"]).default("en"),
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

export type TeacherSignup = z.infer<typeof insertTeacherAuthSchema>;

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

export const insertParentTeacherMessageSchema = createInsertSchema(parentTeacherMessages).omit({
  id: true,
  isRead: true,
  createdAt: true,
  notificationSent: true,
}).extend({
  senderType: z.enum(["parent", "teacher", "admin"]),
  recipientType: z.enum(["parent", "teacher", "admin"]),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const insertSmsNotificationSchema = createInsertSchema(smsNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
}).extend({
  messageType: z.enum(["teacher_message", "pbis_achievement", "house_update", "general"]),
  content: z.string().min(1).max(160), // SMS character limit
  status: z.enum(["pending", "sent", "failed", "delivered"]).optional(),
  threadId: z.string().optional(),
});

export type ParentTeacherMessage = typeof parentTeacherMessages.$inferSelect;
export type SmsNotification = typeof smsNotifications.$inferSelect;
export type InsertParentTeacherMessage = z.infer<typeof insertParentTeacherMessageSchema>;
export type InsertSmsNotification = typeof smsNotifications.$inferInsert;

// Mood and Progress Tracking Tables
export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  mood: text("mood").notNull(), // 'amazing', 'happy', 'okay', 'stressed', 'sad'
  moodEmoji: text("mood_emoji").notNull(), // '😍', '😊', '😐', '😰', '😢'
  energyLevel: integer("energy_level").notNull(), // 1-5 scale
  focusLevel: integer("focus_level").notNull(), // 1-5 scale
  notes: text("notes"), // Optional student notes
  date: timestamp("date").notNull(), // The date this mood entry is for
  createdAt: timestamp("created_at").defaultNow(),
});

export const progressGoals = pgTable("progress_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  category: text("category").notNull(), // 'academic', 'behavioral', 'personal', 'social'
  title: text("title").notNull(),
  description: text("description"),
  targetValue: integer("target_value").notNull(), // Target number (e.g., 5 for "Get 5 positive points this week")
  currentValue: integer("current_value").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'paused'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyReflections = pgTable("daily_reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  date: timestamp("date").notNull(),
  proudMoment: text("proud_moment"), // What they're proud of today
  challengeFaced: text("challenge_faced"), // Challenge they faced
  tomorrowGoal: text("tomorrow_goal"), // Goal for tomorrow
  gratitude: text("gratitude"), // What they're grateful for
  helpNeeded: text("help_needed"), // What help they need
  overallRating: integer("overall_rating").notNull(), // 1-5 star rating for the day
  createdAt: timestamp("created_at").defaultNow(),
});

// Add insert schemas for mood tracking
export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  mood: z.enum(["amazing", "happy", "okay", "stressed", "sad"]),
  moodEmoji: z.enum(["😍", "😊", "😐", "😰", "😢"]),
  energyLevel: z.number().min(1).max(5),
  focusLevel: z.number().min(1).max(5),
  notes: z.string().optional(),
});

export const insertProgressGoalSchema = createInsertSchema(progressGoals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  category: z.enum(["academic", "behavioral", "personal", "social"]),
  title: z.string().min(1),
  targetValue: z.number().min(1),
  status: z.enum(["active", "completed", "paused"]).default("active"),
});

export const insertDailyReflectionSchema = createInsertSchema(dailyReflections).omit({
  id: true,
  createdAt: true,
}).extend({
  overallRating: z.number().min(1).max(5),
});

// Add type exports for mood tracking
export type MoodEntry = typeof moodEntries.$inferSelect;
export type ProgressGoal = typeof progressGoals.$inferSelect;
export type DailyReflection = typeof dailyReflections.$inferSelect;
export type InsertMoodEntry = typeof moodEntries.$inferInsert;
export type InsertProgressGoal = typeof progressGoals.$inferInsert;
export type InsertDailyReflection = typeof dailyReflections.$inferInsert;
