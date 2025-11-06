import type {
  ContentBlock,
  CreatePostPayload,
  MediaAsset,
  Post,
  SupabaseRef,
} from './blog.types';

export const TMP_PREFIX = 'posts/tmp';

export function isTmpRef(ref: SupabaseRef): boolean {
  return ref.path.startsWith(`${TMP_PREFIX}/`);
}

export function derivePermanentPath(ref: SupabaseRef, postId: number): string {
  if (!isTmpRef(ref)) return ref.path;
  const segments = ref.path.split('/');
  // Expecting posts/tmp/<tempId>/... -> posts/<postId>/...
  const remainder = segments.slice(3).join('/');
  return remainder ? `posts/${postId}/${remainder}` : `posts/${postId}`;
}

export function withPostId(ref: SupabaseRef, postId: number): SupabaseRef {
  return { ...ref, path: derivePermanentPath(ref, postId) };
}

export function transformMediaAsset(
  asset: MediaAsset,
  transform: (ref: SupabaseRef) => SupabaseRef,
): MediaAsset {
  return { ...asset, ref: transform(asset.ref) };
}

export function transformContentBlocks(
  blocks: ContentBlock[],
  transform: (asset: MediaAsset) => MediaAsset,
): ContentBlock[] {
  return blocks.map((block) => {
    switch (block.kind) {
      case 'Image':
        return { ...block, asset: transform(block.asset) };
      case 'Callout':
      case 'Code':
      case 'Divider':
      case 'Embed':
      case 'Heading':
      case 'List':
      case 'Paragraph':
      case 'Quote':
        return block;
      default:
        return block;
    }
  });
}

export function transformPayloadMedia(
  payload: CreatePostPayload,
  transform: (asset: MediaAsset) => MediaAsset,
): CreatePostPayload {
  const hero = payload.hero ? { ...payload.hero, media: transform(payload.hero.media) } : payload.hero ?? null;
  const gallery = payload.gallery.map((item) => transform(item));
  const content = transformContentBlocks(payload.content, transform);
  const seo = payload.seo?.ogImage ? { ...payload.seo, ogImage: transform(payload.seo.ogImage) } : payload.seo ?? null;
  return {
    ...payload,
    hero,
    gallery,
    content,
    seo,
  };
}

export function collectMediaAssetsFromPayload(payload: CreatePostPayload): MediaAsset[] {
  const assets: MediaAsset[] = [];
  if (payload.hero) assets.push(payload.hero.media);
  assets.push(...payload.gallery);
  for (const block of payload.content) {
    if (block.kind === 'Image') assets.push(block.asset);
  }
  if (payload.seo?.ogImage) assets.push(payload.seo.ogImage);
  return assets;
}

export function collectMediaRefsFromPost(post: Post): SupabaseRef[] {
  const refs: SupabaseRef[] = [];
  if (post.hero) refs.push(post.hero.media.ref);
  for (const item of post.gallery) refs.push(item.ref);
  for (const block of post.content) {
    if (block.kind === 'Image') refs.push(block.asset.ref);
  }
  if (post.seo.ogImage) refs.push(post.seo.ogImage.ref);
  return refs;
}
