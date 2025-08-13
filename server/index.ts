import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Production environment check
const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Test database connection first
    try {
      const { pool } = await import("./db");
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      log("Database connection successful");
    } catch (dbError) {
      log(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      if (isProduction) {
        process.exit(1);
      }
      throw dbError;
    }

    // CRITICAL DEPLOYMENT FIX - Force teacher seeding on every startup
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`STARTUP: Running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`STARTUP: Production mode: ${isProduction}`);
    console.log(`STARTUP: REPL_ID: ${process.env.REPL_ID || 'not set'}`);
    
    // Aggressive deployment seeding - check and create teachers if missing
    try {
      console.log("STARTUP: 🔧 DEPLOYMENT FIX - Checking teacher count...");
      const { db } = await import("./db");
      const { teacherAuth } = await import("@shared/schema");
      const existingTeachers = await db.select().from(teacherAuth);
      console.log(`STARTUP: Found ${existingTeachers.length} teachers in database`);
      
      if (existingTeachers.length === 0 || isProduction) {
        console.log("STARTUP: 🚨 DEPLOYMENT EMERGENCY - Force creating teachers...");
        
        const bcrypt = (await import("bcryptjs")).default;
        const { randomUUID } = await import("crypto");
        const hashedPassword = await bcrypt.hash("BHSATeacher2025!", 10);
        
        const requiredTeachers = [
          { email: "sarah.johnson@bhsteam.edu", name: "Sarah Johnson", gradeRole: "6th Grade", subject: "Mathematics" },
          { email: "jennifer.adams@bhsteam.edu", name: "Jennifer Adams", gradeRole: "7th Grade", subject: "Science" },
          { email: "michael.davis@bhsteam.edu", name: "Michael Davis", gradeRole: "8th Grade", subject: "English" }
        ];
        
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
            console.log(`STARTUP: ✅ EMERGENCY CREATED: ${teacherInfo.email}`);
          }
        }
        
        const finalCount = await db.select().from(teacherAuth);
        console.log(`STARTUP: 🎯 DEPLOYMENT SUCCESS - ${finalCount.length} teachers now in database`);
      }
    } catch (emergencyError) {
      console.error("STARTUP: 🚨 EMERGENCY SEEDING FAILED:", emergencyError);
    }
    
    // Run regular seeding as well
    const { seedDatabase } = await import("./seed");
    await seedDatabase();
    console.log("STARTUP: Database seeding completed");
    
    const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  const httpServer = server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    log(`Received ${signal}. Starting graceful shutdown...`);
    
    httpServer.close(() => {
      log('HTTP server closed');
      
      // Close database connections
      import("./db").then(({ pool }) => {
        pool.end().then(() => {
          log('Database connections closed');
          process.exit(0);
        }).catch((err) => {
          log(`Error closing database: ${err.message}`);
          process.exit(1);
        });
      }).catch(() => {
        process.exit(0);
      });
    });

    // Force close after 30 seconds
    setTimeout(() => {
      log('Force closing after timeout');
      process.exit(1);
    }, 30000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    log(`Startup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (isProduction) {
      process.exit(1);
    }
    throw error;
  }
})().catch((error) => {
  log(`Unhandled startup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});
