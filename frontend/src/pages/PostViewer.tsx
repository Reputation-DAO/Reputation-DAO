// frontend/src/pages/PostViewer.tsx
// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { blogActor } from "@/components/canister/blogBackend";
import type {
  Post as BackendPost,
  Author as BackendAuthor,
  PostStatus as BackendPostStatus,
} from "@/declarations/blog_backend/blog_backend.did";
import {
  Calendar,
  User as UserIcon,
  ArrowLeft,
  ArrowRight,
  Eye,
} from "lucide-react";

// --- Markdown libs (GFM + safe sanitize) ---
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeSanitize from "rehype-sanitize";

type PostStatusLabel = "Draft" | "Published" | "Archived" | "Unknown";

// --------- ASSET HELPERS (fix missing images due to relative paths) ----------
const resolveAsset = (src?: string) => {
  if (!src) return "";
  // absolute http(s)
  if (/^https?:\/\//i.test(src)) return src;
  // ipfs
  if (src.startsWith("ipfs://")) return src.replace("ipfs://", "https://ipfs.io/ipfs/");
  // already absolute from site root
  if (src.startsWith("/")) return src;
  // normalize "./foo.png" or "images/foo.png" to "/images/foo.png"
  return `/${src.replace(/^\.?\//, "")}`;
};

const onImgError: React.ReactEventHandler<HTMLImageElement> = (e) => {
  const el = e.currentTarget;
  // Prevent infinite loop if fallback also errors
  if (el.getAttribute("data-fallback") === "1") return;
  el.setAttribute("data-fallback", "1");
  el.src =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'>
        <rect width='100%' height='100%' fill='black'/>
        <text x='50%' y='50%' fill='white' font-family='sans-serif' font-size='28' text-anchor='middle' dominant-baseline='middle'>
          image unavailable
        </text>
      </svg>`
    );
};
// ---------------------------------------------------------------------------

const statusLabel = (
  status: BackendPostStatus | string | null | undefined
): PostStatusLabel => {
  if (!status) return "Unknown";
  if (typeof status === "string") {
    return status === "Draft" || status === "Published" || status === "Archived"
      ? status
      : "Unknown";
  }
  if ("Published" in status) return "Published";
  if ("Draft" in status) return "Draft";
  if ("Archived" in status) return "Archived";
  return "Unknown";
};

const nsToMs = (value: bigint | number | null | undefined): number | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === "number")
    return Number.isFinite(value) ? Math.floor(value / 1_000_000) : null;
  try {
    return Number(value / 1_000_000n);
  } catch {
    return null;
  }
};

const fmtDate = (ms: number | null | undefined) => {
  if (!ms && ms !== 0) return "";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const safeAuthor = (author?: BackendAuthor | null) => author?.name ?? "—";

const estimateReadingTime = (text?: string) => {
  if (!text) return "—";
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
};

export default function PostViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BackendPost | null>(null);
  const [siblings, setSiblings] = useState<BackendPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  // parse route id -> bigint
  const postId = useMemo(() => {
    try {
      return id ? BigInt(id) : null;
    } catch {
      return null;
    }
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!postId) throw new Error("Invalid post id");
        const one = await blogActor.getPostById(postId);
        const found = (one && one[0]) || null;

        // fetch list for “More from blog” + prev/next
        const list = await blogActor.getPosts();
        if (!alive) return;

        setPost(found);
        setSiblings(list ?? []);
      } catch (e: any) {
        console.error(e);
        if (alive) setError(e?.message ?? "Failed to load post");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [postId]);

  const dateMs = nsToMs(post?.date);
  const isPublished = statusLabel(post?.status) === "Published";

  // Prev/Next by date among published posts
  const published = useMemo(
    () =>
      (siblings ?? [])
        .filter((p) => statusLabel(p.status) === "Published")
        .sort((a, b) => Number(b.date) - Number(a.date)),
    [siblings]
  );

  const indexInPub = useMemo(() => {
    if (!post) return -1;
    return published.findIndex(
      (p) => p.id.toString() === post.id.toString()
    );
  }, [published, post]);

  const prevPost = indexInPub > 0 ? published[indexInPub - 1] : null;
  const nextPost =
    indexInPub >= 0 && indexInPub < published.length - 1
      ? published[indexInPub + 1]
      : null;

  const moreFromBlog = useMemo(() => {
    const currentKey = post?.id?.toString();
    return published
      .filter((p) => p.id.toString() !== currentKey)
      .slice(0, 3);
  }, [published, post]);

  const heroUrl = resolveAsset(post?.image) || "/banner/blogBanner.jpg";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-16">
        {/* Hero */}
        <section
          className="relative py-24"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.35)),
              url('${heroUrl}')
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            {loading ? (
              <div className="space-y-4">
                <div className="h-8 w-40 bg-black/20 mx-auto rounded" />
                <div className="h-12 w-3/4 bg-black/30 mx-auto rounded" />
                <div className="h-4 w-1/2 bg-black/20 mx-auto rounded" />
              </div>
            ) : error ? (
              <h1 className="text-3xl sm:text-5xl font-bold">
                Couldn’t load post
              </h1>
            ) : post ? (
              <>
                {post.category && (
                  <div className="mb-3 flex justify-center">
                    <span
                      className="px-3 py-1 text-sm font-medium rounded-full"
                      style={{
                        background: "hsl(var(--primary))",
                        opacity: 0.12,
                        color: "hsl(var(--primary))",
                      }}
                    >
                      {post.category}
                    </span>
                  </div>
                )}
                <h1 className="text-4xl sm:text-6xl font-bold mb-4 drop-shadow-lg">
                  {post.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-200">
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> {safeAuthor(post.author)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {fmtDate(dateMs)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" /> {Number(post.views || 0)}
                  </span>
                  <span>{estimateReadingTime(post.content)}</span>
                  {!isPublished && (
                    <span className="px-2 py-0.5 rounded border border-yellow-400 text-yellow-300">
                      Draft
                    </span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="glass-card p-8 animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-4" />
                <div className="h-5 w-full bg-muted rounded mb-2" />
                <div className="h-5 w-5/6 bg-muted rounded mb-2" />
                <div className="h-5 w-4/6 bg-muted rounded mb-2" />
                <div className="h-64 bg-muted rounded-2xl mt-6" />
              </div>
            ) : error ? (
              <div className="glass-card p-6">
                <p className="text-destructive-foreground">Error: {error}</p>
                <button
                  onClick={() => navigate(-1)}
                  className="mt-4 px-4 py-2 rounded-lg border hover-lift"
                >
                  Go back
                </button>
              </div>
            ) : post ? (
              <article className="max-w-none">
               

                {/* --- GFM MARKDOWN RENDER --- */}
                <div className="glass-card p-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="mt-6 mb-3 text-4xl font-bold text-foreground"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="mt-8 mb-3 text-3xl font-bold text-foreground"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="mt-6 mb-2 text-2xl font-semibold text-foreground"
                          {...props}
                        />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4
                          className="mt-5 mb-2 text-xl font-semibold text-foreground"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="my-4 leading-relaxed text-muted-foreground"
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-primary underline underline-offset-4 hover:no-underline break-words"
                          target="_blank"
                          rel="noreferrer"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="my-4 list-disc list-inside text-muted-foreground space-y-1"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="my-4 list-decimal list-inside text-muted-foreground space-y-1"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="leading-relaxed" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="my-6 border-l-4 pl-4 italic text-muted-foreground"
                          style={{ borderColor: "hsl(var(--info))" }}
                          {...props}
                        />
                      ),
                      // inline vs block code
                      code: ({ inline, children, ...props }) =>
                        inline ? (
                          <code
                            className="px-1.5 py-0.5 rounded border"
                            style={{
                              background: "hsl(var(--muted))",
                              borderColor: "hsl(var(--border))",
                              color: "hsl(var(--foreground))",
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre
                            className="rounded-xl border overflow-x-auto text-sm leading-relaxed p-4 my-4"
                            style={{
                              background: "hsl(var(--muted))",
                              borderColor: "hsl(var(--border))",
                              color: "hsl(var(--muted-foreground))",
                            }}
                          >
                            <code {...props}>{children}</code>
                          </pre>
                        ),
                      // tables
                      table: ({ node, ...props }) => (
                        <div className="my-6 overflow-x-auto">
                          <table
                            className="w-full border rounded-lg"
                            style={{ borderColor: "hsl(var(--border))" }}
                            {...props}
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead
                          className="text-foreground"
                          style={{ background: "hsl(var(--muted))" }}
                          {...props}
                        />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="text-left px-3 py-2 border"
                          style={{ borderColor: "hsl(var(--border))" }}
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="align-top px-3 py-2 border text-muted-foreground"
                          style={{ borderColor: "hsl(var(--border))" }}
                          {...props}
                        />
                      ),
                      // images with optional caption via title attribute
                      img: ({ node, ...props }) => {
                        // @ts-ignore
                        const alt = props.alt || "";
                        // @ts-ignore
                        const title = props.title;
                        // @ts-ignore
                        const src = resolveAsset(props.src || "");
                        return (
                          <figure className="my-6">
                            {/* @ts-ignore */}
                            <img
                              {...props}
                              src={src}
                              className="w-full h-auto rounded-xl border"
                              style={{ borderColor: "hsl(var(--border))" }}
                              alt={alt}
                              loading="lazy"
                              onError={onImgError}
                            />
                            {title ? (
                              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                                {title}
                              </figcaption>
                            ) : null}
                          </figure>
                        );
                      },
                      hr: ({ node, ...props }) => (
                        <hr
                          className="my-8 border"
                          style={{ borderColor: "hsl(var(--border))" }}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {post.content || ""}
                  </ReactMarkdown>
                </div>

                {/* Prev / Next */}
                <div className="mt-10 flex justify-between gap-4">
                  {prevPost ? (
                    <Link
                      to={`/posts/${prevPost.id.toString()}`}
                      className="glass-card p-4 flex items-center gap-2 hover-lift"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </Link>
                  ) : (
                    <span />
                  )}

                  {nextPost ? (
                    <Link
                      to={`/posts/${nextPost.id.toString()}`}
                      className="glass-card p-4 flex items-center gap-2 hover-lift"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              </article>
            ) : (
              <div className="glass-card p-6 text-muted-foreground">
                Post not found.
              </div>
            )}
          </div>
        </section>

        {/* More from blog */}
        {moreFromBlog.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-foreground">
                More from the blog
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {moreFromBlog.map((p, i) => (
                  <Link
                    key={p.id.toString()}
                    to={`/posts/${p.id.toString()}`}
                    className="glass-card p-6 hover-lift group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-full h-40 rounded-xl mb-4 overflow-hidden bg-muted">
                      {p.image ? (
                        <img
                          src={resolveAsset(p.image)}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={onImgError}
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ background: "hsl(var(--primary))", opacity: 0.06 }}
                        />
                      )}
                    </div>
                    {p.category && (
                      <div className="mb-2">
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            background: "hsl(var(--primary))",
                            opacity: 0.12,
                            color: "hsl(var(--primary))",
                          }}
                        >
                          {p.category}
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-3 h-3" /> {safeAuthor(p.author)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {fmtDate(nsToMs(p.date))}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
