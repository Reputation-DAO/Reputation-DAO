import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User as UserIcon, 
  ArrowRight, 
  Clock,
  Eye,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  Grid3X3,
  List,
  BookOpen,
  Mail
} from "lucide-react";
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

const BlogPage = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const categories = useMemo(() => {
    const cats = published.map(p => p.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [published]);

  const featuredPost = useMemo(
    () => published.find((p) => p.flags?.featured),
    [published]
  );

  const filteredPosts = useMemo(() => {
    let filtered = published.filter((p) => p.id !== featuredPost?.id);
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    return filtered.sort((a, b) => {
      const aSeconds = toDateSeconds(a) ?? 0;
      const bSeconds = toDateSeconds(b) ?? 0;
      return bSeconds - aSeconds;
    });
  }, [published, featuredPost, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation />

      {/* Professional Hero Section */}
      <main className="pt-16">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-emerald-600/10"></div>
          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              Knowledge Hub
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Insights & 
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-800 via-emerald-600 to-blue-600 dark:from-purple-200 dark:via-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                Innovation
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Deep dives into decentralized reputation, blockchain technology, and the future of trust systems.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{published.length} Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Weekly Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Expert Insights</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredPost && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Featured Article</h2>
              </div>

              <Link to={`/posts/${featuredPost.id}`}>
                <Card className="group overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className="grid lg:grid-cols-2 gap-0">
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      {featuredPost.category && (
                        <Badge className="w-fit mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {featuredPost.category}
                        </Badge>
                      )}

                      <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                        {featuredPost.title}
                      </h3>

                      {featuredPost.excerpt && (
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                          {featuredPost.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{safeAuthor(featuredPost.author)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{fmtDate(featuredPost)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{featuredPost.readingMinutes || 5} min read</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all duration-300">
                          <span>Read Article</span>
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <HeroImage
                        media={featuredPost.hero?.media ?? null}
                        alt={featuredPost.title}
                        className="w-full h-64 lg:h-full"
                        imageClassName="group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </section>
        )}

        {/* Search and Filter Section */}
        <section className="py-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <select
                    value={selectedCategory || ""}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Articles Grid/List */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Latest Articles
                {filteredPosts.length > 0 && (
                  <span className="text-lg font-normal text-slate-600 dark:text-slate-400 ml-3">
                    ({filteredPosts.length})
                  </span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="animate-pulse">
                      <div className="w-full h-48 bg-slate-200 dark:bg-slate-800"></div>
                      <CardContent className="p-6">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-3"></div>
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}>
                {filteredPosts.map((post, index) => (
                  <Link key={postKey(post)} to={`/posts/${post.id}`}>
                    <Card className={`group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                      viewMode === 'list' ? 'flex flex-row' : ''
                    }`}>
                      <HeroImage
                        media={post.hero?.media ?? null}
                        alt={post.title}
                        className={viewMode === 'list' ? "w-64 h-40 flex-shrink-0" : "w-full h-48"}
                        imageClassName="group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      <CardContent className={`p-6 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                        <div>
                          {post.category && (
                            <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {post.category}
                            </Badge>
                          )}

                          <h3 className={`font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 ${
                            viewMode === 'list' ? 'text-xl' : 'text-lg'
                          }`}>
                            {post.title}
                          </h3>

                          {post.excerpt && (
                            <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-3 w-3" />
                              <span>{safeAuthor(post.author)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>{fmtDate(post)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs font-medium">Read</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No articles found</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Try adjusting your search terms or filters.
                </p>
              </Card>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Card className="p-12 border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Stay Updated</h3>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Get the latest insights on decentralized reputation and blockchain innovation delivered to your inbox.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8">
                  Subscribe
                </Button>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                Join 1,000+ readers. Unsubscribe anytime.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
