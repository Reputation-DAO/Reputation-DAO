import { Github, FileText, Play, Presentation, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

const ResourcesSection = () => {
  const resources = [
    
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
        
      </div>
    </section>
  );
};

export default ResourcesSection;