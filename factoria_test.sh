#!/usr/bin/env bash
set -Eeuo pipefail

# ================= Config =================
NET="${NET:-local}"
FACT="${1:-factoria}"                                # canister name or principal
TMP_ARG="${TMP_ARG:-src/factoria/child_wasm.arg}"    # candid-encoded blob of child wasm

# allow underscores in env values (strip before use)
FACTORY_FUND_H="${FACTORY_FUND:-5_000_000_000_000}"          # cycles to deposit into factory
CREATE_CHILD_CYCLES_H="${CREATE_CHILD_CYCLES:-1_000_000_000_000}"
TOPUP_CHILD_H="${TOPUP_CHILD:-1_000_000_000_000}"
REUSE_TARGET_H="${REUSE_TARGET:-1_000_000_000_000}"

TEST_CUSTOM_CONTROLLERS="${TEST_CUSTOM_CONTROLLERS:-1}"       # keeps factory as controller

# Trial test config
TRIAL_IDENTITY="${TRIAL_IDENTITY:-trial_user}"
TRIAL_FACTORY_FUND="${TRIAL_FACTORY_FUND:-2000000000000}"     # 2T for trial flow (NO underscores)
# ==========================================

digits(){ printf '%s' "$1" | tr -d '_' ; }  # strip underscores
shownum(){ printf '%s' "$1" ; }

pass(){ printf '✅ PASS: %s\n' "$*"; }
warn(){ printf '⚠️  WARN: %s\n' "$*"; }
fail(){ printf '❌ FAIL: %s\n' "$*"; }

run() {
  local out
  if ! out="$(bash -lc "$*" 2>&1)"; then
    printf '%s\n' "$out"
    return 1
  fi
  printf '%s\n' "$out"
  return 0
}

expect_contains() {
  local output="$1"; local needle="$2"; local note="${3:-}"
  if printf '%s' "$output" | grep -qF "$needle"; then pass "$note"; return 0; fi
  printf '%s\n' "$output" | sed 's/^/   | /'
  fail "$note (missing: $needle)"; return 1
}

expect_cmd_contains() {
  local note="$1"; shift
  local cmd="$1"; shift
  local needle="$1"
  local out
  out="$(run "$cmd")" || { printf '%s\n' "$out" | sed 's/^/   | /'; fail "$note (command failed)"; return 1; }
  expect_contains "$out" "$needle" "$note"
}

parse_principal() { grep -oE 'principal "[^"]+' | head -n1 | cut -d'"' -f2; }
nat_from_tuple () { grep -oE '\([0-9_]+' | tr -d '_()'; }

# -------- resolve ids / amounts ----------
ORIG_ID_NAME="$(dfx identity whoami 2>/dev/null || echo default)"
ME="$(dfx identity get-principal 2>/dev/null || true)"
FACT_ID="$(dfx canister id --network "$NET" "$FACT" 2>/dev/null || echo "$FACT")"

FACTORY_FUND="$(digits "$FACTORY_FUND_H")"
CREATE_CHILD_CYCLES="$(digits "$CREATE_CHILD_CYCLES_H")"
TOPUP_CHILD="$(digits "$TOPUP_CHILD_H")"
REUSE_TARGET="$(digits "$REUSE_TARGET_H")"

echo "=== ReputationFactory Admin + Trial Test ==="
echo "NET=$NET"
echo "FACTORY=$FACT_ID"
echo "IDENTITY=$ORIG_ID_NAME"
echo "PRINCIPAL=$ME"
echo

# 0) reachability
out="$(run "dfx canister call --network $NET $FACT_ID counts")" || true
if ! grep -q "record" <<<"$out"; then
  printf '%s\n' "$out" | sed 's/^/   | /'; fail "factory not reachable (counts)"; exit 1
fi
pass "factory reachable (counts)"

# 1) enforce admin
ADMIN_OUT="$(run "dfx canister call --network $NET $FACT_ID getAdmin")" || true
ADMIN_PRINC="$(printf '%s\n' "$ADMIN_OUT" | parse_principal || true)"
if [[ -z "$ADMIN_PRINC" ]]; then
  printf '%s\n' "$ADMIN_OUT" | sed 's/^/   | /'
  fail "could not read admin principal"; exit 1
fi
if [[ "$ME" != "$ADMIN_PRINC" ]]; then
  echo "   | current principal: $ME"
  echo "   | required admin:    $ADMIN_PRINC"
  fail "You must run this script as the ADMIN identity"; exit 1
fi
pass "running as admin"

# 2) setDefaultChildWasm (if arg present)
if [[ -f "$TMP_ARG" ]]; then
  if run "dfx canister call --network $NET $FACT_ID setDefaultChildWasm --argument-file $TMP_ARG" >/dev/null; then
    pass "setDefaultChildWasm() loaded from $TMP_ARG"
  else
    warn "setDefaultChildWasm() failed — install/upgrade tests may fail"
  fi
else
  warn "No $TMP_ARG — skipping setDefaultChildWasm"
fi

# 3) FUND FACTORY using deposit-cycles (amount first, then canister; NO underscores)
if [[ -n "$FACTORY_FUND" && "$FACTORY_FUND" != "0" ]]; then
  if out="$(run "dfx canister deposit-cycles ${FACTORY_FUND} ${FACT_ID} --network ${NET}")"; then
    pass "factory funded with $(shownum "$FACTORY_FUND_H") cycles via deposit-cycles"
  else
    printf '%s\n' "$out" | sed 's/^/   | /'
    warn "deposit-cycles failed (ensure replica is running; numbers have no underscores)"
  fi
else
  warn "FACTORY_FUND not set or zero; skipping funding"
fi

# 4) fresh child (admin-only path)
out="$(run "dfx canister call --network $NET $FACT_ID createChildForOwner \"(principal \\\"$ME\\\", ${CREATE_CHILD_CYCLES}:nat, vec {}, \\\"primary child\\\")\"")" || true
PRIMARY_CHILD="$(printf '%s\n' "$out" | parse_principal || true)"
if [[ -z "$PRIMARY_CHILD" ]]; then
  printf '%s\n' "$out" | sed 's/^/   | /'; fail "createChildForOwner did not return a principal"; exit 1
fi
pass "createChildForOwner -> $PRIMARY_CHILD"

# 5) queries
expect_cmd_contains "listChildren includes new child" \
  "dfx canister call --network $NET $FACT_ID listChildren" \
  "$PRIMARY_CHILD"

out="$(run "dfx canister call --network $NET $FACT_ID getChild \"(principal \\\"$PRIMARY_CHILD\\\")\"")" || true
expect_contains "$out" "record" "getChild returns record"
expect_contains "$out" "$ME" "getChild shows correct owner"
expect_contains "$out" "variant { Active }" "getChild shows Active"

# 6) childHealth
expect_cmd_contains "childHealth returns record" \
  "dfx canister call --network $NET $FACT_ID childHealth \"(principal \\\"$PRIMARY_CHILD\\\")\"" \
  "record {"

# 7) topUpChild (<=1T)
out="$(run "dfx canister call --network $NET $FACT_ID topUpChild \"(principal \\\"$PRIMARY_CHILD\\\", ${TOPUP_CHILD}:nat)\"")" || true
if grep -q "variant { ok" <<<"$out"; then
  pass "topUpChild ok (amount $(shownum "$TOPUP_CHILD_H"))"
else
  printf '%s\n' "$out" | sed 's/^/   | /'; warn "topUpChild non-ok (maybe cap/plan); continuing"
fi

# 8) stop/start
run "dfx canister call --network $NET $FACT_ID stopChild \"(principal \\\"$PRIMARY_CHILD\\\")\"" >/dev/null && pass "stopChild()" || warn "stopChild failed"
run "dfx canister call --network $NET $FACT_ID startChild \"(principal \\\"$PRIMARY_CHILD\\\")\"" >/dev/null && pass "startChild()" || warn "startChild failed"

# 9) toggle + reassign (admin is org admin)
out="$(run "dfx canister call --network $NET $FACT_ID toggleVisibility \"(principal \\\"$PRIMARY_CHILD\\\")\"")" || true
if grep -q "variant { Private }" <<<"$out" || grep -q "variant { Public }" <<<"$out"; then
  pass "toggleVisibility returned a variant"
else
  printf '%s\n' "$out" | sed 's/^/   | /'; warn "toggleVisibility unexpected"
fi
expect_cmd_contains "reassignOwner updated" \
  "dfx canister call --network $NET $FACT_ID reassignOwner \"(principal \\\"$PRIMARY_CHILD\\\", principal \\\"$ME\\\")\"" \
  "Success: owner updated"

# 10) upgrade / reinstall (if wasm set)
if [[ -f "$TMP_ARG" ]]; then
  run "dfx canister call --network $NET $FACT_ID upgradeChild \"(principal \\\"$PRIMARY_CHILD\\\")\"" >/dev/null \
    && pass "upgradeChild()" || warn "upgradeChild failed (maybe code same or out of cycles)"
  run "dfx canister call --network $NET $FACT_ID reinstallChild \"(principal \\\"$PRIMARY_CHILD\\\", principal \\\"$ME\\\", principal \\\"$FACT_ID\\\")\"" >/dev/null \
    && pass "reinstallChild()" || warn "reinstallChild failed (may need more cycles)"
else
  warn "No $TMP_ARG — skipping upgrade/reinstall"
fi

# 11) archive to pool (admin)
run "dfx canister call --network $NET $FACT_ID archiveChild \"(principal \\\"$PRIMARY_CHILD\\\")\"" >/dev/null \
  && pass "archiveChild -> pooled" || warn "archiveChild failed"

PSIZE_RAW="$(run "dfx canister call --network $NET $FACT_ID poolSize" || true)"
if printf '%s' "$PSIZE_RAW" | grep -qE '\([0-9_]+ *: *nat\)'; then
  PSIZE="$(printf '%s' "$PSIZE_RAW" | nat_from_tuple || echo 0)"
  pass "poolSize -> $PSIZE"
else
  warn "poolSize unexpected: $PSIZE_RAW"
fi

# 12) reuse from pool (ensureCycles>0)
out="$(run "dfx canister call --network $NET $FACT_ID createOrReuseChildFor \
\"(principal \\\"$ME\\\", ${REUSE_TARGET}:nat, vec {}, \\\"reuse with ensureCycles>0\\\")\"")" || true
REUSED="$(printf '%s\n' "$out" | parse_principal || true)"
if [[ -n "$REUSED" ]]; then
  pass "createOrReuseChildFor (target=$(shownum "$REUSE_TARGET_H")) -> $REUSED"
else
  printf '%s\n' "$out" | sed 's/^/   | /'; warn "createOrReuseChildFor did not return a principal (no pool / needs cycles)"
fi

# 13) admin sweepers
run "dfx canister call --network $NET $FACT_ID adminBackfillPlanDefaults '(variant { Basic })'" >/dev/null && pass "adminBackfillPlanDefaults ok" || warn "adminBackfillPlanDefaults failed"
run "dfx canister call --network $NET $FACT_ID adminArchiveExpired '(10:nat)'" >/dev/null && pass "adminArchiveExpired ok" || warn "adminArchiveExpired failed"

# 14) ===== Trial Flow (non-admin user) =====
echo
echo "--- Trial Flow (non-admin) ---"

# prepare trial identity
if ! dfx identity list | grep -q "^${TRIAL_IDENTITY}\$"; then
  run "dfx identity new ${TRIAL_IDENTITY}" >/dev/null || true
fi

# Make sure factory has slack cycles for the 1T trial top-up
# deposit-cycles: <amount> <canister-id>
if out="$(run "dfx canister deposit-cycles ${TRIAL_FACTORY_FUND} ${FACT_ID} --network ${NET}")"; then
  pass "factory topped up for trial with ${TRIAL_FACTORY_FUND} cycles"
else
  printf '%s\n' "$out" | sed 's/^/   | /'
  warn "could not deposit trial cycles (ensure local replica is running)"
fi

# switch to trial identity
run "dfx identity use ${TRIAL_IDENTITY}" >/dev/null
TRIAL_PRINC="$(dfx identity get-principal 2>/dev/null || true)"
echo "TRIAL_IDENTITY=${TRIAL_IDENTITY}"
echo "TRIAL_PRINCIPAL=${TRIAL_PRINC}"
echo

# run trial creation
OUT_TRIAL="$(run "dfx canister call --network $NET $FACT_ID createTrialForSelf '(\"trial note\")'")" || true
if printf '%s' "$OUT_TRIAL" | grep -q "variant { ok"; then
  TRIAL_CID="$(printf '%s' "$OUT_TRIAL" | parse_principal || true)"
  pass "createTrialForSelf -> ${TRIAL_CID}"
else
  printf '%s\n' "$OUT_TRIAL" | sed 's/^/   | /'
  warn "createTrialForSelf returned non-ok (maybe already used / low factory cycles)"
fi

# verify Trial plan & owner & expiry
if [[ -n "${TRIAL_CID:-}" ]]; then
  OUT_CHILD="$(run "dfx canister call --network $NET $FACT_ID getChild \"(principal \\\"$TRIAL_CID\\\")\"")" || true
  expect_contains "$OUT_CHILD" "plan = variant { Trial }" "getChild shows Trial plan"
  expect_contains "$OUT_CHILD" "$TRIAL_PRINC" "getChild shows Trial owner"
fi

# topUpChild should be blocked on Trial
if [[ -n "${TRIAL_CID:-}" ]]; then
  OUT_TOPUP_TRIAL="$(run "dfx canister call --network $NET $FACT_ID topUpChild \"(principal \\\"$TRIAL_CID\\\", 1000000000000:nat)\"")" || true
  expect_contains "$OUT_TOPUP_TRIAL" "Trial plan: top-ups are not allowed" "topUpChild blocked on Trial"
fi

# second trial should be refused
OUT_TRIAL_2="$(run "dfx canister call --network $NET $FACT_ID createTrialForSelf '(\"another\")'")" || true
expect_contains "$OUT_TRIAL_2" "Trial already used for this owner" "second createTrialForSelf refused"

# back to original admin identity
run "dfx identity use ${ORIG_ID_NAME}" >/dev/null 2>&1 || true

echo
pass "Admin + Trial test suite finished"
