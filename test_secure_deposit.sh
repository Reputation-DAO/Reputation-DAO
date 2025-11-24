#!/bin/bash
set -e

echo "=== Testing Secure Deposit System ==="

TREASURY_ID=$(dfx canister id treasury --network local)
ORG_ID=$(dfx canister id reputation_dao --network local)

echo "Treasury: $TREASURY_ID"
echo "Org: $ORG_ID"

# Test 1: Try to record fake deposit (should fail)
echo ""
echo "Test 1: Attempting fake deposit (should fail)..."
dfx canister call treasury recordOrgDeposit \
  "(principal \"$ORG_ID\", variant { ICP }, 100000000:nat, opt \"fake deposit\")" \
  --network local || echo "✅ Correctly rejected fake deposit"

# Test 2: Get deposit account info
echo ""
echo "Test 2: Getting deposit account..."
dfx canister call treasury getOrgRailDepositAddress \
  "(principal \"$ORG_ID\", variant { ICP })" \
  --network local

echo ""
echo "=== Tests Complete ==="
echo "Frontend running at: http://localhost:8080"
echo "Navigate to: /dashboard/economy-settings/$ORG_ID"
