import { Github, FileText, Play, Presentation, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

const ResourcesSection = () => {
  const resources = [
    {
      title: "GitHub",
      description: "Explore the complete source code and contribute to the project",
      icon: Github,
      link: "https://github.com/Reputation-DAO/Reputation-DAO",
      color: "from-gray-600 to-gray-700"
    },
    {
      title: "Core Idea",
      description: "Deep dive into the foundational concepts and philosophy",
      icon: FileText,
      link: "https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0",
      color: "from-blue-600 to-blue-700"
    },
    {
      title: "Watch Demo",
      description: "See Reputation DAO in action with our comprehensive demo",
      icon: Play,
      link: "https://www.youtube.com/watch?v=iaZ4pHaWd_U",
      color: "from-red-600 to-red-700"
    },
    {
      title: "Presentation",
      description: "Official presentation slides and project overview",
      icon: Presentation,
      link: "https://drive.google.com/file/d/18A6LH4TseJolKCbDPOf7et7IXwCj2fs0/view?usp=sharing",
      color: "from-green-600 to-green-700"
    },
    {
      title: "Complete Flow Chart",
      description: "Visual workflow and system architecture diagrams",
      icon: GitBranch,
      link: "https://www.figma.com/board/fWhXwD7MX9wxylm8SumTqr/REPUTAION-DAO-WORKFLOW?t=xV8nwU4sJ0ZQSwEq-0",
      color: "from-purple-600 to-purple-700"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Resources
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to get started with Reputation DAO
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {resources.map((resource, index) => {
            const IconComponent = resource.icon;
            return (
              <a
                key={resource.title}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-6 hover-lift group transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${resource.color} flex items-center justify-center mb-4 group-hover:animate-pulse-glow`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                  {resource.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {resource.description}
                </p>
                
                <div className="mt-4 text-primary text-sm font-medium group-hover:text-primary-glow transition-colors duration-300">
                  Explore →
                </div>
              </a>
            );
          })}
        </div>
        
        {/* Call to action */}
        <div className="text-center">
          <div className="glass-card p-10 max-w-4xl mx-auto border border-primary/20">
            <h3 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Dive Deeper?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of developers, contributors, and innovators building the future of decentralized reputation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" className="group">
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                View on GitHub
              </Button>
              <Button variant="outline" size="lg" className="group">
                <span>Join Community</span>
                <GitBranch className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Button>
            </div>
            
            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">100+</div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">1K+</div>
                <div className="text-sm text-muted-foreground">GitHub Stars</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">50+</div>
                <div className="text-sm text-muted-foreground">Integrations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Community Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;