import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, uuid, jsonb, serial, real } from "drizzle-orm/pg-core";
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
  bhsaMustangTraitsPoints: integer("bhsa_mustang_traits_points").notNull().default(0),
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
  bhsaMustangTraitsPoints: integer("bhsa_mustang_traits_points").notNull().default(0),
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

// Teacher Class Periods for Unified Arts Teachers
export const teacherClassPeriods = pgTable("teacher_class_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").notNull().references(() => teacherAuth.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Class Period Student Enrollments
export const classPeriodEnrollments = pgTable("class_period_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classPeriodId: varchar("class_period_id").notNull().references(() => teacherClassPeriods.id),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
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

// Password reset tokens for teachers
export const teacherPasswordResets = pgTable("teacher_password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teacherAuth.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens for administrators
export const adminPasswordResets = pgTable("admin_password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => administrators.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
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

// Progress Reports table for one-click report generation
export const progressReports = pgTable("progress_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => scholars.id),
  reportType: varchar("report_type").notNull(), // 'weekly', 'monthly', 'semester', 'custom'
  generatedBy: varchar("generated_by").notNull().references(() => teacherAuth.id),
  reportData: jsonb("report_data").notNull(), // Complete report data with charts and analytics
  dateRange: jsonb("date_range").notNull(), // {start: date, end: date}
  totalPBISPoints: integer("total_pbis_points").notNull().default(0),
  academicGrade: varchar("academic_grade"),
  behaviorGrade: varchar("behavior_grade"),
  attendanceRate: integer("attendance_rate").default(100),
  recommendedActions: text("recommended_actions").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher Performance Analytics for administrator heatmap
export const teacherPerformanceMetrics = pgTable("teacher_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teacherAuth.id),
  metricDate: timestamp("metric_date").notNull(),
  totalStudentsManaged: integer("total_students_managed").notNull().default(0),
  pbisPointsAwarded: integer("pbis_points_awarded").notNull().default(0),
  positiveInteractions: integer("positive_interactions").notNull().default(0),
  negativeInteractions: integer("negative_interactions").notNull().default(0),
  parentCommunications: integer("parent_communications").notNull().default(0),
  reflectionsAssigned: integer("reflections_assigned").notNull().default(0),
  reflectionsCompleted: integer("reflections_completed").notNull().default(0),
  avgResponseTime: integer("avg_response_time").default(0), // in hours
  studentEngagementScore: integer("student_engagement_score").default(0), // 0-100
  effectivenessRating: integer("effectiveness_rating").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Recommendations for adaptive learning engine
export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => scholars.id),
  recommendationType: varchar("recommendation_type").notNull(), // 'learning_activity', 'intervention', 'enrichment', 'behavioral_support'
  priority: varchar("priority").notNull(), // 'low', 'medium', 'high', 'urgent'
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionItems: text("action_items").array().default([]),
  targetSkills: text("target_skills").array().default([]),
  estimatedDuration: integer("estimated_duration"), // in minutes
  confidence: integer("confidence").default(0), // AI confidence 0-100
  aiReasoning: text("ai_reasoning"), // Why AI made this recommendation
  implementedBy: varchar("implemented_by").references(() => teacherAuth.id),
  implementedAt: timestamp("implemented_at"),
  effectivenessRating: integer("effectiveness_rating"), // Teacher feedback 1-5
  status: varchar("status").default("pending"), // 'pending', 'in_progress', 'completed', 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievement Playground unlockables and progress
export const achievementPlayground = pgTable("achievement_playground", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => scholars.id),
  achievementType: varchar("achievement_type").notNull(), // 'milestone', 'badge', 'trophy', 'special_unlock'
  achievementId: varchar("achievement_id").notNull(), // Reference to specific achievement
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconType: varchar("icon_type").notNull(), // 'star', 'trophy', 'medal', 'crown', 'lightning'
  iconColor: varchar("icon_color").notNull(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  rarity: varchar("rarity").notNull(), // 'common', 'rare', 'epic', 'legendary'
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  unlockedAt: timestamp("unlocked_at"),
  progress: integer("progress").default(0), // 0-100
  requirements: jsonb("requirements"), // What's needed to unlock
  celebrationShown: boolean("celebration_shown").default(false),
  shareCount: integer("share_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gamified Progress Tracking
export const gamifiedProgress = pgTable("gamified_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => scholars.id),
  skillCategory: varchar("skill_category").notNull(), // 'academic', 'behavior', 'leadership', 'creativity'
  skillName: varchar("skill_name").notNull(),
  currentLevel: integer("current_level").notNull().default(1),
  currentXP: integer("current_xp").notNull().default(0),
  totalXP: integer("total_xp").notNull().default(0),
  nextLevelXP: integer("next_level_xp").notNull().default(100),
  streakDays: integer("streak_days").default(0),
  bestStreak: integer("best_streak").default(0),
  masteryLevel: varchar("mastery_level").default("novice"), // 'novice', 'apprentice', 'expert', 'master'
  lastActivityAt: timestamp("last_activity_at"),
  milestones: jsonb("milestones").default('[]'), // Array of achieved milestones
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const updateScholarSchema = z.object({
  name: z.string().min(1).optional(),
  grade: z.number().min(6).max(8).optional(),
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
  mustangTrait: z.enum(["M - Make Good Choices", "U - Use Kind Words", "S - Show School Pride", "T - Tolerant of Others", "A - Aim for Excellence", "N - Need to be Responsible", "G - Give 100% Everyday", "Make good choices", "Use kind words", "Show school pride", "Tolerant of others", "Aim for excellence", "Need to be responsible", "Give 100% everyday"]),
  category: z.enum(["bhsa_mustang_traits", "attendance", "behavior", "academic", "universal_positive", "universal_negative"]),
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
export type ProgressReport = typeof progressReports.$inferSelect;
export type TeacherPerformanceMetrics = typeof teacherPerformanceMetrics.$inferSelect;
export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type AchievementPlayground = typeof achievementPlayground.$inferSelect;
export type GamifiedProgress = typeof gamifiedProgress.$inferSelect;

// Trend Analytics Types
export interface StudentTrendData {
  period: string; // ISO date string for the period start
  start: Date;
  end: Date;
  studentId: string;
  studentName: string;
  grade: number;
  houseId: string | null;
  positive: number;
  negative: number;
  net: number;
}

export interface ClassroomTrendData {
  period: string; // ISO date string for the period start
  start: Date;
  end: Date;
  teacherId: string;
  teacherName: string;
  subject: string;
  grade: string;
  positive: number;
  negative: number;
  net: number;
}

// Insert schemas for new tables
export const insertProgressReportSchema = createInsertSchema(progressReports).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherPerformanceMetricsSchema = createInsertSchema(teacherPerformanceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertAIRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementPlaygroundSchema = createInsertSchema(achievementPlayground).omit({
  id: true,
  createdAt: true,
});

export const insertGamifiedProgressSchema = createInsertSchema(gamifiedProgress).omit({
  id: true,
  updatedAt: true,
});

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
export type InsertTeacherPasswordReset = typeof teacherPasswordResets.$inferInsert;
export type InsertAdminPasswordReset = typeof adminPasswordResets.$inferInsert;
export type TeacherPasswordReset = typeof teacherPasswordResets.$inferSelect;
export type AdminPasswordReset = typeof adminPasswordResets.$inferSelect;
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

// ===== SEL (Social Emotional Learning) System Tables =====

// SEL Lessons - AI-generated lessons based on behavioral incidents
export const selLessons = pgTable("sel_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  pbisEntryId: varchar("pbis_entry_id").references(() => pbisEntries.id), // The negative PBIS entry that triggered this lesson
  teacherName: text("teacher_name").notNull(), // Teacher who assigned the negative points
  behaviorType: text("behavior_type").notNull(), // 'disrespectful', 'disruptive', 'unsafe', etc.
  specificBehavior: text("specific_behavior").notNull(), // Detailed description of the behavior
  lessonTitle: text("lesson_title").notNull(), // AI-generated title
  lessonContent: text("lesson_content").notNull(), // Full lesson content generated by AI
  learningObjectives: jsonb("learning_objectives").notNull(), // Array of learning objectives
  difficulty: text("difficulty").notNull().default("age_appropriate"), // 'elementary', 'age_appropriate', 'advanced'
  estimatedTime: integer("estimated_time").notNull().default(15), // Estimated completion time in minutes
  status: text("status").notNull().default("assigned"), // 'assigned', 'in_progress', 'completed', 'overdue'
  assignedAt: timestamp("assigned_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date").notNull(), // 48-72 hours from assignment
  interventionLevel: integer("intervention_level").notNull().default(1), // 1=first offense, 2=repeat, 3=persistent
  createdAt: timestamp("created_at").defaultNow(),
});

// SEL Quiz Questions - AI-generated comprehension quiz for each lesson
export const selQuizQuestions = pgTable("sel_quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => selLessons.id),
  questionNumber: integer("question_number").notNull(), // 1-5
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"), // 'multiple_choice', 'true_false', 'short_answer'
  correctAnswer: text("correct_answer").notNull(),
  choices: jsonb("choices"), // For multiple choice questions
  explanation: text("explanation").notNull(), // Why this answer is correct
  createdAt: timestamp("created_at").defaultNow(),
});

// SEL Quiz Responses - Student answers and AI grading
export const selQuizResponses = pgTable("sel_quiz_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => selLessons.id),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  questionId: varchar("question_id").notNull().references(() => selQuizQuestions.id),
  studentAnswer: text("student_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  aiGradingNotes: text("ai_grading_notes"), // AI explanation of grading decision
  pointsEarned: integer("points_earned").notNull().default(0), // Points for this question
  timeSpent: integer("time_spent"), // Seconds spent on this question
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// SEL Quiz Results - Overall quiz performance
export const selQuizResults = pgTable("sel_quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => selLessons.id),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  totalQuestions: integer("total_questions").notNull().default(5),
  correctAnswers: integer("correct_answers").notNull(),
  scorePercentage: integer("score_percentage").notNull(), // 0-100
  passingScore: integer("passing_score").notNull().default(80), // Required score to pass
  isPassed: boolean("is_passed").notNull(),
  timeSpent: integer("time_spent").notNull(), // Total time in seconds
  attempts: integer("attempts").notNull().default(1), // Number of attempts (retakes allowed)
  aiOverallFeedback: text("ai_overall_feedback").notNull(), // AI-generated feedback on performance
  bonusPbisPoints: integer("bonus_pbis_points").default(0), // Bonus points for excellent performance
  completedAt: timestamp("completed_at").defaultNow(),
});

// SEL Notifications - Notifications for students, teachers, parents, administrators
export const selNotifications = pgTable("sel_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => selLessons.id),
  recipientType: text("recipient_type").notNull(), // 'student', 'teacher', 'parent', 'administrator'
  recipientId: varchar("recipient_id").notNull(), // ID of student, teacher, parent, or admin
  notificationType: text("notification_type").notNull(), // 'lesson_assigned', 'lesson_completed', 'quiz_passed', 'quiz_failed', 'overdue_reminder'
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  sentVia: text("sent_via").notNull().default("dashboard"), // 'dashboard', 'email', 'sms'
  sentAt: timestamp("sent_at").defaultNow(),
});

// SEL Progress Analytics - Track behavioral improvement over time
export const selProgressAnalytics = pgTable("sel_progress_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scholarId: varchar("scholar_id").notNull().references(() => scholars.id),
  behaviorType: text("behavior_type").notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  totalIncidents: integer("total_incidents").notNull().default(0), // Number of negative behaviors
  lessonsAssigned: integer("lessons_assigned").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  averageQuizScore: integer("average_quiz_score").default(0), // Average percentage
  improvementTrend: text("improvement_trend").default("stable"), // 'improving', 'stable', 'concerning'
  interventionLevel: integer("intervention_level").notNull().default(1), // Current intervention level
  lastIncidentDate: timestamp("last_incident_date"),
  consecutiveDaysWithoutIncident: integer("consecutive_days_without_incident").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// SEL Behavioral Definitions - Comprehensive behavior database for AI lesson generation
export const selBehaviorDefinitions = pgTable("sel_behavior_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  behaviorType: text("behavior_type").notNull().unique(), // 'disrespectful', 'disruptive', etc.
  category: text("category").notNull(), // 'social', 'emotional', 'academic', 'safety'
  description: text("description").notNull(),
  severity: text("severity").notNull().default("minor"), // 'minor', 'major', 'severe'
  commonTriggers: jsonb("common_triggers"), // Array of common triggers
  preventionStrategies: jsonb("prevention_strategies"), // Array of prevention strategies
  interventionApproaches: jsonb("intervention_approaches"), // Array of intervention methods
  learningObjectives: jsonb("learning_objectives"), // Default learning objectives for this behavior
  mustangTraitConnection: text("mustang_trait_connection"), // Which MUSTANG trait this relates to
  gradeAppropriate: jsonb("grade_appropriate"), // Which grades this applies to [6,7,8]
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Add SEL Insert Schemas
export const insertSelLessonSchema = createInsertSchema(selLessons).omit({
  id: true,
  createdAt: true,
  assignedAt: true,
  startedAt: true,
  completedAt: true,
}).extend({
  behaviorType: z.string().min(1),
  specificBehavior: z.string().min(1),
  lessonTitle: z.string().min(1),
  lessonContent: z.string().min(10),
  status: z.enum(["assigned", "in_progress", "completed", "overdue"]).default("assigned"),
  interventionLevel: z.number().min(1).max(3).default(1),
  estimatedTime: z.number().min(5).max(60).default(15),
});

export const insertSelQuizQuestionSchema = createInsertSchema(selQuizQuestions).omit({
  id: true,
  createdAt: true,
}).extend({
  questionNumber: z.number().min(1).max(5),
  questionText: z.string().min(1),
  questionType: z.enum(["multiple_choice", "true_false", "short_answer"]).default("multiple_choice"),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
});

export const insertSelQuizResponseSchema = createInsertSchema(selQuizResponses).omit({
  id: true,
  submittedAt: true,
}).extend({
  studentAnswer: z.string().min(1),
  pointsEarned: z.number().min(0).max(10).default(0),
  timeSpent: z.number().optional(),
});

export const insertSelQuizResultSchema = createInsertSchema(selQuizResults).omit({
  id: true,
  completedAt: true,
}).extend({
  totalQuestions: z.number().min(1).max(10).default(5),
  correctAnswers: z.number().min(0),
  scorePercentage: z.number().min(0).max(100),
  passingScore: z.number().min(0).max(100).default(80),
  attempts: z.number().min(1).default(1),
  aiOverallFeedback: z.string().min(1),
  bonusPbisPoints: z.number().min(0).default(0),
});

export const insertSelNotificationSchema = createInsertSchema(selNotifications).omit({
  id: true,
  sentAt: true,
}).extend({
  recipientType: z.enum(["student", "teacher", "parent", "administrator"]),
  notificationType: z.enum(["lesson_assigned", "lesson_completed", "quiz_passed", "quiz_failed", "overdue_reminder"]),
  title: z.string().min(1),
  message: z.string().min(1),
  sentVia: z.enum(["dashboard", "email", "sms"]).default("dashboard"),
});

export const insertSelBehaviorDefinitionSchema = createInsertSchema(selBehaviorDefinitions).omit({
  id: true,
  lastUpdated: true,
}).extend({
  behaviorType: z.string().min(1),
  category: z.enum(["social", "emotional", "academic", "safety"]),
  description: z.string().min(1),
  severity: z.enum(["minor", "major", "severe"]).default("minor"),
  mustangTraitConnection: z.string().optional(),
});

// SEL Type Exports
export type SelLesson = typeof selLessons.$inferSelect;
export type SelQuizQuestion = typeof selQuizQuestions.$inferSelect;
export type SelQuizResponse = typeof selQuizResponses.$inferSelect;
export type SelQuizResult = typeof selQuizResults.$inferSelect;
export type SelNotification = typeof selNotifications.$inferSelect;
export type SelProgressAnalytics = typeof selProgressAnalytics.$inferSelect;
export type SelBehaviorDefinition = typeof selBehaviorDefinitions.$inferSelect;

export type InsertSelLesson = z.infer<typeof insertSelLessonSchema>;
export type InsertSelQuizQuestion = z.infer<typeof insertSelQuizQuestionSchema>;
export type InsertSelQuizResponse = z.infer<typeof insertSelQuizResponseSchema>;
export type InsertSelQuizResult = z.infer<typeof insertSelQuizResultSchema>;
export type InsertSelNotification = z.infer<typeof insertSelNotificationSchema>;
export type InsertSelBehaviorDefinition = z.infer<typeof insertSelBehaviorDefinitionSchema>;

// Staff Champions Awards System
export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'secretary', 'school_nurse', 'bookkeeper', 'cnp_manager', 'cnp_team', 'iss_facilitator', 'custodian', 'head_custodian', 'sro'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherChampionPoints = pgTable("teacher_champion_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teacherAuth.id),
  category: text("category").notNull(), // 'attendance', 'lesson_plans', 'school_events', 'school_spirit_weekly', 'school_spirit_monthly', 'parent_contact', 'morning_duty_daily', 'morning_duty_monthly', 'mustang_principles', 'iready_weekly', 'iready_monthly', 'sel_lessons', 'focus_board', 'clock_in', 'no_mispunches'
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  awardedBy: varchar("awarded_by").notNull().references(() => administrators.id),
  awardedAt: timestamp("awarded_at").defaultNow(),
});

export const staffChampionPoints = pgTable("staff_champion_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staffMembers.id),
  category: text("category").notNull(), // Custom categories for staff
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  awardedBy: varchar("awarded_by").notNull().references(() => administrators.id),
  awardedAt: timestamp("awarded_at").defaultNow(),
});

// Staff Champions Insert Schemas
export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
}).extend({
  name: z.string().min(1),
  role: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const insertTeacherChampionPointsSchema = createInsertSchema(teacherChampionPoints).omit({
  id: true,
  awardedAt: true,
}).extend({
  teacherId: z.string().min(1),
  category: z.string().min(1),
  points: z.number().min(1),
  reason: z.string().min(1),
  awardedBy: z.string().min(1),
});

export const insertStaffChampionPointsSchema = createInsertSchema(staffChampionPoints).omit({
  id: true,
  awardedAt: true,
}).extend({
  staffId: z.string().min(1),
  category: z.string().min(1),
  points: z.number().min(1),
  reason: z.string().min(1),
  awardedBy: z.string().min(1),
});

// Staff Champions Type Exports
export type StaffMember = typeof staffMembers.$inferSelect;
export type TeacherChampionPoints = typeof teacherChampionPoints.$inferSelect;
export type StaffChampionPoints = typeof staffChampionPoints.$inferSelect;

export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type InsertTeacherChampionPoints = z.infer<typeof insertTeacherChampionPointsSchema>;
export type InsertStaffChampionPoints = z.infer<typeof insertStaffChampionPointsSchema>;

// ========================
// ACAP Module Tables
// ========================

export const acapStandards = pgTable("acap_standards", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  domain: varchar("domain", { length: 100 }).notNull(),
  subdomain: varchar("subdomain", { length: 200 }),
  gradeLevel: integer("grade_level").notNull(),
  description: text("description").notNull(),
  dokLevels: jsonb("dok_levels").$type<number[]>().notNull().default([2, 3, 4]),
  isActive: boolean("is_active").notNull().default(true),
});

export const acapBlueprints = pgTable("acap_blueprints", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  gradeLevel: integer("grade_level").notNull(),
  subject: varchar("subject", { length: 50 }).notNull(),
  standardIds: jsonb("standard_ids").$type<number[]>().notNull().default([]),
  dokDistribution: jsonb("dok_distribution").$type<Record<string, number>>().notNull().default({}),
  totalItems: integer("total_items").notNull().default(30),
  timeLimitMinutes: integer("time_limit_minutes").notNull().default(60),
  isActive: boolean("is_active").notNull().default(true),
});

export const acapPassages = pgTable("acap_passages", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  genre: varchar("genre", { length: 50 }),
  lexileLevel: integer("lexile_level"),
  gradeLevel: integer("grade_level").notNull(),
  standardId: integer("standard_id").references(() => acapStandards.id),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapItems = pgTable("acap_items", {
  id: serial("id").primaryKey(),
  standardId: integer("standard_id").references(() => acapStandards.id).notNull(),
  blueprintId: integer("blueprint_id").references(() => acapBlueprints.id),
  passageId: integer("passage_id").references(() => acapPassages.id),
  itemType: varchar("item_type", { length: 30 }).notNull(),
  dokLevel: integer("dok_level").notNull(),
  stem: text("stem").notNull(),
  options: jsonb("options").$type<{ key: string; text: string; }[]>().default([]),
  correctAnswer: jsonb("correct_answer").$type<any>().notNull(),
  rubric: jsonb("rubric").$type<any>(),
  explanation: text("explanation"),
  difficulty: real("difficulty").default(0.5),
  discrimination: real("discrimination").default(1.0),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  reviewStatus: varchar("review_status", { length: 20 }).notNull().default("pending"),
  reviewedBy: varchar("reviewed_by"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapAssessments = pgTable("acap_assessments", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  assessmentType: varchar("assessment_type", { length: 20 }).notNull(),
  blueprintId: integer("blueprint_id").references(() => acapBlueprints.id),
  gradeLevel: integer("grade_level").notNull(),
  subject: varchar("subject", { length: 50 }).notNull(),
  itemIds: jsonb("item_ids").$type<number[]>().notNull().default([]),
  timeLimitMinutes: integer("time_limit_minutes").default(60),
  isAdaptive: boolean("is_adaptive").notNull().default(false),
  settings: jsonb("settings").$type<Record<string, any>>().default({}),
  createdBy: varchar("created_by"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapAssignments = pgTable("acap_assignments", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").references(() => acapAssessments.id).notNull(),
  teacherId: varchar("teacher_id").references(() => teacherAuth.id).notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetIds: jsonb("target_ids").$type<string[]>().notNull().default([]),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date").defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapAttempts = pgTable("acap_attempts", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => acapAssignments.id),
  assessmentId: integer("assessment_id").references(() => acapAssessments.id).notNull(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("in_progress"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  rawScore: real("raw_score"),
  scaledScore: real("scaled_score"),
  percentCorrect: real("percent_correct"),
  dokBreakdown: jsonb("dok_breakdown").$type<Record<string, any>>().default({}),
  standardBreakdown: jsonb("standard_breakdown").$type<Record<string, any>>().default({}),
  adaptiveState: jsonb("adaptive_state").$type<Record<string, any>>().default({}),
  timeSpentSeconds: integer("time_spent_seconds"),
});

export const acapItemResponses = pgTable("acap_item_responses", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => acapAttempts.id).notNull(),
  itemId: integer("item_id").references(() => acapItems.id).notNull(),
  response: jsonb("response").$type<any>(),
  isCorrect: boolean("is_correct"),
  score: real("score"),
  maxScore: real("max_score").default(1),
  aiGradingResult: jsonb("ai_grading_result").$type<Record<string, any>>(),
  timeSpentSeconds: integer("time_spent_seconds"),
  sequenceNumber: integer("sequence_number").notNull(),
  respondedAt: timestamp("responded_at").defaultNow(),
});

export const acapMasteryTracking = pgTable("acap_mastery_tracking", {
  id: serial("id").primaryKey(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  standardId: integer("standard_id").references(() => acapStandards.id).notNull(),
  masteryLevel: varchar("mastery_level", { length: 30 }).notNull().default("not_started"),
  currentScore: real("current_score").default(0),
  attemptsCount: integer("attempts_count").default(0),
  lastAttemptDate: timestamp("last_attempt_date"),
  history: jsonb("history").$type<any[]>().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const acapGrowthSnapshots = pgTable("acap_growth_snapshots", {
  id: serial("id").primaryKey(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  snapshotType: varchar("snapshot_type", { length: 20 }).notNull(),
  assessmentId: integer("assessment_id").references(() => acapAssessments.id),
  overallScore: real("overall_score"),
  domainScores: jsonb("domain_scores").$type<Record<string, number>>().default({}),
  standardScores: jsonb("standard_scores").$type<Record<string, number>>().default({}),
  growthFromBaseline: real("growth_from_baseline"),
  riskLevel: varchar("risk_level", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapBootcampSessions = pgTable("acap_bootcamp_sessions", {
  id: serial("id").primaryKey(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  standardId: integer("standard_id").references(() => acapStandards.id).notNull(),
  sessionType: varchar("session_type", { length: 30 }).notNull().default("tutoring"),
  messages: jsonb("messages").$type<{ role: string; content: string; timestamp: string; }[]>().default([]),
  practiceItems: jsonb("practice_items").$type<any[]>().default([]),
  performanceSummary: jsonb("performance_summary").$type<Record<string, any>>(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const acapAuditLog = pgTable("acap_audit_log", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  userId: varchar("user_id"),
  userRole: varchar("user_role", { length: 30 }),
  details: jsonb("details").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projected ACAP Score Tables
export const acapProjectionRuns = pgTable("acap_projection_runs", {
  id: serial("id").primaryKey(),
  gradeLevel: integer("grade_level"),
  subject: varchar("subject", { length: 50 }),
  assessmentPhase: varchar("assessment_phase", { length: 30 }).notNull().default("baseline"),
  proficiencyIndex: real("proficiency_index").default(0),
  growthIndex: real("growth_index").default(0),
  writingIndex: real("writing_index").default(0),
  attendancePoints: real("attendance_points").default(0),
  elPoints: real("el_points").default(0),
  projectedScore: real("projected_score").default(0),
  letterGrade: varchar("letter_grade", { length: 5 }).default("F"),
  thresholds: jsonb("thresholds").$type<Record<string, number>>().default({ A: 90, B: 80, C: 70, D: 60, F: 0 }),
  proficiencyDistribution: jsonb("proficiency_distribution").$type<Record<string, number>>().default({}),
  dokBreakdown: jsonb("dok_breakdown").$type<Record<string, number>>().default({}),
  domainBreakdown: jsonb("domain_breakdown").$type<Record<string, number>>().default({}),
  growthProjection: jsonb("growth_projection").$type<Record<string, any>>().default({}),
  coachingRecommendations: jsonb("coaching_recommendations").$type<string[]>().default([]),
  totalStudentsTested: integer("total_students_tested").default(0),
  levelCounts: jsonb("level_counts").$type<Record<string, number>>().default({ level1: 0, level2: 0, level3: 0, level4: 0 }),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapProjectionSnapshots = pgTable("acap_projection_snapshots", {
  id: serial("id").primaryKey(),
  projectionRunId: integer("projection_run_id").references(() => acapProjectionRuns.id).notNull(),
  scenarioName: varchar("scenario_name", { length: 200 }).notNull(),
  levelShifts: jsonb("level_shifts").$type<Record<string, number>>().default({}),
  attendanceWhatIf: jsonb("attendance_what_if").$type<Record<string, any>>().default({}),
  adjustedScore: real("adjusted_score").default(0),
  adjustedLetterGrade: varchar("adjusted_letter_grade", { length: 5 }).default("F"),
  studentsNeededForNextGrade: integer("students_needed_for_next_grade").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapSchoolwideAssessments = pgTable("acap_schoolwide_assessments", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  gradeLevels: jsonb("grade_levels").$type<number[]>().notNull().default([]),
  subject: varchar("subject", { length: 50 }).notNull(),
  itemCount: integer("item_count").notNull().default(50),
  dokMix: jsonb("dok_mix").$type<Record<string, number>>().default({ dok2: 30, dok3: 50, dok4: 20 }),
  domainWeights: jsonb("domain_weights").$type<Record<string, number>>().default({}),
  writingTypes: jsonb("writing_types").$type<string[]>().default([]),
  blueprintId: integer("blueprint_id").references(() => acapBlueprints.id),
  settings: jsonb("settings").$type<Record<string, any>>().default({}),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapSchoolwideResults = pgTable("acap_schoolwide_results", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").references(() => acapSchoolwideAssessments.id).notNull(),
  proficiencyDistribution: jsonb("proficiency_distribution").$type<Record<string, number>>().default({}),
  domainBreakdown: jsonb("domain_breakdown").$type<Record<string, number>>().default({}),
  dokBreakdown: jsonb("dok_breakdown").$type<Record<string, number>>().default({}),
  growthProjection: jsonb("growth_projection").$type<Record<string, any>>().default({}),
  diagnostics: jsonb("diagnostics").$type<Record<string, any>>().default({}),
  projectedScore: real("projected_score").default(0),
  letterGrade: varchar("letter_grade", { length: 5 }).default("F"),
  totalStudents: integer("total_students").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== ACAP IMPACT SIMULATOR TABLES =====
export const acapImpactRuns = pgTable("acap_impact_runs", {
  id: serial("id").primaryKey(),
  scopeType: varchar("scope_type", { length: 20 }).notNull().default("SCHOOL"),
  subject: varchar("subject", { length: 20 }),
  gradeLevel: integer("grade_level"),
  classId: varchar("class_id", { length: 50 }),
  dateRange: varchar("date_range", { length: 20 }).default("qtr"),
  currentProjectedScore: real("current_projected_score").default(0),
  currentLetter: varchar("current_letter", { length: 2 }),
  projectedPointGain: real("projected_point_gain").default(0),
  targetLetter: varchar("target_letter", { length: 2 }),
  attendancePoints: real("attendance_points").default(10.5),
  elPoints: real("el_points").default(0),
  inputs: jsonb("inputs").$type<Record<string, any>>().default({}),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapImpactLevers = pgTable("acap_impact_levers", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => acapImpactRuns.id),
  name: varchar("name", { length: 200 }).notNull(),
  leverType: varchar("lever_type", { length: 50 }).notNull(),
  estimatedPointGain: real("estimated_point_gain").notNull().default(0),
  weeksToImpact: integer("weeks_to_impact").default(6),
  studentsAffected: integer("students_affected").default(0),
  confidence: real("confidence").default(0.5),
  summary: text("summary"),
  actionType: varchar("action_type", { length: 50 }),
  actionPayload: jsonb("action_payload").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== ACAP STUDENT READINESS GENOME TABLES =====
export const acapGenomeTraits = pgTable("acap_genome_traits", {
  id: serial("id").primaryKey(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  subject: varchar("subject", { length: 20 }).notNull(),
  gradeLevel: integer("grade_level").notNull(),
  traitKey: varchar("trait_key", { length: 50 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  score: real("score").notNull().default(0),
  level: integer("level").notNull().default(1),
  description: text("description"),
  readinessScore: real("readiness_score").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const acapGenomeEvents = pgTable("acap_genome_events", {
  id: serial("id").primaryKey(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 20 }),
  gradeLevel: integer("grade_level"),
  sourceId: integer("source_id"),
  sourceType: varchar("source_type", { length: 30 }),
  data: jsonb("data").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const acapGenomeRecommendations = pgTable("acap_genome_recommendations", {
  id: serial("id").primaryKey(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  subject: varchar("subject", { length: 20 }).notNull(),
  gradeLevel: integer("grade_level").notNull(),
  priority: integer("priority").notNull().default(1),
  category: varchar("category", { length: 30 }).notNull(),
  recommendation: text("recommendation").notNull(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  actionPayload: jsonb("action_payload").$type<Record<string, any>>().default({}),
  tutorAdaptations: jsonb("tutor_adaptations").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ACAP Insert Schemas
export const insertAcapStandardSchema = createInsertSchema(acapStandards).omit({ id: true });
export const insertAcapBlueprintSchema = createInsertSchema(acapBlueprints).omit({ id: true });
export const insertAcapPassageSchema = createInsertSchema(acapPassages).omit({ id: true, createdAt: true });
export const insertAcapItemSchema = createInsertSchema(acapItems).omit({ id: true, createdAt: true });
export const insertAcapAssessmentSchema = createInsertSchema(acapAssessments).omit({ id: true, createdAt: true });
export const insertAcapAssignmentSchema = createInsertSchema(acapAssignments).omit({ id: true, createdAt: true });
export const insertAcapAttemptSchema = createInsertSchema(acapAttempts).omit({ id: true });
export const insertAcapItemResponseSchema = createInsertSchema(acapItemResponses).omit({ id: true, respondedAt: true });
export const insertAcapMasterySchema = createInsertSchema(acapMasteryTracking).omit({ id: true, updatedAt: true });
export const insertAcapGrowthSnapshotSchema = createInsertSchema(acapGrowthSnapshots).omit({ id: true, createdAt: true });
export const insertAcapBootcampSessionSchema = createInsertSchema(acapBootcampSessions).omit({ id: true, startedAt: true });
export const insertAcapAuditLogSchema = createInsertSchema(acapAuditLog).omit({ id: true, createdAt: true });
export const insertAcapProjectionRunSchema = createInsertSchema(acapProjectionRuns).omit({ id: true, createdAt: true });
export const insertAcapProjectionSnapshotSchema = createInsertSchema(acapProjectionSnapshots).omit({ id: true, createdAt: true });
export const insertAcapSchoolwideAssessmentSchema = createInsertSchema(acapSchoolwideAssessments).omit({ id: true, createdAt: true });
export const insertAcapSchoolwideResultSchema = createInsertSchema(acapSchoolwideResults).omit({ id: true, createdAt: true });
export const insertAcapImpactRunSchema = createInsertSchema(acapImpactRuns).omit({ id: true, createdAt: true });
export const insertAcapImpactLeverSchema = createInsertSchema(acapImpactLevers).omit({ id: true, createdAt: true });
export const insertAcapGenomeTraitSchema = createInsertSchema(acapGenomeTraits).omit({ id: true, updatedAt: true });
export const insertAcapGenomeEventSchema = createInsertSchema(acapGenomeEvents).omit({ id: true, createdAt: true });
export const insertAcapGenomeRecommendationSchema = createInsertSchema(acapGenomeRecommendations).omit({ id: true, createdAt: true });

export const acapTutorAdaptations = pgTable("acap_tutor_adaptations", {
  id: serial("id").primaryKey(),
  scholarId: varchar("scholar_id").references(() => scholars.id).notNull(),
  subject: varchar("subject", { length: 20 }).notNull(),
  reduceVocabLoad: boolean("reduce_vocab_load").default(false).notNull(),
  increaseWorkedExamples: boolean("increase_worked_examples").default(false).notNull(),
  requireJustificationEvery: integer("require_justification_every").default(2).notNull(),
  hintPolicy: varchar("hint_policy", { length: 50 }).default("standard").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAcapTutorAdaptationSchema = createInsertSchema(acapTutorAdaptations).omit({ id: true, updatedAt: true });

export const acapAccessCodes = pgTable("acap_access_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 12 }).notNull().unique(),
  assessmentId: integer("assessment_id").references(() => acapAssessments.id),
  teacherId: varchar("teacher_id").notNull(),
  window: varchar({ length: 20 }).notNull(),
  gradeLevel: integer("grade_level").notNull(),
  subject: varchar("subject", { length: 20 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAcapAccessCodeSchema = createInsertSchema(acapAccessCodes).omit({ id: true, createdAt: true });

// ACAP Type Exports
export type AcapStandard = typeof acapStandards.$inferSelect;
export type AcapBlueprint = typeof acapBlueprints.$inferSelect;
export type AcapPassage = typeof acapPassages.$inferSelect;
export type AcapItem = typeof acapItems.$inferSelect;
export type AcapAssessment = typeof acapAssessments.$inferSelect;
export type AcapAssignment = typeof acapAssignments.$inferSelect;
export type AcapAttempt = typeof acapAttempts.$inferSelect;
export type AcapItemResponse = typeof acapItemResponses.$inferSelect;
export type AcapMasteryTracking = typeof acapMasteryTracking.$inferSelect;
export type AcapGrowthSnapshot = typeof acapGrowthSnapshots.$inferSelect;
export type AcapBootcampSession = typeof acapBootcampSessions.$inferSelect;
export type AcapAuditLog = typeof acapAuditLog.$inferSelect;
export type AcapProjectionRun = typeof acapProjectionRuns.$inferSelect;
export type AcapProjectionSnapshot = typeof acapProjectionSnapshots.$inferSelect;
export type AcapSchoolwideAssessment = typeof acapSchoolwideAssessments.$inferSelect;
export type AcapSchoolwideResult = typeof acapSchoolwideResults.$inferSelect;

export type InsertAcapStandard = z.infer<typeof insertAcapStandardSchema>;
export type InsertAcapBlueprint = z.infer<typeof insertAcapBlueprintSchema>;
export type InsertAcapPassage = z.infer<typeof insertAcapPassageSchema>;
export type InsertAcapItem = z.infer<typeof insertAcapItemSchema>;
export type InsertAcapAssessment = z.infer<typeof insertAcapAssessmentSchema>;
export type InsertAcapAssignment = z.infer<typeof insertAcapAssignmentSchema>;
export type InsertAcapAttempt = z.infer<typeof insertAcapAttemptSchema>;
export type InsertAcapItemResponse = z.infer<typeof insertAcapItemResponseSchema>;
export type InsertAcapMasteryTracking = z.infer<typeof insertAcapMasterySchema>;
export type InsertAcapGrowthSnapshot = z.infer<typeof insertAcapGrowthSnapshotSchema>;
export type InsertAcapBootcampSession = z.infer<typeof insertAcapBootcampSessionSchema>;
export type InsertAcapAuditLog = z.infer<typeof insertAcapAuditLogSchema>;
export type InsertAcapProjectionRun = z.infer<typeof insertAcapProjectionRunSchema>;
export type InsertAcapProjectionSnapshot = z.infer<typeof insertAcapProjectionSnapshotSchema>;
export type InsertAcapSchoolwideAssessment = z.infer<typeof insertAcapSchoolwideAssessmentSchema>;
export type InsertAcapSchoolwideResult = z.infer<typeof insertAcapSchoolwideResultSchema>;

export type AcapImpactRun = typeof acapImpactRuns.$inferSelect;
export type AcapImpactLever = typeof acapImpactLevers.$inferSelect;
export type AcapGenomeTrait = typeof acapGenomeTraits.$inferSelect;
export type AcapGenomeEvent = typeof acapGenomeEvents.$inferSelect;
export type AcapGenomeRecommendation = typeof acapGenomeRecommendations.$inferSelect;
export type AcapTutorAdaptation = typeof acapTutorAdaptations.$inferSelect;
export type InsertAcapTutorAdaptation = z.infer<typeof insertAcapTutorAdaptationSchema>;
export type AcapAccessCode = typeof acapAccessCodes.$inferSelect;
export type InsertAcapAccessCode = z.infer<typeof insertAcapAccessCodeSchema>;
export type InsertAcapImpactRun = z.infer<typeof insertAcapImpactRunSchema>;
export type InsertAcapImpactLever = z.infer<typeof insertAcapImpactLeverSchema>;
export type InsertAcapGenomeTrait = z.infer<typeof insertAcapGenomeTraitSchema>;
export type InsertAcapGenomeEvent = z.infer<typeof insertAcapGenomeEventSchema>;
export type InsertAcapGenomeRecommendation = z.infer<typeof insertAcapGenomeRecommendationSchema>;

// Re-export chat models for integration
export { conversations, messages } from "./models/chat";
