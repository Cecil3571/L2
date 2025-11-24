import { db } from "./db.js";
import { type Session, type Message, type InsertSession, type InsertMessage, sessions, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Sessions
  createSession(title: string): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  deleteSession(id: string): Promise<void>;
  updateSession(id: string, title: string): Promise<Session>;

  // Messages
  createMessage(data: InsertMessage): Promise<Message>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  deleteMessage(id: string): Promise<void>;
  deleteMessagesBySession(sessionId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createSession(title: string): Promise<Session> {
    const result = await db
      .insert(sessions)
      .values({ title })
      .returning();
    return result[0];
  }

  async getSession(id: string): Promise<Session | undefined> {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id));
    return result[0];
  }

  async getAllSessions(): Promise<Session[]> {
    return db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.createdAt));
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async updateSession(id: string, title: string): Promise<Session> {
    const result = await db
      .update(sessions)
      .set({ title })
      .where(eq(sessions.id, id))
      .returning();
    return result[0];
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values(data)
      .returning();
    return result[0];
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.timestamp);
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async deleteMessagesBySession(sessionId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.sessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();
