# 🚀 ICP DAO Integration Package for Lovable Frontend

## 📦 Essential Files to Copy

### **1. Core ICP Integration (CRITICAL - Copy First)**
```
frontend/src/components/canister/reputationDao.ts    [608 lines - ALL canister functions]
frontend/src/components/canister/blogBackend.tsx     [14 lines - Blog integration]
frontend/src/connect2ic.ts                           [22 lines - Multi-wallet setup]
```

### **2. Authentication System (ESSENTIAL)**
```
frontend/src/contexts/AuthContext.tsx                [98 lines - Internet Identity auth]
frontend/src/contexts/RoleContext.tsx                [159 lines - Role management] 
frontend/src/services/internetIdentity.ts            [148 lines - II service]
frontend/src/utils/connectionManager.ts              [139 lines - Connection management]
frontend/src/hooks/usePlugConnection.ts              [68 lines - Plug wallet hook]
```

### **3. Core DAO Pages (BUSINESS LOGIC)**
```
frontend/src/pages/Dashboard.tsx                     [Main dashboard]
frontend/src/pages/AwardRep.tsx                      [Award reputation points]
frontend/src/pages/RevokeRep.tsx                     [Revoke reputation points]
frontend/src/pages/ManageAwarders.tsx                [Manage trusted awarders]
frontend/src/pages/ViewBalances.tsx                  [View user balances]
frontend/src/pages/TransactionLogSimple.tsx          [Transaction history]
frontend/src/pages/DecaySystemPage.tsx               [Decay system management]
frontend/src/pages/OrgSelector.tsx                   [Organization selector]
```

### **4. Decay System Components (COMPLETE FOLDER)**
```
frontend/src/components/decay/                       [Entire folder - 8 files]
├── DecayStatusCard.tsx                              [User decay status]
├── DecayConfigPanel.tsx                             [Admin decay config]
├── DecayAnalytics.tsx                               [Decay analytics]
├── DecayHistoryChart.tsx                            [Decay charts]
├── DecayTransactionFilter.tsx                       [Decay transactions]
├── DecayDashboard.tsx                               [Complete decay dashboard]
├── index.ts                                         [Exports]
└── README.md                                        [Component docs]
```

### **5. Backend Type Definitions (REQUIRED)**
```
src/declarations/reputation_dao/reputation_dao.did.d.ts    [TypeScript interfaces]
src/declarations/reputation_dao/reputation_dao.did.js     [JavaScript definitions]
src/declarations/reputation_dao/index.d.ts               [Index definitions]
src/declarations/reputation_dao/index.js                 [Index exports]
src/declarations/blog_backend/                           [Blog backend types]
```

---

## 🔧 Integration Steps

### **Step 1: Install ICP Dependencies**
Add these to your `package.json`:

```json
{
  "dependencies": {
    "@connect2ic/core": "^0.2.0-beta.24",
    "@connect2ic/react": "^0.2.0-beta.24",
    "@dfinity/agent": "^2.4.1",
    "@dfinity/auth-client": "^2.4.1",
    "@dfinity/identity": "^2.4.1",
    "@dfinity/principal": "^2.4.1",
    "buffer": "^6.0.3",
    "process": "^0.11.10"
  }
}
```

### **Step 2: Add ICP Polyfills to main.tsx**
Add these lines at the very top of your main entry file:

```typescript
// ===== Polyfills for ICP compatibility =====
import { Buffer } from 'buffer';

(window as any).global ||= window;
(window as any).Buffer ||= Buffer;
(window as any).process ||= { env: {} };
```

### **Step 3: Add Plug Wallet Types**
Add to your global types or vite-env.d.ts:

```typescript
declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (options: any) => Promise<boolean>;
        isConnected: () => Promise<boolean>;
        createAgent: (options: any) => Promise<void>;
        createActor: (options: any) => Promise<any>;
        agent: any;
        disconnect: () => Promise<void>;
      };
    };
  }
}
```

### **Step 4: Update Canister IDs**
In the copied files, update these canister IDs to match your deployment:

```typescript
// In reputationDao.ts
const canisterId = 'YOUR_REPUTATION_DAO_CANISTER_ID';

// In blogBackend.tsx  
const canisterId = 'YOUR_BLOG_CANISTER_ID';

// In connect2ic.ts
const canisterId = 'YOUR_REPUTATION_DAO_CANISTER_ID';

// In internetIdentity.ts
const CANISTER_ID = 'YOUR_REPUTATION_DAO_CANISTER_ID';
```

### **Step 5: Wrap Your App with Providers**
Update your main App component:

```typescript
import { AuthProvider } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        {/* Your app content */}
      </RoleProvider>
    </AuthProvider>
  );
}
```

### **Step 6: Create Protected Routes**
Add a ProtectedRoute component (copy from original or create):

```typescript
import { useRole } from './contexts/RoleContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { userRole, loading } = useRole();
  
  if (loading) return <div>Loading...</div>;
  if (!requiredRole.includes(userRole)) return <div>Access Denied</div>;
  
  return children;
};
```

---

## 🎯 Key Features You'll Get

### **✅ Multi-Wallet Support**
- Plug Wallet integration
- Internet Identity support
- Stoic Wallet (optional)

### **✅ Complete DAO Functionality**
- Award/Revoke reputation points
- Manage trusted awarders
- View user balances and rankings
- Transaction history with filtering
- Organization management

### **✅ Advanced Decay System**
- Configurable reputation decay
- Real-time decay analytics
- User decay status monitoring
- Admin decay management tools

### **✅ Role-Based Access Control**
- Admin, Awarder, User roles
- Organization-based permissions
- Protected routes and components

---

## 🔥 Usage Examples

### **Connect to Wallet**
```typescript
import { usePlugConnection } from './hooks/usePlugConnection';

const { connect, isConnected, principal } = usePlugConnection();

// Connect button
<button onClick={connect}>
  {isConnected ? `Connected: ${principal}` : 'Connect Wallet'}
</button>
```

### **Award Reputation**
```typescript
import { awardRep } from './components/canister/reputationDao';

const handleAward = async () => {
  try {
    const result = await awardRep(orgId, userPrincipal, amount, reason);
    console.log('Award successful:', result);
  } catch (error) {
    console.error('Award failed:', error);
  }
};
```

### **Check User Role**
```typescript
import { useRole } from './contexts/RoleContext';

const { userRole, isAdmin, isAwarder } = useRole();

return (
  <div>
    {isAdmin && <AdminPanel />}
    {isAwarder && <AwarderPanel />}
    <UserDashboard />
  </div>
);
```

### **Decay System Integration**
```typescript
import { DecayDashboard } from './components/decay';

// Complete decay system in one component
<DecayDashboard />
```

---

## ⚡ Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Copy all the files to your Lovable project

# 3. Update canister IDs in the integration files

# 4. Add providers to your App.tsx

# 5. Start development
npm run dev
```

---

## 🎉 Result

You'll have a **complete ICP DAO frontend** with:
- **Modern Lovable UI** + **Full ICP Backend Integration**
- **Multi-wallet authentication** 
- **Complete reputation system**
- **Advanced decay mechanics**
- **Role-based permissions**
- **Transaction management**
- **Organization support**

**Total Integration Time: 1-2 hours** ⚡

---

## 📞 Support

All integration functions are well-documented and typed. The decay system includes comprehensive README.md with usage examples.

**Key Integration Functions:**
- `getPlugActor()` - Connect to backend
- `awardRep()`, `revokeRep()` - Reputation management
- `getBalance()`, `getTransactionHistory()` - Data retrieval
- `configureDecay()` - Decay system configuration

🚀 **You're ready to launch a professional ICP DAO with modern UI!**
