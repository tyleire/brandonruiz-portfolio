import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
];

export async function POST(request: Request): Promise<NextResponse> {
  // Dev mode (no Blob token): receive file via FormData, save to public/uploads/
  if (!process.env.VERCEL || !process.env.BLOB_READ_WRITE_TOKEN) {
    const session = await getSession();
    if (!session.admin_auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const projectSlug = (formData.get('project_slug') as string | null) ?? 'upload';

    if (!file) return NextResponse.json({ error: 'No file received.' }, { status: 400 });
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed.' }, { status: 415 });
    }

    const prefix = projectSlug.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || 'upload';
    const { writeFileSync, mkdirSync, readdirSync } = await import('fs');
    const { join } = await import('path');
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadDir, { recursive: true });

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

  // Production: client-side direct upload to Vercel Blob.
  // The browser calls upload() from @vercel/blob/client which hits this route
  // twice: once to get a signed token, once to confirm completion.
  // The file itself goes directly to Blob storage — never through this function —
  // so Vercel's 4.5 MB serverless body limit is not a factor.
  const { handleUpload } = await import('@vercel/blob/client');

  try {
    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Runs when the browser requests an upload token — session cookie present.
        const session = await getSession();
        if (!session.admin_auth) throw new Error('Not authenticated');
        return {
          allowedContentTypes: ALLOWED_MIME,
          maximumSizeInBytes: 200 * 1024 * 1024, // 200 MB
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Called by Vercel's servers after the file lands in Blob storage.
        console.log('Blob upload completed:', blob.url);
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
