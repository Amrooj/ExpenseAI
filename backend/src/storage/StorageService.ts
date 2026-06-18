// ============================================================
// src/storage/StorageService.ts — Storage Factory & Singleton
// ============================================================
//
// Selects the correct storage provider based on STORAGE_PROVIDER env var.
// Follows the same singleton pattern as our database config.
// ============================================================

import { IStorageProvider } from "./IStorageProvider";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { env } from "../config/env";
import { log } from "../utils/logger";

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    switch (env.storage.provider) {
      case "local":
        log.info("📦 Storage Provider: Local filesystem");
        storageInstance = new LocalStorageProvider();
        break;

      case "s3":
        // Future: import { S3StorageProvider } from "./S3StorageProvider";
        // storageInstance = new S3StorageProvider();
        log.warn("S3 provider not yet implemented. Falling back to local.");
        storageInstance = new LocalStorageProvider();
        break;

      case "cloudinary":
        // Future: import { CloudinaryStorageProvider } from "./CloudinaryStorageProvider";
        // storageInstance = new CloudinaryStorageProvider();
        log.warn("Cloudinary provider not yet implemented. Falling back to local.");
        storageInstance = new LocalStorageProvider();
        break;

      default:
        storageInstance = new LocalStorageProvider();
    }
  }
  return storageInstance;
}

// Convenience functions — used by controllers
export async function uploadFile(file: Express.Multer.File) {
  return getStorageProvider().upload(file);
}

export async function deleteFile(fileUrl: string) {
  return getStorageProvider().delete(fileUrl);
}
