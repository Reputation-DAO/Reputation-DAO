import Navigation from "@/components/ui/navigation";
import Footer from "@/components/layout/Footer";
import { MessageCircle, Users, Github, Twitter, Calendar, Trophy, Heart, Star, Clock } from "lucide-react";

const Community = () => {
  const communityStats = [
    { label: "Community Members", value: "2,500+", icon: Users },
    { label: "GitHub Contributors", value: "150+", icon: Github },
    { label: "Monthly Events", value: "12", icon: Calendar },
    { label: "Projects Built", value: "35+", icon: Trophy }
  ];

  const communityChannels = [
    {
      name: "Discord",
      description: "Join our main community hub for real-time discussions, support, and announcements.",
      icon: MessageCircle,
      members: "2,500+",
      link: "#",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      name: "GitHub",
      description: "Contribute to the codebase, report issues, and collaborate on development.",
      icon: Github,
      members: "150+",
      link: "https://github.com/Reputation-DAO",
      color: "from-gray-700 to-gray-800"
    },
    {
      name: "Twitter",
      description: "Follow us for updates, announcements, and community highlights.",
      icon: Twitter,
      members: "5,000+", 
      link: "#",
      color: "from-blue-500 to-blue-600"
    }
  ];

  const upcomingEvents = [
    {
      title: "Developer Workshop: Smart Contract Integration",
      date: "Jan 15, 2025",
      time: "2:00 PM UTC",
      type: "Workshop"
    },
    {
      title: "Community AMA with Founders",
      date: "Jan 20, 2025", 
      time: "6:00 PM UTC",
      type: "AMA"
    },
    {
      title: "Hackathon: Build with Reputation DAO",
      date: "Jan 25-27, 2025",
      time: "48 Hours",
      type: "Hackathon"
    }
  ];

  const contributors = [
    { name: "Alex Chen", role: "Core Developer", contributions: "Smart Contracts" },
    { name: "Sarah Williams", role: "Community Lead", contributions: "Documentation" },
    { name: "Mike Zhang", role: "DevRel Engineer", contributions: "SDKs & Tools" },
    { name: "Dr. Lisa Park", role: "Research Lead", contributions: "Privacy Solutions" },
    { name: "Tom Miller", role: "Frontend Dev", contributions: "UI/UX Design" },
    { name: "Emma Davis", role: "Product Manager", contributions: "Roadmap & Strategy" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-b from-primary-light/10 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Community
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join a vibrant community of developers, researchers, and innovators building the future of decentralized reputation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)]">
                Join Discord
              </button>
              <button className="px-8 py-4 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-all duration-300">
                View GitHub
              </button>
            </div>
          </div>
        </section>

        {/* Community Stats */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {communityStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div 
                    key={stat.label}
                    className="glass-card p-6 text-center hover-lift"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Community Channels */}
        <section className="py-24 bg-gradient-to-b from-background to-secondary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Connect With Us
              </h2>
              <p className="text-xl text-muted-foreground">
                Choose your preferred platform to engage with our community
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {communityChannels.map((channel, index) => {
                const IconComponent = channel.icon;
                return (
                  <a
                    key={channel.name}
                    href={channel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-8 hover-lift group"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center mb-6 group-hover:animate-pulse-glow`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                      {channel.name}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {channel.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary font-medium">{channel.members} members</span>
                      <span className="text-primary text-sm font-medium group-hover:text-primary-glow transition-colors duration-300">
                        Join →
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Upcoming Events
              </h2>
              <p className="text-xl text-muted-foreground">
                Join us for workshops, AMAs, and community gatherings
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event, index) => (
                <div 
                  key={event.title}
                  className="glass-card p-6 hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                      {event.type}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </div>
                  </div>
                  
                  <button className="mt-4 w-full py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors duration-300">
                    Register
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contributors */}
        <section className="py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-foreground">
                Meet the Contributors
              </h2>
              <p className="text-xl text-muted-foreground">
                The amazing people building Reputation DAO
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributors.map((contributor, index) => (
                <div 
                  key={contributor.name}
                  className="glass-card p-6 text-center hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary-glow/20 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {contributor.name}
                  </h3>
                  
                  <p className="text-primary text-sm font-medium mb-2">
                    {contributor.role}
                  </p>
                  
                  <p className="text-muted-foreground text-sm">
                    {contributor.contributions}
                  </p>
                  
                  <div className="mt-4 flex justify-center">
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-10 text-center border border-primary/20">
              <h3 className="text-3xl font-bold mb-4 text-foreground">
                Become a Contributor
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                Whether you're a developer, researcher, designer, or community builder, 
                there's a place for you in the Reputation DAO ecosystem.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-glow text-white rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)]">
                  Start Contributing
                </button>
                <button className="px-8 py-4 border border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-all duration-300">
                  Learn More
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

export default Community;