# Mainnet Deployment Guide

## 🎯 Overview
This guide is for deploying the Reputation DAO DApp to Internet Computer Mainnet after migrating from Plug Wallet to Internet Identity.

---

## ✅ Pre-Deployment Checklist

All configuration files have been updated for mainnet:

- ✅ **frontend/.env** - Updated with mainnet canister IDs
- ✅ **canister_ids.json** - Contains mainnet IDs
- ✅ **dfx.json** - Canister IDs configured
- ✅ **Internet Identity migration** - Complete
- ✅ **All deprecated Plug files** - Removed

---

## 📋 Mainnet Canister IDs

| Canister | Mainnet ID | URL |
|----------|-----------|-----|
| **factoria** | `ttoz7-uaaaa-aaaam-qd34a-cai` | [View on IC Dashboard](https://dashboard.internetcomputer.org/canister/ttoz7-uaaaa-aaaam-qd34a-cai) |
| **reputation_dao** | `owyeu-jiaaa-aaaam-qdvwq-cai` | [View on IC Dashboard](https://dashboard.internetcomputer.org/canister/owyeu-jiaaa-aaaam-qdvwq-cai) |
| **blog_backend** | `oy2j4-syaaa-aaaam-qdvxq-cai` | [View on IC Dashboard](https://dashboard.internetcomputer.org/canister/oy2j4-syaaa-aaaam-qdvxq-cai) |
| **frontend** | `37le5-2yaaa-aaaam-qdwhq-cai` | [View DApp](https://37le5-2yaaa-aaaam-qdwhq-cai.ic0.app/) |

---

## 🚀 Deployment Steps

### 1. Verify DFX Identity

```bash
# Check your current identity
dfx identity whoami

# Ensure you're using the correct identity with cycles
dfx identity get-principal
```

### 2. Check Cycles Balance

```bash
# Check your cycles wallet balance
dfx wallet balance --network ic

# If low on cycles, you'll need to top up first
```

### 3. Build Frontend

```bash
cd frontend
npm install  # Ensure dependencies are up to date
npm run build
cd ..
```

### 4. Deploy to Mainnet

```bash
# Deploy all canisters to mainnet
dfx deploy --network ic

# Or deploy individual canisters:
dfx deploy reputation_dao --network ic
dfx deploy factoria --network ic
dfx deploy blog_backend --network ic
dfx deploy frontend --network ic
```

### 5. Initialize Canisters (if needed)

If the reputation_dao canister requires initialization:

```bash
# The canister may ask for initialization arguments
# Follow the prompts to provide admin principals
```

---

## 🔧 Post-Deployment Configuration

### Update Canister Settings (Optional)

```bash
# Set canister controllers
dfx canister update-settings reputation_dao --add-controller <PRINCIPAL> --network ic

# Check canister status
dfx canister status reputation_dao --network ic
dfx canister status factoria --network ic
```

### Verify Deployment

1. Visit your frontend: https://37le5-2yaaa-aaaam-qdwhq-cai.ic0.app/
2. Test Internet Identity login
3. Verify organization creation works
4. Test reputation awarding functionality

---

## 🧪 Testing on Mainnet

### 1. Internet Identity Login
- ✅ Click "Connect with Internet Identity"
- ✅ Should redirect to https://identity.ic0.app
- ✅ Login/create II anchor
- ✅ Redirect back to your app authenticated

### 2. Session Persistence
- ✅ Refresh the page
- ✅ Should remain logged in (no re-authentication needed)

### 3. Organization Management
- ✅ Create a new organization
- ✅ Select an organization
- ✅ View organization dashboard

### 4. Reputation System
- ✅ Award reputation (if you're an admin/awarder)
- ✅ View reputation leaderboard
- ✅ Check transaction history

### 5. Role-Based Access
- ✅ Admin features work for admins
- ✅ Awarder features work for awarders
- ✅ Member features accessible to all

---

## 🔍 Troubleshooting

### Frontend Not Loading
```bash
# Check if frontend assets were uploaded
dfx canister info frontend --network ic

# Redeploy frontend
cd frontend && npm run build && cd ..
dfx deploy frontend --network ic
```

### Authentication Issues
- Verify `.env` has `VITE_IC_HOST=https://icp-api.io`
- Check browser console for errors
- Clear browser cache and IndexedDB

### Canister Call Failures
```bash
# Check canister cycles balance
dfx canister status reputation_dao --network ic

# Top up if needed
dfx canister deposit-cycles 1000000000000 reputation_dao --network ic
```

### CORS Issues
- Ensure frontend canister has correct settings
- Check Network tab in browser DevTools

---

## 📊 Monitoring & Maintenance

### Check Canister Health

```bash
# View canister metrics
dfx canister call factoria childHealth '(principal "owyeu-jiaaa-aaaam-qdvwq-cai")' --network ic

# Check cycles balance regularly
dfx canister status reputation_dao --network ic
dfx canister status factoria --network ic
```

### Set Up Cycle Monitoring

Consider setting up alerts when cycles drop below threshold:
- Use IC Dashboard: https://dashboard.internetcomputer.org
- Or use dfx commands in cron jobs

### Backup Important Data

```bash
# Export canister state periodically
dfx canister call reputation_dao exportTransactions --network ic
```

---

## 🔐 Security Considerations

1. **Controller Management**
   - Ensure only trusted principals are controllers
   - Use blackhole canister for immutable canisters

2. **Cycles Management**
   - Keep sufficient cycles in all canisters
   - Monitor cycle burn rate

3. **Access Control**
   - Verify admin/awarder lists are correct
   - Test role-based permissions

4. **Data Privacy**
   - Review which data is public vs private
   - Ensure PII is handled correctly

---

## 📝 Environment Variables Reference

Your `frontend/.env` should contain:

```bash
# Mainnet Canister IDs
VITE_FACTORIA_CANISTER_ID=ttoz7-uaaaa-aaaam-qd34a-cai
VITE_REPUTATION_DAO_CANISTER_ID=owyeu-jiaaa-aaaam-qdvwq-cai
VITE_FRONTEND_CANISTER_ID=37le5-2yaaa-aaaam-qdwhq-cai
VITE_BLOG_BACKEND_CANISTER_ID=oy2j4-syaaa-aaaam-qdvxq-cai

# Network configuration - IC Mainnet
VITE_IC_HOST=https://icp-api.io
```

---

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Frontend loads at https://37le5-2yaaa-aaaam-qdwhq-cai.ic0.app/
- ✅ Internet Identity login works smoothly
- ✅ You can create and manage organizations
- ✅ Reputation awarding functions correctly
- ✅ All role-based features work as expected
- ✅ Session persists across page refreshes
- ✅ No console errors in browser DevTools

---

## 📞 Support Resources

- **Internet Identity Docs**: https://internetcomputer.org/docs/current/references/ii-spec
- **IC Dashboard**: https://dashboard.internetcomputer.org
- **dfx Documentation**: https://internetcomputer.org/docs/current/developer-docs/setup/install/
- **Migration Docs**: See `MIGRATION_COMPLETE.md` in this repository

---

## 🔄 Rollback Plan (If Needed)

If issues arise after deployment:

1. **Keep old version accessible** - Don't delete old canister IDs
2. **Test thoroughly** - Use playground first (already done ✅)
3. **Deploy incrementally** - Deploy backend first, then frontend
4. **Monitor logs** - Check for errors after each deployment

---

**Last Updated**: October 13, 2025  
**Status**: ✅ Ready for Mainnet Deployment  
**Migration**: ✅ Plug → Internet Identity Complete
