import { getData } from '@/lib/data';
import { existsSync } from 'fs';
import { join } from 'path';

export const revalidate = 60;

export default async function ContactPage() {
  const { site } = await getData();

  // Check if the bio photo exists in public/
  const photoExists = existsSync(join(process.cwd(), 'public', 'uploads', 'brandon_ruiz_imdb.jpg'));
  const photoSrc = photoExists ? '/uploads/brandon_ruiz_imdb.jpg' : null;

  return (
    <div className="contact-wrap">
      <div className="contact-grid">
        {/* Left: bio */}
        <div>
          {photoSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt="Brandon Ruiz" className="contact-photo" />
          )}
          <div className="contact-bio">
            <p>
              Brandon Ruiz is a Los Angeles-based Director of Photography with over a decade of
              experience shooting feature films, music videos, and commercials. Known for a
              deeply cinematic eye and a collaborative spirit, Brandon has lensed projects
              across genres — from gritty action thrillers to intimate character dramas.
            </p>
            <p>
              He has shot on virtually every major cinema camera platform and brings a
              meticulous yet instinctive approach to lighting and composition on every project.
            </p>
          </div>
        </div>

        {/* Right: links */}
        <div className="contact-links">
          <a href="mailto:hello@brandonruiz.com" className="contact-link">
            <span className="contact-link-label">Email</span>
            <span className="contact-link-value">hello@brandonruiz.com</span>
          </a>
          {site.instagram && (
            <a href={site.instagram} target="_blank" rel="noopener" className="contact-link">
              <span className="contact-link-label">Instagram</span>
              <span className="contact-link-value">@brandonruizdp</span>
            </a>
          )}
          {site.imdb_url && (
            <a href={site.imdb_url} target="_blank" rel="noopener" className="contact-link">
              <span className="contact-link-label">IMDb</span>
              <span className="contact-link-value">Brandon Ruiz</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
