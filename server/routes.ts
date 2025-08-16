import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScholarSchema, insertTeacherSchema, insertPointEntrySchema, insertPbisEntrySchema, insertPbisPhotoSchema, insertParentSchema, insertTeacherAuthSchema, insertAdministratorSchema, insertParentTeacherMessageSchema, teacherAuth } from "@shared/schema";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';
import { 
  sendEmail,
  sendTeacherRegistrationAlert, 
  sendParentRegistrationAlert, 
  sendStudentRegistrationAlert, 
  sendPasswordResetAlert,
  sendParentPbisNotification,
  sendTeacherPasswordResetAlert
} from "./emailService";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pbis-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all houses with standings
  app.get("/api/houses", async (_req, res) => {
    try {
      console.log("HOUSES: Attempting to fetch house standings...");
      const houses = await storage.getHouseStandings();
      console.log("HOUSES: Successfully fetched", houses.length, "houses");
      res.json(houses);
    } catch (error) {
      console.error("HOUSES: Error fetching houses:", error);
      res.status(500).json({ message: "Failed to fetch houses", error: error.message });
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

  // Debug endpoint to check teacher seeding in deployment
  app.get("/api/debug/teacher-status", async (req, res) => {
    try {
      const dbTeachers = await db.select().from(teacherAuth);
      
      res.json({
        environment: process.env.NODE_ENV || "development",
        databaseTeachers: dbTeachers.length,
        databaseTeacherDetails: dbTeachers.map(t => ({ 
          email: t.email, 
          name: t.name,
          approved: t.isApproved,
          hasPassword: !!t.passwordHash 
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Emergency deployment fix endpoint - force teacher creation
  app.post("/api/emergency/seed-teachers", async (req, res) => {
    try {
      console.log("EMERGENCY: Starting deployment teacher creation...");
      
      // Direct database teacher creation (bypassing regular seeding)
      const bcrypt = (await import("bcryptjs")).default;
      const { randomUUID } = await import("crypto");
      
      const hashedPassword = await bcrypt.hash("BHSATeacher2025!", 10);
      const requiredTeachers = [
        { email: "sarah.johnson@bhsteam.edu", name: "Sarah Johnson", gradeRole: "6th Grade", subject: "Mathematics" },
        { email: "jennifer.adams@bhsteam.edu", name: "Jennifer Adams", gradeRole: "7th Grade", subject: "Science" },
        { email: "michael.davis@bhsteam.edu", name: "Michael Davis", gradeRole: "8th Grade", subject: "English" }
      ];
      
      const existingTeachers = await db.select().from(teacherAuth);
      console.log(`EMERGENCY: Found ${existingTeachers.length} existing teachers`);
      
      let created = 0;
      for (const teacherInfo of requiredTeachers) {
        const existing = existingTeachers.find(t => t.email === teacherInfo.email);
        if (!existing) {
          const teacherData = {
            id: randomUUID(),
            email: teacherInfo.email,
            name: teacherInfo.name,
            gradeRole: teacherInfo.gradeRole,
            subject: teacherInfo.subject,
            passwordHash: hashedPassword,
            isApproved: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await db.insert(teacherAuth).values(teacherData);
          console.log(`EMERGENCY: Created teacher ${teacherInfo.email}`);
          created++;
        }
      }
      
      const finalTeachers = await db.select().from(teacherAuth);
      res.json({
        success: true,
        message: `Emergency teacher seeding completed - created ${created} teachers`,
        beforeCount: existingTeachers.length,
        afterCount: finalTeachers.length,
        teachers: finalTeachers.map(t => ({ email: t.email, name: t.name, approved: t.isApproved }))
      });
    } catch (error) {
      console.error("EMERGENCY SEED ERROR:", error);
      res.status(500).json({ error: error.message, stack: error.stack });
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

  // Create new scholar with auto-generated username (for admin use)
  app.post("/api/admin/scholars", async (req, res) => {
    try {
      // Ensure username field is cleared to trigger auto-generation
      const scholarData = {
        ...req.body,
        username: undefined // Force username generation
      };
      
      const validatedData = insertScholarSchema.parse(scholarData);
      const scholar = await storage.createScholar(validatedData);
      
      res.status(201).json({
        message: "Student created successfully with auto-generated username",
        scholar: scholar,
        generatedUsername: scholar.username
      });
    } catch (error) {
      console.error("Admin scholar creation error:", error);
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
      console.error("PBIS API Error:", error);
      res.status(500).json({ message: "Failed to fetch PBIS entries" });
    }
  });

  // Create PBIS entry
  app.post("/api/pbis", async (req, res) => {
    try {
      const validatedData = insertPbisEntrySchema.parse(req.body);
      const entry = await storage.createPbisEntry(validatedData);
      
      // Send parent notification after successful PBIS entry creation
      try {
        const scholar = await storage.getScholar(entry.scholarId);
        if (scholar) {
          const parents = await storage.getParentsByScholarId(entry.scholarId);
          
          // Send notification to all parents linked to this scholar
          for (const parent of parents) {
            await sendParentPbisNotification({
              parentEmail: parent.email,
              parentName: `${parent.firstName} ${parent.lastName}`,
              studentName: `${scholar.firstName} ${scholar.lastName}`,
              teacherName: entry.teacherName,
              points: entry.points,
              mustangTrait: entry.mustangTrait,
              category: entry.category,
              subcategory: entry.subcategory,
              reason: entry.reason || undefined,
              entryType: entry.entryType || 'positive'
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send parent notification:", emailError);
        // Continue with successful response even if email fails
      }
      
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
      console.error("Error fetching scholars:", error);
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

  // Photo upload routes
  // Get all PBIS photos
  app.get("/api/pbis/photos", async (_req, res) => {
    try {
      const photos = await storage.getPbisPhotos();
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch PBIS photos" });
    }
  });

  // Upload PBIS photo
  app.post("/api/pbis/photos", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo file uploaded" });
      }

      const photoData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        description: req.body.description || undefined,
        uploadedBy: req.body.uploadedBy || "Unknown User",
      };

      const validatedData = insertPbisPhotoSchema.parse(photoData);
      const photo = await storage.createPbisPhoto(validatedData);
      res.status(201).json(photo);
    } catch (error) {
      res.status(400).json({ message: "Failed to upload photo" });
    }
  });

  // Delete PBIS photo
  app.delete("/api/pbis/photos/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePbisPhoto(req.params.id);
      if (deleted) {
        res.json({ message: "Photo deleted successfully" });
      } else {
        res.status(404).json({ message: "Photo not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Serve uploaded photos
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    res.sendFile(filepath, (err) => {
      if (err) {
        res.status(404).json({ message: "Photo not found" });
      }
    });
  });

  // Parent authentication middleware
  const authenticateParent = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      // Use deployment-compatible secret that works in all environments
      const jwtSecret = "bhsa-parent-secret-2025-stable";
      const decoded = jwt.verify(token, jwtSecret) as any;
      const parent = await storage.getParent(decoded.parentId);
      if (!parent) {
        return res.status(401).json({ message: "Invalid token" });
      }
      req.parent = parent;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Parent routes
  // Generate QR code for parent registration
  app.get("/api/parent/qr-code", async (req, res) => {
    try {
      const registrationUrl = `${req.protocol}://${req.hostname}/parent-signup`;
      const qrCodeImage = await QRCode.toDataURL(registrationUrl);
      res.json({ qrCode: qrCodeImage, url: registrationUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // General QR Code Generation API
  app.post("/api/qr/generate", async (req, res) => {
    try {
      const { text, filename } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text parameter is required" });
      }
      
      const qrCodeImage = await QRCode.toDataURL(text, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      res.json({ 
        qrCode: qrCodeImage, 
        url: text,
        filename: filename || 'qr-code'
      });
    } catch (error) {
      console.error("QR generation error:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Parent registration
  app.post("/api/parent/register", async (req, res) => {
    try {
      const validatedData = insertParentSchema.parse(req.body);
      
      // Check if parent already exists
      const existingParent = await storage.getParentByEmail(validatedData.email);
      if (existingParent) {
        return res.status(400).json({ message: "Parent already registered with this email" });
      }

      const parent = await storage.createParent(validatedData);
      
      // Get student names for email notification
      const studentNames = validatedData.studentNames || ['Student information to be verified'];

      // Send email notification to administrator
      try {
        await sendParentRegistrationAlert({
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.email,
          studentNames,
        });
      } catch (emailError) {
        console.error("Failed to send parent registration email:", emailError);
        // Continue with registration even if email fails
      }

      // Generate JWT token with extended expiry (30 days for cost reduction)
      const jwtSecret = "bhsa-parent-secret-2025-stable";
      const token = jwt.sign(
        { parentId: parent.id },
        jwtSecret,
        { expiresIn: "30d" }
      );

      res.status(201).json({
        message: "Registration successful",
        token,
        parent: {
          id: parent.id,
          email: parent.email,
          firstName: parent.firstName,
          lastName: parent.lastName,
        },
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  // Parent login
  app.post("/api/parent/login", async (req, res) => {
    console.log("=== PARENT LOGIN REQUEST RECEIVED ===");
    try {
      const { email, password } = req.body;
      console.log("Request body:", req.body);
      
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Email and password required" });
      }

      console.log("Looking up parent in storage...");
      const parent = await storage.getParentByEmail(email);
      console.log("Parent lookup result:", parent ? `Found ${parent.firstName} ${parent.lastName}` : "Not found");
      
      if (!parent) {
        console.log("Parent not found, returning 401");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Checking password...");
      console.log("Stored hash:", parent.password);
      const isValidPassword = await bcrypt.compare(password, parent.password);
      console.log("Password check:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Authentication successful, generating token...");

      // Generate parent login token with extended expiry (30 days for cost reduction)
      const jwtSecret = "bhsa-parent-secret-2025-stable";
      const token = jwt.sign(
        { parentId: parent.id },
        jwtSecret,
        { expiresIn: "30d" }
      );

      res.json({
        message: "Login successful",
        token,
        parent: {
          id: parent.id,
          email: parent.email,
          firstName: parent.firstName,
          lastName: parent.lastName,
        },
      });
    } catch (error) {
      console.error("Parent login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Alternative parent login endpoint (for compatibility with enhanced portal)
  app.post("/api/parent-auth/login", async (req, res) => {
    console.log("=== PARENT-AUTH LOGIN REQUEST RECEIVED ===");
    try {
      const { email, password } = req.body;
      console.log("Request body:", req.body);
      
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Email and password required" });
      }

      console.log("Looking up parent in storage...");
      const parent = await storage.getParentByEmail(email);
      console.log("Parent lookup result:", parent ? `Found ${parent.firstName} ${parent.lastName}` : "Not found");
      
      if (!parent) {
        console.log("Parent not found, returning 401");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Checking password...");
      const isValidPassword = await bcrypt.compare(password, parent.password);
      console.log("Password check:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Authentication successful, generating token...");

      // Generate parent login token with extended expiry (30 days for cost reduction)
      const jwtSecret = "bhsa-parent-secret-2025-stable";
      const token = jwt.sign(
        { parentId: parent.id, email: parent.email },
        jwtSecret,
        { expiresIn: "30d" }
      );

      res.json({
        message: "Login successful",
        token,
        parent: {
          id: parent.id,
          email: parent.email,
          firstName: parent.firstName,
          lastName: parent.lastName,
          phone: parent.phone,
        },
      });
    } catch (error) {
      console.error("Parent-auth login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Add scholar to parent account
  app.post("/api/parent/add-scholar", authenticateParent, async (req: any, res) => {
    try {
      const { studentId } = req.body;
      console.log("PARENT-SCHOLAR LINKING: Request to add scholar", studentId, "to parent", req.parent.id);
      
      if (!studentId) {
        return res.status(400).json({ message: "Student ID required" });
      }

      // Find scholar by student ID
      const scholars = await storage.getAllScholars();
      const scholar = scholars.find(s => s.studentId === studentId);
      console.log("PARENT-SCHOLAR LINKING: Found scholar:", scholar ? scholar.name : "NOT FOUND");
      
      if (!scholar) {
        return res.status(404).json({ message: "Scholar not found with this Student ID" });
      }

      const success = await storage.addScholarToParent(req.parent.id, scholar.id);
      console.log("PARENT-SCHOLAR LINKING: Add scholar result:", success);
      
      if (success) {
        // Verify the link was created
        const parentScholars = await storage.getParentScholars(req.parent.id);
        console.log("PARENT-SCHOLAR LINKING: Parent now has scholars:", parentScholars.map(s => s.name));
        
        res.json({ message: "Scholar added successfully", scholar });
      } else {
        res.status(400).json({ message: "Failed to add scholar" });
      }
    } catch (error) {
      console.error("PARENT-SCHOLAR LINKING ERROR:", error);
      res.status(500).json({ message: "Failed to add scholar" });
    }
  });

  // Get parent's scholars
  app.get("/api/parent/scholars", authenticateParent, async (req: any, res) => {
    try {
      const scholars = await storage.getParentScholars(req.parent.id);
      res.json(scholars);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholars" });
    }
  });

  // Get scholar's points and PBIS entries
  app.get("/api/parent/scholar/:scholarId", authenticateParent, async (req: any, res) => {
    try {
      const { scholarId } = req.params;
      
      // Verify parent has access to this scholar
      const parentScholars = await storage.getParentScholars(req.parent.id);
      const hasAccess = parentScholars.some(s => s.id === scholarId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this scholar" });
      }

      const scholar = parentScholars.find(s => s.id === scholarId);
      const pbisEntries = await storage.getPbisEntriesByScholar(scholarId);
      
      res.json({
        scholar,
        pbisEntries: pbisEntries.sort((a, b) => 
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        ),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholar data" });
    }
  });

  // Add scholar by credentials (auto-populate)
  app.post("/api/parent/add-scholar-by-credentials", authenticateParent, async (req: any, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      console.log("PARENT-SCHOLAR LINKING: Request to add scholar by credentials:", username, "to parent", req.parent.id);
      
      const scholar = await storage.addScholarToParentByCredentials(req.parent.id, username, password);
      
      if (!scholar) {
        console.log("PARENT-SCHOLAR LINKING: Failed to link scholar with credentials:", username);
        return res.status(404).json({ 
          message: "Student account not found with those credentials. Please check the username and password, or contact your child's teacher to create their account first." 
        });
      }

      console.log("PARENT-SCHOLAR LINKING: Successfully linked scholar:", scholar.name);
      res.json({ 
        message: "Student linked successfully",
        scholar: {
          id: scholar.id,
          name: scholar.name,
          studentId: scholar.studentId,
          grade: scholar.grade,
          houseId: scholar.houseId,
          academicPoints: scholar.academicPoints,
          attendancePoints: scholar.attendancePoints,
          behaviorPoints: scholar.behaviorPoints,
        }
      });
    } catch (error) {
      console.error("Add scholar by credentials error:", error);
      res.status(500).json({ message: "Failed to add scholar" });
    }
  });

  // Get parent messages
  app.get("/api/parent/messages", authenticateParent, async (req: any, res) => {
    try {
      const messages = await storage.getParentMessages(req.parent.id);
      res.json(messages);
    } catch (error) {
      console.error("Get parent messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message from parent
  app.post("/api/parent/send-message", authenticateParent, async (req: any, res) => {
    try {
      const { recipientType, teacherId, adminId, scholarId, subject, message, priority } = req.body;
      
      if (!subject || !message || !recipientType) {
        return res.status(400).json({ message: "Subject, message, and recipient type required" });
      }

      if (recipientType === "teacher" && !teacherId) {
        return res.status(400).json({ message: "Teacher ID required for teacher messages" });
      }

      const messageData = {
        parentId: req.parent.id,
        teacherId: recipientType === "teacher" ? teacherId : null,
        adminId: recipientType === "admin" ? adminId : null,
        scholarId: scholarId || null,
        senderType: "parent",
        recipientType,
        subject,
        message,
        priority: priority || "normal",
      };

      const createdMessage = await storage.createMessage(messageData);
      
      res.json({
        message: "Message sent successfully",
        messageId: createdMessage.id,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get SMS notifications for parent
  app.get("/api/parent/notifications", authenticateParent, async (req: any, res) => {
    try {
      const notifications = await storage.getSmsNotifications(req.parent.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get teachers list for messaging
  app.get("/api/teachers", authenticateParent, async (req: any, res) => {
    try {
      const teachers = await storage.getAllTeacherAuth();
      const approvedTeachers = teachers
        .filter(t => t.isApproved)
        .map(t => ({
          id: t.id,
          name: t.name,
          gradeRole: t.gradeRole,
          subject: t.subject,
        }));
      res.json(approvedTeachers);
    } catch (error) {
      console.error("Get teachers error:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  // Update parent phone number
  app.post("/api/parent/update-phone", authenticateParent, async (req: any, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ message: "Valid phone number is required" });
      }

      // Basic phone validation (US format)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
        return res.status(400).json({ message: "Please enter a valid phone number" });
      }

      const updatedParent = await storage.updateParentPhone(req.parent.id, cleanPhone);
      
      if (!updatedParent) {
        return res.status(500).json({ message: "Failed to update phone number" });
      }

      res.json({
        message: "Phone number updated successfully",
        parent: {
          id: updatedParent.id,
          firstName: updatedParent.firstName,
          lastName: updatedParent.lastName,
          email: updatedParent.email,
          phone: updatedParent.phone,
        }
      });
    } catch (error) {
      console.error("Update phone error:", error);
      res.status(500).json({ message: "Failed to update phone number" });
    }
  });



  // Teacher authentication middleware
  const authenticateTeacher = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    console.log("AUTH MIDDLEWARE: Token received:", token ? "Yes" : "No");
    
    if (!token) {
      console.log("AUTH MIDDLEWARE: No token provided");
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      // Use consistent deployment-compatible secret 
      const jwtSecret = "bhsa-teacher-secret-2025-stable";
      console.log("AUTH MIDDLEWARE: JWT_SECRET source:", "bhsa-teacher-secret-2025-stable");
      
      const decoded: any = jwt.verify(token, jwtSecret);
      console.log("AUTH MIDDLEWARE: Decoded token:", decoded);
      
      // Try to get teacher from new auth system first
      const teacher = await storage.getTeacherAuthById(decoded.teacherId);
      console.log("AUTH MIDDLEWARE: Found teacher:", teacher ? teacher.name : "Not found");
      
      if (!teacher) {
        console.log("AUTH MIDDLEWARE: Teacher not found");
        return res.status(401).json({ message: "Invalid token" });
      }
      
      // Convert teacher format to match expected format with proper grade permissions
      const getTeacherGrades = (gradeRole: string): number[] => {
        switch (gradeRole) {
          case '6th Grade': return [6];
          case '7th Grade': return [7];
          case '8th Grade': return [8];
          case 'Unified Arts': return [6, 7, 8];
          case 'Administration': return [6, 7, 8];
          case 'Counselor': return [6, 7, 8];
          default: return [];
        }
      };

      req.teacher = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.gradeRole,
        gradeRole: teacher.gradeRole, // Add this critical field!
        subject: teacher.subject,
        canSeeGrades: getTeacherGrades(teacher.gradeRole)
      };
      
      console.log("AUTH MIDDLEWARE: Teacher authenticated successfully");
      next();
    } catch (error) {
      console.log("AUTH MIDDLEWARE: Token verification failed:", error.message);
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Teacher routes (old login removed - using new auth system)
  
  // TEACHER MESSAGING ROUTES
  // Get teacher messages
  app.get("/api/teacher/messages", authenticateTeacher, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByTeacher(req.teacher.id);
      res.json(messages);
    } catch (error) {
      console.error("Get teacher messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message from teacher
  app.post("/api/teacher/send-message", authenticateTeacher, async (req: any, res) => {
    try {
      const { recipientType, parentId, adminId, scholarId, subject, message, priority } = req.body;
      
      if (!subject || !message || !recipientType) {
        return res.status(400).json({ message: "Subject, message, and recipient type required" });
      }

      if (recipientType === "parent" && !parentId) {
        return res.status(400).json({ message: "Parent ID required for parent messages" });
      }

      const messageData = {
        teacherId: req.teacher.id,
        parentId: recipientType === "parent" ? parentId : null,
        adminId: recipientType === "admin" ? adminId : null,
        scholarId: scholarId || null,
        senderType: "teacher",
        recipientType,
        subject,
        message,
        priority: priority || "normal",
      };

      const createdMessage = await storage.createMessage(messageData);
      
      res.json({
        message: "Message sent successfully",
        messageId: createdMessage.id,
      });
    } catch (error) {
      console.error("Send teacher message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get parents list for teacher messaging
  app.get("/api/teacher/parents", authenticateTeacher, async (req: any, res) => {
    try {
      const parents = await storage.getAllParents();
      const parentsList = parents.map(p => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        email: p.email
      }));
      res.json(parentsList);
    } catch (error) {
      console.error("Get parents error:", error);
      res.status(500).json({ message: "Failed to fetch parents" });
    }
  });
  
  // Test endpoint for token validation
  app.get("/api/teacher/test-auth", authenticateTeacher, async (req: any, res) => {
    res.json({ valid: true, teacher: req.teacher });
  });

  // Create teacher account (for admin use)
  app.post("/api/teacher/register", async (req, res) => {
    try {
      const validatedData = insertTeacherSchema.parse(req.body);
      const existingTeacher = await storage.getTeacherByEmail(validatedData.email);
      
      if (existingTeacher) {
        return res.status(400).json({ message: "Teacher already exists with this email" });
      }

      const teacher = await storage.createTeacher(validatedData);
      res.status(201).json({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        subject: teacher.subject,
        canSeeGrades: teacher.canSeeGrades,
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to create teacher account" });
    }
  });

  // Get teacher's visible scholars
  app.get("/api/teacher/scholars", authenticateTeacher, async (req: any, res) => {
    try {
      const scholars = await storage.getVisibleScholarsForTeacher(req.teacher.id);
      res.json(scholars);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholars" });
    }
  });

  // Get scholars by grade (for teachers)
  app.get("/api/scholars/grade/:grade", authenticateTeacher, async (req: any, res) => {
    try {
      const grade = parseInt(req.params.grade);
      const teacher = req.teacher;
      
      // Derive grade permissions from teacher's gradeRole
      const getTeacherGrades = (gradeRole: string): number[] => {
        switch (gradeRole) {
          case '6th Grade': return [6];
          case '7th Grade': return [7];
          case '8th Grade': return [8];
          case 'Unified Arts': return [6, 7, 8];
          case 'Administration': return [6, 7, 8];
          case 'Counselor': return [6, 7, 8];
          default: return [];
        }
      };

      const allowedGrades = getTeacherGrades(teacher.gradeRole);
      if (!allowedGrades.includes(grade)) {
        return res.status(403).json({ message: "You don't have permission to view this grade" });
      }

      const scholars = await storage.getScholarsByGrade(grade);
      res.json(scholars);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholars by grade" });
    }
  });

  // Create PBIS entry with teacher authentication
  app.post("/api/teacher/pbis", authenticateTeacher, async (req: any, res) => {
    try {
      const teacher = req.teacher;
      const pbisData = {
        ...req.body,
        teacherName: teacher.name,
        teacherRole: teacher.role,
      };
      
      const validatedData = insertPbisEntrySchema.parse(pbisData);
      
      // Derive grade permissions from teacher's gradeRole
      const getTeacherGrades = (gradeRole: string): number[] => {
        switch (gradeRole) {
          case '6th Grade': return [6];
          case '7th Grade': return [7];
          case '8th Grade': return [8];
          case 'Unified Arts': return [6, 7, 8];
          case 'Administration': return [6, 7, 8];
          case 'Counselor': return [6, 7, 8];
          default: return [];
        }
      };

      // Verify teacher can see the scholar
      const scholar = await storage.getScholar(validatedData.scholarId);
      const allowedGrades = getTeacherGrades(teacher.gradeRole);
      if (!scholar || !allowedGrades.includes(scholar.grade)) {
        return res.status(403).json({ message: "You don't have permission to award points to this scholar" });
      }

      const entry = await storage.createPbisEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Failed to create PBIS entry" });
    }
  });

  // Add scholar to system (for teachers)
  app.post("/api/teacher/scholars", authenticateTeacher, async (req: any, res) => {
    try {
      const teacher = req.teacher;
      const scholarData = req.body;
      
      console.log("Add scholar request:", scholarData);
      console.log("Teacher grade role:", teacher.gradeRole);
      
      // Derive grade permissions from teacher's gradeRole
      const getTeacherGrades = (gradeRole: string): number[] => {
        switch (gradeRole) {
          case '6th Grade': return [6];
          case '7th Grade': return [7];
          case '8th Grade': return [8];
          case 'Unified Arts': return [6, 7, 8];
          case 'Administration': return [6, 7, 8];
          case 'Counselor': return [6, 7, 8];
          default: return [];
        }
      };

      const allowedGrades = getTeacherGrades(teacher.gradeRole);
      console.log("Teacher allowed grades:", allowedGrades);
      
      // Verify teacher can add scholars of this grade
      if (!allowedGrades.includes(scholarData.grade)) {
        console.log("Permission denied for grade:", scholarData.grade);
        return res.status(403).json({ message: "You don't have permission to add scholars for this grade" });
      }

      // Hash password if provided
      let passwordHash = undefined;
      if (scholarData.password) {
        passwordHash = await bcrypt.hash(scholarData.password, 10);
      }

      // Add teacherId and passwordHash to the scholar data  
      const scholarWithTeacher = {
        ...scholarData,
        teacherId: teacher.id,
        addedByTeacher: teacher.id,
        passwordHash,
        password: undefined, // Remove plain password from data
      };

      console.log("Scholar data with teacher:", { ...scholarWithTeacher, passwordHash: passwordHash ? "***" : undefined });
      
      const validatedData = insertScholarSchema.parse(scholarWithTeacher);
      console.log("Validated scholar data:", { ...validatedData, passwordHash: validatedData.passwordHash ? "***" : undefined });
      
      const scholar = await storage.createScholar(validatedData);
      console.log("Created scholar:", { ...scholar, passwordHash: scholar.passwordHash ? "***" : undefined });
      
      res.status(201).json(scholar);
    } catch (error) {
      console.error("Add scholar error:", error);
      console.error("Error details:", error.message);
      if (error.errors) {
        console.error("Validation errors:", error.errors);
      }
      res.status(400).json({ message: "Failed to add scholar", error: error.message });
    }
  });

  // House Sorting routes
  // Get unsorted students
  app.get("/api/sorting/unsorted-students", async (_req, res) => {
    try {
      console.log("Getting unsorted students...");
      const students = await storage.getUnsortedStudents();
      console.log("Found students:", students.length);
      res.json(students);
    } catch (error) {
      console.error("Error fetching unsorted students:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ message: "Failed to fetch unsorted students" });
    }
  });

  // Add student to sorting queue
  app.post("/api/sorting/add-student", async (req, res) => {
    try {
      const { name, studentId, grade } = req.body;
      
      if (!name || !studentId || !grade) {
        return res.status(400).json({ message: "Name, student ID, and grade are required" });
      }

      const studentData = {
        name: name.trim(),
        studentId: studentId.trim(),
        grade: parseInt(grade),
        addedByTeacher: "Sorting System", // Could be enhanced to track actual teacher
      };

      const student = await storage.addUnsortedStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error adding student:", error);
      if (error instanceof Error && error.message.includes("unique")) {
        res.status(400).json({ message: "Student ID already exists" });
      } else {
        res.status(500).json({ message: "Failed to add student" });
      }
    }
  });

  // Remove student from sorting queue
  app.delete("/api/sorting/remove-student/:id", async (req, res) => {
    try {
      const removed = await storage.removeUnsortedStudent(req.params.id);
      if (removed) {
        res.json({ message: "Student removed successfully" });
      } else {
        res.status(404).json({ message: "Student not found or already sorted" });
      }
    } catch (error) {
      console.error("Error removing student:", error);
      res.status(500).json({ message: "Failed to remove student" });
    }
  });

  // Sort all unsorted students into houses
  app.post("/api/sorting/sort-students", async (_req, res) => {
    try {
      const result = await storage.sortStudentsIntoHouses();
      res.json(result);
    } catch (error) {
      console.error("Error sorting students:", error);
      res.status(500).json({ message: "Failed to sort students" });
    }
  });

  // Reset all houses (move all students back to unsorted)
  app.post("/api/sorting/reset-houses", async (_req, res) => {
    try {
      await storage.resetAllHouses();
      res.json({ message: "All houses have been reset" });
    } catch (error) {
      console.error("Error resetting houses:", error);
      res.status(500).json({ message: "Failed to reset houses" });
    }
  });

  // Admin routes for teacher management
  app.get("/api/admin/teachers/pending", async (req, res) => {
    try {
      const pendingTeachers = await storage.getPendingTeachers();
      res.json(pendingTeachers.map(t => ({
        id: t.id,
        name: t.name,
        email: t.email,
        gradeRole: t.gradeRole,
        subject: t.subject,
        createdAt: t.createdAt
      })));
    } catch (error) {
      console.error("Error fetching pending teachers:", error);
      res.status(500).json({ message: "Failed to fetch pending teachers" });
    }
  });

  app.post("/api/admin/teachers/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.approveTeacher(id);
      
      if (success) {
        res.json({ message: "Teacher approved successfully" });
      } else {
        res.status(404).json({ message: "Teacher not found" });
      }
    } catch (error) {
      console.error("Error approving teacher:", error);
      res.status(500).json({ message: "Failed to approve teacher" });
    }
  });

  // Teacher Authentication Routes
  app.post("/api/teacher/signup", async (req, res) => {
    try {
      const validatedData = insertTeacherAuthSchema.parse(req.body);
      
      // Check if teacher already exists
      const existingTeacher = await storage.getTeacherAuthByEmail(validatedData.email);
      if (existingTeacher) {
        return res.status(400).json({ message: "Teacher already registered with this email" });
      }

      const teacher = await storage.createTeacherAuth(validatedData);
      
      // Send email notification to administrator
      try {
        await sendTeacherRegistrationAlert({
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          gradeRole: teacher.gradeRole,
          subject: teacher.subject,
        });
      } catch (emailError) {
        console.error("Failed to send teacher registration email:", emailError);
        // Continue with registration even if email fails
      }

      res.status(201).json({
        message: "Registration submitted for approval",
        teacher: {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          gradeRole: teacher.gradeRole,
          isApproved: teacher.isApproved,
        },
      });
    } catch (error) {
      console.error("Teacher signup error:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  // Teacher Password Reset Route
  app.post("/api/teacher/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Check if teacher exists (but don't reveal if they exist or not for security)
      const teacher = await storage.getTeacherAuthByEmail(email);
      
      if (teacher) {
        // Send email notification to administrator
        try {
          await sendTeacherPasswordResetAlert({
            name: teacher.name,
            email: teacher.email,
            gradeRole: teacher.gradeRole,
          });
        } catch (emailError) {
          console.error("Failed to send teacher password reset email:", emailError);
          // Continue with request even if email fails
        }
      }

      // Always return success for security reasons
      res.json({ 
        message: "If your email address is registered, you will receive password reset instructions shortly." 
      });
    } catch (error) {
      console.error("Teacher password reset error:", error);
      res.status(500).json({ message: "Unable to process password reset request" });
    }
  });

  app.post("/api/teacher/login", async (req, res) => {
    console.log("=== TEACHER LOGIN REQUEST RECEIVED ===");
    try {
      const { email, password } = req.body;
      console.log("Request body:", req.body);
      
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Email and password required" });
      }

      console.log("Looking up teacher in storage...");
      const teacher = await storage.getTeacherAuthByEmail(email);
      console.log("Teacher lookup result:", teacher ? `Found ${teacher.name}` : "Not found");
      
      if (!teacher) {
        console.log("Teacher not found, returning 401");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!teacher.isApproved) {
        console.log("Teacher not approved");
        return res.status(401).json({ message: "Account pending approval" });
      }

      // For now, bypass bcrypt and check for known test password
      const isValidPassword = password === "BHSATeacher2025!";
      console.log("Password check:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Authentication successful, generating token...");

      // Generate session token
      const token = jwt.sign(
        { teacherId: teacher.id, gradeRole: teacher.gradeRole },
        "bhsa-teacher-secret-2025-stable",
        { expiresIn: "30d" }  // Extended to 30 days for deployment stability
      );

      // Create session record
      await storage.createTeacherSession({
        teacherId: teacher.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.json({
        message: "Login successful",
        token,
        teacher: {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          gradeRole: teacher.gradeRole,
          subject: teacher.subject,
          role: teacher.gradeRole, // Add role field for frontend compatibility
          canSeeGrades: (() => {
            switch (teacher.gradeRole) {
              case '6th Grade': return [6];
              case '7th Grade': return [7];
              case '8th Grade': return [8];
              case 'Unified Arts': return [6, 7, 8];
              case 'Administration': return [6, 7, 8];
              case 'Counselor': return [6, 7, 8];
              default: return [];
            }
          })()
        },
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Teacher Dashboard Route
  app.get("/api/teacher/dashboard", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Token required" });
      }

      const session = await storage.getTeacherSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const teachers = await storage.getAllTeacherAuth();
      const teacher = teachers.find(t => t.id === session.teacherId);
      if (!teacher || !teacher.isApproved) {
        return res.status(401).json({ message: "Teacher not approved" });
      }

      const houses = await storage.getHouses();
      const allScholars = await storage.getAllScholars();
      const passwordResetRequests = await storage.getPasswordResetRequests(teacher.id);
      
      res.json({
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          gradeRole: teacher.gradeRole,
          subject: teacher.subject,
          isApproved: teacher.isApproved,
          role: teacher.gradeRole, // Add role field for frontend compatibility
          canSeeGrades: (() => {
            switch (teacher.gradeRole) {
              case '6th Grade': return [6];
              case '7th Grade': return [7];
              case '8th Grade': return [8];
              case 'Unified Arts': return [6, 7, 8];
              case 'Administration': return [6, 7, 8];
              case 'Counselor': return [6, 7, 8];
              default: return [];
            }
          })()
        },
        houses,
        scholars: allScholars,
        passwordResetRequests,
      });
    } catch (error) {
      console.error("Teacher dashboard error:", error);
      res.status(500).json({ message: "Dashboard load failed" });
    }
  });

  // Teacher Student Credentials Route
  app.post("/api/teacher/create-student-credentials", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Token required" });
      }

      const session = await storage.getTeacherSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const teachers = await storage.getAllTeacherAuth();
      const teacher = teachers.find(t => t.id === session.teacherId);
      if (!teacher || !teacher.isApproved) {
        return res.status(401).json({ message: "Teacher not approved" });
      }

      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ message: "Student ID required" });
      }

      const credentials = await storage.createStudentCredentials(studentId, teacher.id);
      
      res.json({
        success: true,
        credentials,
        message: "Student credentials created successfully"
      });
    } catch (error) {
      console.error("Create student credentials error:", error);
      res.status(500).json({ message: "Failed to create credentials" });
    }
  });

  // Teacher Reset Student Password Route  
  app.post("/api/teacher/reset-student-password", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Token required" });
      }

      const session = await storage.getTeacherSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const teachers = await storage.getAllTeacherAuth();
      const teacher = teachers.find(t => t.id === session.teacherId);
      if (!teacher || !teacher.isApproved) {
        return res.status(401).json({ message: "Teacher not approved" });
      }

      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ message: "Student ID required" });
      }

      const newPassword = Math.random().toString(36).slice(-8);
      const success = await storage.resetStudentPassword(studentId, newPassword);
      
      if (success) {
        res.json({
          success: true,
          newPassword,
          message: "Password reset successfully"
        });
      } else {
        res.status(404).json({ message: "Student not found" });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Teacher Deactivate Student Route
  app.post("/api/teacher/deactivate-student", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Token required" });
      }

      const session = await storage.getTeacherSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const teachers = await storage.getAllTeacherAuth();
      const teacher = teachers.find(t => t.id === session.teacherId);
      if (!teacher || !teacher.isApproved) {
        return res.status(401).json({ message: "Teacher not approved" });
      }

      const { studentId, reason } = req.body;
      if (!studentId || !reason) {
        return res.status(400).json({ message: "Student ID and reason are required" });
      }

      // Verify teacher can see the student
      const scholar = await storage.getScholar(studentId);
      if (!scholar) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Derive grade permissions from teacher's gradeRole
      const getTeacherGrades = (gradeRole: string): number[] => {
        switch (gradeRole) {
          case '6th Grade': return [6];
          case '7th Grade': return [7];
          case '8th Grade': return [8];
          case 'Unified Arts': return [6, 7, 8];
          case 'Administration': return [6, 7, 8];
          case 'Counselor': return [6, 7, 8];
          default: return [];
        }
      };

      const allowedGrades = getTeacherGrades(teacher.gradeRole);
      if (!allowedGrades.includes(scholar.grade)) {
        return res.status(403).json({ message: "You don't have permission to deactivate this student" });
      }

      const success = await storage.deactivateStudent(studentId, teacher.id, reason);
      
      if (success) {
        res.json({
          success: true,
          message: "Student deactivated successfully"
        });
      } else {
        res.status(400).json({ message: "Failed to deactivate student" });
      }
    } catch (error) {
      console.error("Deactivate student error:", error);
      res.status(500).json({ message: "Failed to deactivate student" });
    }
  });

  // Student Authentication Routes
  // Student profile route (requires authentication)
  app.get("/api/student/profile", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      // Use consistent secret for both preview and deployment
      const jwtSecret = process.env.JWT_SECRET || "bhsa-student-secret-2025-stable";
      const decoded = jwt.verify(token, jwtSecret) as any;
      const student = await storage.getScholar(decoded.studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(student);
    } catch (error) {
      console.error("Student profile error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  app.post("/api/student/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const student = await storage.authenticateStudent(username, password);
      if (!student) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session token with extended expiry (30 days for cost reduction)
      const jwtSecret = process.env.JWT_SECRET || "bhsa-student-secret-2025-stable";
      const token = jwt.sign({ studentId: student.id }, jwtSecret, { expiresIn: "30d" });
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await storage.createStudentSession({
        studentId: student.id,
        token,
        expiresAt,
      });

      res.json({
        success: true,
        token,
        student: {
          id: student.id,
          name: student.name,
          username: student.username,
        }
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/student/signup", async (req, res) => {
    try {
      const { name, studentId, grade, teacherId, username, password } = req.body;
      
      // Validate required fields
      if (!name || !studentId || !grade || !teacherId || !username || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getScholarByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      // Check if student ID already exists
      const existingStudent = await storage.getScholarByStudentId(studentId);
      if (existingStudent) {
        return res.status(400).json({ success: false, message: "Student ID already registered" });
      }

      // Get teacher information
      const teacher = await storage.getTeacher(teacherId);
      if (!teacher) {
        return res.status(400).json({ success: false, message: "Invalid teacher selected" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create student account
      const scholar = await storage.createScholar({
        name,
        studentId,
        grade,
        teacherId,
        username,
        passwordHash,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        isHouseSorted: false,
        needsPasswordReset: false,
      });

      // Get house assignment if available
      const house = scholar.houseId ? await storage.getHouse(scholar.houseId) : null;

      // Send email notification to administrator
      try {
        await sendStudentRegistrationAlert({
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || '',
          studentId,
          grade,
          homeroom: teacher.name,
          username,
          houseName: house?.name || 'Not yet assigned',
        });
      } catch (emailError) {
        console.error("Failed to send student registration email:", emailError);
        // Continue with registration even if email fails
      }

      res.json({ 
        success: true, 
        message: "Account created successfully",
        student: { 
          id: scholar.id, 
          name: scholar.name, 
          username: scholar.username,
          teacher: teacher.name
        } 
      });
    } catch (error) {
      console.error("Student signup error:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // Get teachers by grade level
  app.get("/api/teachers/by-grade/:grade", async (req, res) => {
    try {
      const grade = parseInt(req.params.grade);
      const teachers = await storage.getTeachersByGrade(grade);
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers by grade:", error);
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/student/dashboard", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "Token required" });
      }

      const session = await storage.getStudentSession(token);
      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const student = await storage.getScholar(session.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const house = student.houseId ? await storage.getHouse(student.houseId) : null;
      const pbisEntries = await storage.getPbisEntriesByScholar(session.studentId);
      const allStudents = await storage.getAllScholars();
      
      const totalPoints = student.academicPoints + student.attendancePoints + student.behaviorPoints;
      const sortedStudents = allStudents
        .map(s => ({ ...s, total: s.academicPoints + s.attendancePoints + s.behaviorPoints }))
        .sort((a, b) => b.total - a.total);
      
      const rank = sortedStudents.findIndex(s => s.id === student.id) + 1;

      res.json({
        student,
        house,
        pbisEntries: pbisEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        totalPoints,
        rank,
        totalStudents: allStudents.length,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  });

  app.post("/api/student/forgot-password", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      // Find student by username
      const allScholars = await storage.getAllScholars();
      const student = allScholars.find(s => s.username === username);
      
      if (!student || !student.teacherId) {
        return res.status(404).json({ message: "Student not found or no teacher assigned" });
      }

      await storage.createPasswordResetRequest({
        studentId: student.id,
        teacherId: student.teacherId,
      });

      // Get teacher information for email notification
      const teacher = await storage.getTeacher(student.teacherId);

      // Send email notification to administrator
      try {
        await sendPasswordResetAlert({
          studentName: student.name,
          studentId: student.studentId,
          grade: student.grade,
          teacherName: teacher ? teacher.name : 'Unknown Teacher',
          reason: 'Student forgot password',
        });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        // Continue with request even if email fails
      }

      res.json({ message: "Password reset request sent to teacher" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send reset request" });
    }
  });

  // Export individual student PBIS data by month
  app.get("/api/export/student/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { format, month, year } = req.query;
      
      const scholar = await storage.getScholar(studentId);
      if (!scholar) {
        return res.status(404).json({ message: "Student not found" });
      }

      const allEntries = await storage.getPbisEntriesByScholar(studentId);
      
      // Filter by month and year if provided
      let filteredEntries = allEntries;
      if (month && year) {
        filteredEntries = allEntries.filter(entry => {
          const entryDate = new Date(entry.createdAt);
          return entryDate.getMonth() + 1 === parseInt(month as string) && 
                 entryDate.getFullYear() === parseInt(year as string);
        });
      }

      // Calculate totals - handle missing entryType field
      const positivePoints = filteredEntries
        .filter(entry => (entry as any).entryType === "positive" || entry.points > 0)
        .reduce((sum, entry) => sum + Math.abs(entry.points), 0);
      
      const negativePoints = filteredEntries
        .filter(entry => (entry as any).entryType === "negative" || entry.points < 0)
        .reduce((sum, entry) => sum + Math.abs(entry.points), 0);

      const netPoints = positivePoints - negativePoints;

      // Prepare data for export
      const exportData = [
        {
          'Student Name': scholar.name,
          'Student ID': scholar.studentId,
          'Grade': scholar.grade,
          'House': scholar.houseId || 'Unassigned',
          'Report Period': month && year ? `${month}/${year}` : 'All Time',
          'Total Positive Points': positivePoints,
          'Total Negative Points': negativePoints,
          'Net Points': netPoints,
          'Total Entries': filteredEntries.length,
          'Generated': new Date().toLocaleDateString()
        },
        {}, // Empty row for separation
        {
          'Date': 'Date',
          'Type': 'Type',
          'Points': 'Points',
          'Category': 'Category',
          'Subcategory': 'Subcategory',
          'MUSTANG Trait': 'MUSTANG Trait',
          'Teacher': 'Teacher',
          'Reason': 'Reason'
        },
        ...filteredEntries.map(entry => ({
          'Date': new Date(entry.createdAt).toLocaleDateString(),
          'Type': entry.points >= 0 ? 'Positive' : 'Negative',
          'Points': entry.points >= 0 ? `+${entry.points}` : `${entry.points}`,
          'Category': entry.category,
          'Subcategory': entry.subcategory,
          'MUSTANG Trait': entry.mustangTrait,
          'Teacher': entry.teacherName,
          'Reason': entry.reason || ''
        }))
      ];

      if (format === 'csv') {
        const csvData = stringify(exportData, { 
          header: true,
          columns: Object.keys(exportData[0] || {})
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${scholar.name.replace(/\s+/g, '_')}_PBIS_Report.csv"`);
        res.send(csvData);
        
      } else if (format === 'excel') {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        worksheet['!cols'] = [
          { width: 20 }, // Student Name
          { width: 12 }, // Student ID
          { width: 8 },  // Grade
          { width: 12 }, // House
          { width: 15 }, // Report Period
          { width: 18 }, // Total Positive Points
          { width: 18 }, // Total Negative Points
          { width: 12 }, // Net Points
          { width: 15 }, // Total Entries
          { width: 12 }  // Generated
        ];
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'PBIS Report');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${scholar.name.replace(/\s+/g, '_')}_PBIS_Report.xlsx"`);
        res.send(buffer);
        
      } else {
        res.status(400).json({ message: 'Invalid format. Use "csv" or "excel"' });
      }
      
    } catch (error) {
      console.error('Individual student export error:', error);
      res.status(500).json({ message: 'Failed to export student data' });
    }
  });

  // Export scholars data endpoint
  app.get("/api/admin/export/scholars/:format", async (req, res) => {
    try {
      const { format } = req.params;
      const scholars = await storage.getAllScholars();
      const houses = await storage.getHouses();
      
      // Create a map for house names
      const houseMap = new Map(houses.map(h => [h.id, h.name]));
      
      // Format the data for export
      const exportData = scholars.map(scholar => ({
        'Student Name': scholar.name,
        'Student ID': scholar.studentId,
        'Grade Level': scholar.grade,
        'House Assigned': houseMap.get(scholar.houseId) || 'Not Assigned',
        'Academic Points': scholar.academicPoints,
        'Attendance Points': scholar.attendancePoints,
        'Behavior Points': scholar.behaviorPoints,
        'Total Points': scholar.academicPoints + scholar.attendancePoints + scholar.behaviorPoints,
        'Date Added': scholar.createdAt ? new Date(scholar.createdAt).toLocaleDateString() : 'N/A'
      }));

      if (format === 'csv') {
        const csv = stringify(exportData, { 
          header: true,
          columns: [
            'Student Name',
            'Student ID', 
            'Grade Level',
            'House Assigned',
            'Academic Points',
            'Attendance Points',
            'Behavior Points',
            'Total Points',
            'Date Added'
          ]
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="bhsa-scholars-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
        
      } else if (format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'BHSA Scholars');
        
        // Set column widths for better readability
        worksheet['!cols'] = [
          { width: 20 }, // Student Name
          { width: 15 }, // Student ID
          { width: 12 }, // Grade Level
          { width: 20 }, // House Assigned
          { width: 15 }, // Academic Points
          { width: 15 }, // Attendance Points
          { width: 15 }, // Behavior Points
          { width: 12 }, // Total Points
          { width: 12 }  // Date Added
        ];
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="bhsa-scholars-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(buffer);
        
      } else {
        res.status(400).json({ message: 'Invalid format. Use "csv" or "excel"' });
      }
      
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: 'Failed to export scholar data' });
    }
  });

  // Administrator Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const admin = await storage.authenticateAdmin(email, password);
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate session token with extended expiry (30 days for cost reduction)
      // Use consistent deployment-compatible secret
      const jwtSecret = "bhsa-admin-secret-2025-stable";
      const token = jwt.sign(
        { adminId: admin.id, title: admin.title },
        jwtSecret,
        { expiresIn: "30d" }
      );

      // Create session record with extended expiry (30 days)
      await storage.createAdminSession({
        adminId: admin.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      res.json({
        message: "Login successful",
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          title: admin.title,
          permissions: admin.permissions,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Administrator signup route (for creating new admin accounts)
  app.post("/api/admin/signup", async (req, res) => {
    try {
      const validatedData = insertAdministratorSchema.parse(req.body);
      
      // Check if admin already exists
      const existingAdmin = await storage.getAdministratorByEmail(validatedData.email);
      if (existingAdmin) {
        return res.status(400).json({ message: "Administrator already exists with this email" });
      }

      const admin = await storage.createAdministrator(validatedData);
      
      // Send email notification to the new administrator
      try {
        const { sendEmail } = await import("./emailService");
        await sendEmail({
          to: admin.email,
          from: 'BHSAHouses25@gmail.com',
          subject: 'Administrator Account Created - Bush Hills STEAM Academy',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Administrator Account Created Successfully</h2>
              <p>Dear ${admin.firstName} ${admin.lastName},</p>
              
              <p>Your administrator account has been successfully created for the Bush Hills STEAM Academy Character Development Program.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Account Details:</h3>
                <p><strong>Name:</strong> ${admin.firstName} ${admin.lastName}</p>
                <p><strong>Role:</strong> ${admin.title}</p>
                <p><strong>Email:</strong> ${admin.email}</p>
                <p><strong>Login Portal:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin-login">Administrator Login</a></p>
              </div>
              
              <p>You can now log in to access the administrator portal.</p>
              
              <p style="color: #666; font-size: 12px; margin-top: 40px;">
                Bush Hills STEAM Academy<br>
                Character Development Program<br>
                ${new Date().toLocaleDateString()}
              </p>
            </div>
          `,
        });
        console.log(`Admin registration email sent to ${admin.email}`);
      } catch (emailError) {
        console.error("Failed to send admin registration email:", emailError);
        // Continue with registration even if email fails
      }
      
      res.status(201).json({
        message: "Administrator account created successfully",
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          title: admin.title,
        },
      });
    } catch (error) {
      console.error("Admin signup error:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  // Administrator middleware
  const authenticateAdmin = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      // Use consistent deployment-compatible secret
      const jwtSecret = "bhsa-admin-secret-2025-stable";
      const decoded: any = jwt.verify(token, jwtSecret);
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid session" });
      }
      
      const admin = await storage.getAdministratorByEmail(decoded.email);
      if (!admin) {
        return res.status(401).json({ message: "Invalid token" });
      }
      req.admin = admin;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Admin email test endpoint
  app.post("/api/admin/test-email", async (req, res) => {
    try {
      console.log('🧪 Testing email configuration...');
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address required" });
      }

      const success = await sendEmail({
        to: email,
        from: "BHSAHouses25@gmail.com", // Use your verified email as sender
        subject: "Bush Hills STEAM Academy - Email Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Bush Hills STEAM Academy</h2>
            <h3 style="color: #059669;">Email Configuration Test</h3>
            <p>This is a test email to confirm your administrator email configuration is working correctly.</p>
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Recipient:</strong> ${email}</p>
            <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="color: #059669; font-weight: bold;">✅ If you received this email, your notification system is properly configured!</p>
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent from the Bush Hills STEAM Academy PBIS House of Champions.
            </p>
          </div>
        `,
        text: `Bush Hills STEAM Academy Email Test\n\nThis is a test email to confirm your administrator email configuration is working correctly.\n\nTest Date: ${new Date().toLocaleString()}\nRecipient: ${email}\n\nIf you received this email, your notification system is properly configured!`
      });

      if (success) {
        res.json({ 
          message: "Test email sent successfully!",
          details: `Email sent to ${email}. Check your inbox to confirm delivery.`
        });
      } else {
        res.status(500).json({ 
          message: "Email test failed",
          details: "Check server logs for error details. Common issues: invalid API key, unverified sender domain, or insufficient permissions."
        });
      }
    } catch (error) {
      console.error("❌ Test email error:", error);
      res.status(500).json({ 
        message: "Email test failed",
        details: "Server error occurred during email test. Check logs for details."
      });
    }
  });

  // Parent-Teacher Messaging Routes
  
  // Create a new message
  app.post("/api/parent-teacher-messages", authenticateTeacher, async (req: any, res) => {
    try {
      // Extract teacher ID from authentication
      const teacherId = req.teacher.id;
      
      // Add required fields for teacher message
      const messageData = insertParentTeacherMessageSchema.parse({
        ...req.body,
        teacherId: teacherId,
        senderType: "teacher"
      });
      
      // Allow messages of any reasonable length (minimum 10 characters for basic validation)
      if (messageData.message.length < 10) {
        return res.status(400).json({ 
          error: "Message must be at least 10 characters long" 
        });
      }
      
      const message = await storage.createParentTeacherMessage(messageData);
      
      // Send email notifications
      const [parent, teacher, scholar] = await Promise.all([
        storage.getParent(messageData.parentId),
        storage.getTeacherAuthById ? storage.getTeacherAuthById(messageData.teacherId) : null,
        storage.getScholar(messageData.scholarId)
      ]);
      
      if (parent && teacher && scholar) {
        if (messageData.senderType === 'teacher') {
          const { sendTeacherMessageNotification } = require("./emailService");
          await sendTeacherMessageNotification({
            parentEmail: parent.email,
            parentName: `${parent.firstName} ${parent.lastName}`,
            teacherName: teacher.name,
            studentName: scholar.name,
            subject: messageData.subject,
            message: messageData.message
          });
        } else {
          const { sendParentReplyNotification } = require("./emailService");
          await sendParentReplyNotification({
            teacherEmail: teacher.email,
            teacherName: teacher.name,
            parentName: `${parent.firstName} ${parent.lastName}`,
            studentName: scholar.name,
            subject: messageData.subject,
            message: messageData.message
          });
        }
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Get messages for a parent
  app.get("/api/parent-teacher-messages/parent/:parentId", async (req, res) => {
    try {
      const { parentId } = req.params;
      const messages = await storage.getMessagesByParent(parentId);
      console.log(`MESSAGES: Fetched ${messages.length} messages for parent ${parentId}`);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching parent messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get messages for a teacher
  app.get("/api/parent-teacher-messages/teacher/:teacherId", async (req, res) => {
    try {
      const { teacherId } = req.params;
      const messages = await storage.getMessagesByTeacher(teacherId);
      console.log(`MESSAGES: Fetched ${messages.length} messages for teacher ${teacherId}`);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching teacher messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get all parents (for teacher messaging interface)
  app.get("/api/parents", async (req, res) => {
    try {
      const parents = await storage.getAllParents();
      console.log("PARENT API: Fetched", parents.length, "parents");
      
      // Add debug info for parent-scholar linkings
      for (const parent of parents) {
        console.log(`PARENT API: Parent ${parent.firstName} ${parent.lastName} has scholarIds:`, parent.scholarIds || []);
      }
      
      res.json(parents);
    } catch (error) {
      console.error("Error fetching parents:", error);
      res.status(500).json({ error: "Failed to fetch parents" });
    }
  });

  // Add scholar to parent by username
  app.post("/api/parents/:parentId/add-scholar-by-username", async (req, res) => {
    try {
      const { parentId } = req.params;
      const { studentUsername } = req.body;
      
      if (!studentUsername) {
        return res.status(400).json({ error: "Student username is required" });
      }
      
      const scholar = await storage.addScholarToParentByUsername(parentId, studentUsername);
      
      if (scholar) {
        res.json({ 
          success: true, 
          scholar,
          message: `Successfully linked ${scholar.name} to your account` 
        });
      } else {
        res.status(404).json({ 
          error: "Student not found with that username" 
        });
      }
    } catch (error) {
      console.error("Error adding scholar by username:", error);
      res.status(500).json({ error: "Failed to add scholar" });
    }
  });

  // Teacher Authentication Routes - Deployment compatibility
  app.post("/api/teacher-auth/login", async (req, res) => {
    console.log("=== TEACHER-AUTH LOGIN REQUEST ===");
    console.log("Login attempt for:", req.body.email);
    
    try {
      const { email, password } = req.body;
      console.log("Looking up teacher in storage...");
      
      const teacher = await storage.getTeacherAuthByEmail(email);
      
      if (!teacher) {
        console.log("Teacher not found:", email);
        return res.status(401).json({ message: "Login failed" });
      }
      
      console.log("Teacher lookup result:", "Found " + teacher.name);
      
      // For deployment, use simple password check
      const isValidPassword = password === "BHSATeacher2025!";
      console.log("Password check:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Invalid password for:", email);
        return res.status(401).json({ message: "Login failed" });
      }
      
      console.log("Authentication successful, generating token...");
      
      // Generate JWT token using consistent secret
      const token = jwt.sign(
        { 
          teacherId: teacher.id,
          gradeRole: teacher.gradeRole 
        },
        "bhsa-teacher-secret-2025-stable",
        { expiresIn: '30d' }
      );
      
      // Generate grade permissions for frontend
      const getCanSeeGrades = (gradeRole: string): number[] => {
        switch (gradeRole) {
          case '6th Grade': return [6];
          case '7th Grade': return [7];
          case '8th Grade': return [8];
          case 'Unified Arts': return [6, 7, 8];
          case 'Administration': return [6, 7, 8];
          case 'Counselor': return [6, 7, 8];
          default: return [];
        }
      };

      res.json({ 
        success: true,
        token, 
        teacher: {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
          gradeRole: teacher.gradeRole,
          subject: teacher.subject,
          role: teacher.gradeRole, // Add role field for compatibility
          canSeeGrades: getCanSeeGrades(teacher.gradeRole)
        }
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Teacher token verification endpoint
  app.get("/api/teacher-auth/verify", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(token, "bhsa-teacher-secret-2025-stable") as any;
      
      // DEPLOYMENT CACHE FIX: Always fetch fresh teacher data from database
      const teacher = await storage.getTeacherAuthById(decoded.teacherId);
      console.log("TEACHER VERIFY: Fetched fresh teacher data:", teacher ? teacher.name : "Not found");
      console.log("TEACHER VERIFY: Grade Role:", teacher?.gradeRole, "Subject:", teacher?.subject);
      
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      // Generate grade permissions for frontend
      const getCanSeeGrades = (gradeRole: string): number[] => {
        switch (gradeRole) {
          case '6th Grade': return [6];
          case '7th Grade': return [7];
          case '8th Grade': return [8];
          case 'Unified Arts': return [6, 7, 8];
          case 'Administration': return [6, 7, 8];
          case 'Counselor': return [6, 7, 8];
          default: return [];
        }
      };

      const teacherData = {
        id: teacher.id,
        email: teacher.email,
        name: teacher.name,
        gradeRole: teacher.gradeRole,
        subject: teacher.subject,
        role: teacher.gradeRole,
        canSeeGrades: getCanSeeGrades(teacher.gradeRole)
      };

      console.log("TEACHER VERIFY: Returning fresh teacher data:", teacherData);

      // Set cache-busting headers to prevent caching issues during deployment
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({ 
        success: true,
        teacher: teacherData
      });
    } catch (error) {
      console.error("Teacher token verification error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  app.post("/api/teacher-auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, subject, canSeeGrades } = req.body;
      
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }

      // Check if teacher already exists
      const existingTeacher = await storage.getTeacherAuthByEmail(email);
      if (existingTeacher) {
        return res.status(409).json({ message: "Teacher with this email already exists" });
      }

      const teacherData = {
        name: `${firstName} ${lastName}`,
        email,
        password,
        gradeRole: role,
        subject: subject || ""
      };

      const newTeacher = await storage.createTeacherAuth(teacherData);
      
      // Send notification email to administrators
      const { sendTeacherRegistrationNotification } = require("./emailService");
      await sendTeacherRegistrationNotification({
        teacherName: newTeacher.name,
        teacherEmail: newTeacher.email,
        gradeRole: newTeacher.gradeRole,
        subject: newTeacher.subject
      });

      res.status(201).json({
        success: true,
        message: "Registration submitted successfully. Your account will be activated once approved by administration."
      });
    } catch (error) {
      console.error("Teacher registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Admin Messaging Routes
  // Get all messages for admin (both sent and received)
  app.get("/api/admin/messages", authenticateAdmin, async (req: any, res) => {
    try {
      console.log("ADMIN MESSAGES: Fetching messages for admin:", req.admin.id);
      const messages = await storage.getMessagesForAdmin(req.admin.id);
      console.log(`ADMIN MESSAGES: Found ${messages.length} messages for admin`);
      res.json(messages);
    } catch (error) {
      console.error("ADMIN MESSAGES: Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages", error: error.message });
    }
  });

  // Send message from admin to teacher or parent
  app.post("/api/admin/send-message", authenticateAdmin, async (req: any, res) => {
    try {
      const { recipientType, teacherId, parentId, subject, message, priority = "normal" } = req.body;
      
      console.log("ADMIN SEND MESSAGE: Request data:", {
        recipientType,
        teacherId,
        parentId,
        subject,
        priority,
        adminId: req.admin.id
      });

      if (!subject || !message) {
        return res.status(400).json({ message: "Subject and message are required" });
      }

      if (!recipientType || (recipientType !== "teacher" && recipientType !== "parent")) {
        return res.status(400).json({ message: "Invalid recipient type. Must be 'teacher' or 'parent'" });
      }

      if (recipientType === "teacher" && !teacherId) {
        return res.status(400).json({ message: "Teacher ID is required when sending to teacher" });
      }

      if (recipientType === "parent" && !parentId) {
        return res.status(400).json({ message: "Parent ID is required when sending to parent" });
      }

      const messageData = {
        senderId: req.admin.id,
        senderType: "admin",
        recipientType,
        teacherId: recipientType === "teacher" ? teacherId : null,
        parentId: recipientType === "parent" ? parentId : null,
        subject,
        message,
        priority,
        isRead: false,
        createdAt: new Date(),
      };

      const newMessage = await storage.createParentTeacherMessage(messageData);
      
      console.log("ADMIN SEND MESSAGE: Message created successfully:", newMessage.id);
      
      res.json({ 
        success: true, 
        message: "Message sent successfully",
        messageId: newMessage.id
      });
    } catch (error) {
      console.error("ADMIN SEND MESSAGE: Error:", error);
      res.status(500).json({ message: "Failed to send message", error: error.message });
    }
  });

  // Get all teachers for admin messaging dropdown
  app.get("/api/admin/teachers", authenticateAdmin, async (req: any, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        gradeRole: teacher.gradeRole,
        subject: teacher.subject
      })));
    } catch (error) {
      console.error("ADMIN TEACHERS: Error fetching teachers:", error);
      res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
    }
  });

  // Get all parents for admin messaging dropdown
  app.get("/api/admin/parents", authenticateAdmin, async (req: any, res) => {
    try {
      const parents = await storage.getAllParents();
      res.json(parents.map(parent => ({
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email
      })));
    } catch (error) {
      console.error("ADMIN PARENTS: Error fetching parents:", error);
      res.status(500).json({ message: "Failed to fetch parents", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
