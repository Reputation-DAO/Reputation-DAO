#!/usr/bin/env bash
set -euo pipefail

# Single FAIL banner if anything blows up outside explicitly tolerated sections
trap 'echo; echo "❌ Treasury test script FAILED (see logs above)."; exit 1' ERR

NETWORK=${NETWORK:-local}
TREASURY_CANISTER=${TREASURY_CANISTER:-treasury}

echo "=== Treasury local test script ==="
echo "Network  : $NETWORK"
echo "Treasury : $TREASURY_CANISTER"

ME_PRINCIPAL=$(dfx identity get-principal)
TREASURY_ID=$(dfx canister --network "$NETWORK" id "$TREASURY_CANISTER")

# Use reputation_dao canister ID as a dummy OrgId if present, otherwise fall back to caller
set +e
ORG_ID_CANDIDATE=$(dfx canister --network "$NETWORK" id reputation_dao 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$ORG_ID_CANDIDATE" ]; then
  ORG_ID="$ORG_ID_CANDIDATE"
else
  ORG_ID="$ME_PRINCIPAL"
fi
set -e

echo "Caller principal : $ME_PRINCIPAL"
echo "Treasury ID      : $TREASURY_ID"
echo "Test OrgId       : $ORG_ID"
echo

#############################################
# 0. Bootstrap admin + factory
#############################################

echo "== 0.1 setFactory (first call also claims admin) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  setFactory "(principal \"$ME_PRINCIPAL\")"

echo
echo "== 0.2 configureGovernanceControllers([]) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  configureGovernanceControllers '(vec {})'

echo
echo "== 0.3 getFactoryVaultBalance (should be zero) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getFactoryVaultBalance

#############################################
# 1. Register Org with inline OrgConfig
#############################################

ORG_ARG_FILE=".dfx/$NETWORK/treasury_test_org_config.arg"
mkdir -p ".dfx/$NETWORK"

echo
echo "== 1.1 Writing OrgConfig argument file: $ORG_ARG_FILE =="

cat > "$ORG_ARG_FILE" <<EOF
(
  principal "$ORG_ID",
  record {
    rails = record {
      btc = true;
      icp = true;
      eth = true;
    };
    microTips = record {
      enabled = true;
      maxEventsPerWindow = 10;
      btcTipAmount = 1_000_000:nat;
      maxBtcPerPeriod = 10_000_000:nat;
      icpTipAmount = 100_000_000:nat;
      maxIcpPerPeriod = 1_000_000_000:nat;
      ethTipAmount = 1_000_000:nat;
      maxEthPerPeriod = 10_000_000:nat;
    };
    scheduled = record {
      enabled = false;
      frequency = variant { Weekly };
      tiers = vec {};  // no scheduled tiers for this local test
    };
    thresholds = record {
      btcMin = 0:nat;
      icpMin = 0:nat;
      ethMin = 0:nat;
    };
    compliance = record {
      kycRequired = false;
      tagWhitelist = vec {};
    };
    // No spend caps for local test
    spendControl = null;
    deadman = record {
      enabled = false;
      inactivityThresholdSeconds = 3_600:nat;
    };
  }
)
EOF

echo
echo "== 1.2 registerOrg(test org) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  registerOrg --argument-file "$ORG_ARG_FILE"

echo
echo "== 1.3 getOrgConfig =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getOrgConfig "(principal \"$ORG_ID\")"

echo
echo "== 1.4 getOrgState =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getOrgState "(principal \"$ORG_ID\")"

echo
echo "== 1.5 listRegisteredOrgs =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  listRegisteredOrgs

#############################################
# 2. Funding: notifyLedgerDeposit + recordNativeDeposit
#############################################

echo
echo "== 2.1 notifyLedgerDeposit(ORG, ICP, 1_000_000_000) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  notifyLedgerDeposit "(
    principal \"$ORG_ID\",
    variant { ICP },
    1_000_000_000:nat,
    opt \"initial ICP funding\"
  )"

echo
echo "== 2.2 recordNativeDeposit(ORG, BTC, 500_000, \"tx#1\") =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  recordNativeDeposit "(
    principal \"$ORG_ID\",
    variant { BTC },
    500_000:nat,
    \"tx#1\",
    null
  )"

echo
echo "== 2.3 getOrgVaultBalance (after deposits) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getOrgVaultBalance "(principal \"$ORG_ID\")"

echo
echo "== 2.4 getRailHealth(ICP) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getRailHealth "(
    principal \"$ORG_ID\",
    variant { ICP }
  )"

echo
echo "== 2.5 getOrgSpendSnapshot =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getOrgSpendSnapshot "(principal \"$ORG_ID\")"

#############################################
# 3. Compliance & badges (light touch)
#############################################

echo
echo "== 3.1 setUserCompliance (ME, kycVerified=false, tags=[\"india\"]) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  setUserCompliance "(
    principal \"$ORG_ID\",
    principal \"$ME_PRINCIPAL\",
    record {
      kycVerified = false;
      tags = vec { \"india\" };
    }
  )"

echo
echo "== 3.2 getUserCompliance =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getUserCompliance "(
    principal \"$ORG_ID\",
    principal \"$ME_PRINCIPAL\"
  )"

# Badges: we don't know your exact Badge type fields, so we won't push our luck here.
# If Badge = record { id : text; label : text }, you can plug it in later:
# dfx canister call treasury setUserBadges '(
#   principal "<ORG_ID>",
#   principal "<USER>",
#   vec { record { id = "founder"; label = "Founder"; } }
# )'

#############################################
# 4. Micro-tips hook: repAwarded
#############################################

echo
echo "== 4.1 repAwarded (org, ME, +10rep) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  repAwarded "(
    principal \"$ORG_ID\",
    principal \"$ME_PRINCIPAL\",
    10 : int,
    null
  )"

echo
echo "== 4.2 listTipEvents(offset=0, limit=10) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  listTipEvents '(0:nat, 10:nat)'

#############################################
# 5. Conversions (OPTIONAL / tolerant)
#    This will likely end as Failed, which is good for exercising that path.
#############################################

echo
echo "== 5.1 setRailMinters (ckBTC/ckETH -> ME, fake) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  setRailMinters "(
    opt principal \"$ME_PRINCIPAL\",
    opt principal \"$ME_PRINCIPAL\"
  )"

echo
echo "== 5.2 requestNativeWithdrawal (ORG, ME, BTC, 100_000 -> \"btc-address\") =="
set +e
WITHDRAW_OUT=$(
  dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
    requestNativeWithdrawal "(
      principal \"$ORG_ID\",
      principal \"$ME_PRINCIPAL\",
      variant { BTC },
      100_000:nat,
      \"bc1q-test-address\",
      null
    )" 2>&1
)
RETVAL=$?
set -e
echo "$WITHDRAW_OUT"

if [ $RETVAL -ne 0 ]; then
  echo "⚠️ requestNativeWithdrawal failed (likely due to fake minter principal) – this is acceptable in local test."
else
  CONVERSION_ID=$(echo "$WITHDRAW_OUT" | grep -o '[0-9_]\+' | head -n1)
  echo "Conversion ID: ${CONVERSION_ID:-<not parsed>}"

  echo
  echo "== 5.3 submitPendingConversions(limit=10) =="
  set +e
  dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
    submitPendingConversions '(10:nat)'
  echo "⚠️ If above call logs ckBTC/ckETH errors, that's expected with fake minter."
  set -e

  if [ -n "${CONVERSION_ID:-}" ]; then
    echo
    echo "== 5.4 getConversionIntent(id) =="
    dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
      getConversionIntent "($CONVERSION_ID:nat)"
  fi
fi

echo
echo "== 5.5 listConversionIntents(offset=0, limit=10) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  listConversionIntents '(0:nat, 10:nat)'

echo
echo "== 5.6 listNativeDeposits(offset=0, limit=10) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  listNativeDeposits '(0:nat, 10:nat)'

#############################################
# 6. Deadman / archiving
#############################################

echo
echo "== 6.1 isOrgArchived(before) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  isOrgArchived "(principal \"$ORG_ID\")"

echo
echo "== 6.2 forceArchiveOrg (admin) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  forceArchiveOrg "(principal \"$ORG_ID\")"

echo
echo "== 6.3 isOrgArchived(after) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  isOrgArchived "(principal \"$ORG_ID\")"

echo
echo "== 6.4 getOrgVaultBalance (should be zero after sweep) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getOrgVaultBalance "(principal \"$ORG_ID\")"

echo
echo "== 6.5 getFactoryVaultBalance (should now hold swept funds) =="
dfx canister --network "$NETWORK" call "$TREASURY_CANISTER" \
  getFactoryVaultBalance

echo
echo "✅ Treasury local test script COMPLETED."
