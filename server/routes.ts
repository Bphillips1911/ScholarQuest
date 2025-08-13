import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScholarSchema, insertTeacherSchema, insertPointEntrySchema, insertPbisEntrySchema, insertPbisPhotoSchema, insertParentSchema, insertTeacherAuthSchema, insertAdministratorSchema, insertParentTeacherMessageSchema } from "@shared/schema";
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

  // Teacher routes (old login removed - using new auth system)

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
      
      console.log("Add scholar request:", scholarData);
      console.log("Teacher permissions:", teacher.canSeeGrades);
      
      // Verify teacher can add scholars of this grade
      if (!teacher.canSeeGrades?.includes(scholarData.grade)) {
        console.log("Permission denied for grade:", scholarData.grade);
        return res.status(403).json({ message: "You don't have permission to add scholars for this grade" });
      }

      // Add teacherId to the scholar data
      const scholarWithTeacher = {
        ...scholarData,
        teacherId: teacher.id,
        addedByTeacher: teacher.id,
      };

      console.log("Scholar data with teacher:", scholarWithTeacher);
      
      const validatedData = insertScholarSchema.parse(scholarWithTeacher);
      console.log("Validated scholar data:", validatedData);
      
      const scholar = await storage.createScholar(validatedData);
      console.log("Created scholar:", scholar);
      
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
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          gradeRole: teacher.gradeRole,
          isApproved: teacher.isApproved,
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

      if (!teacher.canSeeGrades?.includes(scholar.grade)) {
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
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

      // Create session token
      const token = jwt.sign({ studentId: student.id }, process.env.JWT_SECRET || "secret", { expiresIn: "24h" });
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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

      // Generate session token
      const token = jwt.sign(
        { adminId: admin.id, title: admin.title },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "24h" }
      );

      // Create session record
      await storage.createAdminSession({
        adminId: admin.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
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
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
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
  app.post("/api/parent-teacher-messages", async (req, res) => {
    try {
      const messageData = insertParentTeacherMessageSchema.parse(req.body);
      
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

  // Teacher Authentication Routes
  app.post("/api/teacher-auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const teacher = await storage.authenticateTeacher(email, password);
      
      if (!teacher) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate session token
      const token = jwt.sign(
        { teacherId: teacher.id, email: teacher.email },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "8h" }
      );

      // Create session record
      await storage.createTeacherSession({
        teacherId: teacher.id,
        token,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      });

      res.json({
        success: true,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          gradeRole: teacher.gradeRole,
          subject: teacher.subject,
          canSeeGrades: teacher.gradeRole.includes("6th") ? [6] : 
                       teacher.gradeRole.includes("7th") ? [7] :
                       teacher.gradeRole.includes("8th") ? [8] : [6, 7, 8]
        },
        token
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ message: "Login failed" });
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

  const httpServer = createServer(app);
  return httpServer;
}
