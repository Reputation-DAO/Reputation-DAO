# TypeScript SDK & Libraries

The frontend layers several libraries—connect2ic, shadcn/ui, Radix, TanStack Query, and custom hooks—to present canister data and role-specific flows. This page explains the integration points you can reuse.

## Wallet & Actor Setup

Authentication starts in `AuthContext`, which hydrates either Plug or Internet Identity and exposes `getChildActor` / `getFactoriaActor`. Under the hood, helpers such as `makeChildActor` resolve the right agent for the active provider.

### Creating Actors

```typescript
import { makeChildActor } from "@/lib/canisters";

const actor = await makeChildActor("plug", {
  canisterId: process.env.VITE_REPUTATION_DAO_CANISTER_ID!,
});
```

### Actor Helpers

The `frontend/src/lib/canisters` module provides typed helpers:

```typescript
// lib/canisters.ts
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as childIdl } from "../declarations/reputation_dao";
import { idlFactory as factoryIdl } from "../declarations/factoria";

export async function makeChildActor(
  provider: "plug" | "ii",
  options: { canisterId: string }
) {
  const agent = await getAgent(provider);
  
  return Actor.createActor(childIdl, {
    agent,
    canisterId: options.canisterId,
  });
}

export async function makeFactoriaActor(
  provider: "plug" | "ii",
  options: { canisterId: string }
) {
  const agent = await getAgent(provider);
  
  return Actor.createActor(factoryIdl, {
    agent,
    canisterId: options.canisterId,
  });
}

async function getAgent(provider: "plug" | "ii"): Promise<HttpAgent> {
  if (provider === "plug") {
    // @ts-ignore
    return window.ic?.plug?.agent;
  } else {
    // Internet Identity agent
    return new HttpAgent({
      host: process.env.VITE_IC_HOST,
    });
  }
}
```

### Adding New Canisters

When adding new canisters, extend `frontend/src/lib/canisters` with typed helpers so hooks and pages remain strongly typed.

```typescript
// Add new canister
export async function makeMyCanisterActor(
  provider: "plug" | "ii",
  options: { canisterId: string }
) {
  const agent = await getAgent(provider);
  
  return Actor.createActor(myCanisterIdl, {
    agent,
    canisterId: options.canisterId,
  });
}
```

## State & Data Fetching

TanStack Query is initialized in `App.tsx`. Use `useQuery` for read operations and `useMutation` for writes so the library handles caching and error states.

### Query Example

```typescript
import { useQuery } from "@tanstack/react-query";

const { data: leaderboard, isLoading, error } = useQuery({
  queryKey: ["leaderboard", canisterId],
  queryFn: async () => {
    const actor = await makeChildActor("plug", { canisterId });
    return actor.leaderboard(10n, 0n);
  },
  enabled: !!canisterId,
  staleTime: 30000, // 30 seconds
});
```

### Mutation Example

Wrap write flows (award, revoke, decay) in mutations that invalidate relevant query keys once the call succeeds.

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const awardMutation = useMutation({
  mutationFn: async ({ recipient, amount, reason }) => {
    const actor = await makeChildActor("plug", { canisterId });
    return actor.awardRep(recipient, amount, reason ? [reason] : []);
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ["leaderboard", canisterId] });
    queryClient.invalidateQueries({ queryKey: ["balance", canisterId] });
    queryClient.invalidateQueries({ queryKey: ["transactions", canisterId] });
  },
});

// Usage
awardMutation.mutate({
  recipient: Principal.fromText("2vxsx-fae"),
  amount: 100n,
  reason: "Great contribution",
});
```

### Query Keys Convention

```typescript
// Leaderboard
["leaderboard", canisterId]

// User balance
["balance", canisterId, principal]

// Transactions
["transactions", canisterId, offset, limit]

// Org pulse
["orgPulse", canisterId, hours]

// Awarder stats
["awarderStats", canisterId, principal]
```

## UI System

Layout components such as `Navigation`, `Footer`, and `DashboardLayout` pair with reusable shadcn/ui primitives (cards, tabs, forms). Tailwind themes are configured in `tailwind.config.ts`.

### Component Structure

```
frontend/src/components/
├── ui/              # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── layout/          # Layout components
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── DashboardLayout.tsx
├── dashboard/       # Dashboard-specific
│   ├── AwardForm.tsx
│   ├── LeaderboardTable.tsx
│   └── ...
└── docs/            # Documentation components
    ├── DocsSidebar.tsx
    └── MarkdownRenderer.tsx
```

### Adding New UI Components

To add a new UI atom, scaffold it under `frontend/src/components/ui` and export via `components.json` so shadcn generates consistent tokens.

```bash
# Add a new shadcn component
npx shadcn-ui@latest add dropdown-menu
```

### Theme Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more colors
      },
    },
  },
};
```

## Local Utilities & Hooks

### useWalletConnectionMonitor

Keeps Plug sessions fresh and monitors connection status.

```typescript
import { useWalletConnectionMonitor } from "@/hooks/useWalletConnectionMonitor";

function MyComponent() {
  const { isConnected, reconnect } = useWalletConnectionMonitor();
  
  if (!isConnected) {
    return <button onClick={reconnect}>Reconnect Wallet</button>;
  }
  
  return <div>Connected!</div>;
}
```

### useMobile

Adapts responsive layouts when screen width is constrained.

```typescript
import { useMobile } from "@/hooks/useMobile";

function MyComponent() {
  const isMobile = useMobile();
  
  return (
    <div className={isMobile ? "flex-col" : "flex-row"}>
      {/* Content */}
    </div>
  );
}
```

### useToast

Centralizes notifications so transactions surface feedback consistently.

```typescript
import { useToast } from "@/hooks/useToast";

function MyComponent() {
  const { toast } = useToast();
  
  const handleAward = async () => {
    try {
      await awardMutation.mutateAsync({ recipient, amount, reason });
      toast({
        title: "Success",
        description: "Reputation awarded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  return <button onClick={handleAward}>Award</button>;
}
```

### transactionUtils.ts

Maps raw Candid transactions into UI-friendly objects.

```typescript
// lib/transactionUtils.ts
export function formatTransaction(tx: RawTransaction): FormattedTransaction {
  return {
    id: Number(tx.id),
    type: formatTxType(tx.txType),
    from: tx.from.toText(),
    to: tx.to.toText(),
    amount: Number(tx.amount),
    reason: tx.reason[0] || null,
    timestamp: new Date(Number(tx.timestamp) / 1_000_000),
  };
}

export function formatTxType(txType: TxType): string {
  if ("award" in txType) return "Award";
  if ("revoke" in txType) return "Revoke";
  if ("decay" in txType) return "Decay";
  if ("reset" in txType) return "Reset";
  return "Unknown";
}
```

## Adding Your Own Integrations

When introducing third-party wallets or analytics SDKs:

### 1. Register the Provider

Register the provider in `connect2ic` and expose any additional identity metadata through `AuthContext`.

```typescript
// App.tsx
import { Connect2ICProvider } from "@connect2ic/react";

const providers = [
  // Existing providers
  createPlugProvider(),
  createInternetIdentityProvider(),
  
  // New provider
  createMyWalletProvider({
    whitelist: [process.env.VITE_REPUTATION_DAO_CANISTER_ID],
  }),
];

<Connect2ICProvider providers={providers}>
  {/* App */}
</Connect2ICProvider>
```

### 2. Extend AuthContext

```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext({
  // Existing
  isAuthenticated: false,
  principal: null,
  provider: null,
  
  // New
  myWalletData: null,
});
```

### 3. Create Custom Hooks

Keep new hooks self-contained so screens remain declarative.

```typescript
// hooks/useMyWallet.ts
export function useMyWallet() {
  const { myWalletData } = useAuth();
  
  return {
    isConnected: !!myWalletData,
    balance: myWalletData?.balance,
    // ... more wallet-specific data
  };
}
```

### 4. Document the SDK

Document the SDK in this section with setup instructions for contributors.

## Environment Variables

```env
# IC Network
VITE_IC_HOST=http://127.0.0.1:4943

# Canister IDs
VITE_FACTORIA_CANISTER_ID=rrkah-fqaaa-aaaaa-aaaaq-cai
VITE_REPUTATION_DAO_CANISTER_ID=ryjl3-tyaaa-aaaaa-aaaba-cai
VITE_BLOG_BACKEND_CANISTER_ID=r7inp-6aaaa-aaaaa-aaabq-cai
VITE_FRONTEND_CANISTER_ID=renrk-eyaaa-aaaaa-aaada-cai

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id
```

## Type Definitions

### Generated Types

Types are auto-generated from Candid interfaces:

```typescript
// declarations/reputation_dao/reputation_dao.did.d.ts
export interface _SERVICE {
  awardRep: (
    recipient: Principal,
    amount: bigint,
    reason: [] | [string]
  ) => Promise<Result>;
  
  getBalance: (user: Principal) => Promise<bigint>;
  
  leaderboard: (
    limit: bigint,
    offset: bigint
  ) => Promise<Array<LeaderboardEntry>>;
  
  // ... more methods
}
```

### Custom Types

```typescript
// types/reputation.ts
export interface FormattedTransaction {
  id: number;
  type: "Award" | "Revoke" | "Decay" | "Reset";
  from: string;
  to: string;
  amount: number;
  reason: string | null;
  timestamp: Date;
}

export interface LeaderboardEntry {
  principal: string;
  balance: number;
  rank: number;
}
```

## Best Practices

### Actor Management

1. **Reuse Actors**: Cache actors per canister ID
2. **Error Handling**: Always wrap actor calls in try-catch
3. **Type Safety**: Use generated types from declarations
4. **Agent Refresh**: Monitor and refresh agents when needed

### Query Optimization

1. **Stale Time**: Set appropriate stale times for queries
2. **Invalidation**: Invalidate related queries after mutations
3. **Pagination**: Use pagination for large datasets
4. **Prefetching**: Prefetch data for better UX

### UI Consistency

1. **Component Reuse**: Use shadcn/ui primitives
2. **Theme Tokens**: Use CSS variables for colors
3. **Responsive**: Test on mobile and desktop
4. **Accessibility**: Follow ARIA guidelines

## Next Steps

### 🔧 [Factory API](/docs/api/factory)
Explore factory canister methods

### 🔧 [Child API](/docs/api/child)
Explore child canister methods

### ⚛️ [Frontend Integration](/docs/guides/frontend-integration)
Build your first integration

### 🚀 [Getting Started](/docs/getting-started)
Set up your development environment
