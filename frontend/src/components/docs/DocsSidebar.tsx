import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Book, Rocket, Code, Terminal, Zap, Shield, Users, FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    icon: Rocket,
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quick Start', href: '/docs/getting-started' },
      { title: 'Installation', href: '/docs/installation' },
    ],
  },
  {
    title: 'Core Concepts',
    icon: Book,
    items: [
      { title: 'Overview', href: '/docs/concepts/overview' },
      { title: 'Architecture', href: '/docs/concepts/architecture' },
      { title: 'Soulbound Tokens', href: '/docs/concepts/soulbound' },
      { title: 'Decay System', href: '/docs/concepts/decay' },
      { title: 'Multi-Tenancy', href: '/docs/concepts/multi-tenancy' },
    ],
  },
  {
    title: 'Guides',
    icon: FileText,
    items: [
      { title: 'Your First Organization', href: '/docs/guides/first-org' },
      { title: 'Managing Awarders', href: '/docs/guides/awarders' },
      { title: 'Configuring Decay', href: '/docs/guides/decay-config' },
      { title: 'Frontend Integration', href: '/docs/guides/frontend-integration' },
      { title: 'Analytics & Reporting', href: '/docs/guides/analytics' },
    ],
  },
  {
    title: 'API Reference',
    icon: Code,
    items: [
      { title: 'Factory Canister', href: '/docs/api/factory' },
      { title: 'Child Canister', href: '/docs/api/child' },
      { title: 'Blog Backend', href: '/docs/api/blog' },
      { title: 'TypeScript SDK', href: '/docs/api/sdk' },
    ],
  },
  {
    title: 'CLI',
    icon: Terminal,
    items: [
      { title: 'Overview', href: '/docs/cli/overview' },
      { title: 'Installation', href: '/docs/cli/installation' },
      { title: 'Commands', href: '/docs/cli/commands' },
      { title: 'Configuration', href: '/docs/cli/configuration' },
    ],
  },
  {
    title: 'Smart Contracts',
    icon: Zap,
    items: [
      { title: 'Factory Contract', href: '/docs/smart-contracts/factory' },
      { title: 'Child Contract', href: '/docs/smart-contracts/child' },
      { title: 'Upgrade Strategy', href: '/docs/smart-contracts/upgrades' },
      { title: 'Testing', href: '/docs/smart-contracts/testing' },
    ],
  },
  {
    title: 'Deployment',
    icon: Rocket,
    items: [
      { title: 'Local Development', href: '/docs/deployment/local' },
      { title: 'Testnet', href: '/docs/deployment/testnet' },
      { title: 'Mainnet', href: '/docs/deployment/mainnet' },
      { title: 'CI/CD', href: '/docs/deployment/cicd' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      { title: 'Security Model', href: '/docs/security/model' },
      { title: 'Best Practices', href: '/docs/security/best-practices' },
      { title: 'Audit Reports', href: '/docs/security/audits' },
      { title: 'Disclosure Policy', href: '/docs/security/disclosure' },
    ],
  },
  {
    title: 'Community',
    icon: Users,
    items: [
      { title: 'Contributing', href: '/docs/community/contributing' },
      { title: 'Code of Conduct', href: '/docs/community/code-of-conduct' },
      { title: 'Resources', href: '/docs/community/resources' },
      { title: 'Support', href: '/docs/community/support' },
    ],
  },
];

const NavSection = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.items && item.items.length > 0;
  const Icon = item.icon;

  const isActive = item.href === location.pathname;
  const hasActiveChild = item.items?.some(child => child.href === location.pathname);

  if (!hasChildren && item.href) {
    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          'hover:bg-muted',
          isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground',
          level > 0 && 'ml-4'
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {item.title}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
          'hover:bg-muted',
          (isActive || hasActiveChild) ? 'text-foreground font-medium' : 'text-muted-foreground',
          level > 0 && 'ml-4'
        )}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {item.title}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      
      {isOpen && hasChildren && (
        <div className="space-y-1 ml-2">
          {item.items!.map((child) => (
            <NavSection key={child.href || child.title} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const DocsSidebar = () => {
  return (
    <aside className="w-64 shrink-0 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <NavSection key={item.href || item.title} item={item} />
        ))}
      </nav>
    </aside>
  );
};

export default DocsSidebar;
