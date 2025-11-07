import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Calendar, User as UserIcon, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { fetchBlogPostById, fetchBlogPosts } from "./api/blog.client";
import type { MediaAsset, Post, HeroSettings } from "./lib/blog.types";
import { ContentRenderer, useSupabaseAssetUrl } from "./utils/contentRenderer";

const safeAuthor = (author?: Post["author"] | null) => author?.name ?? "—";

const postDateSeconds = (post?: Post | null): number | null => {
  if (!post) return null;
  return post.publishedAt ?? post.updatedAt ?? post.createdAt ?? null;
};

const fmtDate = (post?: Post | null) => {
  const seconds = postDateSeconds(post);
  if (!seconds && seconds !== 0) return "";
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

type HeroImageProps = {
  media: MediaAsset | null;
  alt: string;
  className?: string;
  imageClassName?: string;
};

const HeroImage = ({ media, alt, className = "", imageClassName = "" }: HeroImageProps) => {
  const url = useSupabaseAssetUrl(media);
  if (!media || !url) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-primary/15 to-primary/5 ${className}`} />
    );
  }
  return (
    <div className={className}>
      <img
        src={url}
        alt={alt}
        className={`w-full h-full object-cover ${imageClassName}`}
        loading="lazy"
      />
    </div>
  );
};

const HeroCaption = ({ hero }: { hero?: HeroSettings | null }) => {
  if (!hero?.media?.caption) return null;
  return (
    <p className="mt-2 text-sm text-muted-foreground text-center">{hero.media.caption}</p>
  );
};

export default function PostViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [siblings, setSiblings] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  const numericId = useMemo(() => {
    if (!id) return null;
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [one, list] = await Promise.all([
          numericId !== null ? fetchBlogPostById(numericId) : Promise.resolve(null),
          fetchBlogPosts(),
        ]);
        if (!alive) return;
        if (numericId !== null && !one) {
          throw new Error("Post not found");
        }
        setPost(one ?? null);
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
  }, [numericId]);

  const published = useMemo(
    () =>
      siblings
        .filter((p) => p.status === "Published")
        .sort((a, b) => (postDateSeconds(b) ?? 0) - (postDateSeconds(a) ?? 0)),
    [siblings]
  );

  const indexInPub = useMemo(() => {
    if (!post) return -1;
    return published.findIndex((p) => p.id === post.id);
  }, [published, post]);

  const prevPost = indexInPub > 0 ? published[indexInPub - 1] : null;
  const nextPost =
    indexInPub >= 0 && indexInPub < published.length - 1 ? published[indexInPub + 1] : null;

  const moreFromBlog = useMemo(() => {
    if (!post) return published.slice(0, 3);
    return published.filter((p) => p.id !== post.id).slice(0, 3);
  }, [published, post]);

  const heroMedia = post?.hero?.media ?? null;
  const heroBackground = useSupabaseAssetUrl(heroMedia) ?? "/banner/blogBanner.jpg";
  const readingMinutes = Math.max(1, post?.readingMinutes ?? 0);
  const viewCount = post?.metrics?.views ?? 0;

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
              url('${heroBackground}')
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
              <h1 className="text-3xl sm:text-5xl font-bold">Couldn’t load post</h1>
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
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-200">
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" /> {safeAuthor(post.author)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {fmtDate(post)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" /> {viewCount.toLocaleString()}
                  </span>
                  <span>{readingMinutes} min read</span>
                  {post.status !== "Published" && (
                    <span className="px-2 py-0.5 rounded border border-yellow-400 text-yellow-300">
                      {post.status}
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
              <article className="space-y-8 max-w-none">
                <HeroImage
                  media={heroMedia}
                  alt={post.title}
                  className="w-full h-80 rounded-2xl overflow-hidden bg-muted"
                />
                <HeroCaption hero={post.hero ?? null} />

                <div className="glass-card p-6">
                  <ContentRenderer blocks={post.content} />
                </div>

                <div className="mt-10 flex justify-between gap-4">
                  {prevPost ? (
                    <Link
                      to={`/posts/${prevPost.id}`}
                      className="glass-card p-4 flex items-center gap-2 hover-lift"
                    >
                      <ArrowLeft className="w-4 h-4" /> Previous
                    </Link>
                  ) : (
                    <span />
                  )}

                  {nextPost ? (
                    <Link
                      to={`/posts/${nextPost.id}`}
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
              <div className="glass-card p-6 text-muted-foreground">Post not found.</div>
            )}
          </div>
        </section>

        {/* More from blog */}
        {moreFromBlog.length > 0 && (
          <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold mb-8 text-foreground">More from the blog</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {moreFromBlog.map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/posts/${p.id}`}
                    className="glass-card p-6 hover-lift group"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <HeroImage
                      media={p.hero?.media ?? null}
                      alt={p.title}
                      className="w-full h-40 rounded-xl mb-4 overflow-hidden bg-muted"
                      imageClassName="group-hover:scale-105 transition-transform duration-500"
                    />
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
                    {p.excerpt && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-3 h-3" /> {safeAuthor(p.author)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {fmtDate(p)}
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
