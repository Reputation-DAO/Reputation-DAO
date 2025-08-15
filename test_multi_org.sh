#!/bin/bash

# Multi-Organization Reputation DAO Test Script
# Make sure you're in the project root directory

CANISTER_ID="zneqq-taaaa-aaaab-qaccq-cai"
NETWORK="--network playground"

echo "🧪 Testing Multi-Organization Reputation DAO"
echo "============================================"

# Test 1: Register Organizations
echo ""
echo "📝 Test 1: Register Organizations"
echo "dfx canister call $CANISTER_ID registerOrg '(\"TechDAO\")' $NETWORK"
dfx canister call $CANISTER_ID registerOrg '("TechDAO")' $NETWORK

echo ""
echo "dfx canister call $CANISTER_ID registerOrg '(\"GameDAO\")' $NETWORK"
dfx canister call $CANISTER_ID registerOrg '("GameDAO")' $NETWORK

# Try to register duplicate (should fail)
echo ""
echo "🚫 Test 1b: Try to register duplicate org (should fail)"
echo "dfx canister call $CANISTER_ID registerOrg '(\"TechDAO\")' $NETWORK"
dfx canister call $CANISTER_ID registerOrg '("TechDAO")' $NETWORK

# Test 2: List all organizations
echo ""
echo "📋 Test 2: List all organizations"
echo "dfx canister call $CANISTER_ID getAllOrgs '()' $NETWORK"
dfx canister call $CANISTER_ID getAllOrgs '()' $NETWORK

# Test 3: Get organization admins
echo ""
echo "👑 Test 3: Get organization admins"
echo "dfx canister call $CANISTER_ID getOrgAdmin '(\"TechDAO\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgAdmin '("TechDAO")' $NETWORK

echo ""
echo "dfx canister call $CANISTER_ID getOrgAdmin '(\"GameDAO\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgAdmin '("GameDAO")' $NETWORK

# Test 4: Get trusted awarders (should include admin by default)
echo ""
echo "⭐ Test 4: Get trusted awarders"
echo "dfx canister call $CANISTER_ID getOrgTrustedAwarders '(\"TechDAO\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgTrustedAwarders '("TechDAO")' $NETWORK

# Test 5: Award reputation in TechDAO
echo ""
echo "🎁 Test 5: Award reputation in TechDAO (as admin/awarder)"
USER_PRINCIPAL="rdmx6-jaaaa-aaaah-qca2a-cai"  # Example user principal
echo "dfx canister call $CANISTER_ID awardOrgRep '(\"TechDAO\", principal \"$USER_PRINCIPAL\", 25, opt \"Good contribution\")' $NETWORK"
dfx canister call $CANISTER_ID awardOrgRep "(\"TechDAO\", principal \"$USER_PRINCIPAL\", 25, opt \"Good contribution\")" $NETWORK

# Test 6: Check user balance in TechDAO
echo ""
echo "💰 Test 6: Check user balance in TechDAO"
echo "dfx canister call $CANISTER_ID getOrgBalance '(\"TechDAO\", principal \"$USER_PRINCIPAL\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgBalance "(\"TechDAO\", principal \"$USER_PRINCIPAL\")" $NETWORK

# Test 7: Check user balance in GameDAO (should be 0)
echo ""
echo "💰 Test 7: Check user balance in GameDAO (should be 0)"
echo "dfx canister call $CANISTER_ID getOrgBalance '(\"GameDAO\", principal \"$USER_PRINCIPAL\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgBalance "(\"GameDAO\", principal \"$USER_PRINCIPAL\")" $NETWORK

# Test 8: Get organization stats
echo ""
echo "📊 Test 8: Get organization stats"
echo "dfx canister call $CANISTER_ID getOrgStats '(\"TechDAO\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgStats '("TechDAO")' $NETWORK

echo ""
echo "dfx canister call $CANISTER_ID getOrgStats '(\"GameDAO\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgStats '("GameDAO")' $NETWORK

# Test 9: Get organization transactions
echo ""
echo "📜 Test 9: Get organization transactions"
echo "dfx canister call $CANISTER_ID getOrgTransactions '(\"TechDAO\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgTransactions '("TechDAO")' $NETWORK

# Test 10: Try to revoke reputation (as admin)
echo ""
echo "📉 Test 10: Revoke reputation in TechDAO (as admin)"
echo "dfx canister call $CANISTER_ID revokeOrgRep '(\"TechDAO\", principal \"$USER_PRINCIPAL\", 10, opt \"Policy violation\")' $NETWORK"
dfx canister call $CANISTER_ID revokeOrgRep "(\"TechDAO\", principal \"$USER_PRINCIPAL\", 10, opt \"Policy violation\")" $NETWORK

# Test 11: Check updated balance
echo ""
echo "💰 Test 11: Check updated balance after revocation"
echo "dfx canister call $CANISTER_ID getOrgBalance '(\"TechDAO\", principal \"$USER_PRINCIPAL\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgBalance "(\"TechDAO\", principal \"$USER_PRINCIPAL\")" $NETWORK

echo ""
echo "✅ Multi-Organization Testing Complete!"
echo "Check the outputs above to verify functionality."
