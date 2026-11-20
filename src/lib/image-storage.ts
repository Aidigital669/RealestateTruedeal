import fs from 'fs';
import path from 'path';

const RELATIVE_UPLOAD_DIR = path.join('public', 'uploads', 'properties');
const TARGET_DIR = path.join(process.cwd(), RELATIVE_UPLOAD_DIR);
const ANV_TARGET_DIR = path.resolve('d:/AiDigitals_Projects/AnvReality/public/uploads/properties');

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
 * If the input is a base64 data URL (e.g. data:image/jpeg;base64,...),
 * decodes and saves it as a static file in public/uploads/properties/
 * and returns the relative URL (/uploads/properties/prop_...).
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

  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!match) return trimmed;

  let ext = match[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'svg+xml') ext = 'svg';

  const base64Data = match[2];
  try {
    ensureDirectories();
    const buffer = Buffer.from(base64Data, 'base64');
    const safePropId = String(propertyId).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `prop_${safePropId}_img_${Date.now()}_${index}.${ext}`;
    const filePath = path.join(TARGET_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    // Sync to secondary workspace (AnvReality) if present
    try {
      if (fs.existsSync(path.resolve('d:/AiDigitals_Projects/AnvReality'))) {
        fs.writeFileSync(path.join(ANV_TARGET_DIR, filename), buffer);
      }
    } catch {
      // Non-fatal sync
    }

    return `/uploads/properties/${filename}`;
  } catch (err) {
    console.error('Failed to save base64 image to disk:', err);
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
