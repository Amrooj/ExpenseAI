// ============================================================
// src/app.ts — Express Application Setup
// ============================================================
//
// 🎓 TEACHING: app.ts vs server.ts — Why two files?
//
// SEPARATION OF CONCERNS principle:
//
// app.ts  → defines the Express app (middleware, routes)
//           This is "what" the app does
//
// server.ts → starts the HTTP server (port binding, DB connection)
//             This is "how" the app runs
//
// WHY SEPARATE THEM?
//   In testing, you import `app` WITHOUT starting the server.
//   This lets you run HTTP tests (supertest) without binding a port.
//   If app.ts also started the server, every test file would try
//   to bind port 3000 and crash with "address already in use".
//
// This is a standard pattern in professional Express codebases.
// ============================================================

import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { log } from "./utils/logger";

// ── Route Imports ─────────────────────────────────────────────
import authRoutes    from "./routes/auth.routes";
import expenseRoutes from "./routes/expense.routes";
// import analyticsRoutes from "./routes/analytics.routes"; // M6 (dedicated analytics)

// ── Create Express Application ───────────────────────────────
const app: Application = express();

// ============================================================
// MIDDLEWARE STACK
//
// 🎓 TEACHING: Middleware Execution Order
//
// Express middleware runs in the ORDER it is registered.
// Each middleware either:
//   a) Does something and calls next() → passes to next middleware
//   b) Sends a response → stops the chain
//
// Our order:
//   1. Security headers (first — protect everything below)
//   2. CORS (before any routes — needed for preflight requests)
//   3. Rate limiting (before body parsing — block early)
//   4. Body parsing (before routes — routes need parsed body)
//   5. Logging (before routes — log every request)
//   6. Static files (before API routes)
//   7. API routes
//   8. 404 handler (after routes — catches unmatched routes)
//   9. Error handler (last — catches all thrown errors)
// ============================================================

// ── 1. Security Headers (Helmet) ─────────────────────────────
//
// 🎓 TEACHING: helmet sets secure HTTP headers automatically.
//
// Without it, your Express app sends dangerous defaults like:
//   X-Powered-By: Express  → tells attackers your tech stack
//
// Helmet adds:
//   Content-Security-Policy → prevents XSS attacks
//   X-Frame-Options: DENY   → prevents clickjacking
//   X-Content-Type-Options  → prevents MIME sniffing
//   Strict-Transport-Security → forces HTTPS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Allow cross-origin images (needed for receipt previews from local storage)
  })
);

// ── 2. CORS — Cross-Origin Resource Sharing ──────────────────
//
// 🎓 TEACHING: What is CORS?
//
// Browsers block requests from origin A to origin B by default.
// (e.g., http://localhost:5173 can't call http://localhost:3000)
// This is the "Same-Origin Policy" — a browser security feature.
//
// CORS is the mechanism that lets servers ALLOW specific origins.
// Without this config, your React app couldn't talk to your API.
app.use(
  cors({
    // Only allow requests from our frontend
    origin: env.frontendUrl.split(",").map((url) => url.trim()),
    // Allow cookies/auth headers to be sent cross-origin
    credentials: true,
    // Allowed HTTP methods
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // Allowed request headers
    allowedHeaders: ["Content-Type", "Authorization", "X-Refresh-Token"],
  })
);

// ── 3. Rate Limiting ──────────────────────────────────────────
//
// 🎓 TEACHING: Rate limiting protects against:
//   - Brute force attacks (trying thousands of passwords)
//   - DDoS attacks (overwhelming the server with requests)
//   - API abuse (scraping, excessive API usage)
//
// We set: max 100 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: {
    success: false,
    error: { message: "Too many requests, please try again later." },
  },
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
});

app.use("/api", limiter);

// Stricter rate limit for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 login attempts per 15 min
  message: {
    success: false,
    error: { message: "Too many authentication attempts. Please wait 15 minutes." },
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── 4. Body Parsing ───────────────────────────────────────────
// Parse JSON request bodies (req.body)
app.use(express.json({ limit: "10mb" }));
// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── 5. Compression ────────────────────────────────────────────
// Compress HTTP responses with gzip
// Reduces bandwidth usage by ~70% for JSON responses
app.use(compression());

// ── 6. HTTP Request Logging (Morgan) ─────────────────────────
//
// 🎓 TEACHING: Morgan logs every HTTP request.
// In development: "GET /api/expenses 200 45ms"
// In production: structured JSON (piped to winston)
if (env.isDevelopment) {
  app.use(morgan("dev"));
} else {
  // In production, pipe morgan output to winston logger
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => log.info(message.trim()),
      },
    })
  );
}

// ── 7. Static Files (Receipt Uploads) ─────────────────────────
// Serve uploaded receipt images from the uploads directory
// URL pattern: GET /uploads/filename.jpg
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), env.storage.uploadDir), {
    // Set cache headers for uploaded files
    maxAge: "1d",
    // Don't show directory listings (security)
    dotfiles: "deny",
  })
);

// ── 8. API Routes ─────────────────────────────────────────────
// Health check endpoint — used by Docker, load balancers, and
// deployment platforms to verify the service is running
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Expense Tracker API is running",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    version: process.env["npm_package_version"] ?? "1.0.0",
  });
});

// Serve uploaded files statically (local storage provider)
app.use("/uploads", express.static(path.resolve(env.storage.uploadDir)));

// API routes
app.use("/api/auth",     authRoutes);
app.use("/api/expenses", expenseRoutes);
// app.use("/api/analytics", analyticsRoutes); // M6 — dedicated analytics module

// ── 9. 404 Handler ────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use(notFoundHandler);

// ── 10. Global Error Handler ─────────────────────────────────
// MUST be last — Express identifies it by its 4 parameters
app.use(errorHandler);

export { app };
export default app;
