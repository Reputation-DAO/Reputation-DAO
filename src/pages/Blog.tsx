import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Calendar, User, ArrowRight, Tag } from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      title: "The Future of Decentralized Identity",
      excerpt: "Exploring how soulbound tokens and reputation systems will transform digital identity in the web3 era.",
      author: "Alex Chen", 
      date: "Dec 15, 2024",
      category: "Technology",
      readTime: "5 min read",
      featured: true
    },
    {
      title: "Building Trust in DAOs with Reputation",
      excerpt: "How reputation-based governance can solve the challenges of token-weighted voting systems.",
      author: "Sarah Williams",
      date: "Dec 10, 2024", 
      category: "Governance",
      readTime: "7 min read",
      featured: false
    },
    {
      title: "ICP Integration: Technical Deep Dive",
      excerpt: "A comprehensive look at how we built Reputation DAO on the Internet Computer Protocol.",
      author: "Mike Zhang",
      date: "Dec 5, 2024",
      category: "Development", 
      readTime: "12 min read",
      featured: false
    },
    {
      title: "Privacy and Transparency: Finding Balance",
      excerpt: "How zero-knowledge proofs enable verifiable reputation while preserving user privacy.",
      author: "Dr. Lisa Park",
      date: "Nov 28, 2024",
      category: "Privacy",
      readTime: "8 min read", 
      featured: false
    },
    {
      title: "Community Spotlight: Early Adopters", 
      excerpt: "Meet the first DAOs and protocols integrating Reputation DAO into their platforms.",
      author: "Team RepDAO",
      date: "Nov 20, 2024",
      category: "Community",
      readTime: "6 min read",
      featured: false
    },
    {
      title: "Roadmap Update: Q1 2025",
      excerpt: "What's coming next for Reputation DAO including new features, partnerships, and protocol upgrades.",
      author: "Founder Team",
      date: "Nov 15, 2024",
      category: "Updates",
      readTime: "4 min read", 
      featured: false
    }
  ];

  const categories = ["All", "Technology", "Governance", "Development", "Privacy", "Community", "Updates"];

  return (  
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-b from-primary-light/10 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Insights, updates, and deep dives into the world of decentralized reputation.
            </p>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="py-8 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 text-sm font-medium rounded-full border border-primary/20 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-foreground">Featured</h2>
            </div>
            
            {blogPosts.filter(post => post.featured).map((post) => (
              <div key={post.title} className="glass-card p-8 lg:p-12 hover-lift cursor-pointer">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                        {post.category}
                      </span>
                      <span className="text-sm text-muted-foreground">{post.readTime}</span>
                    </div>
                    
                    <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground hover:text-primary transition-colors duration-300">
                      {post.title}
                    </h3>
                    
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {post.date}
                        </div>
                      </div>
                      
                      <button className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all duration-300">
                        Read More <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-foreground">Latest Posts</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.filter(post => !post.featured).map((post, index) => (
                <article 
                  key={post.title} 
                  className="glass-card p-6 hover-lift cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-full h-48 bg-gradient-to-br from-primary/5 to-primary-glow/5 rounded-xl mb-6" />
                  
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.readTime}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    {post.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-10 text-center border border-primary/20">
              <h3 className="text-3xl font-bold mb-4 text-foreground">
                Stay in the Loop
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Get the latest blog posts, technical updates, and community news delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 glass rounded-lg border border-border/50 focus:border-primary focus:outline-none transition-colors duration-300"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary-glow text-white rounded-lg hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)] whitespace-nowrap">
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