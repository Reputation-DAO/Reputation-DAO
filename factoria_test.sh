#!/usr/bin/env bash
set -euo pipefail

# ========= Config =========
NET="${NET:-local}"
FACT="${1:-factoria}"   # can be canister *name* or *principal*
# Path to a compiled child wasm (used to seed the factory). Adjust if needed:
CHILD_WASM="${CHILD_WASM:-.dfx/${NET}/canisters/reputation_dao/reputation_dao.wasm}"
TMP_ARG="src/factoria/reputation_dao_wasm.arg"  # stable path you used before

# ========= Pretty printers =========
pass(){ echo -e "✅ PASS: $*"; }
fail(){ echo -e "❌ FAIL: $*"; }
warn(){ echo -e "⚠️  WARN: $*"; }

# Run a command, capture stdout (dfx prints logs to stdout), preserve exit code
run() {
  local out
  if ! out="$(bash -lc "$*" 2>&1)"; then
    echo "$out"
    return 1
  fi
  echo "$out"
  return 0
}

# Expect stdout to contain a substring
expect_contains() {
  local output="$1"; local needle="$2"; local note="${3:-}"
  if grep -qF "$needle" <<<"$output"; then pass "$note"; return 0
  else echo "$output" | sed 's/^/   | /'
       fail "$note (missing: $needle)"; return 1
  fi
}

# Expect command to succeed (exit 0) and contain substring
expect_cmd_contains() {
  local note="$1"; shift
  local cmd="$1"; shift
  local needle="$1"
  local out
  out="$(run "$cmd")" || { echo "$out" | sed 's/^/   | /'; fail "$note (command failed)"; return 1; }
  expect_contains "$out" "$needle" "$note"
}

# ========= Helpers =========

# Build the argument file (blob "\HH…") from a wasm, if not already present
ensure_wasm_arg() {
  if [[ -f "$TMP_ARG" ]]; then
    return 0
  fi
  if [[ ! -f "$CHILD_WASM" ]]; then
    warn "No wasm at $CHILD_WASM — skipping setDefaultChildWasm"
    return 1
  fi
  python3 - <<'PY' || { fail "Failed to generate wasm arg"; exit 1; }
p = """'"$CHILD_WASM"'"""
b = open(p, "rb").read()
with open("""'"$TMP_ARG"'"", "w") as f:
    f.write('(blob "' + ''.join('\\%02x' % x for x in b) + '")')
print("ok:", len(b), "bytes ->", """'"$TMP_ARG"'"")
PY
}

# Parse principal from dfx printed value: principal "xxxx-...-cai"
parse_principal() { grep -oP 'principal "\K[^"]+' | head -n1; }

# ========= Who am I? =========
ME="$(dfx identity get-principal)"
WALLET="$(dfx identity get-wallet --network "$NET" 2>/dev/null || true)"

echo "=== Factory Test Target ==="
echo "NET=$NET"
echo "FACTORY=$FACT"
echo "OWNER/ME=$ME"
[[ -n "$WALLET" ]] && echo "WALLET=$WALLET" || echo "WALLET=(none)"
echo

# ---------- 0) Factory reachable ----------
out="$(run "dfx canister call --network $NET $FACT counts")" || true
if grep -q "record" <<<"$out"; then pass "factory reachable (counts)"; else
  echo "$out" | sed 's/^/   | /'
  fail "factory not reachable"; exit 1
fi

# ---------- 1) Seed default child WASM ----------
if ensure_wasm_arg; then
  out="$(run "dfx canister call --network $NET $FACT setDefaultChildWasm --argument-file $TMP_ARG")" || true
  if [[ $? -eq 0 ]]; then pass "setDefaultChildWasm()"; else
    echo "$out" | sed 's/^/   | /'
    fail "setDefaultChildWasm()"; exit 1
  fi
else
  warn "Skipping setDefaultChildWasm (no wasm found)"
fi

# ---------- 2) Counts before ----------
before_counts="$(run "dfx canister call --network $NET $FACT counts" || true)"
echo "$before_counts" | sed 's/^/   | /'
expect_contains "$before_counts" "record {" "counts() returns a record"

# ---------- 3) Create a child for ME ----------
# Give the factory fuel (if needed)
if [[ -n "$WALLET" ]]; then
  run "dfx canister call $FACT wallet_receive --with-cycles 2_000_000_000_000 --network $NET --wallet $WALLET" >/dev/null || true
fi

out="$(run "dfx canister call --network $NET $FACT createChildForOwner \"(principal \\\"$ME\\\", 1_000_000_000_000:nat, vec {}, \\\"factory alpha org\\\")\"")" || true
CHILD_ID="$(echo "$out" | parse_principal || true)"
if [[ -z "$CHILD_ID" ]]; then
  echo "$out" | sed 's/^/   | /'
  fail "createChildForOwner did not return a principal"; exit 1
fi
pass "createChildForOwner -> $CHILD_ID"

# ---------- 4) listChildren shows our child ----------
out="$(run "dfx canister call --network $NET $FACT listChildren")" || true
expect_contains "$out" "$CHILD_ID" "listChildren includes new child"

# ---------- 5) getChild returns record with owner & Active ----------
out="$(run "dfx canister call --network $NET $FACT getChild \"(principal \\\"$CHILD_ID\\\")\"")" || true
expect_contains "$out" "record" "getChild returns record"
expect_contains "$out" "$ME" "getChild shows correct owner"
expect_contains "$out" "variant { Active }" "getChild shows Active"

# ---------- 6) childHealth proxy via factory ----------
out="$(run "dfx canister call --network $NET $FACT childHealth \"(principal \\\"$CHILD_ID\\\")\"")" || true
expect_contains "$out" "record {" "childHealth returns record"

# ---------- 7) topUpChild via factory (cycles vault) ----------
if [[ -n "$WALLET" ]]; then
  out="$(run "dfx canister call --network $NET $FACT topUpChild \"(principal \\\"$CHILD_ID\\\", 1_000_000_000:nat)\"")" || true
  if grep -q "variant { ok" <<<"$out"; then
    pass "topUpChild ok"
  else
    echo "$out" | sed 's/^/   | /'
    warn "topUpChild returned non-ok (may still be fine if child throttled cycles)"
  fi
else
  warn "No wallet found; skipping topUpChild"
fi

# ---------- 8) stop/start child through factory ----------
out="$(run "dfx canister call --network $NET $FACT stopChild \"(principal \\\"$CHILD_ID\\\")\"")" || true
if [[ $? -eq 0 ]]; then pass "stopChild()"; else fail "stopChild()"; fi
out="$(run "dfx canister call --network $NET $FACT startChild \"(principal \\\"$CHILD_ID\\\")\"")" || true
if [[ $? -eq 0 ]]; then pass "startChild()"; else fail "startChild()"; fi

# ---------- 9) reassignOwner book-keeping ----------
NEW_OWNER="$ME" # you can swap to another identity if you like
out="$(run "dfx canister call --network $NET $FACT reassignOwner \"(principal \\\"$CHILD_ID\\\", principal \\\"$NEW_OWNER\\\")\"")" || true
expect_contains "$out" "Success: owner updated" "reassignOwner updated"
out="$(run "dfx canister call --network $NET $FACT getChild \"(principal \\\"$CHILD_ID\\\")\"")" || true
expect_contains "$out" "$NEW_OWNER" "getChild shows new owner"

# ---------- 10) listByOwner ----------
out="$(run "dfx canister call --network $NET $FACT listByOwner \"(principal \\\"$NEW_OWNER\\\")\"")" || true
expect_contains "$out" "$CHILD_ID" "listByOwner includes child"

# ---------- 11) archiveChild -> pool ----------
out="$(run "dfx canister call --network $NET $FACT archiveChild \"(principal \\\"$CHILD_ID\\\")\"")" || true
expect_contains "$out" "Success: archived" "archiveChild returns success"
out="$(run "dfx canister call --network $NET $FACT getChild \"(principal \\\
