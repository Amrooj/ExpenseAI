// ============================================================
// src/utils/logger.ts — Application Logger
// ============================================================
//
// 🎓 TEACHING: Why use a logger instead of console.log?
//
// console.log is fine for learning but has problems in production:
//   1. No log levels (can't filter "only show errors")
//   2. No timestamps on log messages
//   3. No structured format (hard to search in log aggregators)
//   4. Synchronous — can block the event loop under heavy load
//
// Winston gives us:
//   - Log levels: error > warn > info > debug
//   - Timestamps and structured JSON output
//   - Different formats for dev (human-readable) vs prod (JSON)
//   - Non-blocking async I/O for log writing
//
// In big companies, logs go to systems like:
//   Datadog, Splunk, AWS CloudWatch, Grafana Loki
// These systems REQUIRE structured JSON to search logs.
// ============================================================

import winston from "winston";
import { env } from "../config/env";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Development Format: Human-readable colored output ────────
// Example: 2024-01-15 10:30:45 [INFO]: Server started on port 3000
const developmentFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }), // Include stack traces for errors
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    // If there's a stack trace, include it (only for Error objects)
    const stackTrace = stack ? `\n${stack}` : "";
    // If there's extra metadata, pretty-print it
    const metadata = Object.keys(meta).length > 0
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `${ts} [${level}]: ${message}${stackTrace}${metadata}`;
  })
);

// ── Production Format: Structured JSON ───────────────────────
// Example: {"level":"info","message":"Server started","timestamp":"...","port":3000}
const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ── Create Logger Instance ────────────────────────────────────
export const logger = winston.createLogger({
  // Only log messages at this level and above
  // Development: log everything (debug and above)
  // Production: only log warnings and errors
  level: env.isDevelopment ? "debug" : "warn",

  format: env.isDevelopment ? developmentFormat : productionFormat,

  transports: [
    // Always write to stdout (Docker captures this for log aggregation)
    new winston.transports.Console(),
  ],
});

// ── Convenience methods ───────────────────────────────────────
// These make the logger easier to use throughout the codebase
export const log = {
  info: (message: string, meta?: object) => logger.info(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  error: (message: string, error?: unknown, meta?: object) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, { error, ...meta });
    }
  },
  debug: (message: string, meta?: object) => logger.debug(message, meta),
};
