import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { ContentBlock, MediaAsset } from '../lib/blog.types';
import { PRIVATE_BUCKET, getSignedUrl, toPublicUrl } from '../lib/supabaseClient';
import { cn } from '@/lib/utils';

export function useSupabaseAssetUrl(asset: MediaAsset | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!asset) {
        setUrl(null);
        return;
      }
      if (!PRIVATE_BUCKET) {
        setUrl(toPublicUrl(asset.ref));
        return;
      }
      try {
        const signed = await getSignedUrl(asset.ref);
        if (!cancelled) setUrl(signed);
      } catch (error) {
        if (!cancelled) setUrl(null);
        console.error('Failed to fetch signed URL', error);
      }
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [asset]);

  return url;
}

function Heading({ level, children }: { level: number; children: ReactNode }) {
  const Tag = useMemo(() => {
    const clamped = Math.min(Math.max(level, 1), 6);
    return `h${clamped}` as const;
  }, [level]);
  return <Tag className="mt-8 text-foreground first:mt-0">{children}</Tag>;
}

const toneStyles: Record<string, string> = {
  info: 'border-blue-500/50 bg-blue-50 text-blue-700',
  success: 'border-green-500/50 bg-green-50 text-green-700',
  warning: 'border-amber-500/50 bg-amber-50 text-amber-700',
  danger: 'border-red-500/50 bg-red-50 text-red-700',
  tip: 'border-slate-500/50 bg-slate-50 text-slate-700',
};

interface ContentRendererProps {
  blocks: ContentBlock[];
}

export function ContentRenderer({ blocks }: ContentRendererProps) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      {blocks.map((block, idx) => (
        <Block key={idx} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case 'Paragraph':
      return <p>{block.text}</p>;
    case 'Heading':
      return <Heading level={block.level}>{block.text}</Heading>;
    case 'Quote':
      return (
        <blockquote>
          <p>{block.text}</p>
          {block.attribution && <footer className="mt-2 text-sm italic">— {block.attribution}</footer>}
        </blockquote>
      );
    case 'List':
      return block.ordered ? (
        <ol>
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case 'Image':
      return <ImageBlock asset={block.asset} fullWidth={block.fullWidth} />;
    case 'Code':
      return (
        <pre>
          <code>{block.code}</code>
        </pre>
      );
    case 'Embed':
      return (
        <div className="my-6">
          {block.title && <div className="mb-2 text-sm font-semibold">{block.title}</div>}
          <a href={block.url} target="_blank" rel="noreferrer" className="text-primary underline">
            {block.provider ?? block.url}
          </a>
        </div>
      );
    case 'Callout':
      return (
        <div className={cn('my-4 rounded-md border px-4 py-3', toneStyles[block.tone] ?? toneStyles.info)}>
          <strong className="block font-semibold">{block.title}</strong>
          <p className="mt-2 text-sm">{block.body}</p>
        </div>
      );
    case 'Divider':
      return <hr className="my-6 border-t border-muted" />;
    default:
      return null;
  }
}

function ImageBlock({ asset, fullWidth }: { asset: MediaAsset; fullWidth: boolean }) {
  const url = useSupabaseAssetUrl(asset);
  if (!asset) return null;
  return (
    <figure className={cn('my-6', fullWidth ? '-mx-6 md:-mx-12' : '')}>
      {url ? (
        <img
          src={url}
          alt={asset.alt}
          className={cn('rounded-md border border-muted object-cover', fullWidth ? 'w-full' : '')}
        />
      ) : (
        <div className="grid h-64 place-items-center rounded-md border border-dashed border-muted">
          <span className="text-sm text-muted-foreground">Preview unavailable</span>
        </div>
      )}
      {(asset.caption || asset.credit) && (
        <figcaption className="mt-2 text-xs text-muted-foreground">
          {asset.caption}
          {asset.credit && <span className="ml-2 italic">({asset.credit})</span>}
        </figcaption>
      )}
    </figure>
  );
}
