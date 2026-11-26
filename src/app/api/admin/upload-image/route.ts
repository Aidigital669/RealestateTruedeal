import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveImageIfBase64Async, persistUploadedFile } from '@/lib/image-storage';

export const dynamic = 'force-dynamic';

const TARGET_DIR = path.join(process.cwd(), 'public', 'uploads', 'properties');
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
    // ignore
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle JSON payload with base64 data URL
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const base64Str = body.image || body.dataUrl || body.file;
      const propertyId = body.propertyId || 'admin';
      const index = body.index || 1;

      if (!base64Str) {
        return NextResponse.json({ success: false, error: 'No image data provided' }, { status: 400 });
      }

      const fileUrl = await saveImageIfBase64Async(base64Str, propertyId, index);
      return NextResponse.json({ success: true, url: fileUrl });
    }

    // Handle Multipart FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const propertyId = (formData.get('propertyId') as string) || 'admin';

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      ensureDirectories();
      const originalExt = path.extname(file.name || '').toLowerCase() || '.jpg';
      const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(originalExt) ? (originalExt === '.jpeg' ? '.jpg' : originalExt) : '.jpg';
      const safePropId = String(propertyId).replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `prop_${safePropId}_img_${Date.now()}_${Math.floor(Math.random() * 1000)}${cleanExt}`;
      const filePath = path.join(TARGET_DIR, filename);

      fs.writeFileSync(filePath, buffer);

      try {
        if (fs.existsSync(path.resolve('d:/AiDigitals_Projects/AnvReality'))) {
          fs.writeFileSync(path.join(ANV_TARGET_DIR, filename), buffer);
        }
      } catch {
        // ignore
      }

      const fileUrl = `/uploads/properties/${filename}`;
      const mimeType = file.type || (cleanExt === '.png' ? 'image/png' : cleanExt === '.webp' ? 'image/webp' : 'image/jpeg');

      // Persist to Postgres database
      await persistUploadedFile(fileUrl, filename, mimeType, buffer.toString('base64'), buffer.length);

      return NextResponse.json({ success: true, url: fileUrl });
    }

    return NextResponse.json({ success: false, error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (err: any) {
    console.error('Upload image error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Image upload failed' }, { status: 500 });
  }
}
