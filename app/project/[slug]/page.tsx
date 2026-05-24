'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Project, SiteData } from '@/lib/types';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<SiteData | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then(setData);
  }, []);

  const project = data?.projects.find((p) => p.slug === slug);
  const projects = data?.projects ?? [];
  const idx = projects.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? projects[idx - 1] : null;
  const next = idx < projects.length - 1 ? projects[idx + 1] : null;

  const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImage = useCallback(() => {
    if (!project) return;
    setLightboxIndex((i) => (i - 1 + project.stills.length) % project.stills.length);
  }, [project]);
  const nextImage = useCallback(() => {
    if (!project) return;
    setLightboxIndex((i) => (i + 1) % project.stills.length);
  }, [project]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, prevImage, nextImage]);

  if (!data) return null;
  if (!project) return <div style={{ padding: 40, color: 'var(--muted)' }}>Project not found.</div>;

  const descParagraphs = project.description.split('\n\n').filter(Boolean);
  const creditEntries = Object.entries(project.credits ?? {});

  return (
    <>
      {/* Hero still */}
      <div className="detail-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.stills[0] ?? project.thumbnail}
          alt={project.title}
          onClick={() => openLightbox(0)}
        />
      </div>

      {/* Meta bar */}
      <div className="detail-meta">
        <h1 className="detail-title">{project.title}</h1>
        <span className="detail-badge">
          {project.category}{project.year ? ` — ${project.year}` : ''}
        </span>
      </div>

      {/* Description + credits */}
      {(descParagraphs.length > 0 || creditEntries.length > 0) && (
        <div className="detail-body">
          <div className="detail-description">
            {descParagraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {creditEntries.length > 0 && (
            <aside className="detail-credits">
              <dl>
                {creditEntries.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
        </div>
      )}

      {/* Video embed */}
      {project.video && (
        <div className="detail-video">
          <iframe
            src={project.video}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={project.title}
          />
        </div>
      )}

      {/* Stills grid */}
      {project.stills.length > 0 && (
        <>
          <div className="detail-stills-head"><h3>Stills</h3></div>
          <div className="detail-stills-grid">
            {project.stills.map((src, i) => (
              <div
                key={i}
                className="detail-still-item"
                onClick={() => openLightbox(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${project.title} still ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Prev / Next nav */}
      <nav className="detail-nav">
        {prev ? (
          <Link href={`/project/${prev.slug}`} className="detail-nav-item">
            <span className="detail-nav-label">← Previous</span>
            <span className="detail-nav-title">{prev.title}</span>
            <span className="detail-nav-category">{prev.category}</span>
          </Link>
        ) : <div />}
        {next && (
          <Link href={`/project/${next.slug}`} className="detail-nav-item next">
            <span className="detail-nav-label">Next →</span>
            <span className="detail-nav-title">{next.title}</span>
            <span className="detail-nav-category">{next.category}</span>
          </Link>
        )}
      </nav>

      {/* Lightbox */}
      <div className={`lightbox${lightboxOpen ? ' open' : ''}`} onClick={closeLightbox}>
        <button className="lightbox-close" onClick={closeLightbox}>×</button>
        <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.stills[lightboxIndex]}
          alt=""
          onClick={(e) => e.stopPropagation()}
        />
        <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
      </div>
    </>
  );
}
