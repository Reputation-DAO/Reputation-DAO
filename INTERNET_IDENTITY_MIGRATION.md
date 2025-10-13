# Internet Identity Migration Guide - Reputation DAO

## 🎯 Migration Overview

This document outlines the complete migration from Plug Wallet to Internet Identity (II) authentication in the Reputation DAO DApp.

---

## ✅ Completed Changes

### 1. **New Internet Identity Utilities** (`utils/internetIdentity.ts`)

Created a comprehensive II authentication module with:
- `getAuthClient()` - Singleton auth client management
- `isAuthenticated()` - Check authentication status
- `getIdentity()` - Get current II identity
- `getPrincipal()` - Get authenticated principal
- `loginWithII()` - Initiate II login flow
- `logout()` - Clear II session
- `createAgent()` - Create authenticated HttpAgent for canister calls
- `shortPrincipal()` - Display helper for principals

**Key Features:**
- Auto-login persistence (checks on app mount)
- Proper local vs mainnet handling
- Session management without idle timeout
- Singleton pattern for AuthClient

### 2. **Updated Canister Actor Creation**

**`lib/canisters/child.ts`:**
- Renamed `makeChildWithPlug()` → `makeChildActor()`
- Uses II identity from `getIdentity()`
- Falls back to anonymous actor if not authenticated
- Backward compatible alias for migration period

**`lib/canisters/factoria.ts`:**
- Updated `makeFactoriaActor()` to use II identity
- Renamed `makeFactoriaWithPlug()` → alias for compatibility
- Supports both authenticated and anonymous modes

### 3. **AuthContext Updated** (`contexts/AuthContext.tsx`)

**Changed:**
- `AuthMethod`: `'plug'` → `'ii'`
- `loginWithPlug()` → `loginWithInternetIdentity()`
- Uses II utilities instead of Plug functions
- Clears localStorage on logout (orgId, role, userName)

**Interface remains the same:**
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  authMethod: AuthMethod;
  principal: Principal | null;
  isLoading: boolean;
  loginWithInternetIdentity: () => Promise<void>;
  logout: () => Promise<void>;
  checkConnection: () => Promise<void>;
  getActor: (canisterId: string) => Promise<ChildActor>;
}
```

### 4. **RoleContext Updated** (`contexts/RoleContext.tsx`)

**Changed:**
- `getCurrentPrincipal()` now uses `getPrincipal()` from II utils
- Removed Plug-specific `window.ic.plug` references
- Updated actor creation: `makeChildWithPlug` → `makeChildActor`
- Updated factoria actor: `makeFactoriaWithPlug` → `makeFactoriaActor`

### 5. **AuthPage UI Updated** (`features/auth/AuthPage.tsx`)

**Changed:**
- Wallet option changed from "Plug Wallet" to "Internet Identity"
- Icon changed from `Zap` to `Shield`
- Handler uses `loginWithInternetIdentity()` instead of `loginWithPlug()`
- Auth method check: `'plug'` → `'ii'`

---

## 🔧 Still Need Manual Updates

### 1. **OrgSelectorPage** (`features/org/OrgSelectorPage.tsx`)

**Current issue:**
```typescript
import { usePlugConnection } from "@/hooks/usePlugConnection";
```

**Action needed:**
Replace with:
```typescript
import { useAuth } from "@/contexts/AuthContext";

// Change:
const { isConnected, principal } = usePlugConnection();
// To:
const { isAuthenticated, principal } = useAuth();
```

### 2. **Remove Deprecated Files**

These files are no longer needed:
- `utils/plug.ts` ❌ (replaced by `internetIdentity.ts`)
- `hooks/usePlugConnection.ts` ❌ (use `useAuth` instead)
- `hooks/useWalletConnectionMonitor.ts` ❌ (II handles session automatically)

### 3. **Update connect2ic Configuration** (`connect2ic.ts`)

**Current:**
```typescript
import { PlugWallet } from '@connect2ic/core/providers/plug-wallet';
```

**If you're using connect2ic, update to:**
```typescript
import { InternetIdentity } from '@connect2ic/core/providers/internet-identity';

const client = createClient({
  providers: [
    new InternetIdentity()
  ],
  globalProviderConfig: {
    host: II_HOST,
  },
});
```

**Or remove connect2ic entirely** if you're only using II (we've implemented it directly).

---

## 🚀 Testing Checklist

### Authentication Flow
- [ ] Login with Internet Identity opens II window
- [ ] After login, principal is correctly retrieved
- [ ] Principal displays in UI (truncated format)
- [ ] Session persists on page reload
- [ ] Logout clears session and redirects to auth page

### Org Selection & Dashboard
- [ ] After II login, org selector loads organizations
- [ ] Can select an org and navigate to dashboard
- [ ] Dashboard shows correct user role (admin/awarder/member)
- [ ] Principal-based permissions work correctly

### Canister Calls
- [ ] Award reputation works (update calls)
- [ ] Revoke reputation works (update calls)
- [ ] View balances works (query calls)
- [ ] Transaction log works (query calls)
- [ ] Manage awarders works (update calls)

### Session Management
- [ ] Auto-login works on app restart
- [ ] No unexpected logouts during use
- [ ] Logout button properly ends session
- [ ] Switching between accounts works

---

## 📦 Dependencies

### Required Packages (should already be installed):
```json
{
  "@dfinity/auth-client": "^2.4.1",
  "@dfinity/agent": "^2.4.1",
  "@dfinity/identity": "^2.4.1",
  "@dfinity/principal": "^2.4.1"
}
```

### Can Remove (optional):
- `@connect2ic/core` (if not using other providers)
- `@connect2ic/react` (if not using other providers)
- Plug-related dependencies

---

## 🔐 How It Works

### Login Flow:
1. User clicks "Connect" button on AuthPage
2. `loginWithInternetIdentity()` called in AuthContext
3. Opens II authentication window (identity.ic0.app)
4. User authenticates with II (passkey/recovery phrase)
5. II returns authenticated identity
6. Identity stored in AuthClient (persisted in IndexedDB)
7. Principal extracted and stored in AuthContext
8. User redirected to org selector

### Actor Creation:
```typescript
// Old way (Plug):
const actor = await makeChildWithPlug({ canisterId });

// New way (II):
const actor = await makeChildActor({ canisterId });
// Automatically uses authenticated II identity
```

### Auto-Login:
```typescript
// On app mount, AuthContext runs:
const checkConnection = async () => {
  const isIIAuth = await checkIIAuth(); // checks AuthClient
  if (isIIAuth) {
    const iiPrincipal = await getPrincipal();
    // Set authenticated state
  }
};
```

---

## 🐛 Troubleshooting

### Issue: "Not authenticated" errors on canister calls
**Solution:** Make sure `loginWithInternetIdentity()` completed successfully before making calls.

### Issue: Session not persisting
**Solution:** Check browser allows IndexedDB (II stores session there).

### Issue: II login window doesn't open
**Solution:** 
- Check popup blocker
- Verify II_URL is correct for your environment
- Check console for CORS errors

### Issue: Principal is anonymous
**Solution:** Ensure `getIdentity()` returns non-anonymous identity. Check `await authClient.isAuthenticated()` returns true.

---

## 📝 Key Differences: Plug vs II

| Feature | Plug Wallet | Internet Identity |
|---------|------------|-------------------|
| **Type** | Browser Extension | Built-in IC Service |
| **Setup** | Requires installation | No installation needed |
| **Login** | Extension popup | Web-based (identity.ic0.app) |
| **Session** | Per-session | Persistent (IndexedDB) |
| **Principal** | `window.ic.plug.getPrincipal()` | `authClient.getIdentity().getPrincipal()` |
| **Agent** | `window.ic.plug.agent` | `new HttpAgent({ identity })` |
| **Auto-login** | Manual check | Built-in with `isAuthenticated()` |

---

## ✨ Benefits of II Migration

1. **✅ No Extension Required** - Works in any browser
2. **✅ Better UX** - One-click authentication with passkeys
3. **✅ More Secure** - No browser extension security risks
4. **✅ Native to IC** - First-class integration
5. **✅ Cross-Device** - Works on mobile and desktop
6. **✅ Persistent Sessions** - Auto-login on return visits
7. **✅ Simpler Code** - No wallet-specific logic

---

## 🎓 Next Steps

1. **Update OrgSelectorPage** to use `useAuth` instead of `usePlugConnection`
2. **Remove deprecated files** (plug.ts, usePlugConnection.ts, etc.)
3. **Test all user flows** with the checklist above
4. **Update documentation** to reflect II as the auth method
5. **Remove Plug mentions** from README and user guides
6. **Optional:** Add loading states for II login window
7. **Optional:** Add error handling for failed II logins

---

## 💡 Code Examples

### Example: Using II in a Component
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, principal, loginWithInternetIdentity, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Principal: {principal?.toString()}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={loginWithInternetIdentity}>
          Login with Internet Identity
        </button>
      )}
    </div>
  );
}
```

### Example: Making Authenticated Canister Calls
```typescript
import { makeChildActor } from '@/lib/canisters';

async function awardReputation(canisterId: string, userId: string, amount: number) {
  // Automatically uses authenticated II identity
  const actor = await makeChildActor({ canisterId });
  
  const result = await actor.awardReputation({
    userId: Principal.fromText(userId),
    amount: BigInt(amount),
    reason: "Great contribution!"
  });
  
  return result;
}
```

---

## 📚 Additional Resources

- [Internet Identity Docs](https://internetcomputer.org/docs/current/developer-docs/integrations/internet-identity/overview)
- [@dfinity/auth-client](https://www.npmjs.com/package/@dfinity/auth-client)
- [IC Authentication Best Practices](https://internetcomputer.org/docs/current/developer-docs/integrations/internet-identity/integrate-internet-identity)

---

**Migration Status:** 🟡 **~80% Complete**
- ✅ Core authentication system migrated
- ✅ Canister actor creation updated
- ✅ Auth UI updated
- 🟡 Need to update OrgSelector
- 🟡 Need to remove deprecated files
- ⚪ Testing pending

---

*Generated: $(date)
*Migrated from: Plug Wallet
*Migrated to: Internet Identity
*Project: Reputation DAO
