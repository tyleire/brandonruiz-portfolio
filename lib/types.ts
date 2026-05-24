export interface NavLink {
  label: string;
  url: string;
}

export interface SiteConfig {
  name: string;
  role: string;
  copyright: string;
  instagram: string;
  vimeo_url: string;
  imdb_url: string;
  nav: NavLink[];
}

export interface HeroConfig {
  image: string;
  hero_video: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  url: string;
  cta: string;
}

export interface Project {
  title: string;
  slug: string;
  category: string;
  year: string;
  description: string;
  credits: Record<string, string>;
  thumbnail: string;
  stills: string[];
  video: string;
  external: boolean;
  url: string;
}

export interface SiteData {
  site: SiteConfig;
  hero: HeroConfig;
  projects: Project[];
}
