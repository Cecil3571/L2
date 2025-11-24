import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "coach"
  content: text("content").notNull(),
  type: text("type").notNull(), // "text", "image", "analysis"
  imageUrl: text("image_url"),
  imageData: text("image_data"), // base64 encoded image
  mode: text("mode"), // "tldr" or "full"
  scenarioId: text("scenario_id"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  title: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  role: true,
  content: true,
  type: true,
  imageUrl: true,
  imageData: true,
  mode: true,
  scenarioId: true,
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
