import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { scholars } from "./schema";

// Sticker Collections - Different themed collections students can complete
export const stickerCollections = pgTable("sticker_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "House Pride", "Academic Excellence", etc.
  description: text("description").notNull(),
  theme: text("theme").notNull(), // "house", "academic", "behavior", "seasonal"
  totalStickers: integer("total_stickers").notNull(),
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced"
  seasonalStart: timestamp("seasonal_start"),
  seasonalEnd: timestamp("seasonal_end"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual Stickers - The collectible items within collections
export const stickers = pgTable("stickers", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").references(() => stickerCollections.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(), // The visual representation
  rarity: text("rarity").notNull(), // "common", "uncommon", "rare", "epic", "legendary"
  triggerType: text("trigger_type").notNull(), // "points", "streak", "behavior", "academic", "special"
  triggerCondition: jsonb("trigger_condition").notNull(), // JSON with specific requirements
  points: integer("points").default(0), // Points awarded when collected
  isAnimated: boolean("is_animated").default(false),
  unlockMessage: text("unlock_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Sticker Collection - Track which stickers each student has collected
export const studentStickers = pgTable("student_stickers", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => scholars.id),
  stickerId: uuid("sticker_id").references(() => stickers.id),
  collectedAt: timestamp("collected_at").defaultNow(),
  isNew: boolean("is_new").default(true), // For showing "NEW!" badges
});

// Daily Learning Challenges
export const dailyChallenges = pgTable("daily_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: timestamp("date").notNull(),
  subject: text("subject").notNull(), // "math", "science", "english", "history", "mixed"
  gradeLevel: integer("grade_level").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  challengeType: text("challenge_type").notNull(), // "question", "puzzle", "creative", "reflection"
  content: jsonb("content").notNull(), // Question, options, correct answer, etc.
  difficulty: text("difficulty").notNull(), // "easy", "medium", "hard"
  points: integer("points").default(5),
  timeEstimate: integer("time_estimate").default(3), // minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Challenge Participation
export const studentChallenges = pgTable("student_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => scholars.id),
  challengeId: uuid("challenge_id").references(() => dailyChallenges.id),
  completedAt: timestamp("completed_at").defaultNow(),
  response: jsonb("response"), // Student's answer/response
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned").default(0),
  streak: integer("streak").default(0), // Current streak count
});

// Mood-Based Learning Recommendations
export const moodRecommendations = pgTable("mood_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  mood: text("mood").notNull(), // "energetic", "tired", "frustrated", "confident", "bored", "focused"
  energyLevel: text("energy_level").notNull(), // "low", "medium", "high"
  subject: text("subject").notNull(),
  gradeLevel: integer("grade_level").notNull(),
  activityType: text("activity_type").notNull(), // "video", "game", "reflection", "practice", "creative"
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: jsonb("content").notNull(), // Activity details, links, instructions
  duration: integer("duration").notNull(), // minutes
  difficulty: text("difficulty").notNull(),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Mood Check-ins
export const studentMoodCheckins = pgTable("student_mood_checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => scholars.id),
  mood: text("mood").notNull(),
  energyLevel: text("energy_level").notNull(),
  timeOfDay: text("time_of_day").notNull(), // "morning", "afternoon", "evening"
  context: text("context"), // Optional context about current situation
  recommendationUsed: uuid("recommendation_used").references(() => moodRecommendations.id),
  checkinAt: timestamp("checkin_at").defaultNow(),
});

// Student Achievement Streaks
export const studentStreaks = pgTable("student_streaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => scholars.id),
  streakType: text("streak_type").notNull(), // "daily_challenge", "mood_checkin", "points", "attendance"
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Insert Schemas for validation
export const insertStickerCollectionSchema = createInsertSchema(stickerCollections);
export const insertStickerSchema = createInsertSchema(stickers);
export const insertStudentStickerSchema = createInsertSchema(studentStickers);
export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges);
export const insertStudentChallengeSchema = createInsertSchema(studentChallenges);
export const insertMoodRecommendationSchema = createInsertSchema(moodRecommendations);
export const insertStudentMoodCheckinSchema = createInsertSchema(studentMoodCheckins);
export const insertStudentStreakSchema = createInsertSchema(studentStreaks);

// Types
export type StickerCollection = typeof stickerCollections.$inferSelect;
export type InsertStickerCollection = z.infer<typeof insertStickerCollectionSchema>;
export type Sticker = typeof stickers.$inferSelect;
export type InsertSticker = z.infer<typeof insertStickerSchema>;
export type StudentSticker = typeof studentStickers.$inferSelect;
export type InsertStudentSticker = z.infer<typeof insertStudentStickerSchema>;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type InsertDailyChallenge = z.infer<typeof insertDailyChallengeSchema>;
export type StudentChallenge = typeof studentChallenges.$inferSelect;
export type InsertStudentChallenge = z.infer<typeof insertStudentChallengeSchema>;
export type MoodRecommendation = typeof moodRecommendations.$inferSelect;
export type InsertMoodRecommendation = z.infer<typeof insertMoodRecommendationSchema>;
export type StudentMoodCheckin = typeof studentMoodCheckins.$inferSelect;
export type InsertStudentMoodCheckin = z.infer<typeof insertStudentMoodCheckinSchema>;
export type StudentStreak = typeof studentStreaks.$inferSelect;
export type InsertStudentStreak = z.infer<typeof insertStudentStreakSchema>;