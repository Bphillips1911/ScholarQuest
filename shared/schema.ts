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
  houseId: varchar("house_id").notNull().references(() => houses.id),
  academicPoints: integer("academic_points").notNull().default(0),
  attendancePoints: integer("attendance_points").notNull().default(0),
  behaviorPoints: integer("behavior_points").notNull().default(0),
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
  points: z.number().min(1).max(10),
  mustangTrait: z.enum(["Motivated", "Understanding", "Safe", "Teamwork", "Accountable", "Noble", "Growth"]),
});

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

export type House = typeof houses.$inferSelect;
export type Scholar = typeof scholars.$inferSelect;
export type PointEntry = typeof pointEntries.$inferSelect;
export type PbisEntry = typeof pbisEntries.$inferSelect;
export type PbisPhoto = typeof pbisPhotos.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type InsertHouse = z.infer<typeof insertHouseSchema>;
export type InsertScholar = z.infer<typeof insertScholarSchema>;
export type InsertPointEntry = z.infer<typeof insertPointEntrySchema>;
export type InsertPbisEntry = z.infer<typeof insertPbisEntrySchema>;
export type InsertPbisPhoto = z.infer<typeof insertPbisPhotoSchema>;
export type InsertParent = z.infer<typeof insertParentSchema>;
