// ============================================================
// src/config/database.ts — Prisma Client Singleton
// ============================================================
//
// 🎓 TEACHING: The Singleton Pattern
//
// WHAT IS IT?
//   Singleton ensures only ONE instance of a class/object
//   exists throughout your entire application's lifetime.
//
// WHY DO WE NEED IT HERE?
//   PrismaClient manages a connection POOL to PostgreSQL.
//   A connection pool = a set of pre-opened database connections
//   that are reused instead of opened/closed on every query.
//
//   If you create `new PrismaClient()` in every file that needs
//   the database, you'd open dozens of connection pools.
//   PostgreSQL has a max connection limit (~100 by default).
//   You'd hit that limit and crash.
//
// THE PROBLEM IN DEVELOPMENT (HOT RELOAD):
//   Tools like `tsx watch` restart the module system but DON'T
//   restart the entire Node.js process. Each hot reload runs
//   `new PrismaClient()` AGAIN — creating more and more pools.
//
//   The fix: Store the instance on `globalThis` (the global object).
//   On next hot reload, we reuse the existing instance instead
//   of creating a new one.
//
// REAL-WORLD ANALOGY:
//   A connection pool is like a taxi dispatcher.
//   Instead of calling a new taxi for every trip (slow, expensive),
//   the dispatcher maintains a fleet of taxis (connections) and
//   assigns available ones to requests instantly.
//
// INTERVIEW QUESTION:
//   "What is the Singleton pattern and when should you use it?"
//   Answer: Singleton restricts a class to one instance. Use it
//   for shared resources like database connections, logging services,
//   or configuration objects.
// ============================================================

import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Extend globalThis to store our Prisma instance
// This is a TypeScript pattern to safely add properties to the global object
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ── Create or Reuse Prisma Instance ─────────────────────────
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: env.isDevelopment
      ? ["query", "info", "warn", "error"] // Log all SQL in development
      : ["warn", "error"],                  // Only warnings/errors in production
    // 🎓 TEACHING: Logging SQL queries in development helps you:
    //   1. See what queries Prisma generates
    //   2. Spot N+1 query problems early
    //   3. Debug unexpected behavior
    //   But in production, query logging is too verbose and
    //   could expose sensitive data in logs.
  });
}

// Use global instance in development (hot reload fix)
// Create fresh instance in production (no hot reload)
const prisma = globalThis.__prisma ?? createPrismaClient();

if (env.isDevelopment) {
  globalThis.__prisma = prisma;
}

export { prisma };

// ── Connection Health Check ──────────────────────────────────
// Call this at app startup to verify DB is reachable
export async function checkDatabaseConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

// ── Graceful Shutdown ────────────────────────────────────────
// 🎓 TEACHING: Graceful shutdown
//
// When Node.js receives SIGTERM (from Docker, Kubernetes, or Ctrl+C),
// we should close the DB connection cleanly before exiting.
// Otherwise, in-flight queries might get corrupted.
//
// This is called "graceful shutdown" — a production best practice.
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log("🔌 Database disconnected");
}
