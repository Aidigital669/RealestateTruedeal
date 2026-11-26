import fs from 'fs';
import path from 'path';
import { query } from './db';

const RELATIVE_UPLOAD_DIR = path.join('public', 'uploads', 'properties');
const TARGET_DIR = path.join(process.cwd(), RELATIVE_UPLOAD_DIR);
const ANV_TARGET_DIR = path.resolve('d:/AiDigitals_Projects/AnvReality/public/uploads/properties');

let tableEnsuredPromise: Promise<void> | null = null;

/**
 * Ensures the UploadedFile table exists in PostgreSQL (runs once per process).
 */
export async function ensureUploadedFileTable(): Promise<void> {
  if (!tableEnsuredPromise) {
    tableEnsuredPromise = query(`
      CREATE TABLE IF NOT EXISTS "UploadedFile" (
        id SERIAL PRIMARY KEY,
        url TEXT UNIQUE NOT NULL,
        filename TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        data TEXT NOT NULL,
        "sizeBytes" INT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_uploaded_file_url" ON "UploadedFile"(url);
      CREATE INDEX IF NOT EXISTS "idx_uploaded_file_filename" ON "UploadedFile"(filename);
    `)
      .then(() => undefined)
      .catch((err) => {
        tableEnsuredPromise = null;
        console.warn('Could not ensure UploadedFile table:', err);
      });
  }
  return tableEnsuredPromise;
}

function ensureDirectories() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }
  try {
    if (fs.existsSync(path.resolve('d:/AiDigitals_Projects/AnvReality')) && !fs.existsSync(ANV_TARGET_DIR)) {
      fs.mkdirSync(ANV_TARGET_DIR, { recursive: true });
    }
  } catch {
    // Ignore cross-drive access if not available
  }
}

/**
 * Persist an uploaded file buffer / base64 into the PostgreSQL database UploadedFile table.
 */
export async function persistUploadedFile(
  url: string,
  filename: string,
  mimeType: string,
  base64Data: string,
  sizeBytes: number
) {
  try {
    await ensureUploadedFileTable();
    await query(
      `INSERT INTO "UploadedFile" (url, filename, "mimeType", data, "sizeBytes", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (url) DO UPDATE 
       SET data = EXCLUDED.data, "sizeBytes" = EXCLUDED."sizeBytes", "updatedAt" = NOW();`,
      [url, filename, mimeType, base64Data, sizeBytes]
    );
  } catch (err) {
    console.warn('Could not persist file to UploadedFile table:', err);
  }
}

function writeBase64ImageToDisk(
  trimmed: string,
  propertyId: string | number = 'temp',
  index: number = 0
): { fileUrl: string; filename: string; mimeType: string; base64Data: string; sizeBytes: number } | null {
  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!match) return null;

  let ext = match[1].toLowerCase();
  let mimeType = `image/${ext}`;
  if (ext === 'jpeg') {
    ext = 'jpg';
    mimeType = 'image/jpeg';
  } else if (ext === 'svg+xml') {
    ext = 'svg';
    mimeType = 'image/svg+xml';
  }

  const base64Data = match[2];
  ensureDirectories();
  const buffer = Buffer.from(base64Data, 'base64');
  const safePropId = String(propertyId).replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `prop_${safePropId}_img_${Date.now()}_${index}.${ext}`;
  const filePath = path.join(TARGET_DIR, filename);

  fs.writeFileSync(filePath, buffer);

  try {
    if (fs.existsSync(path.resolve('d:/AiDigitals_Projects/AnvReality'))) {
      fs.writeFileSync(path.join(ANV_TARGET_DIR, filename), buffer);
    }
  } catch {
    // Non-fatal sync
  }

  return {
    fileUrl: `/uploads/properties/${filename}`,
    filename,
    mimeType,
    base64Data,
    sizeBytes: buffer.length
  };
}

/**
 * If the input is a base64 data URL (e.g. data:image/jpeg;base64,...),
 * decodes and saves it as a static file in public/uploads/properties/
 * and persists it to PostgreSQL, returning the relative URL (/uploads/properties/prop_...).
 * If already a normal URL or path, returns it unchanged.
 */
export function saveImageIfBase64(
  urlOrBase64: string,
  propertyId: string | number = 'temp',
  index: number = 0
): string {
  if (!urlOrBase64 || typeof urlOrBase64 !== 'string') return '';
  const trimmed = urlOrBase64.trim();
  if (!trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  try {
    const written = writeBase64ImageToDisk(trimmed, propertyId, index);
    if (!written) return trimmed;
    persistUploadedFile(written.fileUrl, written.filename, written.mimeType, written.base64Data, written.sizeBytes).catch(() => {});
    return written.fileUrl;
  } catch (err) {
    console.error('Failed to save base64 image to disk:', err);
    return trimmed;
  }
}

/**
 * Async variant that awaits PostgreSQL persistence before returning.
 */
export async function saveImageIfBase64Async(
  urlOrBase64: string,
  propertyId: string | number = 'temp',
  index: number = 0
): Promise<string> {
  if (!urlOrBase64 || typeof urlOrBase64 !== 'string') return '';
  const trimmed = urlOrBase64.trim();
  if (!trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  try {
    const written = writeBase64ImageToDisk(trimmed, propertyId, index);
    if (!written) return trimmed;
    await persistUploadedFile(written.fileUrl, written.filename, written.mimeType, written.base64Data, written.sizeBytes);
    return written.fileUrl;
  } catch (err) {
    console.error('Failed to save base64 image:', err);
    return trimmed;
  }
}

/**
 * Batch processes an array of image URLs/base64 strings.
 */
export function processImageList(
  images: (string | null | undefined)[],
  propertyId: string | number = 'temp'
): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .map((url, idx) => saveImageIfBase64(url, propertyId, idx + 1));
}

/**
 * Async batch processor ensuring DB persistence completes.
 */
export async function processImageListAsync(
  images: (string | null | undefined)[],
  propertyId: string | number = 'temp'
): Promise<string[]> {
  if (!Array.isArray(images)) return [];
  const valid = images.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  return Promise.all(valid.map((url, idx) => saveImageIfBase64Async(url, propertyId, idx + 1)));
}
