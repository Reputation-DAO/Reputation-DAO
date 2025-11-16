import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Zap, Copy } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isAuthenticated, principal, authMethod } = useAuth();
  const principalText = useMemo(() => principal?.toText?.() ?? null, [principal]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Docs", href: "/docs" },
    { name: "Blog", href: "/blog" },
    { name: "Community", href: "/community" },
  ];

  const handleCopyPrincipal = async () => {
    if (!principalText) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      const { clipboard } = navigator;
      if (typeof clipboard.writeText !== "function") {
        throw new Error("Clipboard API unavailable");
      }
      await clipboard.writeText(principalText);
      toast.success("Wallet principal copied to clipboard");
    } catch (error) {
      console.error("Failed to copy wallet principal", error);
      toast.error("Unable to copy. Try again.");
    }
  };

  const walletBadge = isAuthenticated && principalText ? (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 backdrop-blur px-3 py-2">
      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
      <span className="text-sm font-mono text-muted-foreground">
        {(authMethod === "internetIdentity" ? "II" : "Plug") + " · " + principalText.slice(0, 8) + "..." + principalText.slice(-8)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleCopyPrincipal}
        aria-label="Copy wallet principal"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  ) : null;

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      scrolled ? "bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-blue-500/10" : "bg-transparent"
    )}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="/main.png" 
              alt="Reputation DAO logo" 
              className="w-8 h-8 rounded-lg group-hover:scale-110 transition-all duration-300"
              width="32"
              height="32"
              decoding="async"
            />
            <span className="text-xl font-bold text-white">
              Reputation DAO
            </span>
          </Link>

          {/* Desktop Navigation - Right */}
          <div className="hidden md:flex items-center gap-6">
            {walletBadge}
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-sm font-medium transition-all duration-300",
                  "hover:text-blue-400",
                  location.pathname === item.href ? "text-blue-400" : "text-gray-300"
                )}
              >
                {item.name}
              </Link>
            ))}
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden glass-card mt-2 p-4 rounded-xl">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    location.pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <Link to="/auth" className="mt-2">
                <Button variant="default">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
