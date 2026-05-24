import Link from 'next/link';
import { getData } from '@/lib/data';

export const revalidate = 10;

export default async function HomePage() {
  const { hero, projects } = await getData();

  return (
    <>
      {/* Hero / Reel banner */}
      <section className="hero">
        {hero.hero_video ? (
          <video autoPlay muted loop playsInline>
            <source src={hero.hero_video} />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image} alt={hero.title} />
        )}
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-eyebrow">{hero.eyebrow}</p>
          <h1 className="hero-title">{hero.title}</h1>
          <p className="hero-subtitle">{hero.subtitle}</p>
          <a href={hero.url} className="hero-cta" target="_blank" rel="noopener">
            {hero.cta}
          </a>
        </div>
      </section>

      {/* Section header */}
      <div className="section-head">
        <h2>Selected Work</h2>
        <span className="section-count">{projects.length} Projects</span>
      </div>

      {/* Portfolio grid */}
      <div className="portfolio-grid">
        {projects.map((project) => {
          const href = project.external && project.url
            ? project.url
            : `/project/${project.slug}`;
          const isExternal = project.external && !!project.url;

          return (
            <a
              key={project.slug}
              href={href}
              className="portfolio-item"
              {...(isExternal ? { target: '_blank', rel: 'noopener' } : {})}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.thumbnail} alt={project.title} loading="lazy" />
              <div className="portfolio-item-overlay">
                <p className="portfolio-item-category">{project.category}</p>
                <p className="portfolio-item-title">{project.title}</p>
                {project.year && (
                  <p className="portfolio-item-year">{project.year}</p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </>
  );
}
