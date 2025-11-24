import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User as UserIcon, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Clock,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  ChevronUp,
  Twitter,
  Facebook,
  Linkedin,
  Copy
} from "lucide-react";
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
      <div className={`w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 ${className}`} />
    );
  }
  return (
    <div className={className}>
      <img
        src={url}
        alt={alt}
        className={`w-full h-full object-cover ${imageClassName}`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

const HeroCaption = ({ hero }: { hero?: HeroSettings | null }) => {
  if (!hero?.media?.caption) return null;
  return (
    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center italic">{hero.media.caption}</p>
  );
};

export default function PostViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [siblings, setSiblings] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const numericId = useMemo(() => {
    if (!id) return null;
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  const nextPost = indexInPub >= 0 && indexInPub < published.length - 1 ? published[indexInPub + 1] : null;

  const moreFromBlog = useMemo(() => {
    if (!post) return published.slice(0, 3);
    return published.filter((p) => p.id !== post.id).slice(0, 3);
  }, [published, post]);

  const heroMedia = post?.hero?.media ?? null;
  const readingMinutes = Math.max(1, post?.readingMinutes ?? 0);
  const viewCount = post?.metrics?.views ?? 0;
  const likeCount = post?.metrics?.likes ?? 0;

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || 'Check out this post';
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: url
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
    } else {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation />

      {/* Professional Article Layout */}
      <main className="pt-16">
        {loading ? (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-4xl mx-auto px-6 py-12 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Post Not Found</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        ) : post ? (
          <>
            {/* Article Header */}
            <header className="max-w-4xl mx-auto px-6 py-12">
              <div className="space-y-6">
                {/* Breadcrumb & Category */}
                <div className="flex items-center gap-3 text-sm">
                  <Link to="/blog" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Blog
                  </Link>
                  <span className="text-slate-400">/</span>
                  {post.category && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {post.category}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {post.title}
                </h1>

                {/* Subtitle */}
                {post.subtitle && (
                  <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                    {post.subtitle}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {safeAuthor(post.author).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{safeAuthor(post.author)}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{post.author?.title || 'Author'}</p>
                    </div>
                  </div>
                  
                  <Separator orientation="vertical" className="h-12" />
                  
                  <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{fmtDate(post)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{readingMinutes} min read</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>{viewCount.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    {likeCount + (isLiked ? 1 : 0)}
                  </Button>
                  
                  <Button
                    variant={isBookmarked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="gap-2"
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    Save
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleShare('twitter')}>
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare('facebook')}>
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare('copy')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Hero Image */}
            {heroMedia && (
              <section className="max-w-5xl mx-auto px-6 mb-12">
                <Card className="overflow-hidden border-0 shadow-2xl">
                  <HeroImage
                    media={heroMedia}
                    alt={post.title}
                    className="w-full h-96 md:h-[500px]"
                  />
                </Card>
                <HeroCaption hero={post.hero ?? null} />
              </section>
            )}

            {/* Article Content */}
            <article className="max-w-4xl mx-auto px-6 pb-12">
              <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-8 md:p-12">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <ContentRenderer blocks={post.content} />
                  </div>
                </CardContent>
              </Card>
            </article>

            {/* Navigation */}
            <section className="max-w-4xl mx-auto px-6 py-8">
              <div className="flex justify-between items-center">
                {prevPost ? (
                  <Link to={`/posts/${prevPost.id}`}>
                    <Card className="p-4 hover:shadow-lg transition-all duration-200 group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Previous</p>
                          <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {prevPost.title}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ) : (
                  <div />
                )}

                {nextPost ? (
                  <Link to={`/posts/${nextPost.id}`}>
                    <Card className="p-4 hover:shadow-lg transition-all duration-200 group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Next</p>
                          <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {nextPost.title}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </Card>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </section>

            {/* Related Posts */}
            {moreFromBlog.length > 0 && (
              <section className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 py-16">
                <div className="max-w-6xl mx-auto px-6">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
                    More from our blog
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {moreFromBlog.map((p, i) => (
                      <Link key={p.id} to={`/posts/${p.id}`}>
                        <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                          <HeroImage
                            media={p.hero?.media ?? null}
                            alt={p.title}
                            className="w-full h-48"
                            imageClassName="group-hover:scale-105 transition-transform duration-300"
                          />
                          <CardContent className="p-6">
                            {p.category && (
                              <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {p.category}
                              </Badge>
                            )}
                            <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                              {p.title}
                            </h3>
                            {p.excerpt && (
                              <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">{p.excerpt}</p>
                            )}
                            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                {safeAuthor(p.author)}
                              </span>
                              <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {fmtDate(p)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-12 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Post not found</h1>
            <p className="text-slate-600 dark:text-slate-400">The post you're looking for doesn't exist.</p>
          </div>
        )}
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 rounded-full w-12 h-12 shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
          size="sm"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}

      <Footer />
    </div>
  );
}
