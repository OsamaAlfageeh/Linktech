import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seedDatabase";

const app = express();
app.use(express.json({ limit: '50mb' })); // زيادة الحد المسموح به للطلبات
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // استخدام extended: true للتعامل مع البيانات المركبة في الـ URL

// تكوين التطبيق للتعامل مع الأحرف العربية في عناوين URL
app.use((req, res, next) => {
  // ضمان أن الحروف العربية سيتم استقبالها بشكل صحيح في params
  if (req.params) {
    for (let key in req.params) {
      try {
        // فك تشفير سلاسل URL إذا لزم الأمر (تم تشفيرها من قبل المتصفح)
        if (req.params[key] && req.params[key].includes('%')) {
          req.params[key] = decodeURIComponent(req.params[key]);
        }
      } catch (e) {
        console.error(`Error decoding URL param ${key}:`, e);
      }
    }
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

// Add process error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, we might want to exit gracefully
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, we might want to exit gracefully
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Add graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

(async () => {
  // Seed the database with initial data - with enhanced error handling
  console.log("Starting database seeding...");
  try {
    await seedDatabase();
    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    // In production, don't fail the entire deployment due to seeding errors
    if (process.env.NODE_ENV === 'production') {
      console.warn("Continuing with deployment despite seeding error...");
    } else {
      // In development, we can be more strict
      throw error;
    }
  }

  const server = await registerRoutes(app);

  // Enhanced error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error for debugging
    console.error('Express error handler:', {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    res.status(status).json({ message });
    
    // Don't throw in production to prevent crashes
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // Temporarily use static files due to Vite configuration TypeScript issue
  serveStatic(app);

  // Get port from environment or default to 5000
  // This ensures compatibility with Cloud Run and other deployment platforms
  const port = process.env.PORT || 5000;
  const host = process.env.HOST || "0.0.0.0";
  
  console.log(`Starting server on ${host}:${port} in ${process.env.NODE_ENV || 'development'} mode`);
  
  server.listen(parseInt(port.toString(), 10), host, () => {
    log(`serving on ${host}:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
  });

  // Handle server errors
  server.on('error', (error: any) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    }
  });
})();
