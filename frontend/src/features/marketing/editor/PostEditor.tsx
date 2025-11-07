import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import type { CreatePostPayload, FeatureFlags, HeroSettings, MediaAsset, Post, PostStatus } from '../lib/blog.types';
import { createPostSchema } from '../lib/validators';
import type { CreatePostFormValues } from '../lib/validators';
import {
  collectMediaAssetsFromPayload,
  isTmpRef,
  transformMediaAsset,
  transformPayloadMedia,
  withPostId,
} from '../lib/media';
import { computeReadingMinutes } from '../utils/readingTime';
import {
  createBlogPost,
  fetchBlogPostById,
  replaceBlogPost,
} from '../api/blog.client';
import { moveObject } from '../lib/supabaseClient';
import { ImagePicker } from './ImagePicker';
import { GalleryManager } from './GalleryManager';
import { ContentBlockEditor } from './ContentBlockEditor';
import { SeoPanel } from './SeoPanel';
import { FlagsPanel } from './FlagsPanel';
import { SchedulePanel } from './SchedulePanel';
import { PostPreview } from '../views/PostPreview';

interface PostEditorProps {
  initialPost?: Post;
  onComplete?: (post: Post) => void;
}

export function PostEditor({ initialPost, onComplete }: PostEditorProps) {
  const mode: 'create' | 'edit' = initialPost ? 'edit' : 'create';
  const [activeTab, setActiveTab] = useState('basics');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPost, setCurrentPost] = useState<Post | null>(initialPost ?? null);
  const [tempId] = useState(() => {
    if (mode === 'edit') return `post-${initialPost!.id}`;
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return Math.random().toString(36).slice(2);
  });

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: initialPost ? mapPostToFormValues(initialPost) : defaultFormValues(),
    mode: 'onChange',
  });
  const {
    formState: { errors },
  } = form;

  const watchAll = useWatch({ control: form.control });
  const draftPreview = useMemo(() => buildPreviewPost(watchAll, currentPost), [watchAll, currentPost]);

  useEffect(() => {
    if (initialPost) {
      const values = mapPostToFormValues(initialPost);
      form.reset(values, { keepDefaultValues: false });
      setCurrentPost(initialPost);
      setActiveTab('basics');
    } else {
      form.reset(defaultFormValues(), { keepDefaultValues: false });
      setCurrentPost(null);
      setActiveTab('basics');
    }
  }, [initialPost]);

  async function handleSubmit(values: CreatePostFormValues) {
    setSubmitting(true);
    try {
      const normalized = ensurePostDefaults(values);

      if (!normalized.slug) {
        toast({
          title: 'Missing slug',
          description: 'Add a title so we can generate a URL-friendly slug.',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      if (!normalized.excerpt) {
        toast({
          title: 'Missing excerpt',
          description: 'Add a short summary or paragraph so readers see a preview.',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      if (normalized.slug !== values.slug) {
        form.setValue('slug', normalized.slug, { shouldDirty: true });
      }
      if (normalized.excerpt !== values.excerpt) {
        form.setValue('excerpt', normalized.excerpt, { shouldDirty: true });
      }
      if (normalized.category !== values.category) {
        form.setValue('category', normalized.category, { shouldDirty: true });
      }
      if (
        normalized.tags.length !== values.tags.length ||
        normalized.tags.some((tag, idx) => tag !== values.tags[idx])
      ) {
        form.setValue('tags', normalized.tags, { shouldDirty: true });
      }

      const payload = formValuesToPayload(normalized);

      if (mode === 'create') {
        const created = await createBlogPost(payload);
        await cascadeTempAssets(created.id, payload);
        const refreshed = await fetchBlogPostById(created.id);
        const finalPost = refreshed ?? created;
        setCurrentPost(finalPost);
        form.reset(mapPostToFormValues(finalPost));
        await queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
        toast({
          title: 'Post created',
          description: 'Your draft is now stored on the canister.',
        });
        onComplete?.(finalPost);
      } else {
        const updated = await replaceBlogPost(initialPost!.id, payload);
        const finalPost = updated ?? (await fetchBlogPostById(initialPost!.id)) ?? initialPost!;
        setCurrentPost(finalPost);
        form.reset(mapPostToFormValues(finalPost));
        await queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
        toast({
          title: 'Post updated',
          description: 'Changes saved to the canister.',
        });
        onComplete?.(finalPost);
      }
      setActiveTab('preview');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleInvalid(errors: FieldErrors<CreatePostFormValues>) {
    const first = findFirstError(errors);
    toast({
      title: first?.label ?? 'Please complete the required fields',
      description: first?.message ?? 'Check slug, tags, and excerpt before publishing.',
      variant: 'destructive',
    });
  }

  async function cascadeTempAssets(postId: number, payload: CreatePostPayload) {
    const assets = collectMediaAssetsFromPayload(payload).filter((asset) => isTmpRef(asset.ref));
    if (!assets.length) return;
    await Promise.all(
      assets.map((asset) => moveObject(asset.ref.bucket, asset.ref.path, withPostId(asset.ref, postId).path)),
    );
    const patched = transformPayloadMedia(payload, (asset) =>
      isTmpRef(asset.ref) ? transformMediaAsset(asset, (ref) => withPostId(ref, postId)) : asset,
    );
    await replaceBlogPost(postId, patched);
  }

  const hero = form.watch('hero');
  const gallery = form.watch('gallery');
  const content = form.watch('content');
  const seo = form.watch('seo');
  const flags = form.watch('flags');
  const status = form.watch('status');
  const scheduledFor = form.watch('scheduledFor');
  const authorLinks = form.watch('author.links');

  function updateHeroMedia(asset: MediaAsset | null) {
    if (asset) {
      const existing = hero ?? {
        media: asset,
        overlayTitle: null,
        overlaySubtitle: null,
        ctaLabel: null,
        ctaUrl: null,
        accentColor: null,
      };
      form.setValue(
        'hero',
        { ...existing, media: asset },
        { shouldDirty: true },
      );
    } else {
      form.setValue('hero', null, { shouldDirty: true });
    }
  }

  function ensureHero(): HeroSettings {
    const current = form.getValues('hero');
    if (current) return current;
    const fallback: HeroSettings = {
      media: {
        ref: { bucket: '', path: '', mime: null, size: null },
        alt: '',
        caption: null,
        credit: null,
        aspectRatio: null,
      },
      overlayTitle: null,
      overlaySubtitle: null,
      ctaLabel: null,
      ctaUrl: null,
      accentColor: null,
    };
    form.setValue('hero', fallback, { shouldDirty: false });
    return fallback;
  }

  function updateFlags(next: FeatureFlags | null) {
    form.setValue('flags', next, { shouldDirty: true });
  }

  function updateSeo(next: CreatePostPayload['seo']) {
    form.setValue('seo', next, { shouldDirty: true });
  }

  function updateContent(next: CreatePostPayload['content']) {
    form.setValue('content', next, { shouldDirty: true, shouldValidate: true });
  }

  function updateGallery(next: MediaAsset[]) {
    form.setValue('gallery', next, { shouldDirty: true });
  }

  function updateSchedule(nextStatus: PostStatus, time: number | null) {
    form.setValue('status', nextStatus, { shouldDirty: true });
    form.setValue('scheduledFor', time, { shouldDirty: true });
  }

  function updateLinks(index: number, field: 'text' | 'url', value: string) {
    const links = [...(authorLinks ?? [])];
    links[index] = { ...links[index], [field]: value };
    form.setValue('author.links', links, { shouldDirty: true });
  }

  function addLink() {
    const links = [...(authorLinks ?? [])];
    links.push({ text: '', url: '' });
    form.setValue('author.links', links, { shouldDirty: true });
  }

  function removeLink(index: number) {
    const links = [...(authorLinks ?? [])];
    links.splice(index, 1);
    form.setValue('author.links', links, { shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="flags">Flags</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="title"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input {...field} placeholder="Inspiring headline" />
                    </div>
                  )}
                />
                <Controller
                  name="subtitle"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input {...field} placeholder="Optional supporting line" />
                    </div>
                  )}
                />
                <Controller
                  name="slug"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        {...field}
                        placeholder="my-post-slug"
                        aria-invalid={Boolean(errors.slug)}
                      />
                      {errors.slug ? (
                        <p className="text-xs text-destructive">{String(errors.slug.message)}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Used in the URL. Leave blank to auto-generate.
                        </p>
                      )}
                    </div>
                  )}
                />
                <Controller
                  name="excerpt"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Excerpt</Label>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        rows={3}
                        aria-invalid={Boolean(errors.excerpt)}
                      />
                      {errors.excerpt && (
                        <p className="text-xs text-destructive">{String(errors.excerpt.message)}</p>
                      )}
                    </div>
                  )}
                />
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input {...field} placeholder="Announcements" />
                    </div>
                  )}
                />
                <Controller
                  name="tags"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <Input
                        value={field.value.join(', ')}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value
                              .split(',')
                              .map((tag) => tag.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder="dao, governance, transparency"
                        aria-invalid={Boolean(errors.tags)}
                      />
                      {errors.tags ? (
                        <p className="text-xs text-destructive">Add at least one tag.</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Separate tags with commas to improve discovery.
                        </p>
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Author</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  name="author.name"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input {...field} placeholder="Jane Writer" />
                    </div>
                  )}
                />
                <Controller
                  name="author.title"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input {...field} placeholder="Head of Community" />
                    </div>
                  )}
                />
                <Controller
                  name="author.avatar"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Avatar URL</Label>
                      <Input
                        {...field}
                        placeholder="https://..."
                        aria-invalid={Boolean(errors.author?.avatar)}
                      />
                      {errors.author?.avatar && (
                        <p className="text-xs text-destructive">
                          {String(errors.author.avatar.message)}
                        </p>
                      )}
                    </div>
                  )}
                />
                <Controller
                  name="author.bio"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        rows={3}
                        aria-invalid={Boolean(errors.author?.bio)}
                      />
                      {errors.author?.bio && (
                        <p className="text-xs text-destructive">
                          {String(errors.author.bio.message)}
                        </p>
                      )}
                    </div>
                  )}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Social links</Label>
                    <Button variant="outline" size="sm" type="button" onClick={addLink}>
                      Add link
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(authorLinks ?? []).map((link, index) => (
                      <div key={index} className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        <Input
                          value={link.text}
                          onChange={(event) => updateLinks(index, 'text', event.target.value)}
                          placeholder="Label"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={link.url}
                            onChange={(event) => updateLinks(index, 'url', event.target.value)}
                            placeholder="https://"
                          />
                          <Button variant="ghost" size="sm" type="button" onClick={() => removeLink(index)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!(authorLinks ?? []).length && (
                      <p className="text-sm text-muted-foreground">Add social profiles to display under the author bio.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImagePicker value={hero?.media ?? null} onChange={updateHeroMedia} postId={currentPost?.id} tempId={tempId} folder="hero" />
                {hero && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Overlay title</Label>
                      <Input
                        value={hero.overlayTitle ?? ''}
                        onChange={(event) =>
                          form.setValue('hero', { ...ensureHero(), overlayTitle: event.target.value || null }, { shouldDirty: true })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Overlay subtitle</Label>
                      <Input
                        value={hero.overlaySubtitle ?? ''}
                        onChange={(event) =>
                          form.setValue('hero', { ...ensureHero(), overlaySubtitle: event.target.value || null }, { shouldDirty: true })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA label</Label>
                      <Input
                        value={hero.ctaLabel ?? ''}
                        onChange={(event) =>
                          form.setValue('hero', { ...ensureHero(), ctaLabel: event.target.value || null }, { shouldDirty: true })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA URL</Label>
                      <Input
                        value={hero.ctaUrl ?? ''}
                        onChange={(event) =>
                          form.setValue('hero', { ...ensureHero(), ctaUrl: event.target.value || null }, { shouldDirty: true })
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Accent color</Label>
                      <Input
                        value={hero.accentColor ?? ''}
                        onChange={(event) =>
                          form.setValue('hero', { ...ensureHero(), accentColor: event.target.value || null }, { shouldDirty: true })
                        }
                        placeholder="#1a1a1a"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <GalleryManager value={gallery} onChange={updateGallery} postId={currentPost?.id} tempId={tempId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <ContentBlockEditor value={content} onChange={updateContent} postId={currentPost?.id} tempId={tempId} />
          </TabsContent>

          <TabsContent value="seo">
            <SeoPanel value={seo ?? null} onChange={updateSeo} postId={currentPost?.id} tempId={tempId} />
          </TabsContent>

          <TabsContent value="flags">
            <FlagsPanel value={flags ?? null} onChange={updateFlags} />
          </TabsContent>

          <TabsContent value="schedule">
            <SchedulePanel
              status={status}
              onStatusChange={(next) => updateSchedule(next, scheduledFor ?? null)}
              scheduledFor={scheduledFor ?? null}
              onScheduledForChange={(time) => updateSchedule(status, time)}
            />
          </TabsContent>

          <TabsContent value="preview">
            <PostPreview post={draftPreview} />
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review &amp; publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{watchAll.status}</Badge>
                  <Badge variant="outline">{watchAll.tags.length} tags</Badge>
                  <Badge variant="outline">{watchAll.content.length} blocks</Badge>
                  <Badge variant="outline">{computeReadingMinutes(watchAll.content)} min read</Badge>
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  Double-check hero media, gallery items, and schedule before publishing. When you submit we will upload media to
                  Supabase (if needed) and persist the post on-chain.
                </p>
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? 'Saving…' : mode === 'create' ? 'Create post' : 'Save changes'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}

function defaultFormValues(): CreatePostFormValues {
  return {
    slug: '',
    title: '',
    subtitle: null,
    excerpt: '',
    category: '',
    tags: [],
    author: {
      name: '',
      avatar: '',
      title: null,
      bio: null,
      links: [],
    },
    hero: null,
    gallery: [],
    content: [{ kind: 'Paragraph', text: '' }],
    seo: null,
    status: 'Published',
    flags: null,
    scheduledFor: Math.floor(Date.now() / 1000),
    related: [],
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function deriveExcerpt(values: CreatePostFormValues): string {
  if (values.excerpt?.trim()) return values.excerpt.trim();
  const paragraph = values.content.find(
    (block) => block.kind === 'Paragraph' && block.text.trim().length > 0,
  );
  if (paragraph && paragraph.kind === 'Paragraph') {
    return paragraph.text.trim().slice(0, 240);
  }
  if (values.title.trim()) {
    return values.title.trim();
  }
  return '';
}

function ensurePostDefaults(values: CreatePostFormValues): CreatePostFormValues {
  const baseSlug = values.slug.trim() || values.title.trim();
  const normalizedSlug = slugify(baseSlug);
  const fallbackSlug = normalizedSlug || `post-${Date.now()}`;
  const excerpt = deriveExcerpt(values);
  const category = values.category.trim() || 'Uncategorized';
  const cleanedTags = values.tags
    .map((tag) => tag.trim())
    .filter(Boolean);
  const tags = cleanedTags.length ? cleanedTags : [fallbackSlug];
  return {
    ...values,
    slug: fallbackSlug,
    excerpt,
    category,
    tags,
  };
}

type ErrorSummary = { label: string; message: string };

function findFirstError(errors: FieldErrors<CreatePostFormValues>): ErrorSummary | null {
  const detail = findFirstErrorDetail(errors);
  if (!detail) return null;
  const pathKey = formatErrorPath(detail.path);
  const label = fieldLabels[pathKey] ?? humanizePath(pathKey);
  return { label, message: detail.message };
}

type ErrorDetail = { path: string[]; message: string };

function findFirstErrorDetail(
  errors: FieldErrors<CreatePostFormValues>,
  parentPath: string[] = []
): ErrorDetail | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    const path = [...parentPath, key];
    if (typeof value === 'object') {
      if ('message' in value && value.message) {
        return { path, message: String(value.message) };
      }
      if ('types' in value && value.types && typeof value.types === 'object') {
        const first = Object.values(value.types as Record<string, unknown>)[0];
        if (first) return { path, message: String(first) };
      }
      const nested = findFirstErrorDetail(value as FieldErrors<any>, path);
      if (nested) return nested;
    }
  }
  return null;
}

function formatErrorPath(path: string[]): string {
  return path
    .map((segment) => segment.replace(/\.\d+/g, ''))
    .join('.')
    .replace(/\.message$/, '');
}

function humanizePath(path: string): string {
  return path
    .split('.')
    .filter(Boolean)
    .map((token) => token.replace(/\[\d+\]/g, '').replace(/([A-Z])/g, ' $1'))
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

const fieldLabels: Record<string, string> = {
  title: 'Title',
  slug: 'Slug',
  excerpt: 'Excerpt',
  category: 'Category',
  tags: 'Tags',
  'author.name': 'Author name',
  'author.avatar': 'Author avatar URL',
  'author.bio': 'Author bio',
  'author.links': 'Author links',
  content: 'Content blocks',
};
function mapPostToFormValues(post: Post): CreatePostFormValues {
  return {
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle ?? null,
    excerpt: post.excerpt,
    category: post.category,
    tags: [...post.tags],
    author: {
      name: post.author.name,
      avatar: post.author.avatar,
      title: post.author.title ?? null,
      bio: post.author.bio ?? null,
      links: post.author.links.map((link) => ({ ...link })),
    },
    hero: post.hero ? { ...post.hero, media: { ...post.hero.media, ref: { ...post.hero.media.ref } } } : null,
    gallery: post.gallery.map((asset) => ({ ...asset, ref: { ...asset.ref } })),
    content: post.content.map((block) => JSON.parse(JSON.stringify(block))),
    seo: post.seo ? JSON.parse(JSON.stringify(post.seo)) : null,
    status: post.status,
    flags: post.flags ? { ...post.flags } : null,
    scheduledFor: post.scheduledFor ?? null,
    related: [...post.related],
  };
}

function formValuesToPayload(values: CreatePostFormValues): CreatePostPayload {
  return {
    slug: values.slug,
    title: values.title,
    subtitle: values.subtitle ?? null,
    excerpt: values.excerpt,
    category: values.category,
    tags: values.tags,
    author: {
      name: values.author.name,
      avatar: values.author.avatar,
      title: values.author.title ?? null,
      bio: values.author.bio ?? null,
      links: values.author.links,
    },
    hero: values.hero,
    gallery: values.gallery,
    content: values.content,
    seo: values.seo,
    status: values.status,
    flags: values.flags,
    scheduledFor: values.scheduledFor ?? null,
    related: values.related,
  };
}

function buildPreviewPost(values: CreatePostFormValues, current: Post | null): Post {
  return {
    id: current?.id ?? 0,
    slug: values.slug,
    title: values.title || 'Untitled post',
    subtitle: values.subtitle,
    excerpt: values.excerpt,
    category: values.category || 'Uncategorized',
    tags: values.tags,
    author: {
      name: values.author.name || 'Anonymous',
      avatar: values.author.avatar || '',
      title: values.author.title ?? null,
      bio: values.author.bio ?? null,
      links: values.author.links,
    },
    hero: values.hero,
    gallery: values.gallery,
    content: values.content,
    seo:
      values.seo ??
      ({
        title: null,
        description: null,
        keywords: [],
        canonicalUrl: null,
        ogImage: null,
        twitterCard: 'summary_large_image',
      } as CreatePostPayload['seo']),
    readingMinutes: computeReadingMinutes(values.content),
    status: values.status,
    flags:
      values.flags ??
      ({
        featured: false,
        editorsPick: false,
        allowComments: true,
        heroLayout: 'classic',
      } as FeatureFlags),
    metrics: current?.metrics ?? { views: 0, likes: 0, shares: 0 },
    createdAt: current?.createdAt ?? Math.floor(Date.now() / 1000),
    updatedAt: current?.updatedAt ?? Math.floor(Date.now() / 1000),
    publishedAt: current?.publishedAt ?? null,
    scheduledFor: values.scheduledFor ?? null,
    related: values.related,
  };
}
