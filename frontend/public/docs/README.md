# Reputation DAO Documentation

This directory contains the markdown-based documentation for Reputation DAO.

## Structure

```
docs/
├── index.md                    # Main documentation landing page
├── getting-started.md          # Quick start guide
├── installation.md             # Detailed installation
├── concepts/                   # Core concepts
│   ├── overview.md
│   ├── architecture.md
│   ├── soulbound.md
│   ├── decay.md
│   └── multi-tenancy.md
├── guides/                     # Step-by-step tutorials
│   ├── first-org.md
│   ├── awarders.md
│   ├── decay-config.md
│   ├── frontend-integration.md
│   └── analytics.md
├── api/                        # API reference
│   ├── factory.md
│   ├── child.md
│   ├── blog.md
│   └── sdk.md
├── cli/                        # CLI documentation
│   ├── overview.md
│   ├── installation.md
│   ├── commands.md
│   └── configuration.md
├── smart-contracts/            # Contract documentation
│   ├── factory.md
│   ├── child.md
│   ├── upgrades.md
│   └── testing.md
├── deployment/                 # Deployment guides
│   ├── local.md
│   ├── testnet.md
│   ├── mainnet.md
│   └── cicd.md
├── security/                   # Security documentation
│   ├── model.md
│   ├── best-practices.md
│   ├── audits.md
│   └── disclosure.md
└── community/                  # Community resources
    ├── contributing.md
    ├── code-of-conduct.md
    ├── resources.md
    └── support.md
```

## Writing Documentation

### Markdown Format

All documentation is written in GitHub Flavored Markdown (GFM) with support for:

- **Headings** - Use `#` for H1, `##` for H2, etc.
- **Code blocks** - Use triple backticks with language tags
- **Tables** - Standard markdown tables
- **Links** - Internal (`/docs/...`) and external
- **Lists** - Ordered and unordered
- **Blockquotes** - Use `>` for callouts

### Code Blocks

Always specify the language for syntax highlighting:

````markdown
```typescript
const example = "code";
```

```bash
dfx deploy
```

```motoko
public func example() : async Text {
  "Hello"
}
```
````

### Internal Links

Use absolute paths from the docs root:

```markdown
See [Getting Started](/docs/getting-started) for setup instructions.
```

### External Links

External links automatically open in a new tab:

```markdown
Check out [Internet Computer](https://internetcomputer.org)
```

### Tables

Use markdown tables for structured data:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

### Callouts

Use blockquotes for important notes:

```markdown
> **Note:** This is an important note.

> **Warning:** This is a warning.

> **Tip:** This is a helpful tip.
```

## Best Practices

### 1. Clear Structure

- Start with H1 title
- Use H2 for main sections
- Use H3 for subsections
- Keep hierarchy logical

### 2. Code Examples

- Always include working examples
- Show both CLI and SDK usage
- Include expected output
- Add error handling examples

### 3. Cross-References

- Link to related documentation
- Add "See Also" sections
- Create "Next Steps" sections
- Build a knowledge graph

### 4. Consistency

- Use consistent terminology
- Follow the same format across docs
- Maintain similar structure
- Use the same code style

### 5. Completeness

- Cover all parameters
- Document return values
- List possible errors
- Include edge cases

## Templates

### API Method Template

```markdown
### methodName

Brief description of what the method does.

\`\`\`motoko
public func methodName(param1: Type1, param2: Type2) : async ReturnType
\`\`\`

**Parameters:**
- `param1` - Description of parameter 1
- `param2` - Description of parameter 2

**Returns:** Description of return value

**Example:**

\`\`\`bash
dfx canister call canister_name methodName '(arg1, arg2)'
\`\`\`

**TypeScript:**

\`\`\`typescript
import { methodName } from 'repdao';

const result = await methodName(arg1, arg2, { identity, network: 'ic' });
\`\`\`
```

### Guide Template

```markdown
# Guide Title

Brief introduction to what this guide covers.

## Prerequisites

- Requirement 1
- Requirement 2

## Step 1: First Step

Detailed instructions...

\`\`\`bash
command example
\`\`\`

## Step 2: Second Step

More instructions...

## Troubleshooting

Common issues and solutions.

## Next Steps

### 🚀 [Getting Started](/docs/getting-started)
Set up your development environment in 15 minutes

### 📚 [Core Concepts](/docs/concepts/overview)
Understand the architecture and design principles

### 📖 [Deploy Your First Org](/docs/guides/first-org)
Step-by-step tutorial for creating your first organization

```

## Rendering

Documentation is rendered by the `MarkdownRenderer` component which provides:

- Syntax highlighting with copy buttons
- Custom styled components
- Internal link handling
- Responsive tables
- Dark mode support

## Contributing

When adding new documentation:

1. Create the markdown file in the appropriate directory
2. Add the route to `DocsSidebar.tsx`
3. Test the rendering locally
4. Ensure all links work
5. Check code examples
6. Submit a pull request

## Style Guide

### Terminology

- **Canister** - Not "smart contract" (IC-specific)
- **Principal** - Not "address" or "account"
- **Cycles** - Not "gas" (IC-specific)
- **Factory** - The orchestration canister
- **Child** - Organization-specific canister
- **Soulbound** - Non-transferable reputation

### Code Style

- Use TypeScript for SDK examples
- Use Motoko for canister examples
- Use bash for CLI examples
- Include comments for complex code
- Show both success and error cases

### Formatting

- Use **bold** for emphasis
- Use `code` for inline code
- Use > for callouts
- Use tables for structured data
- Use lists for steps or items

## Testing

Before submitting documentation:

1. **Render Check** - View in the app
2. **Link Check** - Verify all links work
3. **Code Check** - Test all code examples
4. **Format Check** - Ensure consistent formatting
5. **Spell Check** - Run spell checker

## Maintenance

Documentation should be updated when:

- API changes
- New features added
- Bugs fixed
- Best practices change
- User feedback received

## Questions?

- Check existing documentation
- Ask in Discord
- Open a GitHub issue
- Contact the team

## License

Documentation is licensed under MIT, same as the project.
