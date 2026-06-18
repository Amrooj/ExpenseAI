// ============================================================
// src/server.ts — HTTP Server Entry Point
// ============================================================
//
// 🎓 TEACHING: This is where the application "boots".
//
// The startup sequence matters:
//   1. Validate environment variables (fail fast if missing)
//   2. Connect to database (fail fast if unreachable)
//   3. Start listening for HTTP requests
//
// Notice we DON'T start the server in app.ts.
// That separation allows tests to import `app` without
// starting the server (no port conflicts in tests).
// ============================================================

import { app } from "./app";
import { env } from "./config/env";
import { checkDatabaseConnection, disconnectDatabase } from "./config/database";
import { log } from "./utils/logger";

// ── Start Server ─────────────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    // Step 1: Verify database is reachable before accepting traffic
    await checkDatabaseConnection();

    // Step 2: Start HTTP server
    const server = app.listen(env.port, () => {
      log.info(`🚀 Server running`, {
        port: env.port,
        environment: env.nodeEnv,
        url: `http://localhost:${env.port}`,
        health: `http://localhost:${env.port}/health`,
      });

      if (env.isDevelopment) {
        log.info("📚 API Documentation:", {
          auth: `http://localhost:${env.port}/api/auth`,
          expenses: `http://localhost:${env.port}/api/expenses`,
          categories: `http://localhost:${env.port}/api/categories`,
        });
      }
    });

    // ── Graceful Shutdown ───────────────────────────────────
    //
    // 🎓 TEACHING: What is graceful shutdown?
    //
    // When Docker stops a container (or you press Ctrl+C), it sends
    // a SIGTERM signal to the process. By default, Node.js exits immediately.
    //
    // Graceful shutdown means:
    //   1. Stop accepting NEW requests (close the server)
    //   2. Wait for IN-FLIGHT requests to complete
    //   3. Close DB connections cleanly
    //   4. THEN exit
    //
    // Without this, requests in-flight get cut off mid-execution,
    // potentially leaving the database in an inconsistent state.
    //
    // Docker waits 10 seconds (SIGTERM → SIGKILL) for graceful shutdown.
    // Our shutdown should complete well within that window.
    const gracefulShutdown = async (signal: string) => {
      log.info(`\n📭 ${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        log.info("✅ HTTP server closed");

        // Disconnect from database
        await disconnectDatabase();

        log.info("👋 Goodbye!");
        process.exit(0);
      });

      // Force exit if shutdown takes too long (8 seconds)
      setTimeout(() => {
        log.error("⚠️ Graceful shutdown timed out. Force exiting.");
        process.exit(1);
      }, 8000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Docker, Kubernetes
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));   // Ctrl+C

    // ── Handle Unhandled Promise Rejections ────────────────
    //
    // 🎓 TEACHING: Unhandled promise rejections
    //
    // If you forget to await a Promise or don't catch its error,
    // it becomes an "unhandled rejection". In Node.js 15+, this
    // crashes the process (correctly — silent failures are dangerous).
    //
    // We catch it here to log it with full context before crashing.
    process.on("unhandledRejection", (reason: unknown) => {
      log.error("💥 Unhandled Promise Rejection", reason instanceof Error ? reason : undefined, {
        reason: String(reason),
      });
      // Exit after logging — let the process manager (Docker) restart
      process.exit(1);
    });

    process.on("uncaughtException", (error: Error) => {
      log.error("💥 Uncaught Exception", error);
      process.exit(1);
    });

  } catch (error) {
    log.error("❌ Failed to start server", error instanceof Error ? error : undefined);
    await disconnectDatabase().catch(() => {}); // Best effort cleanup
    process.exit(1);
  }
}

// ── Boot ─────────────────────────────────────────────────────
startServer();
