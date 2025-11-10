import { Github, Twitter, MessageCircle, Mail, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const footerLinks = {
    Product: [
      { name: "How it Works", href: "#how-it-works" },
      { name: "Benefits", href: "#benefits" },
      { name: "Use Cases", href: "#use-cases" },
      { name: "Technical", href: "#technical" },
    ],

    Community: [
      { name: "Discord", href: "#" },
      { name: "Blog", href: "/blog" },
      { name: "Twitter", href: "#" },
      { name: "Newsletter", href: "#" },
    ],
    Company: [
      { name: "About", href: "/about" },
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Contact", href: "/contact" },
    ],
  };

  const socialLinks = [
    { icon: Github, href: "https://github.com/Reputation-DAO", label: "GitHub" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: MessageCircle, href: "#", label: "Discord" },
    { icon: Mail, href: "mailto:hello@reputationdao.com", label: "Email" },
  ];

  return (
    <footer className="bg-background border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid gap-12 sm:gap-16 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand section */}
            <div className="space-y-6 text-center md:text-left lg:col-span-2">
              <Link to="/" className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Reputation DAO
                </span>
              </Link>

              <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto md:mx-0">
                Building the future of decentralized reputation. Soulbound, tamper-proof,
                and completely transparent identity for the web3 ecosystem.
              </p>

              {/* Social links */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl border border-border/50 bg-secondary/20 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-110"
                      aria-label={social.label}
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
            
            {/* Links sections */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:col-span-3">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category} className="text-center sm:text-left">
                  <h3 className="font-semibold text-foreground mb-4">{category}</h3>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={link.name}>
                        {link.href.startsWith('#') || link.href.startsWith('http') ? (
                          <a
                            href={link.href}
                            target={link.href.startsWith('http') ? "_blank" : undefined}
                            rel={link.href.startsWith('http') ? "noopener noreferrer" : undefined}
                            className="text-muted-foreground hover:text-primary transition-colors duration-300"
                          >
                            {link.name}
                          </a>
                        ) : (
                          <Link
                            to={link.href}
                            className="text-muted-foreground hover:text-primary transition-colors duration-300"
                          >
                            {link.name}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Newsletter signup */}
        <div className="py-8 border-t border-border/50">
          <div className="rounded-xl border border-border/50 bg-card p-8 md:p-10 text-center md:text-left md:flex md:items-center md:justify-between md:gap-8">
            <div className="md:max-w-xl space-y-3">
              <h3 className="text-2xl font-bold text-foreground">Stay Updated</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto md:mx-0">
                Get the latest updates on Reputation DAO development, partnerships, and community news.
              </p>
            </div>
            <div className="mt-6 md:mt-0 w-full md:max-w-md flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary-glow text-white rounded-lg hover:scale-105 transition-all duration-300 hover:shadow-[var(--shadow-glow)] whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="py-6 border-t border-border/50 flex flex-col lg:flex-row justify-between items-center gap-4 text-center lg:text-left">
          <p className="text-muted-foreground text-sm">© 2024 Reputation DAO. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors duration-300">
              Terms of Service
            </Link>
            <span>Built on ICP</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
