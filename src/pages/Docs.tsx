import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { Book, Code, Zap, Database, Shield, Users } from "lucide-react";

const Docs = () => {
  const docSections = [
    {
      title: "Getting Started",
      description: "Learn the basics of Reputation DAO and how to get started building with our protocol.",
      icon: Book,
      items: [
        "Introduction to Reputation DAO",
        "Quick Start Guide",
        "Core Concepts",
        "Installation & Setup"
      ]
    },
    {
      title: "API Reference",
      description: "Complete API documentation with examples and integration guides.",
      icon: Code,
      items: [
        "REST API",
        "GraphQL API", 
        "WebSocket Events",
        "Authentication"
      ]
    },
    {
      title: "Smart Contracts",
      description: "Learn how to interact with our smart contracts and build custom integrations.",
      icon: Zap,
      items: [
        "Contract Architecture",
        "Deployment Guide",
        "Function Reference",
        "Event Handling"
      ]
    },
    {
      title: "SDKs & Libraries",
      description: "Official SDKs and community libraries for popular programming languages.",
      icon: Database,
      items: [
        "JavaScript SDK",
        "Python SDK",
        "Rust SDK",
        "Community Libraries"
      ]
    },
    {
      title: "Security",
      description: "Security best practices, audit reports, and vulnerability disclosure.",
      icon: Shield,
      items: [
        "Security Model",
        "Audit Reports",
        "Best Practices",
        "Bug Bounty Program"
      ]
    },
    {
      title: "Community",
      description: "Governance, contributions, and community resources.",
      icon: Users,
      items: [
        "Governance Process",
        "Contributing Guide",
        "Community Forums",
        "Developer Support"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-b from-primary-light/10 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Everything you need to build with Reputation DAO. From quick start guides to advanced integrations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)]">
                Quick Start
              </button>
              <button className="px-8 py-4 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-all duration-300">
                API Reference
              </button>
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {docSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <div 
                    key={section.title}
                    className="glass-card p-8 hover-lift group cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                      {section.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {section.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-300 cursor-pointer">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Resources */}
        <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Popular Resources
              </h2>
              <p className="text-xl text-muted-foreground">
                Most accessed documentation and guides
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="glass-card p-8 hover-lift">
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Quick Start Tutorial
                </h3>
                <p className="text-muted-foreground mb-6">
                  Get up and running with Reputation DAO in under 10 minutes.
                </p>
                <button className="text-primary font-medium hover:underline">
                  Start Tutorial →
                </button>
              </div>
              
              <div className="glass-card p-8 hover-lift">
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Integration Examples
                </h3>
                <p className="text-muted-foreground mb-6">
                  Real-world examples of platforms using Reputation DAO.
                </p>
                <button className="text-primary font-medium hover:underline">
                  View Examples →
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

export default Docs;