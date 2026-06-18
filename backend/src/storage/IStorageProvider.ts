// ============================================================
// src/storage/IStorageProvider.ts — Storage Adapter Interface
// ============================================================
//
// 🎓 TEACHING: Interface-Based Abstraction
//
// This interface defines the contract that ALL storage providers
// must implement: upload a file, delete a file, get a URL.
//
// The rest of the application calls IStorageProvider methods.
// It NEVER knows whether files go to local disk, S3, or Cloudinary.
//
// SWITCHING PROVIDERS:
//   1. Set STORAGE_PROVIDER=s3 in .env
//   2. Implement S3Provider (this interface)
//   3. Done. Zero changes to controllers, services, or routes.
// ============================================================

export interface UploadResult {
  url:      string;   // The URL where the file can be accessed
  filename: string;   // The stored filename (may differ from original)
  size:     number;   // File size in bytes
  mimetype: string;   // MIME type (e.g. "image/jpeg")
}

export interface IStorageProvider {
  // Upload a file and return its URL
  upload(file: Express.Multer.File): Promise<UploadResult>;

  // Delete a previously uploaded file by its URL or filename
  delete(fileUrl: string): Promise<void>;

  // Get the public-facing URL for a stored file
  getUrl(filename: string): string;
}
