import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  filePath: string;
}

const MarkdownRenderer = ({ filePath }: MarkdownRendererProps) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/docs/${filePath}.md`);
        
        if (!response.ok) {
          throw new Error(`Failed to load documentation: ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation');
        console.error('Error loading markdown:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
  }, [filePath]);

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Documentation</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Custom heading with anchor links
          h1: ({ children, ...props }) => (
            <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground scroll-mt-20" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-3xl font-semibold mb-4 mt-8 text-foreground scroll-mt-20 border-b border-border pb-2" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-2xl font-semibold mb-3 mt-6 text-foreground scroll-mt-20" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-xl font-semibold mb-2 mt-4 text-foreground scroll-mt-20" {...props}>
              {children}
            </h4>
          ),
          
          // Custom paragraph
          p: ({ children, ...props }) => (
            <p className="text-muted-foreground leading-7 mb-4" {...props}>
              {children}
            </p>
          ),
          
          // Custom links
          a: ({ href, children, ...props }) => {
            const isInternal = href?.startsWith('/');
            const isAnchor = href?.startsWith('#');
            
            if (isInternal || isAnchor) {
              return (
                <Link
                  to={href || '#'}
                  className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
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
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // Custom code blocks with syntax highlighting
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
            
            if (!inline && match) {
              return (
                <div className="relative group my-4">
                  <div className="absolute right-2 top-2 z-10">
                    <button
                      onClick={() => copyToClipboard(codeString, codeId)}
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy code"
                    >
                      {copiedCode === codeId ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg !mt-0"
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }
            
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Custom blockquote
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r"
              {...props}
            >
              {children}
            </blockquote>
          ),
          
          // Custom table
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-muted" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-border px-4 py-2" {...props}>
              {children}
            </td>
          ),
          
          // Custom lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-2 my-4 text-muted-foreground" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 my-4 text-muted-foreground" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="ml-4" {...props}>
              {children}
            </li>
          ),
          
          // Custom horizontal rule
          hr: ({ ...props }) => (
            <hr className="my-8 border-border" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
