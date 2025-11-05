# Documentation Theme Guide

This guide explains how the documentation styling works and how to customize it.

## Current Theme

The documentation uses your existing Tailwind CSS theme with custom enhancements for markdown content.

### Color Scheme

The documentation automatically adapts to your theme:

- **Background** - `bg-background`
- **Foreground** - `text-foreground`
- **Muted** - `text-muted-foreground`
- **Primary** - `text-primary`
- **Border** - `border-border`

### Typography

- **Headings** - Bold, hierarchical sizing
- **Body** - `text-muted-foreground` with `leading-7`
- **Code** - Monospace with `bg-muted`
- **Links** - `text-primary` with underline

## Customization

### Code Block Theme

Edit `frontend/src/components/docs/MarkdownRenderer.tsx`:

```typescript
// Current theme
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Available themes:
// - vscDarkPlus (current)
// - oneDark
// - dracula
// - nightOwl
// - atomDark
// - tomorrow
// - solarizedlight
```

### Heading Styles

```typescript
h1: ({ children, ...props }) => (
  <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground" {...props}>
    {children}
  </h1>
),
```

Customize by changing:
- `text-4xl` - Size
- `font-bold` - Weight
- `mb-6 mt-8` - Spacing
- `text-foreground` - Color

### Link Styles

```typescript
<Link
  to={href || '#'}
  className="text-primary hover:text-primary/80 underline underline-offset-4"
>
  {children}
</Link>
```

### Code Block Styles

```typescript
<code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
  {children}
</code>
```

### Table Styles

```typescript
<table className="w-full border-collapse">
  <thead className="bg-muted">
    <th className="border border-border px-4 py-2 text-left font-semibold">
```

## Sidebar Styling

Edit `frontend/src/components/docs/DocsSidebar.tsx`:

### Active State

```typescript
isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
```

### Hover State

```typescript
'hover:bg-muted'
```

### Icons

```typescript
{Icon && <Icon className="w-4 h-4" />}
```

## Layout Customization

Edit `frontend/src/components/layout/DocsLayout.tsx`:

### Sidebar Width

```typescript
<aside className="w-64 ...">  // Change w-64 to w-72, w-80, etc.
```

### Content Width

```typescript
<main className="flex-1 px-8 py-8 max-w-5xl">  // Change max-w-5xl
```

### Spacing

```typescript
<main className="flex-1 px-8 py-8">  // Change px-8 py-8
```

## Dark Mode

The documentation automatically supports dark mode through your theme:

```css
/* Light mode */
.prose {
  color: hsl(var(--foreground));
}

/* Dark mode */
.dark .prose {
  color: hsl(var(--foreground));
}
```

## Custom Components

### Callout Boxes

Add to `MarkdownRenderer.tsx`:

```typescript
// In the components object
blockquote: ({ children, ...props }) => {
  const text = String(children);
  const isNote = text.includes('Note:');
  const isWarning = text.includes('Warning:');
  const isTip = text.includes('Tip:');
  
  return (
    <blockquote
      className={cn(
        'border-l-4 pl-4 py-2 my-4 rounded-r',
        isNote && 'border-blue-500 bg-blue-500/10',
        isWarning && 'border-yellow-500 bg-yellow-500/10',
        isTip && 'border-green-500 bg-green-500/10',
        !isNote && !isWarning && !isTip && 'border-primary bg-muted/30'
      )}
      {...props}
    >
      {children}
    </blockquote>
  );
},
```

Usage in markdown:

```markdown
> **Note:** This is a note.

> **Warning:** This is a warning.

> **Tip:** This is a tip.
```

### Info Boxes

Add custom component:

```typescript
// Detect special divs
div: ({ children, className, ...props }) => {
  if (className?.includes('info-box')) {
    return (
      <div className="glass-card p-6 my-4 border-l-4 border-primary">
        {children}
      </div>
    );
  }
  return <div className={className} {...props}>{children}</div>;
},
```

## Responsive Design

### Mobile Sidebar

Add to `DocsSidebar.tsx`:

```typescript
<aside className="
  w-64 
  hidden lg:block  // Hide on mobile
  h-[calc(100vh-4rem)] 
  sticky top-16
">
```

### Mobile Menu Button

Add to `DocsLayout.tsx`:

```typescript
const [sidebarOpen, setSidebarOpen] = useState(false);

<button 
  className="lg:hidden"
  onClick={() => setSidebarOpen(!sidebarOpen)}
>
  <Menu />
</button>
```

## Print Styles

Add to your CSS:

```css
@media print {
  .docs-sidebar {
    display: none;
  }
  
  .docs-content {
    max-width: 100%;
  }
  
  pre {
    page-break-inside: avoid;
  }
}
```

## Accessibility

### Focus Styles

```typescript
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

### Skip Links

Add to `DocsLayout.tsx`:

```typescript
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to content
</a>
```

## Performance

### Lazy Load Syntax Highlighter

```typescript
import { lazy, Suspense } from 'react';

const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(mod => ({
    default: mod.Prism
  }))
);

// In component
<Suspense fallback={<pre>{code}</pre>}>
  <SyntaxHighlighter {...props}>
    {code}
  </SyntaxHighlighter>
</Suspense>
```

### Optimize Images

Add to markdown renderer:

```typescript
img: ({ src, alt, ...props }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className="rounded-lg shadow-lg my-4"
    {...props}
  />
),
```

## Custom Markdown Extensions

### Tabs

Add tabs component:

```typescript
// Detect tab syntax
// ```tabs
// ## Tab 1
// Content 1
// ## Tab 2
// Content 2
// ```
```

### Mermaid Diagrams

Add mermaid support:

```typescript
import mermaid from 'mermaid';

// In code block handler
if (language === 'mermaid') {
  return <MermaidDiagram code={codeString} />;
}
```

## Best Practices

1. **Use Theme Variables** - Always use Tailwind theme colors
2. **Test Dark Mode** - Check both light and dark themes
3. **Mobile First** - Design for mobile, enhance for desktop
4. **Accessibility** - Include ARIA labels and focus states
5. **Performance** - Lazy load heavy components
6. **Consistency** - Use same spacing throughout

## Examples

### Custom Card Component

```typescript
// In markdown
<div class="doc-card">
  <h3>Title</h3>
  <p>Content</p>
</div>

// In renderer
div: ({ className, children, ...props }) => {
  if (className?.includes('doc-card')) {
    return (
      <div className="glass-card p-6 hover-lift">
        {children}
      </div>
    );
  }
  return <div className={className} {...props}>{children}</div>;
},
```

### Custom Badge

```typescript
// In markdown
<span class="badge badge-primary">New</span>

// In renderer
span: ({ className, children, ...props }) => {
  if (className?.includes('badge')) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        {children}
      </span>
    );
  }
  return <span className={className} {...props}>{children}</span>;
},
```

## Testing

Test your theme changes:

1. **Light Mode** - Check all components
2. **Dark Mode** - Toggle and verify
3. **Mobile** - Test responsive layout
4. **Print** - Check print styles
5. **Accessibility** - Test with screen reader
6. **Performance** - Check load times

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- [Lucide Icons](https://lucide.dev/)

## Support

For theme customization help:
1. Check Tailwind documentation
2. Review existing components
3. Test changes locally
4. Ask in Discord
