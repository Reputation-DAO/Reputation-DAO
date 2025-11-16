import type { InputHTMLAttributes, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import type { ContentBlock, MediaAsset } from '../lib/blog.types';
import { PRIVATE_BUCKET, getSignedUrl, toPublicUrl } from '../lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { PluggableList } from 'unified';

const extendedTagNames = new Set([...(defaultSchema.tagNames ?? []), 'sup', 'sub', 'kbd', 'mark']);
const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: Array.from(extendedTagNames),
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    sup: [],
    sub: [],
    kbd: ['className'],
    mark: ['className'],
  },
};

const remarkPlugins: PluggableList = [remarkGfm, remarkBreaks];
const rehypePlugins: PluggableList = [[rehypeSanitize, markdownSanitizeSchema]];

const headingTypography: Record<string, string> = {
  h1: 'text-4xl md:text-5xl font-bold leading-tight',
  h2: 'text-3xl md:text-4xl font-semibold leading-snug',
  h3: 'text-2xl font-semibold leading-snug',
  h4: 'text-xl font-semibold leading-snug',
  h5: 'text-lg font-semibold leading-snug',
  h6: 'text-base font-semibold leading-snug uppercase tracking-wide text-muted-foreground',
};

const toneStyles: Record<string, string> = {
  info: 'border-blue-500/50 bg-blue-50 text-blue-700',
  success: 'border-green-500/50 bg-green-50 text-green-700',
  warning: 'border-amber-500/50 bg-amber-50 text-amber-700',
  danger: 'border-red-500/50 bg-red-50 text-red-700',
  tip: 'border-slate-500/50 bg-slate-50 text-slate-700',
};

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

function Heading({ level, anchor, children }: { level: number; anchor?: string | null; children: ReactNode }) {
  const clamped = useMemo(() => Math.min(Math.max(level, 1), 6), [level]);
  const Tag = useMemo(() => `h${clamped}` as const, [clamped]);
  const typography = headingTypography[`h${clamped}`] ?? headingTypography.h3;

  return (
    <Tag id={anchor ?? undefined} className={cn('mt-8 text-foreground first:mt-0', typography)}>
      {children}
    </Tag>
  );
}

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
      return <MarkdownBlock text={block.text} />;
    case 'Heading':
      return (
        <Heading level={block.level} anchor={block.anchor}>
          <InlineMarkdown text={block.text} />
        </Heading>
      );
    case 'Quote':
      return (
        <blockquote className="my-6 space-y-4 border-l-4 border-slate-300/70 pl-4 text-lg italic text-slate-600 dark:text-slate-300">
          <MarkdownBlock text={block.text} className="space-y-2 text-inherit [&_p]:text-inherit" />
          {block.attribution && (
            <footer className="text-sm font-medium not-italic text-slate-500 dark:text-slate-400">
              <InlineMarkdown text={`— ${block.attribution}`} />
            </footer>
          )}
        </blockquote>
      );
    case 'List':
      return block.ordered ? (
        <ol className="my-4 list-decimal space-y-2 pl-6 text-muted-foreground">
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="my-4 list-disc space-y-2 pl-6 text-muted-foreground">
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
    case 'Image':
      return <ImageBlock asset={block.asset} fullWidth={block.fullWidth} />;
    case 'Code':
      return <StandaloneCodeBlock code={block.code} language={block.language} />;
    case 'Embed':
      return (
        <div className="my-6">
          {block.title && (
            <div className="mb-2 text-sm font-semibold">
              <InlineMarkdown text={block.title} />
            </div>
          )}
          <a href={block.url} target="_blank" rel="noreferrer" className="text-primary underline">
            {block.provider ?? block.url}
          </a>
        </div>
      );
    case 'Callout':
      return (
        <div className={cn('my-4 rounded-md border px-4 py-3', toneStyles[block.tone] ?? toneStyles.info)}>
          <strong className="block font-semibold">
            <InlineMarkdown text={block.title} />
          </strong>
          <MarkdownBlock text={block.body} className="mt-2 text-sm text-current [&_p]:text-current" />
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
          loading="lazy"
          decoding="async"
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

function MarkdownBlock({ text, className }: { text: string; className?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={cn('space-y-4', className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function InlineMarkdown({ text }: { text?: string | null }) {
  if (!text?.trim()) return null;
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      allowedElements={['a', 'strong', 'em', 'code', 'del', 'span', 'sup', 'sub', 'kbd', 'mark', 'br']}
      unwrapDisallowed
      components={inlineMarkdownComponents}
    >
      {text}
    </ReactMarkdown>
  );
}

type CodeComponentProps = {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
};

function CodeRenderer({ inline, className, children, ...props }: CodeComponentProps & Record<string, unknown>) {
  if (inline) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
        {children}
      </code>
    );
  }
  return <MarkdownCodeBlock className={className}>{children}</MarkdownCodeBlock>;
}

function MarkdownCodeBlock({ className, children }: { className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const language = /language-([\w-]+)/.exec(className ?? '')?.[1];
  const codeString = Array.isArray(children)
    ? children.join('').replace(/\n$/, '')
    : String(children ?? '').replace(/\n$/, '');

  async function handleCopy() {
    if (!codeString) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard API unavailable');
      return;
    }
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code block', error);
    }
  }

  return (
    <div className="group relative my-4">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-slate-900/70 p-2 text-slate-200 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        className="!mt-0 rounded-lg border border-slate-800/40 bg-slate-950/90 text-sm"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

function StandaloneCodeBlock({ code, language }: { code: string; language?: string }) {
  const className = language ? `language-${language}` : undefined;
  return <MarkdownCodeBlock className={className}>{code}</MarkdownCodeBlock>;
}

function MarkdownLink({ href, children, ...props }: { href?: string; children: ReactNode } & Record<string, unknown>) {
  if (!href) {
    return (
      <span className="text-primary underline underline-offset-4" {...props}>
        {children}
      </span>
    );
  }
  const isInternal = href.startsWith('/') || href.startsWith('#');
  if (isInternal) {
    return (
      <Link
        to={href}
        className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        {...props}
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      {...props}
    >
      {children}
    </a>
  );
}

function MarkdownTable({ children, ...props }: { children: ReactNode } & Record<string, unknown>) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  );
}

function MarkdownListItem({ children, className, ...props }: { children: ReactNode; className?: string } & Record<string, unknown>) {
  const isTask = typeof className === 'string' && className.includes('task-list-item');
  return (
    <li
      className={cn('ml-4 text-muted-foreground', isTask && 'ml-0 list-none', className)}
      {...props}
    >
      {isTask ? <span className="flex items-start gap-2">{children}</span> : children}
    </li>
  );
}

function MarkdownCheckbox(props: InputHTMLAttributes<HTMLInputElement>) {
  if (props.type !== 'checkbox') {
    return <input {...props} />;
  }
  const { className, ...rest } = props;
  return (
    <input
      type="checkbox"
      className={cn('mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600', className)}
      disabled
      {...rest}
    />
  );
}

const markdownComponents = {
  h1: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <h1 className={headingTypography.h1} {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <h2 className={headingTypography.h2} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <h3 className={headingTypography.h3} {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <h4 className={headingTypography.h4} {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <h5 className={headingTypography.h5} {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <h6 className={headingTypography.h6} {...props}>
      {children}
    </h6>
  ),
  p: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <p className="text-base leading-7 text-muted-foreground" {...props}>
      {children}
    </p>
  ),
  a: MarkdownLink,
  table: MarkdownTable,
  th: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <th className="border border-border px-4 py-2 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <td className="border border-border px-4 py-2 align-top" {...props}>
      {children}
    </td>
  ),
  code: CodeRenderer,
  ul: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <ul className="list-disc list-inside space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <ol className="list-decimal list-inside space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: MarkdownListItem,
  input: MarkdownCheckbox,
  blockquote: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <blockquote
      className="border-l-4 border-primary/40 bg-primary/5 px-4 py-2 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props: Record<string, unknown>) => <hr className="my-6 border-border" {...props} />,
};

const inlineMarkdownComponents = {
  a: MarkdownLink,
  p: ({ children }: { children: ReactNode }) => <>{children}</>,
  code: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
      {children}
    </code>
  ),
  br: (props: Record<string, unknown>) => <br {...props} />,
};
