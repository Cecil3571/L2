import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer, { type Multer } from "multer";
import { insertSessionSchema, insertMessageSchema } from "@shared/schema";
import OpenAI from "openai";

const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function analyzeL2Screenshot(imageData: string, mode: "tldr" | "full" = "tldr"): Promise<string> {
  const prompt = mode === "tldr" 
    ? `You are an expert Level 2 tape reader and scalping mentor. Analyze this L2 market data screenshot and provide a quick, decisive TL;DR read.

RESPOND ONLY with market analysis in this exact format:
> COACH READ
[Your 2-3 line flash read here - who's in control, what's the setup, one action]

Be concise, use trader language. Focus on: who's aggressive (buyers/sellers), order flow direction, key levels, and immediate opportunity.`
    : `You are an expert Level 2 tape reader and scalping mentor. Provide a DEEP analysis of this L2 market data screenshot.

RESPOND ONLY with market analysis in this exact format:
> COACH READ
[Detailed analysis with multiple sections]

Include:
1. Market Control - Who's in charge (buyers/sellers) and why
2. Order Flow - What the tape is showing about activity
3. Key Levels - Support/resistance and order clustering
4. Trade Setup - What to watch for, entry/exit scenarios
5. Risk/Reward - Best R:R setup visible

Use precise trader language. Reference specific details from the screenshot (price levels, volume clustering, etc).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: mode === "tldr" ? 300 : 1000,
    });

    return response.choices[0]?.message?.content || "Unable to analyze screenshot";
  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sessions endpoints
  app.get("/api/sessions", async (req, res) => {
    try {
      const allSessions = await storage.getAllSessions();
      res.json(allSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      // Return empty array if table doesn't exist yet (migrations pending)
      res.json([]);
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required" });
      }
      const newSession = await storage.createSession(title);
      res.json(newSession);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      await storage.deleteSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Messages endpoints
  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const msgs = await storage.getMessagesBySession(req.params.sessionId);
      res.json(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { role, content, type, imageUrl, imageData, mode, scenarioId } = req.body;
      
      if (!role || !content || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newMessage = await storage.createMessage({
        sessionId: req.params.sessionId,
        role,
        content,
        type,
        imageUrl: imageUrl || null,
        imageData: imageData || null,
        mode: mode || null,
        scenarioId: scenarioId || null,
      });

      res.json(newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const base64 = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

      res.json({ 
        url: dataUrl,
        filename: req.file.originalname,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Analyze L2 screenshot endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { imageData, mode = "tldr" } = req.body;
      
      if (!imageData || !imageData.startsWith("data:image")) {
        return res.status(400).json({ error: "Valid image data required" });
      }

      const analysis = await analyzeL2Screenshot(imageData, mode);
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing screenshot:", error);
      res.status(500).json({ error: "Failed to analyze screenshot" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
