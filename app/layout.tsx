import type { Metadata } from 'next';
import Link from 'next/link';
import { getData } from '@/lib/data';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getData();
  return {
    title: `${site.name} — ${site.role}`,
    description: `Portfolio of ${site.name}, ${site.role}`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site } = await getData();
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Filmstrip scroll progress */}
        <div className="filmstrip">
          <div className="filmstrip-fill" id="filmstrip-fill" />
        </div>

        {/* Header */}
        <header className="header">
          <Link href="/" className="logo">
            <span className="logo-name">{site.name}</span>
            <span className="logo-role">{site.role}</span>
          </Link>
          <nav className="nav">
            {site.nav.map((link, i) => (
              <>
                {i > 0 && <div key={`sep-${i}`} className="nav-sep" />}
                <NavLink key={link.url} href={`/${link.url.replace('index.php', '').replace('.php', '')}`} label={link.label} />
              </>
            ))}
          </nav>
        </header>

        {children}

        {/* Footer */}
        <footer className="footer">
          <p className="footer-copy">© {year} {site.copyright}</p>
          <div className="footer-social">
            {site.instagram && (
              <a href={site.instagram} target="_blank" rel="noopener">Instagram</a>
            )}
            {site.vimeo_url && (
              <a href={site.vimeo_url} target="_blank" rel="noopener">Vimeo</a>
            )}
            {site.imdb_url && (
              <a href={site.imdb_url} target="_blank" rel="noopener">IMDb</a>
            )}
          </div>
        </footer>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              const fill = document.getElementById('filmstrip-fill');
              function updateFilmstrip() {
                const scrolled = window.scrollY;
                const total = document.documentElement.scrollHeight - window.innerHeight;
                fill.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
              }
              window.addEventListener('scroll', updateFilmstrip, { passive: true });
            `,
          }}
        />
      </body>
    </html>
  );
}

// Active-link aware nav link (server component friendly via suppressHydrationWarning)
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="nav-link">
      {label}
    </Link>
  );
}
