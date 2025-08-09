import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScholarSchema, insertPointEntrySchema, insertPbisEntrySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all houses with standings
  app.get("/api/houses", async (_req, res) => {
    try {
      const houses = await storage.getHouseStandings();
      res.json(houses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch houses" });
    }
  });

  // Get specific house
  app.get("/api/houses/:id", async (req, res) => {
    try {
      const house = await storage.getHouse(req.params.id);
      if (!house) {
        return res.status(404).json({ message: "House not found" });
      }
      res.json(house);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch house" });
    }
  });

  // Get scholars by house
  app.get("/api/houses/:id/scholars", async (req, res) => {
    try {
      const scholars = await storage.getScholarsByHouse(req.params.id);
      res.json(scholars);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholars" });
    }
  });

  // Create new scholar
  app.post("/api/scholars", async (req, res) => {
    try {
      const validatedData = insertScholarSchema.parse(req.body);
      const scholar = await storage.createScholar(validatedData);
      res.status(201).json(scholar);
    } catch (error) {
      res.status(400).json({ message: "Invalid scholar data" });
    }
  });

  // Add points
  app.post("/api/points", async (req, res) => {
    try {
      const validatedData = insertPointEntrySchema.parse(req.body);
      const pointEntry = await storage.createPointEntry(validatedData);
      res.status(201).json(pointEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid point entry data" });
    }
  });

  // Get point entries
  app.get("/api/points", async (_req, res) => {
    try {
      const entries = await storage.getPointEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch point entries" });
    }
  });

  // Get point entries by house
  app.get("/api/houses/:id/points", async (req, res) => {
    try {
      const entries = await storage.getPointEntriesByHouse(req.params.id);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch point entries" });
    }
  });

  // PBIS routes
  // Get all PBIS entries
  app.get("/api/pbis", async (_req, res) => {
    try {
      const entries = await storage.getPbisEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PBIS entries" });
    }
  });

  // Create PBIS entry
  app.post("/api/pbis", async (req, res) => {
    try {
      const validatedData = insertPbisEntrySchema.parse(req.body);
      const entry = await storage.createPbisEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid PBIS entry data" });
    }
  });

  // Get all scholars
  app.get("/api/scholars", async (_req, res) => {
    try {
      const scholars = await storage.getAllScholars();
      res.json(scholars);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholars" });
    }
  });

  // Get PBIS entries for a specific scholar
  app.get("/api/scholars/:id/pbis", async (req, res) => {
    try {
      const entries = await storage.getPbisEntriesByScholar(req.params.id);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PBIS entries for scholar" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
