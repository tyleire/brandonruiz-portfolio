import type { SiteData } from './types';

// ── Data source ──────────────────────────────────────────────
// In development: reads/writes data.json from the filesystem.
// In production (Vercel): reads from Vercel Blob if BLOB_READ_WRITE_TOKEN
// is set; otherwise falls back to the bundled data.json.
// ─────────────────────────────────────────────────────────────

const DATA_BLOB_URL = process.env.DATA_BLOB_URL; // set after first upload

export async function getData(): Promise<SiteData> {
  // Production + Blob configured → fetch from Blob
  if (process.env.VERCEL && DATA_BLOB_URL) {
    const res = await fetch(DATA_BLOB_URL, { next: { revalidate: 10 } });
    if (res.ok) return res.json() as Promise<SiteData>;
  }

  // Dev or fallback → read local file
  const { readFileSync } = await import('fs');
  const { join } = await import('path');
  const raw = readFileSync(join(process.cwd(), 'lib', 'data.json'), 'utf8');
  return JSON.parse(raw) as SiteData;
}

export async function saveData(data: SiteData): Promise<void> {
  if (process.env.VERCEL) {
    // Production: write to Vercel Blob
    const { put } = await import('@vercel/blob');
    const blob = await put('data.json', JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    // Store the URL so getData() can find it next time
    // (In practice you set DATA_BLOB_URL env var in Vercel dashboard
    //  to the URL returned here after the first save.)
    console.log('Data saved to Blob:', blob.url);
  } else {
    // Development: write to local file
    const { writeFileSync } = await import('fs');
    const { join } = await import('path');
    writeFileSync(
      join(process.cwd(), 'lib', 'data.json'),
      JSON.stringify(data, null, 2),
      'utf8'
    );
  }
}

export async function getProject(slug: string) {
  const { projects } = await getData();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getAdjacentProjects(slug: string) {
  const { projects } = await getData();
  const idx = projects.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? projects[idx - 1] : null,
    next: idx < projects.length - 1 ? projects[idx + 1] : null,
  };
}
