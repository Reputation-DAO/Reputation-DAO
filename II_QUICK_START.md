# 🚀 Internet Identity - Quick Implementation Guide

## Immediate Next Steps

### 1. Update OrgSelectorPage (5 min)

**File:** `frontend/src/features/org/OrgSelectorPage.tsx`

**Find and replace:**
```typescript
// OLD:
import { usePlugConnection } from "@/hooks/usePlugConnection";
const { isConnected, principal, checkConnection } = usePlugConnection();

// NEW:
import { useAuth } from "@/contexts/AuthContext";
const { isAuthenticated, principal, checkConnection } = useAuth();
```

**Update all references:**
- `isConnected` → `isAuthenticated`
- Keep `principal` and `checkConnection` as-is

---

### 2. Install Dependencies (if needed)

```bash
cd frontend
npm install @dfinity/auth-client @dfinity/agent @dfinity/identity @dfinity/principal
```

---

### 3. Test the Login Flow

```bash
# Start your local replica
dfx start --clean --background

# Deploy canisters
dfx deploy

# Start frontend
cd frontend
npm run dev
```

**Test Steps:**
1. Navigate to `/auth`
2. Click "Connect" on Internet Identity
3. II window should open
4. Complete authentication
5. Should redirect to org selector
6. Principal should display correctly

---

## 🔥 Common Issues & Quick Fixes

### Issue: "Cannot find module '@/utils/internetIdentity'"
**Fix:** Make sure you created the file at:
```
frontend/src/utils/internetIdentity.ts
```

### Issue: TypeScript errors about 'loginWithPlug'
**Fix:** Search for `loginWithPlug` and replace with `loginWithInternetIdentity`

### Issue: II login window doesn't open
**Fix:** Check browser popup blocker. Whitelist `identity.ic0.app`

### Issue: "Not authenticated" on canister calls
**Fix:** Ensure login completed before calling `getActor()` or `makeChildActor()`

---

## 🎯 Minimal Working Example

### Login Component
```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginButton() {
  const { isAuthenticated, loginWithInternetIdentity, principal } = useAuth();
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    try {
      await loginWithInternetIdentity();
      navigate('/org-selector'); // Redirect after login
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };
  
  if (isAuthenticated) {
    return <div>Connected: {principal?.toString().slice(0, 10)}...</div>;
  }
  
  return <button onClick={handleLogin}>Login with II</button>;
}
```

### Making Canister Calls
```tsx
import { useAuth } from '@/contexts/AuthContext';
import { makeChildActor } from '@/lib/canisters';
import { Principal } from '@dfinity/principal';

export function AwardButton({ orgId, userId, amount }) {
  const { isAuthenticated } = useAuth();
  
  const handleAward = async () => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }
    
    try {
      const actor = await makeChildActor({ canisterId: orgId });
      const result = await actor.awardReputation({
        user: Principal.fromText(userId),
        amount: BigInt(amount),
        reason: "Great work!"
      });
      console.log('Success:', result);
    } catch (error) {
      console.error('Award failed:', error);
    }
  };
  
  return <button onClick={handleAward}>Award Reputation</button>;
}
```

---

## 📋 Final Checklist

Before considering migration complete:

- [ ] All `loginWithPlug` replaced with `loginWithInternetIdentity`
- [ ] All `makeChildWithPlug` replaced with `makeChildActor`
- [ ] All `makeFactoriaWithPlug` replaced with `makeFactoriaActor`
- [ ] `OrgSelectorPage` updated to use `useAuth`
- [ ] Removed `usePlugConnection` hook usage
- [ ] Tested login/logout flow
- [ ] Tested org selection
- [ ] Tested canister calls (award, revoke, view balances)
- [ ] Tested session persistence (refresh page while logged in)
- [ ] Updated documentation/README

---

## 🆘 Need Help?

### Debug Mode
Enable detailed logging:
```typescript
// In internetIdentity.ts, enable all console.log statements
// Check browser console for authentication flow
```

### Check Authentication State
```typescript
// In browser console:
localStorage.getItem('ic-authentication'); // Should exist when logged in
```

### Verify Principal
```typescript
import { getPrincipal } from '@/utils/internetIdentity';

// In component:
const principal = await getPrincipal();
console.log('Current principal:', principal?.toString());
```

---

## 💡 Pro Tips

1. **Session Persistence:** II automatically saves sessions. Users stay logged in across page reloads.

2. **Anonymous vs Authenticated:** If you need read-only access before login, the actors gracefully fall back to anonymous mode.

3. **Error Handling:** Always wrap II calls in try/catch. User might cancel the login.

4. **Testing Locally:** Use `http://localhost:4943` for local II or configure to use mainnet II even in development.

5. **Multiple Identities:** Users can create multiple II identities. Each has its own principal.

---

## 🎉 You're Done!

Your DApp now uses Internet Identity instead of Plug wallet!

**Benefits:**
- ✅ Works on any device/browser
- ✅ Better security (no extension)
- ✅ Simpler user onboarding
- ✅ Native IC integration
- ✅ Persistent sessions

**Next:** Test thoroughly and update user documentation!

---

*For detailed information, see: [INTERNET_IDENTITY_MIGRATION.md](./INTERNET_IDENTITY_MIGRATION.md)*
