// src/pages/Blog.tsx
import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Calendar, User as UserIcon, ArrowRight } from "lucide-react";
import type { MediaAsset, Post } from "./lib/blog.types";
import { fetchBlogPosts } from "./api/blog.client";
import { useSupabaseAssetUrl } from "./utils/contentRenderer";

const safeAuthor = (author?: Post["author"] | null) => author?.name ?? "—";

const postKey = (post: Post) => post.id.toString();

const toDateSeconds = (post: Post): number | null => {
  if (post.publishedAt) return post.publishedAt;
  if (post.updatedAt) return post.updatedAt;
  if (post.createdAt) return post.createdAt;
  return null;
};

const fmtDate = (post: Post) => {
  const seconds = toDateSeconds(post);
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
      <div
        className={`w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 ${className}`}
      />
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

const BlogPage = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchBlogPosts();
        if (alive) setPosts(data);
      } catch (e) {
        console.error(e);
        if (alive) setPosts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const published = useMemo(() => posts.filter((p) => p.status === "Published"), [posts]);

  const featuredPost = useMemo(
    () => published.find((p) => p.flags?.featured),
    [published]
  );

  const latest = useMemo(() => {
    const fpKey = featuredPost ? featuredPost.id : null;
    return published
      .filter((p) => p.id !== fpKey)
      .sort((a, b) => {
        const aSeconds = toDateSeconds(a) ?? 0;
        const bSeconds = toDateSeconds(b) ?? 0;
        return bSeconds - aSeconds;
      });
  }, [published, featuredPost]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-16">
        {/* HERO with background image */}
        <section
          className="relative py-24 bg-gradient-to-b from-primary/10 to-background"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(0,0,0,0.6),
                rgba(0,0,0,0.4)
              ),
              url('/banner/blogBanner.jpg')
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 drop-shadow-lg">
              Blog
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto drop-shadow">
              Insights, updates, and deep dives into the world of decentralized reputation.
            </p>
          </div>
        </section>

        {/* ✂️ Removed category buttons section */}

        {/* Featured */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-foreground">Featured</h2>
            </div>

            {loading ? (
              <div className="glass-card p-8 lg:p-12 animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-4" />
                <div className="h-10 w-3/4 bg-muted rounded mb-4" />
                <div className="h-5 w-full bg-muted rounded mb-2" />
                <div className="h-5 w-5/6 bg-muted rounded mb-6" />
                <div className="h-64 bg-muted rounded-2xl" />
              </div>
            ) : featuredPost ? (
              <div className="glass-card p-8 lg:p-12 hover-lift cursor-pointer">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    {featuredPost.category ? (
                      <div className="flex items-center gap-4 mb-4">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                          {featuredPost.category}
                        </span>
                      </div>
                    ) : null}

                    <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground hover:text-primary transition-colors duration-300">
                      {featuredPost.title}
                    </h3>

                    {featuredPost.excerpt ? (
                      <p className="text-lg text-muted-foreground mb-6 leading-relaxed line-clamp-4">
                        {featuredPost.excerpt}
                      </p>
                    ) : null}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4" />
                              {safeAuthor(featuredPost.author)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {fmtDate(featuredPost)}
                            </div>
                          </div>

                      <a
                        href={`/posts/${featuredPost.id}`}
                        className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all duration-300"
                      >
                        Read More <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <HeroImage
                    media={featuredPost.hero?.media ?? null}
                    alt={featuredPost.title}
                    className="w-full h-64 lg:h-80 rounded-2xl overflow-hidden bg-muted"
                  />
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No featured post available.</div>
            )}
          </div>
        </section>

        {/* Latest Grid */}
        <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-foreground">Latest Posts</h2>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-card p-6 animate-pulse">
                    <div className="w-full h-48 bg-muted rounded-xl mb-6" />
                    <div className="h-4 w-24 bg-muted rounded mb-3" />
                    <div className="h-6 w-3/4 bg-muted rounded mb-3" />
                    <div className="h-4 w-full bg-muted rounded mb-2" />
                    <div className="h-4 w-5/6 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latest.map((post, index) => (
                  <article
                    key={postKey(post)}
                    className="glass-card p-6 hover-lift cursor-pointer group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <a href={`/posts/${post.id}`} className="block">
                      <HeroImage
                        media={post.hero?.media ?? null}
                        alt={post.title}
                        className="w-full h-48 rounded-xl mb-6 overflow-hidden bg-muted"
                        imageClassName="group-hover:scale-105 transition-transform duration-500"
                      />

                      {post.category ? (
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                            {post.category}
                          </span>
                        </div>
                      ) : null}

                      <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {post.title}
                      </h3>

                      {post.excerpt ? (
                        <p className="text-muted-foreground mb-4 leading-relaxed text-sm line-clamp-3">
                          {post.excerpt}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-3 h-3" />
                          {safeAuthor(post.author)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(post)}
                        </div>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-10 text-center border border-primary/20">
              <h3 className="text-3xl font-bold mb-4 text-foreground">Stay in the Loop</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Get the latest blog posts, technical updates, and community news delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 glass rounded-lg border border-border/50 focus:border-primary focus:outline-none transition-colors duration-300"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary text-white rounded-lg hover:scale-105 transition-all duration-300 whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
