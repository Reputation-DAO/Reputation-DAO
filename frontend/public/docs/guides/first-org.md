# Your First Organization

Deploy your first Reputation DAO organization in 10 minutes.

## Prerequisites

Before starting, ensure you have:

- ✅ DFX 0.27.0 installed
- ✅ Local replica running (`dfx start --background`)
- ✅ Factory canister deployed
- ✅ Child WASM uploaded to factory

If you haven't done these steps, see [Getting Started](/docs/getting-started).

## Step 1: Get Your Principal

```bash
dfx identity get-principal
```

Save this principal - you'll need it!

## Step 2: Create the Organization

```bash
OWNER=$(dfx identity get-principal)

dfx canister call factoria createChildForOwner \
  "(principal \"$OWNER\", 1_000_000_000_000:nat, vec {}, \"My First DAO\")"
```

**Expected output:**
```
(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")
```

Save this child canister ID!

## Step 3: Verify Creation

```bash
CHILD_ID="xxxxx-xxxxx-xxxxx-xxxxx-cai"  # Replace with your ID

# Check the child exists
dfx canister call factoria getChild "(principal \"$CHILD_ID\")"

# Check child health
dfx canister call $CHILD_ID health
```

## Step 4: Add Yourself as an Awarder

```bash
dfx canister call $CHILD_ID addTrustedAwarder \
  "(principal \"$OWNER\", \"Founder\")"
```

## Step 5: Award Your First Reputation

```bash
# Award yourself some reputation
dfx canister call $CHILD_ID awardRep \
  "(principal \"$OWNER\", 100:nat, opt \"Genesis award\")"

# Check your balance
dfx canister call $CHILD_ID getBalance \
  "(principal \"$OWNER\")"
```

## Step 6: Configure the Frontend

Update `frontend/.env`:

```env
VITE_REPUTATION_DAO_CANISTER_ID=xxxxx-xxxxx-xxxxx-xxxxx-cai
```

Restart the dev server:

```bash
cd frontend
npm run dev
```

## Step 7: Connect with Plug

1. Visit http://localhost:5173
2. Click "Connect Wallet"
3. Select your organization
4. Start awarding reputation!

## Next Steps

### 👥 [Managing Awarders](/docs/guides/awarders)
Learn how to add and manage awarders in your organization

### ⏰ [Configuring Decay](/docs/guides/decay-config)
Set up reputation decay to keep scores fresh and relevant

### ⚛️ [Frontend Integration](/docs/guides/frontend-integration)
Connect your React app to display reputation data
