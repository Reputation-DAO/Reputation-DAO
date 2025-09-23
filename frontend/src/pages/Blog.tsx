// src/pages/Blog.tsx
// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Calendar, User as UserIcon, ArrowRight } from "lucide-react";
import { blogActor } from "@/components/canister/blogBackend"; // unchanged

type PostStatus = "Draft" | "Published" | "Archived";
type AuthorObj = { name: string; avatar: string };

type Post = {
  id: bigint;
  status: { Draft?: null; Published?: null; Archived?: null } | PostStatus;
  title: string;
  content: string;
  views: bigint;
  date: bigint;          // ns
  author: AuthorObj;     // object
  isEditorsPick: boolean;
  isFeatured: boolean;
  category: string;
  image: string;
};

const statusString = (s: Post["status"]): PostStatus | "Unknown" => {
  if (!s) return "Unknown";
  if (typeof s === "string") return (["Draft","Published","Archived"].includes(s) ? s : "Unknown") as any;
  const k = Object.keys(s)[0] as PostStatus | undefined;
  return (k ?? "Unknown");
};

const nsToMs = (v?: bigint | number) => {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.floor(n / 1_000_000);
};

const fmtDate = (ns?: bigint | number) => {
  const ms = nsToMs(ns);
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const safeAuthor = (a?: AuthorObj) => a?.name ?? "—";
const postKey = (p: Post) => p.id?.toString() || p.title;

const Blog = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<(Post & { _status: PostStatus | "Unknown" })[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data: Post[] = await blogActor.getPosts();
        const formatted = (data ?? []).map((p) => ({ ...p, _status: statusString(p.status) }));
        if (alive) setPosts(formatted);
      } catch (e) {
        console.error(e);
        if (alive) setPosts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const published = useMemo(
    () => posts.filter((p) => p._status === "Published"),
    [posts]
  );

  const featuredPost = useMemo(
    () => published.find((p) => p.isFeatured),
    [published]
  );

  const latest = useMemo(() => {
    const fpKey = featuredPost ? postKey(featuredPost) : null;
    return published
      .filter((p) => postKey(p) !== fpKey)
      .sort((a, b) => Number(b.date) - Number(a.date));
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

                    {featuredPost.content ? (
                      <p className="text-lg text-muted-foreground mb-6 leading-relaxed line-clamp-4">
                        {featuredPost.content}
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
                          {fmtDate(featuredPost.date)}
                        </div>
                      </div>

                      <a
                        href={`/posts/${featuredPost.id?.toString() ?? ""}`}
                        className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all duration-300"
                      >
                        Read More <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="w-full h-64 lg:h-80 rounded-2xl overflow-hidden bg-muted">
                    {featuredPost.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                    )}
                  </div>
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
                    <a href={`/posts/${post.id?.toString() ?? ""}`} className="block">
                      <div className="w-full h-48 rounded-xl mb-6 overflow-hidden bg-muted">
                        {post.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/5" />
                        )}
                      </div>

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

                      {post.content ? (
                        <p className="text-muted-foreground mb-4 leading-relaxed text-sm line-clamp-3">
                          {post.content}
                        </p>
                      ) : null}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-3 h-3" />
                          {safeAuthor(post.author)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(post.date)}
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

export default Blog;
