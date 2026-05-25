'use client';

import { useEffect, useState, useRef } from 'react';
import type { SiteData, Project, HeroConfig, SiteConfig } from '@/lib/types';

// ── Styles ──────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap: { background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-mono)', minHeight: '100vh', padding: 0 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 50 },
  topbarTitle: { fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase' },
  logoutBtn: { background: 'none', border: '1px solid var(--border-strong)', color: 'var(--muted)', padding: '6px 16px', cursor: 'pointer', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const },
  layout: { display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 57px)' },
  sidebar: { borderRight: '1px solid var(--border)', padding: '24px 0', background: 'var(--surface)' },
  sideSection: { marginBottom: 8 },
  sideLabel: { fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--muted)', padding: '8px 24px 4px' },
  sideItem: (active: boolean): React.CSSProperties => ({
    display: 'block', width: '100%', textAlign: 'left' as const, background: active ? 'rgba(200,185,122,0.08)' : 'none',
    border: 'none', borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--text)' : 'var(--muted)', padding: '8px 24px', cursor: 'pointer',
    fontSize: 12, letterSpacing: '0.05em',
  }),
  main: { padding: 40 },
  panelTitle: { fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 28 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: 28, marginBottom: 20 },
  cardTitle: { fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--accent)', marginBottom: 16 },
  row: { marginBottom: 16 },
  label: { display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 },
  input: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' },
  textarea: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical' as const, minHeight: 100 },
  saveBtn: { background: 'var(--accent)', color: 'var(--bg)', border: 'none', padding: '10px 28px', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' as const, cursor: 'pointer', fontFamily: 'var(--font-mono)', marginTop: 8 },
  uploadBtn: { background: 'none', border: '1px solid var(--border-strong)', color: 'var(--accent)', padding: '6px 14px', fontSize: 11, letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'var(--font-mono)', marginLeft: 8 },
  thumbImg: { height: 60, objectFit: 'cover' as const, marginTop: 8, border: '1px solid var(--border)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  stillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 },
  stillThumb: { position: 'relative' as const, aspectRatio: '4/3', overflow: 'hidden', border: '1px solid var(--border)' },
  removeBtn: { position: 'absolute' as const, top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', width: 20, height: 20, cursor: 'pointer', fontSize: 14, lineHeight: '20px', textAlign: 'center' as const, padding: 0 },
  toast: (show: boolean): React.CSSProperties => ({ position: 'fixed', bottom: 24, right: 24, background: 'var(--accent)', color: 'var(--bg)', padding: '10px 20px', fontSize: 12, letterSpacing: '0.1em', opacity: show ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none' }),
};

// ── Login screen ────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (res.ok) onLogin();
    else setErr('Invalid password.');
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <form onSubmit={submit} style={{ width: 320 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24, color: 'var(--text)' }}>Admin</div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" style={{ ...s.input, marginBottom: 12 }} autoFocus />
        {err && <div style={{ color: '#e06c6c', fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <button type="submit" style={s.saveBtn}>Enter</button>
      </form>
    </div>
  );
}

// ── Upload helper ───────────────────────────────────────────
// In production (Vercel), we upload directly from the browser to Vercel Blob
// to bypass the 4.5 MB serverless body limit. In dev we fall back to FormData.
async function uploadFile(file: File, slug: string): Promise<string> {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
    // Client-side direct upload — file never passes through the API function
    const { upload } = await import('@vercel/blob/client');
    const prefix = slug.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40) || 'upload';
    const ext = file.name.split('.').pop() ?? 'bin';
    const pathname = `images/${prefix}/${prefix}_${Date.now()}.${ext}`;
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
    });
    return blob.url;
  }

  // Dev: send via FormData
  const fd = new FormData();
  fd.append('image', file);
  fd.append('project_slug', slug);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Upload failed');
  return json.url as string;
}

// ── Main admin app ──────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<SiteData | null>(null);
  const [panel, setPanel] = useState<'settings' | 'hero' | string>('settings');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const showToast = () => { setToast(true); setTimeout(() => setToast(false), 2500); };

  // Check auth by trying to fetch data
  useEffect(() => {
    fetch('/api/data').then(async (r) => {
      if (r.ok) { setData(await r.json()); setAuthed(true); }
      else setAuthed(false);
    });
  }, []);

  const save = async (updated: SiteData) => {
    setSaving(true);
    await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    setData(updated);
    setSaving(false);
    showToast();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthed(false);
  };

  if (authed === null) return null;
  if (!authed) return <LoginScreen onLogin={() => { setAuthed(true); fetch('/api/data').then(r => r.json()).then(setData); }} />;
  if (!data) return null;

  const activeProject = data.projects.find(p => p.slug === panel);

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <span style={s.topbarTitle}>Brandon Ruiz — Admin</span>
        <button style={s.logoutBtn} onClick={logout}>Log out</button>
      </div>

      <div style={s.layout}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sideSection}>
            <div style={s.sideLabel}>Site</div>
            <button style={s.sideItem(panel === 'settings')} onClick={() => setPanel('settings')}>Settings</button>
            <button style={s.sideItem(panel === 'hero')} onClick={() => setPanel('hero')}>Reel Banner</button>
          </div>
          <div style={s.sideSection}>
            <div style={s.sideLabel}>Projects</div>
            {data.projects.map(p => (
              <button key={p.slug} style={s.sideItem(panel === p.slug)} onClick={() => setPanel(p.slug)}>
                {p.title.length > 22 ? p.title.slice(0, 22) + '…' : p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div style={s.main}>
          {panel === 'settings' && (
            <SettingsPanel data={data} onSave={save} saving={saving} />
          )}
          {panel === 'hero' && (
            <HeroPanel hero={data.hero} onSave={(hero) => save({ ...data, hero })} saving={saving} />
          )}
          {activeProject && (
            <ProjectPanel
              key={activeProject.slug}
              project={activeProject}
              onSave={(updated) => save({ ...data, projects: data.projects.map(p => p.slug === updated.slug ? updated : p) })}
              saving={saving}
            />
          )}
        </div>
      </div>

      <div style={s.toast(toast)}>Saved ✓</div>
    </div>
  );
}

// ── Settings panel ──────────────────────────────────────────
function SettingsPanel({ data, onSave, saving }: { data: SiteData; onSave: (d: SiteData) => void; saving: boolean }) {
  const [site, setSite] = useState<SiteConfig>(data.site);
  return (
    <div>
      <div style={s.panelTitle}>Site Settings</div>
      <div style={s.card}>
        <div style={s.cardTitle}>Identity</div>
        {(['name', 'role', 'copyright'] as const).map(k => (
          <div key={k} style={s.row}>
            <label style={s.label}>{k}</label>
            <input style={s.input} value={site[k]} onChange={e => setSite({ ...site, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Social Links</div>
        {(['instagram', 'vimeo_url', 'imdb_url'] as const).map(k => (
          <div key={k} style={s.row}>
            <label style={s.label}>{k.replace('_url', '')}</label>
            <input style={s.input} value={site[k]} onChange={e => setSite({ ...site, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <button style={s.saveBtn} disabled={saving} onClick={() => onSave({ ...data, site })}>
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}

// ── Hero panel ──────────────────────────────────────────────
function HeroPanel({ hero, onSave, saving }: { hero: HeroConfig; onSave: (h: HeroConfig) => void; saving: boolean }) {
  const [h, setH] = useState<HeroConfig>(hero);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    const url = await uploadFile(file, 'hero');
    setH(prev => ({ ...prev, image: url }));
  };
  const uploadVideo = async (file: File) => {
    const url = await uploadFile(file, 'hero');
    setH(prev => ({ ...prev, hero_video: url }));
  };

  return (
    <div>
      <div style={s.panelTitle}>Reel Banner</div>
      <div style={s.card}>
        <div style={s.cardTitle}>Banner Image</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input style={{ ...s.input, flex: 1 }} value={h.image} onChange={e => setH({ ...h, image: e.target.value })} placeholder="URL or upload" />
          <button style={s.uploadBtn} onClick={() => fileRef.current?.click()}>Upload</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
        </div>
        {h.image && <img src={h.image} alt="" style={s.thumbImg} />}
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Banner Video (loop)</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input style={{ ...s.input, flex: 1 }} value={h.hero_video} onChange={e => setH({ ...h, hero_video: e.target.value })} placeholder="Leave blank to use image instead" />
          <button style={s.uploadBtn} onClick={() => videoRef.current?.click()}>Upload</button>
          <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={e => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
        </div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Text</div>
        {(['eyebrow', 'title', 'subtitle', 'cta', 'url'] as const).map(k => (
          <div key={k} style={s.row}>
            <label style={s.label}>{k}</label>
            <input style={s.input} value={h[k]} onChange={e => setH({ ...h, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <button style={s.saveBtn} disabled={saving} onClick={() => onSave(h)}>
        {saving ? 'Saving…' : 'Save Banner'}
      </button>
    </div>
  );
}

// ── Project panel ───────────────────────────────────────────
function ProjectPanel({ project, onSave, saving }: { project: Project; onSave: (p: Project) => void; saving: boolean }) {
  const [p, setP] = useState<Project>(project);
  const thumbRef = useRef<HTMLInputElement>(null);
  const stillRef = useRef<HTMLInputElement>(null);

  const uploadThumb = async (file: File) => {
    const url = await uploadFile(file, p.slug);
    setP(prev => ({ ...prev, thumbnail: url }));
  };
  const uploadStill = async (file: File) => {
    const url = await uploadFile(file, p.slug);
    setP(prev => ({ ...prev, stills: [...prev.stills, url] }));
  };
  const removeStill = (i: number) => setP(prev => ({ ...prev, stills: prev.stills.filter((_, idx) => idx !== i) }));

  const creditKeys = Object.keys(p.credits);

  return (
    <div>
      <div style={s.panelTitle}>{p.title}</div>

      <div style={s.card}>
        <div style={s.cardTitle}>Info</div>
        <div style={s.grid2}>
          <div style={s.row}>
            <label style={s.label}>Title</label>
            <input style={s.input} value={p.title} onChange={e => setP({ ...p, title: e.target.value })} />
          </div>
          <div style={s.row}>
            <label style={s.label}>Category</label>
            <input style={s.input} value={p.category} onChange={e => setP({ ...p, category: e.target.value })} />
          </div>
          <div style={s.row}>
            <label style={s.label}>Year</label>
            <input style={s.input} value={p.year} onChange={e => setP({ ...p, year: e.target.value })} />
          </div>
          <div style={s.row}>
            <label style={s.label}>Video Embed URL</label>
            <input style={s.input} value={p.video} onChange={e => setP({ ...p, video: e.target.value })} />
          </div>
        </div>
        <div style={s.row}>
          <label style={s.label}>Description</label>
          <textarea style={s.textarea} value={p.description} onChange={e => setP({ ...p, description: e.target.value })} rows={6} />
        </div>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Credits</div>
        {creditKeys.map(k => (
          <div key={k} style={{ ...s.grid2, marginBottom: 8 }}>
            <input style={s.input} defaultValue={k} onBlur={e => {
              const newKey = e.target.value;
              if (newKey === k) return;
              const entries = Object.entries(p.credits);
              const updated = Object.fromEntries(entries.map(([ck, cv]) => ck === k ? [newKey, cv] : [ck, cv]));
              setP({ ...p, credits: updated });
            }} />
            <input style={s.input} value={p.credits[k]} onChange={e => setP({ ...p, credits: { ...p.credits, [k]: e.target.value } })} />
          </div>
        ))}
        <button style={{ ...s.uploadBtn, marginLeft: 0, marginTop: 8 }} onClick={() => setP({ ...p, credits: { ...p.credits, '': '' } })}>+ Add Credit</button>
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Thumbnail</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input style={{ ...s.input, flex: 1 }} value={p.thumbnail} onChange={e => setP({ ...p, thumbnail: e.target.value })} />
          <button style={s.uploadBtn} onClick={() => thumbRef.current?.click()}>Upload</button>
          <input ref={thumbRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && uploadThumb(e.target.files[0])} />
        </div>
        {p.thumbnail && <img src={p.thumbnail} alt="" style={s.thumbImg} />}
      </div>

      <div style={s.card}>
        <div style={s.cardTitle}>Stills</div>
        <div style={s.stillsGrid}>
          {p.stills.map((src, i) => (
            <div key={i} style={s.stillThumb}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button style={s.removeBtn} onClick={() => removeStill(i)}>×</button>
            </div>
          ))}
          <div
            style={{ ...s.stillThumb, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 24 }}
            onClick={() => stillRef.current?.click()}
          >+</div>
        </div>
        <input ref={stillRef} type="file" accept="image/*" hidden multiple onChange={e => {
          if (!e.target.files) return;
          Array.from(e.target.files).forEach(f => uploadStill(f));
        }} />
      </div>

      <button style={s.saveBtn} disabled={saving} onClick={() => onSave(p)}>
        {saving ? 'Saving…' : 'Save Project'}
      </button>
    </div>
  );
}
