import { z } from 'zod';

export const toneEnum = z.enum(['info', 'success', 'warning', 'danger', 'tip']);
export const statusEnum = z.enum(['Draft', 'Scheduled', 'Published', 'Archived']);

export const supabaseRefSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
  mime: z.string().optional().nullable(),
  size: z.number().int().nonnegative().optional().nullable(),
});

export const mediaAssetSchema = z.object({
  ref: supabaseRefSchema,
  alt: z.string().min(1),
  caption: z.string().optional().nullable(),
  credit: z.string().optional().nullable(),
  aspectRatio: z.string().optional().nullable(),
});

export const contentBlockSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('Paragraph'),
    text: z.string().min(1),
  }),
  z.object({
    kind: z.literal('Heading'),
    level: z.number().int().min(1).max(6),
    text: z.string().min(1),
    anchor: z.string().optional().nullable(),
  }),
  z.object({
    kind: z.literal('Quote'),
    text: z.string().min(1),
    attribution: z.string().optional().nullable(),
  }),
  z.object({
    kind: z.literal('List'),
    ordered: z.boolean(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    kind: z.literal('Image'),
    asset: mediaAssetSchema,
    fullWidth: z.boolean(),
  }),
  z.object({
    kind: z.literal('Code'),
    language: z.string().min(1),
    code: z.string().min(1),
  }),
  z.object({
    kind: z.literal('Embed'),
    provider: z.string().optional().nullable(),
    url: z.string().url(),
    title: z.string().optional().nullable(),
  }),
  z.object({
    kind: z.literal('Callout'),
    tone: toneEnum,
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  z.object({
    kind: z.literal('Divider'),
  }),
]);

export const authorSchema = z.object({
  name: z.string().min(1),
  avatar: z.string().url(),
  title: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  links: z.array(
    z.object({
      text: z.string().min(1),
      url: z.string().url(),
    }),
  ),
});

export const heroSchema = z
  .object({
    media: mediaAssetSchema,
    overlayTitle: z.string().optional().nullable(),
    overlaySubtitle: z.string().optional().nullable(),
    ctaLabel: z.string().optional().nullable(),
    ctaUrl: z.string().url().optional().nullable(),
    accentColor: z
      .string()
      .regex(/^#([0-9a-f]{3}){1,2}$/i, 'Use a hex color, e.g. #1a1a1a')
      .optional()
      .nullable(),
  })
  .optional()
  .nullable();

export const seoSchema = z
  .object({
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    keywords: z.array(z.string().min(1)).max(25),
    canonicalUrl: z.string().url().optional().nullable(),
    ogImage: mediaAssetSchema.optional().nullable(),
    twitterCard: z.string().optional().nullable(),
  })
  .optional()
  .nullable();

export const featureFlagsSchema = z
  .object({
    featured: z.boolean(),
    editorsPick: z.boolean(),
    allowComments: z.boolean(),
    heroLayout: z.string().min(1),
  })
  .optional()
  .nullable();

export const createPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens'),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  author: authorSchema,
  hero: heroSchema,
  gallery: z.array(mediaAssetSchema),
  content: z.array(contentBlockSchema).min(1),
  seo: seoSchema,
  status: statusEnum,
  flags: featureFlagsSchema,
  scheduledFor: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .nullable(),
  related: z.array(z.number().int().nonnegative()),
});

export type CreatePostFormValues = z.infer<typeof createPostSchema>;
