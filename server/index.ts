import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Production environment check
const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
  }
  next();
});

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
    // Enhanced database connection testing with retry logic
    try {
      const { testDatabaseConnection } = await import("./db");
      log("DEPLOYMENT: Testing database connection with retry logic...");
      
      const maxRetries = isProduction ? 10 : 3;
      const retryDelay = isProduction ? 5000 : 2000;
      
      const isConnected = await testDatabaseConnection(maxRetries, retryDelay);
      
      if (!isConnected) {
        const errorMsg = `Database connection failed after ${maxRetries} attempts`;
        log(`DEPLOYMENT ERROR: ${errorMsg}`);
        
        if (isProduction) {
          console.error('DEPLOYMENT: Database connection failure - exiting');
          process.exit(1);
        }
        throw new Error(errorMsg);
      }
      
      log("DEPLOYMENT: Database connection established successfully");
      
      // CRITICAL: Ensure database schema exists before any operations
      try {
        log("STARTUP: Ensuring database schema exists...");
        const { ensureSchema } = await import("./schema-bootstrap");
        const { db } = await import("./db");
        await ensureSchema(db);
        log("STARTUP: Database schema bootstrap completed successfully");
      } catch (schemaError) {
        log("STARTUP: Schema bootstrap error:", schemaError.message);
        
        if (isProduction) {
          console.error('DEPLOYMENT: Critical schema error - application cannot start without tables');
          process.exit(1);
        }
        throw new Error(`Schema bootstrap failed: ${schemaError.message}`);
      }
      
      // Deployment debugging and data synchronization
      try {
        const { debugDeploymentEnvironment } = await import("./deployment-debug");
        await debugDeploymentEnvironment();
      } catch (error) {
        log("DEPLOYMENT: Debug error (non-critical):", error.message);
      }
      
      // Initialize parent password security system
      try {
        log("STARTUP: Initializing parent password security...");
        const { initializeParentPasswordSecurity } = await import("./parent-password-fix");
        await initializeParentPasswordSecurity();
        log("STARTUP: Parent password security initialized successfully");
      } catch (error) {
        log("STARTUP: Parent password security error (non-critical):", error.message);
      }
      
      try {
        const { forceDeploymentDatabaseSync } = await import("./deployment-database-fix");
        await forceDeploymentDatabaseSync();
      } catch (error) {
        log("DEPLOYMENT: Database sync error (non-critical):", error.message);
      }
      
      // Production database override for deployment consistency
      try {
        const { overrideProductionDatabase } = await import("./production-db-override");
        await overrideProductionDatabase();
      } catch (error) {
        log("PRODUCTION: Database override error (non-critical):", error.message);
      }
      
      // Teacher authentication consistency check
      try {
        const { ensureTeacherAuthConsistency } = await import("./teacher-auth-fix");
        await ensureTeacherAuthConsistency();
      } catch (error) {
        log("TEACHER AUTH: Error (non-critical):", error.message);
      }
      
      // Parent authentication consistency check
      try {
        const { ensureParentAuthConsistency } = await import("./parent-auth-fix");
        await ensureParentAuthConsistency();
      } catch (error) {
        log("PARENT AUTH: Error (non-critical):", error.message);
      }
      
      try {
        const { forceDeploymentSync } = await import("./force-deployment-sync");
        await forceDeploymentSync();
      } catch (error) {
        log("DEPLOYMENT: Sync error (non-critical):", error.message);
      }
      
      // Comprehensive deployment initialization
      if (isProduction) {
        try {
          const { verifyDeploymentEnvironment, initializeDeploymentDatabase } = await import("./deployment-init");
          
          // Verify environment variables
          const envValid = verifyDeploymentEnvironment();
          if (!envValid) {
            console.error('DEPLOYMENT: Environment validation failed - missing required variables');
            process.exit(1);
          }
          
          // Initialize database schema
          const schemaValid = await initializeDeploymentDatabase();
          if (!schemaValid) {
            log("DEPLOYMENT WARNING: Database schema issues detected");
            log("DEPLOYMENT: Proceeding with seeding to create missing tables...");
          } else {
            log("DEPLOYMENT: Database schema validation passed");
          }
          
        } catch (deploymentError) {
          log(`DEPLOYMENT ERROR: Initialization failed - ${deploymentError instanceof Error ? deploymentError.message : 'Unknown error'}`);
          // Continue with startup - seeding may resolve issues
        }
      }
      
    } catch (dbError) {
      const errorMsg = `Database initialization failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
      log(`DEPLOYMENT ERROR: ${errorMsg}`);
      
      if (isProduction) {
        console.error('DEPLOYMENT: Critical database error - application cannot start');
        process.exit(1);
      }
      throw new Error(errorMsg);
    }

    // CRITICAL DEPLOYMENT FIX - Force teacher seeding on every startup
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
          { email: "michael.davis@bhsteam.edu", name: "Michael Davis", gradeRole: "7th Grade", subject: "Science" },  // FIXED
          { email: "david.thompson@bhsteam.edu", name: "David Thompson", gradeRole: "7th Grade", subject: "Science" }  // NEW
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
    
    // CRITICAL: Seed EduCAP data (standards, blueprints, items, assessments)
    // This ensures production has the same data as development
    try {
      const { seedEducapData } = await import("./seed-educap");
      await seedEducapData();
      console.log("STARTUP: EduCAP data seeding completed");
    } catch (educapError: any) {
      console.error("STARTUP: EduCAP seeding error (non-critical):", educapError.message);
    }
    
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

  // Enhanced server configuration for deployment
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = isProduction ? '0.0.0.0' : 'localhost'; // Bind to all interfaces in production
  
  log(`DEPLOYMENT: Starting server on ${host}:${port} (production: ${isProduction})`);
  
  const httpServer = server.listen({
    port,
    host: "0.0.0.0", // Bind to all interfaces for preview access
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
