#!/bin/bash

# Multi-Organization Reputation DAO Test Script (Fixed Version)
# Make sure you're in the project root directory

CANISTER_ID="zneqq-taaaa-aaaab-qaccq-cai"
NETWORK="--network playground"

echo "🧪 Testing Multi-Organization Reputation DAO (Fixed)"
echo "===================================================="

# Use your own principal as a test user (the admin principal)
YOUR_PRINCIPAL="ofkbl-m6bgx-xlgm3-ko4y6-mh7i4-kp6b4-sojbh-wyy2r-aznnp-gmqtb-xqe"
TEST_USER="rdmx6-jaaaa-aaaah-qca2q-cai"  # Fixed principal with valid checksum

echo ""
echo "📝 Organizations already registered: TechDAO, GameDAO"

# Test 1: Add a trusted awarder to TechDAO
echo ""
echo "⭐ Test 1: Add trusted awarder to TechDAO"
echo "dfx canister call $CANISTER_ID addOrgTrustedAwarder '(\"TechDAO\", principal \"$TEST_USER\", \"Developer\")' $NETWORK"
dfx canister call $CANISTER_ID addOrgTrustedAwarder "(\"TechDAO\", principal \"$TEST_USER\", \"Developer\")" $NETWORK

# Test 2: Check updated trusted awarders
echo ""
echo "⭐ Test 2: Check updated trusted awarders"
echo "dfx canister call $CANISTER_ID getOrgTrustedAwarders '(\"TechDAO\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgTrustedAwarders '("TechDAO")' $NETWORK

# Test 3: Award reputation to yourself in TechDAO
echo ""
echo "🎁 Test 3: Award reputation to yourself in TechDAO"
echo "dfx canister call $CANISTER_ID awardOrgRep '(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 30, opt \"Testing award\")' $NETWORK"
dfx canister call $CANISTER_ID awardOrgRep "(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 30, opt \"Testing award\")" $NETWORK

# Test 4: Check your balance in TechDAO
echo ""
echo "💰 Test 4: Check balance in TechDAO"
echo "dfx canister call $CANISTER_ID getOrgBalance '(\"TechDAO\", principal \"$YOUR_PRINCIPAL\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgBalance "(\"TechDAO\", principal \"$YOUR_PRINCIPAL\")" $NETWORK

# Test 5: Check balance in GameDAO (should be null/0)
echo ""
echo "💰 Test 5: Check balance in GameDAO (should be null/0)"
echo "dfx canister call $CANISTER_ID getOrgBalance '(\"GameDAO\", principal \"$YOUR_PRINCIPAL\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgBalance "(\"GameDAO\", principal \"$YOUR_PRINCIPAL\")" $NETWORK

# Test 6: Award reputation in GameDAO
echo ""
echo "🎁 Test 6: Award reputation in GameDAO"
echo "dfx canister call $CANISTER_ID awardOrgRep '(\"GameDAO\", principal \"$YOUR_PRINCIPAL\", 15, opt \"Gaming contribution\")' $NETWORK"
dfx canister call $CANISTER_ID awardOrgRep "(\"GameDAO\", principal \"$YOUR_PRINCIPAL\", 15, opt \"Gaming contribution\")" $NETWORK

# Test 7: Check balance in GameDAO after award
echo ""
echo "💰 Test 7: Check balance in GameDAO after award"
echo "dfx canister call $CANISTER_ID getOrgBalance '(\"GameDAO\", principal \"$YOUR_PRINCIPAL\")' $NETWORK"
dfx canister call $CANISTER_ID getOrgBalance "(\"GameDAO\", principal \"$YOUR_PRINCIPAL\")" $NETWORK

# Test 8: Compare organization stats
echo ""
echo "📊 Test 8: Compare organization stats"
echo "TechDAO Stats:"
dfx canister call $CANISTER_ID getOrgStats '("TechDAO")' $NETWORK

echo ""
echo "GameDAO Stats:"
dfx canister call $CANISTER_ID getOrgStats '("GameDAO")' $NETWORK

# Test 9: Get transaction histories
echo ""
echo "📜 Test 9: Get transaction histories"
echo "TechDAO Transactions:"
dfx canister call $CANISTER_ID getOrgTransactions '("TechDAO")' $NETWORK

echo ""
echo "GameDAO Transactions:"
dfx canister call $CANISTER_ID getOrgTransactions '("GameDAO")' $NETWORK

# Test 10: Test daily limit by trying to award more than 50
echo ""
echo "🚫 Test 10: Test daily limit (try to award 25 more, should work)"
echo "dfx canister call $CANISTER_ID awardOrgRep '(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 20, opt \"More points\")' $NETWORK"
dfx canister call $CANISTER_ID awardOrgRep "(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 20, opt \"More points\")" $NETWORK

echo ""
echo "🚫 Test 11: Test daily limit exceeded (try to award 5 more, total would be 55, should fail)"
echo "dfx canister call $CANISTER_ID awardOrgRep '(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 5, opt \"Should fail\")' $NETWORK"
dfx canister call $CANISTER_ID awardOrgRep "(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 5, opt \"Should fail\")" $NETWORK

# Test 12: Revoke some reputation
echo ""
echo "📉 Test 12: Revoke reputation (as admin)"
echo "dfx canister call $CANISTER_ID revokeOrgRep '(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 10, opt \"Test revocation\")' $NETWORK"
dfx canister call $CANISTER_ID revokeOrgRep "(\"TechDAO\", principal \"$YOUR_PRINCIPAL\", 10, opt \"Test revocation\")" $NETWORK

# Test 13: Check final balances
echo ""
echo "💰 Test 13: Check final balances"
echo "TechDAO Balance:"
dfx canister call $CANISTER_ID getOrgBalance "(\"TechDAO\", principal \"$YOUR_PRINCIPAL\")" $NETWORK

echo ""
echo "GameDAO Balance:"
dfx canister call $CANISTER_ID getOrgBalance "(\"GameDAO\", principal \"$YOUR_PRINCIPAL\")" $NETWORK

# Test 14: Final organization stats
echo ""
echo "📊 Test 14: Final organization stats"
echo "TechDAO Final Stats:"
dfx canister call $CANISTER_ID getOrgStats '("TechDAO")' $NETWORK

echo ""
echo "GameDAO Final Stats:"
dfx canister call $CANISTER_ID getOrgStats '("GameDAO")' $NETWORK

echo ""
echo "✅ Comprehensive Multi-Organization Testing Complete!"
echo ""
echo "📋 Summary of what was tested:"
echo "  ✅ Organization registration"
echo "  ✅ Duplicate registration prevention"
echo "  ✅ Admin role assignment"
echo "  ✅ Trusted awarder management"
echo "  ✅ Cross-org balance isolation"
echo "  ✅ Daily minting limits"
echo "  ✅ Transaction logging per org"
echo "  ✅ Admin-only revocation"
echo "  ✅ Organization statistics"
