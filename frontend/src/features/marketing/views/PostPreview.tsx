import type { Post } from '../lib/blog.types';
import { ContentRenderer, useSupabaseAssetUrl } from '../utils/contentRenderer';
import { computeReadingMinutes } from '../utils/readingTime';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface PostPreviewProps {
  post: Post;
  showMeta?: boolean;
}

export function PostPreview({ post, showMeta = true }: PostPreviewProps) {
  const heroUrl = useSupabaseAssetUrl(post.hero?.media ?? null);
  const readingMinutes = computeReadingMinutes(post.content);

  return (
    <article className="space-y-6 rounded-lg border border-border bg-background p-6 shadow-sm">
      {post.hero?.media && (
        <div className="overflow-hidden rounded-lg border border-border">
          {heroUrl ? (
            <img
              src={heroUrl}
              alt={post.hero.media.alt}
              className="h-80 w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid h-80 w-full place-items-center bg-muted">
              <span className="text-muted-foreground">Hero image unavailable</span>
            </div>
          )}
          {post.hero.media.caption && (
            <p className="px-4 py-2 text-xs text-muted-foreground">{post.hero.media.caption}</p>
          )}
        </div>
      )}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium uppercase tracking-wide">{post.category}</span>
          <span>•</span>
          <span>{readingMinutes} min read</span>
          {post.publishedAt && (
            <>
              <span>•</span>
              <span>{format(new Date(post.publishedAt * 1000), 'PPP')}</span>
            </>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
        {post.subtitle && <p className="text-lg text-muted-foreground">{post.subtitle}</p>}
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </header>

      {showMeta && (
        <section className="flex flex-wrap justify-between gap-4 rounded-md bg-muted/50 p-4 text-sm">
          <div>
            <div className="font-semibold">{post.author.name}</div>
            {post.author.title && <div className="text-muted-foreground">{post.author.title}</div>}
          </div>
          <div className="text-muted-foreground">
            Status: <span className="font-medium text-foreground">{post.status}</span>
          </div>
        </section>
      )}

      <ContentRenderer blocks={post.content} />
    </article>
  );
}
