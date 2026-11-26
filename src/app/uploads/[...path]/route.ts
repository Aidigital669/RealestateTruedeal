import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryOne } from '@/lib/db';
import { ensureUploadedFileTable } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const rawParams = await context.params;
    const pathParts = rawParams.path || [];

    if (!Array.isArray(pathParts) || pathParts.length === 0) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Guard against directory traversal
    for (const part of pathParts) {
      if (part.includes('..') || part.includes('/') || part.includes('\\')) {
        return NextResponse.json({ error: 'Forbidden path traversal' }, { status: 403 });
      }
    }

    const relativeSubPath = path.join(...pathParts);
    const filename = pathParts[pathParts.length - 1];
    const mimeType = getMimeType(filename);

    // Primary candidates on disk (covers standard cwd and .next/standalone cwd)
    const diskCandidates = [
      path.join(process.cwd(), 'public', 'uploads', relativeSubPath),
      path.join(process.cwd(), 'uploads', relativeSubPath),
      path.join(process.cwd(), 'public', 'uploads', 'properties', filename),
      path.join(process.cwd(), 'uploads', 'properties', filename),
      path.join(process.cwd(), '..', '..', 'public', 'uploads', relativeSubPath),
      path.join(process.cwd(), '..', '..', 'public', 'uploads', 'properties', filename)
    ];

    for (const diskPath of diskCandidates) {
      try {
        if (fs.existsSync(diskPath)) {
          const stats = fs.statSync(diskPath);
          if (stats.isFile()) {
            const buffer = fs.readFileSync(diskPath);
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': mimeType,
                'Content-Length': String(buffer.length),
                'Cache-Control': 'public, max-age=31536000, immutable'
              }
            });
          }
        }
      } catch {
        // Continue to database fallback
      }
    }

    // Database fallback from UploadedFile table
    const requestUrl = `/uploads/${pathParts.join('/')}`;
    const altUrl = `/uploads/properties/${filename}`;

    try {
      await ensureUploadedFileTable();
      const record = await queryOne<{ data: string; mimeType: string; sizeBytes: number }>(
        `SELECT data, "mimeType", "sizeBytes" 
         FROM "UploadedFile" 
         WHERE url = $1 OR url = $2 OR filename = $3 
         ORDER BY id DESC LIMIT 1;`,
        [requestUrl, altUrl, filename]
      );

      if (record && record.data) {
        let cleanBase64 = record.data;
        if (cleanBase64.includes('base64,')) {
          cleanBase64 = cleanBase64.split('base64,')[1];
        }
        const buffer = Buffer.from(cleanBase64, 'base64');
        const dbMime = record.mimeType || mimeType;

        // Asynchronously restore to disk cache so subsequent reads are instant
        try {
          const primaryDiskPath = path.join(process.cwd(), 'public', 'uploads', relativeSubPath);
          const dir = path.dirname(primaryDiskPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(primaryDiskPath, buffer);
        } catch {
          // Non-fatal disk cache write
        }

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': dbMime,
            'Content-Length': String(buffer.length),
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        });
      }
    } catch (dbErr) {
      console.warn('Error reading from UploadedFile:', dbErr);
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  } catch (err: any) {
    console.error('Upload serving error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
