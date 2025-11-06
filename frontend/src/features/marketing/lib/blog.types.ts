export interface SupabaseRef {
  bucket: string;
  path: string;
  mime?: string | null;
  size?: number | null;
}

export interface MediaAsset {
  ref: SupabaseRef;
  alt: string;
  caption?: string | null;
  credit?: string | null;
  aspectRatio?: string | null;
}

export type Tone = 'info' | 'success' | 'warning' | 'danger' | 'tip';

export interface SocialLink {
  text: string;
  url: string;
}

export interface Author {
  name: string;
  avatar: string;
  title?: string | null;
  bio?: string | null;
  links: SocialLink[];
}

export interface HeroSettings {
  media: MediaAsset;
  overlayTitle?: string | null;
  overlaySubtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  accentColor?: string | null;
}

export type ContentBlock =
  | { kind: 'Paragraph'; text: string }
  | { kind: 'Heading'; level: number; text: string; anchor?: string | null }
  | { kind: 'Quote'; text: string; attribution?: string | null }
  | { kind: 'List'; ordered: boolean; items: string[] }
  | { kind: 'Image'; asset: MediaAsset; fullWidth: boolean }
  | { kind: 'Code'; language: string; code: string }
  | { kind: 'Embed'; provider?: string | null; url: string; title?: string | null }
  | { kind: 'Callout'; tone: Tone; title: string; body: string }
  | { kind: 'Divider' };

export interface SeoMeta {
  title?: string | null;
  description?: string | null;
  keywords: string[];
  canonicalUrl?: string | null;
  ogImage?: MediaAsset | null;
  twitterCard?: string | null;
}

export type PostStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived';

export interface FeatureFlags {
  featured: boolean;
  editorsPick: boolean;
  allowComments: boolean;
  heroLayout: string;
}

export interface Metrics {
  views: number;
  likes: number;
  shares: number;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  category: string;
  tags: string[];
  author: Author;
  hero?: HeroSettings | null;
  gallery: MediaAsset[];
  content: ContentBlock[];
  seo: SeoMeta;
  readingMinutes: number;
  status: PostStatus;
  flags: FeatureFlags;
  metrics: Metrics;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number | null;
  scheduledFor?: number | null;
  related: number[];
}

export interface PostSummary {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  category: string;
  tags: string[];
  author: Author;
  hero?: HeroSettings | null;
  status: PostStatus;
  flags: FeatureFlags;
  readingMinutes: number;
  publishedAt?: number | null;
  metrics: Metrics;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePostPayload {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string;
  category: string;
  tags: string[];
  author: Author;
  hero?: HeroSettings | null;
  gallery: MediaAsset[];
  content: ContentBlock[];
  seo?: SeoMeta | null;
  status: PostStatus;
  flags?: FeatureFlags | null;
  scheduledFor?: number | null;
  related: number[];
}

export type ReplacePostPayload = CreatePostPayload;
