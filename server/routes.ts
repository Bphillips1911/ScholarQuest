import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScholarSchema, insertTeacherSchema, insertPointEntrySchema, insertPbisEntrySchema, insertPbisPhotoSchema, insertParentSchema, insertTeacherAuthSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as any;
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
      
      // Generate JWT token
      const token = jwt.sign(
        { parentId: parent.id },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
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
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const parent = await storage.getParentByEmail(email);
      if (!parent) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, parent.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { parentId: parent.id },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
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
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Add scholar to parent account
  app.post("/api/parent/add-scholar", authenticateParent, async (req: any, res) => {
    try {
      const { studentId } = req.body;
      
      if (!studentId) {
        return res.status(400).json({ message: "Student ID required" });
      }

      // Find scholar by student ID
      const scholars = await storage.getAllScholars();
      const scholar = scholars.find(s => s.studentId === studentId);
      
      if (!scholar) {
        return res.status(404).json({ message: "Scholar not found with this Student ID" });
      }

      const success = await storage.addScholarToParent(req.parent.id, scholar.id);
      if (success) {
        res.json({ message: "Scholar added successfully", scholar });
      } else {
        res.status(400).json({ message: "Failed to add scholar" });
      }
    } catch (error) {
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

  // Teacher authentication middleware
  const authenticateTeacher = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "teacher-secret-key");
      const teacher = await storage.getTeacher(decoded.teacherId);
      if (!teacher) {
        return res.status(401).json({ message: "Invalid token" });
      }
      req.teacher = teacher;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Teacher routes
  // Teacher login
  app.post("/api/teacher/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const teacher = await storage.getTeacherByEmail(email);
      
      if (!teacher) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, teacher.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { teacherId: teacher.id, role: teacher.role },
        process.env.JWT_SECRET || "teacher-secret-key",
        { expiresIn: "24h" }
      );

      res.json({
        token,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
          subject: teacher.subject,
          canSeeGrades: teacher.canSeeGrades,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
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
      
      // Check if teacher has permission to see this grade
      if (!teacher.canSeeGrades?.includes(grade)) {
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
      
      // Verify teacher can see the scholar
      const scholar = await storage.getScholar(validatedData.scholarId);
      if (!scholar || !teacher.canSeeGrades?.includes(scholar.grade)) {
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
      
      // Verify teacher can add scholars of this grade
      if (!teacher.canSeeGrades?.includes(scholarData.grade)) {
        return res.status(403).json({ message: "You don't have permission to add scholars for this grade" });
      }

      const validatedData = insertScholarSchema.parse(scholarData);
      const scholar = await storage.createScholar(validatedData);
      res.status(201).json(scholar);
    } catch (error) {
      res.status(400).json({ message: "Failed to add scholar" });
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

  app.post("/api/teacher/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("Login attempt for:", email);
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const teacher = await storage.getTeacherAuthByEmail(email);
      console.log("Found teacher:", teacher ? "yes" : "no");
      
      if (!teacher) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!teacher.isApproved) {
        return res.status(401).json({ message: "Account pending approval" });
      }

      const isValidPassword = await bcrypt.compare(password, teacher.passwordHash);
      console.log("Password valid:", isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate session token
      const token = jwt.sign(
        { teacherId: teacher.id, gradeRole: teacher.gradeRole },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
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
        },
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
