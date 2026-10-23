import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 1. Handle multipart/form-data upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const category = (formData.get('category') as string) || 'proof'; // 'screenshot' | 'document'

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const originalName = file.name || 'proof_file';
      const ext = path.extname(originalName) || '';
      const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const savedFileName = `${category}_${cleanBase}_${uniqueSuffix}${ext}`;
      const fullPath = path.join(uploadsDir, savedFileName);

      fs.writeFileSync(fullPath, buffer);

      const fileSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      return NextResponse.json({
        success: true,
        url: `/uploads/${savedFileName}`,
        downloadUrl: `/uploads/${savedFileName}`,
        viewUrl: `/uploads/${savedFileName}`,
        fileName: originalName,
        savedFileName,
        fileSize,
        mimeType: file.type || 'application/octet-stream',
        category,
      });
    }

    // 2. Handle base64 JSON upload fallback
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { dataUrl, fileName, category = 'proof', mimeType } = body;

      if (!dataUrl) {
        return NextResponse.json({ success: false, error: 'No dataUrl provided' }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let detectedExt = '.png';

      if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], 'base64');
        const detectedMime = matches[1];
        if (detectedMime.includes('pdf')) detectedExt = '.pdf';
        else if (detectedMime.includes('jpeg') || detectedMime.includes('jpg')) detectedExt = '.jpg';
        else if (detectedMime.includes('webp')) detectedExt = '.webp';
        else if (detectedMime.includes('csv')) detectedExt = '.csv';
        else if (detectedMime.includes('spreadsheet') || detectedMime.includes('excel')) detectedExt = '.xlsx';
      } else {
        buffer = Buffer.from(dataUrl, 'base64');
      }

      const originalName = fileName || `file${detectedExt}`;
      const ext = path.extname(originalName) || detectedExt;
      const cleanBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const savedFileName = `${category}_${cleanBase}_${uniqueSuffix}${ext}`;
      const fullPath = path.join(uploadsDir, savedFileName);

      fs.writeFileSync(fullPath, buffer);

      const fileSize = buffer.length > 1024 * 1024 
        ? `${(buffer.length / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.max(1, Math.round(buffer.length / 1024))} KB`;

      return NextResponse.json({
        success: true,
        url: `/uploads/${savedFileName}`,
        downloadUrl: `/uploads/${savedFileName}`,
        viewUrl: `/uploads/${savedFileName}`,
        fileName: originalName,
        savedFileName,
        fileSize,
        mimeType: mimeType || 'application/octet-stream',
        category,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (error: any) {
    console.error('[Upload API Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'File upload failed' }, { status: 500 });
  }
}
