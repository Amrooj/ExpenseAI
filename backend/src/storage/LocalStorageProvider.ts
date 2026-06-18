// ============================================================
// src/storage/LocalStorageProvider.ts — Local File System Storage
// ============================================================
//
// Stores files on the local disk (./uploads directory).
// Used in development. In production, swap for S3 or Cloudinary.
// ============================================================

import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { IStorageProvider, UploadResult } from "./IStorageProvider";
import { env } from "../config/env";
import { log } from "../utils/logger";

export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.storage.uploadDir);
    this.ensureUploadDir();
  }

  // Create the uploads directory if it doesn't exist
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      log.info(`📁 Created upload directory: ${this.uploadDir}`);
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    // Generate a unique filename to prevent collisions
    // UUID + original extension: "a1b2c3d4-e5f6.jpg"
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    const destPath = path.join(this.uploadDir, filename);

    // Write file to disk
    await fs.writeFile(destPath, file.buffer);

    log.debug("File uploaded locally", { filename, size: file.size });

    return {
      url:      this.getUrl(filename),
      filename,
      size:     file.size,
      mimetype: file.mimetype,
    };
  }

  async delete(fileUrl: string): Promise<void> {
    // Extract filename from URL: "/uploads/abc123.jpg" → "abc123.jpg"
    const filename = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.unlink(filePath);
      log.debug("File deleted locally", { filename });
    } catch (error) {
      // Don't throw if file doesn't exist — idempotent delete
      log.warn("Failed to delete local file (may not exist)", { filename, error });
    }
  }

  getUrl(filename: string): string {
    // Return relative URL — served by express.static in app.ts
    return `/uploads/${filename}`;
  }
}
