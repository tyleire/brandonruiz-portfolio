import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.admin_auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('image') as File | null;
  const projectSlug = (formData.get('project_slug') as string | null) ?? 'upload';

  if (!file) return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed.' }, { status: 415 });
  }

  const isVideo = file.type.startsWith('video/');
  const maxBytes = isVideo ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File too large. Max ${isVideo ? '200MB' : '20MB'}.` }, { status: 413 });
  }

  // Sanitise slug for filename prefix
  const prefix = projectSlug.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || 'upload';

  if (process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN) {
    // Production: upload to Vercel Blob
    const { put } = await import('@vercel/blob');
    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `${prefix}_${Date.now()}.${ext}`;
    const blob = await put(`images/${prefix}/${filename}`, file, { access: 'public' });
    return NextResponse.json({ url: blob.url, filename });
  } else {
    // Development: save to public/uploads/
    const { writeFileSync, mkdirSync, readdirSync } = await import('fs');
    const { join } = await import('path');

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadDir, { recursive: true });

    // Find next sequence number
    const ext = file.type === 'video/quicktime' ? 'mov'
      : file.type === 'video/mp4' ? 'mp4'
      : file.type === 'video/webm' ? 'webm'
      : file.type === 'image/png' ? 'png'
      : file.type === 'image/webp' ? 'webp'
      : file.type === 'image/gif' ? 'gif'
      : 'jpg';

    const existing = readdirSync(uploadDir).filter(f => f.startsWith(prefix + '_'));
    let maxNum = 0;
    for (const f of existing) {
      const m = f.match(/_(\d+)\./);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
    }
    const filename = `${prefix}_${String(maxNum + 1).padStart(3, '0')}.${ext}`;
    const bytes = await file.arrayBuffer();
    writeFileSync(join(uploadDir, filename), Buffer.from(bytes));

    return NextResponse.json({ url: `/uploads/${filename}`, filename });
  }
}
