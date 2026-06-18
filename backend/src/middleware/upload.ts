// ============================================================
// src/middleware/upload.ts — Multer File Upload Middleware
// ============================================================
//
// 🎓 TEACHING: What is Multer?
//
// Multer is a Node.js middleware for handling `multipart/form-data`
// — the encoding type used for file uploads in HTML forms.
//
// When a user uploads a receipt image, the browser sends the file
// as binary data inside a multipart request. Express can't parse
// this by default. Multer:
//   1. Extracts the file from the multipart data
//   2. Validates size and type
//   3. Stores it in memory (as a Buffer)
//   4. Attaches it to req.file
//
// We use memoryStorage (file stays in RAM) rather than diskStorage
// because our StorageProvider handles writing to disk/cloud.
// ============================================================

import multer from "multer";
import { Request } from "express";
import { env } from "../config/env";

// ── Allowed file types for receipts ──────────────────────────
const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf", // Receipt PDFs
];

const MAX_FILE_SIZE = env.storage.maxFileSizeMb * 1024 * 1024; // Convert MB to bytes

// ── Multer Configuration ──────────────────────────────────────
const upload = multer({
  // Store files in memory (Buffer) — our StorageProvider writes them
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Max 1 file per upload
  },

  // File filter — reject non-image/PDF files before they're uploaded
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
  ) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      callback(null, true); // Accept
    } else {
      callback(
        new Error(
          `File type "${file.mimetype}" not allowed. Allowed types: JPEG, PNG, WebP, HEIC, PDF`
        )
      );
    }
  },
});

// ── Export the configured middleware ───────────────────────────
// Usage in routes: router.post("/upload", uploadReceipt, controller)
export const uploadReceipt = upload.single("receipt");
// "receipt" = the form field name the client uses for the file
