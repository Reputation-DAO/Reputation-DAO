import type {
  ContentBlock,
  CreatePostPayload,
  FeatureFlags,
  MediaAsset,
  Metrics,
  Post,
  PostStatus,
  PostSummary,
  SeoMeta,
  SupabaseRef,
} from './blog.types';

type Opt<T> = [] | [T];

const none: Opt<never> = [];
const some = <T>(value: T): Opt<T> => [value];

function optText(value?: string | null): Opt<string> {
  return value === undefined || value === null ? none : some(value);
}

function optNumber(value?: number | null): Opt<bigint> {
  return value === undefined || value === null ? none : some(BigInt(value));
}

function fromOpt<T>(opt: Opt<T>): T | null {
  return opt.length ? opt[0] : null;
}

function toToneVariant(tone: string) {
  switch (tone) {
    case 'info':
    case 'success':
    case 'warning':
    case 'danger':
    case 'tip':
      return { [tone]: null };
    default:
      return { info: null };
  }
}

function fromToneVariant(variant: Record<string, unknown>): string {
  const key = Object.keys(variant)[0];
  if (key === 'info' || key === 'success' || key === 'warning' || key === 'danger' || key === 'tip') return key;
  return 'info';
}

function toStatusVariant(status: PostStatus) {
  return { [status]: null };
}

function fromStatusVariant(variant: Record<string, unknown>): PostStatus {
  const key = Object.keys(variant)[0];
  switch (key) {
    case 'Draft':
    case 'Scheduled':
    case 'Published':
    case 'Archived':
      return key;
    default:
      return 'Draft';
  }
}

function toCandidSupabaseRef(ref: SupabaseRef) {
  return {
    bucket: ref.bucket,
    path: ref.path,
    mime: optText(ref.mime ?? null),
    size: ref.size === undefined ? none : optNumber(ref.size ?? null),
  };
}

function fromCandidSupabaseRef(ref: {
  bucket: string;
  path: string;
  mime: Opt<string>;
  size: Opt<bigint>;
}): SupabaseRef {
  return {
    bucket: ref.bucket,
    path: ref.path,
    mime: fromOpt(ref.mime),
    size: ref.size.length ? Number(ref.size[0]) : null,
  };
}

function toCandidMediaAsset(asset: MediaAsset) {
  return {
    ref: toCandidSupabaseRef(asset.ref),
    alt: asset.alt,
    caption: optText(asset.caption ?? null),
    credit: optText(asset.credit ?? null),
    aspectRatio: optText(asset.aspectRatio ?? null),
  };
}

function fromCandidMediaAsset(asset: {
  ref: ReturnType<typeof toCandidSupabaseRef>;
  alt: string;
  caption: Opt<string>;
  credit: Opt<string>;
  aspectRatio: Opt<string>;
}): MediaAsset {
  return {
    ref: fromCandidSupabaseRef(asset.ref),
    alt: asset.alt,
    caption: fromOpt(asset.caption),
    credit: fromOpt(asset.credit),
    aspectRatio: fromOpt(asset.aspectRatio),
  };
}

function toCandidContentBlock(block: ContentBlock) {
  switch (block.kind) {
    case 'Paragraph':
      return { Paragraph: { text: block.text } };
    case 'Heading':
      return { Heading: { level: block.level, text: block.text, anchor: optText(block.anchor ?? null) } };
    case 'Quote':
      return { Quote: { text: block.text, attribution: optText(block.attribution ?? null) } };
    case 'List':
      return { List: { ordered: block.ordered, items: block.items } };
    case 'Image':
      return { Image: { asset: toCandidMediaAsset(block.asset), fullWidth: block.fullWidth } };
    case 'Code':
      return { Code: { language: block.language, code: block.code } };
    case 'Embed':
      return { Embed: { provider: optText(block.provider ?? null), url: block.url, title: optText(block.title ?? null) } };
    case 'Callout':
      return {
        Callout: {
          tone: toToneVariant(block.tone),
          title: block.title,
          body: block.body,
        },
      };
    case 'Divider':
      return { Divider: null };
    default:
      return { Paragraph: { text: '' } };
  }
}

function fromCandidContentBlock(block: any): ContentBlock {
  if ('Paragraph' in block) return { kind: 'Paragraph', text: block.Paragraph.text };
  if ('Heading' in block) {
    return {
      kind: 'Heading',
      level: block.Heading.level,
      text: block.Heading.text,
      anchor: fromOpt(block.Heading.anchor),
    };
  }
  if ('Quote' in block) {
    return {
      kind: 'Quote',
      text: block.Quote.text,
      attribution: fromOpt(block.Quote.attribution),
    };
  }
  if ('List' in block) {
    return {
      kind: 'List',
      ordered: block.List.ordered,
      items: block.List.items,
    };
  }
  if ('Image' in block) {
    return {
      kind: 'Image',
      asset: fromCandidMediaAsset(block.Image.asset),
      fullWidth: block.Image.fullWidth,
    };
  }
  if ('Code' in block) {
    return {
      kind: 'Code',
      language: block.Code.language,
      code: block.Code.code,
    };
  }
  if ('Embed' in block) {
    return {
      kind: 'Embed',
      provider: fromOpt(block.Embed.provider),
      url: block.Embed.url,
      title: fromOpt(block.Embed.title),
    };
  }
  if ('Callout' in block) {
    return {
      kind: 'Callout',
      tone: fromToneVariant(block.Callout.tone),
      title: block.Callout.title,
      body: block.Callout.body,
    };
  }
  if ('Divider' in block) {
    return { kind: 'Divider' };
  }
  return { kind: 'Paragraph', text: '' };
}

function toCandidSeo(seo: SeoMeta | null | undefined) {
  if (!seo) return none;
  return some({
    title: optText(seo.title ?? null),
    description: optText(seo.description ?? null),
    keywords: seo.keywords,
    canonicalUrl: optText(seo.canonicalUrl ?? null),
    ogImage: seo.ogImage ? some(toCandidMediaAsset(seo.ogImage)) : none,
    twitterCard: optText(seo.twitterCard ?? null),
  });
}

function fromCandidSeo(seoOpt: Opt<any>): SeoMeta {
  if (!seoOpt.length) {
    return {
      title: null,
      description: null,
      keywords: [],
      canonicalUrl: null,
      ogImage: null,
      twitterCard: null,
    };
  }
  const seo = seoOpt[0];
  return {
    title: fromOpt(seo.title),
    description: fromOpt(seo.description),
    keywords: seo.keywords,
    canonicalUrl: fromOpt(seo.canonicalUrl),
    ogImage: seo.ogImage.length ? fromCandidMediaAsset(seo.ogImage[0]) : null,
    twitterCard: fromOpt(seo.twitterCard),
  };
}

function toCandidFlags(flags: FeatureFlags | null | undefined) {
  const merged: FeatureFlags = flags ?? {
    featured: false,
    editorsPick: false,
    allowComments: true,
    heroLayout: 'classic',
  };
  return {
    featured: merged.featured,
    editorsPick: merged.editorsPick,
    allowComments: merged.allowComments,
    heroLayout: merged.heroLayout,
  };
}

function fromCandidFlags(flags: FeatureFlags): FeatureFlags {
  return { ...flags };
}

function fromCandidMetrics(metrics: { views: bigint; likes: bigint; shares: bigint }): Metrics {
  return {
    views: Number(metrics.views),
    likes: Number(metrics.likes),
    shares: Number(metrics.shares),
  };
}

function toCandidHero(hero: CreatePostPayload['hero']) {
  if (!hero) return none;
  return some({
    media: toCandidMediaAsset(hero.media),
    overlayTitle: optText(hero.overlayTitle ?? null),
    overlaySubtitle: optText(hero.overlaySubtitle ?? null),
    ctaLabel: optText(hero.ctaLabel ?? null),
    ctaUrl: optText(hero.ctaUrl ?? null),
    accentColor: optText(hero.accentColor ?? null),
  });
}

export function toCandidCreatePayload(payload: CreatePostPayload) {
  return {
    slug: payload.slug,
    title: payload.title,
    subtitle: optText(payload.subtitle ?? null),
    excerpt: payload.excerpt,
    category: payload.category,
    tags: payload.tags,
    author: {
      name: payload.author.name,
      avatar: payload.author.avatar,
      title: optText(payload.author.title ?? null),
      bio: optText(payload.author.bio ?? null),
      links: payload.author.links.map((link) => ({ text: link.text, url: link.url })),
    },
    hero: toCandidHero(payload.hero),
    gallery: payload.gallery.map(toCandidMediaAsset),
    content: payload.content.map(toCandidContentBlock),
    seo: toCandidSeo(payload.seo ?? null),
    status: toStatusVariant(payload.status),
    flags: payload.flags ? some(toCandidFlags(payload.flags)) : none,
    scheduledFor: optNumber(payload.scheduledFor ?? null),
    related: payload.related.map((id) => BigInt(id)),
  };
}

export function fromCandidPost(post: any): Post {
  return {
    id: Number(post.id),
    slug: post.slug,
    title: post.title,
    subtitle: fromOpt(post.subtitle),
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags,
    author: {
      name: post.author.name,
      avatar: post.author.avatar,
      title: fromOpt(post.author.title),
      bio: fromOpt(post.author.bio),
      links: post.author.links,
    },
    hero: post.hero.length
      ? {
          media: fromCandidMediaAsset(post.hero[0].media),
          overlayTitle: fromOpt(post.hero[0].overlayTitle),
          overlaySubtitle: fromOpt(post.hero[0].overlaySubtitle),
          ctaLabel: fromOpt(post.hero[0].ctaLabel),
          ctaUrl: fromOpt(post.hero[0].ctaUrl),
          accentColor: fromOpt(post.hero[0].accentColor),
        }
      : null,
    gallery: post.gallery.map(fromCandidMediaAsset),
    content: post.content.map(fromCandidContentBlock),
    seo: fromCandidSeo(post.seo),
    readingMinutes: Number(post.readingMinutes),
    status: fromStatusVariant(post.status),
    flags: fromCandidFlags(post.flags),
    metrics: fromCandidMetrics(post.metrics),
    createdAt: Number(post.createdAt),
    updatedAt: Number(post.updatedAt),
    publishedAt: post.publishedAt.length ? Number(post.publishedAt[0]) : null,
    scheduledFor: post.scheduledFor.length ? Number(post.scheduledFor[0]) : null,
    related: post.related.map((id: bigint) => Number(id)),
  };
}

export function fromCandidPostSummary(summary: any): PostSummary {
  return {
    id: Number(summary.id),
    slug: summary.slug,
    title: summary.title,
    subtitle: fromOpt(summary.subtitle),
    excerpt: summary.excerpt,
    category: summary.category,
    tags: summary.tags,
    author: {
      name: summary.author.name,
      avatar: summary.author.avatar,
      title: fromOpt(summary.author.title),
      bio: fromOpt(summary.author.bio),
      links: summary.author.links,
    },
    hero: summary.hero.length
      ? {
          media: fromCandidMediaAsset(summary.hero[0].media),
          overlayTitle: fromOpt(summary.hero[0].overlayTitle),
          overlaySubtitle: fromOpt(summary.hero[0].overlaySubtitle),
          ctaLabel: fromOpt(summary.hero[0].ctaLabel),
          ctaUrl: fromOpt(summary.hero[0].ctaUrl),
          accentColor: fromOpt(summary.hero[0].accentColor),
        }
      : null,
    status: fromStatusVariant(summary.status),
    flags: fromCandidFlags(summary.flags),
    readingMinutes: Number(summary.readingMinutes),
    publishedAt: summary.publishedAt.length ? Number(summary.publishedAt[0]) : null,
    metrics: fromCandidMetrics(summary.metrics),
    createdAt: Number(summary.createdAt),
    updatedAt: Number(summary.updatedAt),
  };
}

export function fromCandidSupabaseRefs(refsOpt: Opt<any>): SupabaseRef[] | null {
  if (!refsOpt.length) return null;
  return refsOpt[0].map(fromCandidSupabaseRef);
}
