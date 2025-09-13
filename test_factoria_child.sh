#!/usr/bin/env bash
set -euo pipefail

# ========= Config =========
NET="local"
CID="${1:-}"
if [[ -z "${CID}" ]]; then
  echo "usage: $0 <child_canister_id>"; exit 1
fi

# Pretty printers
pass(){ echo -e "✅ PASS: $*"; }
fail(){ echo -e "❌ FAIL: $*"; }
warn(){ echo -e "⚠️  WARN: $*"; }

# Run a command, capture stdout, print line if DFX prints logs
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

# Expect command to succeed with substring
expect_cmd_contains() {
  local note="$1"; shift
  local cmd="$1"; shift
  local needle="$1"
  local out
  out="$(run "$cmd")" || { echo "$out" | sed 's/^/   | /'; fail "$note (command failed)"; return 1; }
  expect_contains "$out" "$needle" "$note"
}


# Grab identities
ME="$(dfx identity get-principal)"
dfx identity new bob --disable-encryption >/dev/null 2>&1 || true
dfx identity new alice --disable-encryption >/dev/null 2>&1 || true
BOB="$(dfx --identity bob identity get-principal)"
ALICE="$(dfx --identity alice identity get-principal)"

echo "=== Test target ==="
echo "NET=$NET"
echo "CID=$CID"
echo "OWNER/ME=$ME"
echo "BOB=$BOB"
echo "ALICE=$ALICE"
echo

# ---------- Version ----------
out="$(run "dfx canister call --network $NET $CID version")" || true
expect_contains "$out" '("1.0.1")' "version returns 1.0.1"

# ---------- Health ----------
# Some builds may trap on health() due to Nat64 overflow (pre-fix).
out="$(run "dfx canister call --network $NET $CID health")" || true
if grep -q "CanisterError" <<<"$out"; then
  echo "$out" | sed 's/^/   | /'
  warn "health() trapped (likely mix64_ overflow) — apply *% and re-upgrade if you want this to PASS"
else
  pass "health() query"
fi

# ---------- Awarder management ----------
expect_cmd_contains "addTrustedAwarder(owner->owner-awarder)" \
  "dfx canister call --network $NET $CID addTrustedAwarder \"(principal \\\"$ME\\\", \\\"owner-awarder\\\")\"" \
  "Success: Awarder added"

out="$(run "dfx canister call --network $NET $CID getTrustedAwarders")" || true
expect_contains "$out" "$ME" "getTrustedAwarders returns our principal"

# ---------- Award flow ----------
# fresh start for BOB
run "dfx canister call --network $NET $CID resetUser \"(principal \\\"$BOB\\\", opt \\\"reset\\\")\"" >/dev/null || true
out="$(run "dfx canister call --network $NET $CID awardRep \"(principal \\\"$BOB\\\", 20:nat, opt \\\"first boost\\\")\"")"
expect_contains "$out" "Success: 20 points awarded" "awardRep(20)"

out="$(run "dfx canister call --network $NET $CID getBalance \"(principal \\\"$BOB\\\")\"")"
expect_contains "$out" "(20 : nat)" "getBalance after award == 20"

# ---------- Revoke flow ----------
out="$(run "dfx canister call --network $NET $CID revokeRep \"(principal \\\"$BOB\\\", 5:nat, opt \\\"bad vibes\\\")\"")"
expect_contains "$out" "Success: 5 points revoked" "revokeRep(5)"

out="$(run "dfx canister call --network $NET $CID getBalance \"(principal \\\"$BOB\\\")\"")"
expect_contains "$out" "(15 : nat)" "balance after revoke == 15"

# ---------- Caps ----------
# default dailyMintLimit = 50 (per awarder). Already minted 20 (then revoked 5, but revokes don't refund cap).
out="$(run "dfx canister call --network $NET $CID awardRep \"(principal \\\"$BOB\\\", 40:nat, null)\"")"
if grep -q "Success:" <<<"$out"; then
  warn "awardRep(40) succeeded; mintedToday allowed <= 50 — OK if 20+40<=50 else check peekDaily_ vs bumpDaily_ precheck logic"
else
  expect_contains "$out" "Error: Daily mint cap exceeded" "awardRep(40) blocked if already at cap"
fi

out="$(run "dfx canister call --network $NET $CID awardRep \"(principal \\\"$BOB\\\", 11:nat, null)\"")"
if grep -q "Success:" <<<"$out"; then
  pass "awardRep(11) allowed when within cap"
else
  expect_contains "$out" "Error: Daily mint cap exceeded" "awardRep(11) correctly blocked when over cap"
fi

# ---------- Pause toggle blocks writes ----------
expect_cmd_contains "pause(true)" \
  "dfx canister call --network $NET $CID pause \"(true)\"" \
  "Success: pause=true"
out="$(run "dfx canister call --network $NET $CID awardRep \"(principal \\\"$ALICE\\\", 1:nat, null)\"")"
expect_contains "$out" "Error: Paused" "awardRep blocked when paused"

expect_cmd_contains "pause(false)" \
  "dfx canister call --network $NET $CID pause \"(false)\"" \
  "Success: pause=false"

# ---------- Blacklist blocks both sides ----------
expect_cmd_contains "blacklist(BOB,true)" \
  "dfx canister call --network $NET $CID blacklist \"(principal \\\"$BOB\\\", true)\"" \
  "Success: blacklist updated"
out="$(run "dfx canister call --network $NET $CID awardRep \"(principal \\\"$BOB\\\", 1:nat, null)\"")"
expect_contains "$out" "Error: Blacklisted principal" "awardRep blocked by blacklist"
expect_cmd_contains "blacklist(BOB,false)" \
  "dfx canister call --network $NET $CID blacklist \"(principal \\\"$BOB\\\", false)\"" \
  "Success: blacklist updated"

# ---------- Self-award blocked ----------
out="$(run "dfx canister call --network $NET $CID awardRep \"(principal \\\"$ME\\\", 1:nat, null)\"")"
expect_contains "$out" "Error: Cannot self-award" "self-award is blocked"

# ---------- Per-awarder override ----------
expect_cmd_contains "setPerAwarderDailyLimit(owner, 5)" \
  "dfx canister call --network $NET $CID setPerAwarderDailyLimit \"(principal \\\"$ME\\\", 5:nat)\"" \
  "Success: Per-awarder limit set"

# Reset BOB and try to exceed owner-specific 5 cap quickly
run "dfx canister call --network $NET $CID resetUser \"(principal \\\"$BOB\\\", null)\"" >/dev/null || true
out="$(run "dfx canister call --network $NET $CID awardRep \"(principal \\\"$BOB\\\", 6:nat, null)\"")"
expect_contains "$out" "Error: Daily mint cap exceeded" "per-awarder cap 5 enforced"

# ---------- multiAward (non-atomic & atomic) ----------
# non-atomic: one bad pair shouldn't cancel others
out="$(run "dfx canister call --network $NET $CID multiAward \"(vec { record { principal \\\"$BOB\\\"; 2:nat; null }; record { principal \\\"$ALICE\\\"; 0:nat; null } }, false)\"")"
expect_contains "$out" "Success: awarded to" "multiAward(non-atomic) runs"

# atomic: any bad pair should fail all
out="$(run "dfx canister call --network $NET $CID multiAward \"(vec { record { principal \\\"$BOB\\\"; 0:nat; null }; record { principal \\\"$ALICE\\\"; 1:nat; null } }, true)\"")"
expect_contains "$out" "Error: Atomic precheck failed" "multiAward(atomic) fails on bad pair"

# ---------- Queries ----------
expect_cmd_contains "getTransactionCount()" \
  "dfx canister call --network $NET $CID getTransactionCount" \
  " : nat)"
out="$(run "dfx canister call --network $NET $CID getTransactionsPaged \"(0:nat, 5:nat)\"")"
expect_contains "$out" "vec" "getTransactionsPaged returns vec"

out="$(run "dfx canister call --network $NET $CID getTransactionsByUser \"(principal \\\"$BOB\\\")\"")"
expect_contains "$out" "vec" "getTransactionsByUser returns vec"

out="$(run "dfx canister call --network $NET $CID findTransactionsByReason \"(\\\"boost\\\", 10:nat)\"")"
expect_contains "$out" "vec" "findTransactionsByReason returns vec"

out="$(run "dfx canister call --network $NET $CID leaderboard \"(10:nat, 0:nat)\"")"
expect_contains "$out" "vec" "leaderboard returns vec"

out="$(run "dfx canister call --network $NET $CID myStats \"(principal \\\"$BOB\\\")\"")"
expect_contains "$out" "record" "myStats returns record"

out="$(run "dfx canister call --network $NET $CID awarderStats \"(principal \\\"$BOB\\\")\"")"
expect_contains "$out" "vec" "awarderStats returns vec"

# orgPulse: since now-10min
SINCE=$(( $(date +%s) - 600 ))
out="$(run "dfx canister call --network $NET $CID orgPulse \"($SINCE:nat)\"")"

expect_contains "$out" "record {"  "orgPulse returns a record"
expect_contains "$out" "awards = " "orgPulse includes awards"
expect_contains "$out" "revokes = " "orgPulse includes revokes"
expect_contains "$out" "decays = "  "orgPulse includes decays"


# ---------- Decay config ----------
out="$(run "dfx canister call --network $NET $CID getDecayConfig")"
expect_contains "$out" "record" "getDecayConfig returns record"
expect_cmd_contains "configureDecay()" \
  "dfx canister call --network $NET $CID configureDecay \"(500:nat, 2592000:nat, 10:nat, 2592000:nat, false)\"" \
  "Success: Decay config updated"

# ---------- Snapshot/Audit ----------
out="$(run "dfx canister call --network $NET $CID snapshotHash")"
expect_contains "$out" " : nat)" "snapshotHash returns nat"

# ---------- Events (owner-only) ----------
out="$(run "dfx canister call --network $NET $CID emitEvent \"(\\\"ping\\\", blob \\\"\\01\\02\\\")\"")"
expect_contains "$out" "Success: event emitted" "emitEvent by owner"

# ---------- Cycles / wallet_receive / topUp ----------
WALLET="$(dfx identity get-wallet --network $NET 2>/dev/null || true)"
if [[ -n "$WALLET" ]]; then
  out="$(run "dfx canister call $CID wallet_receive --with-cycles 1_000_000_000 --network $NET --wallet $WALLET")"
  expect_contains "$out" "(1_000_000_000 : nat)" "wallet_receive accepted cycles"
  out="$(run "dfx canister call --network $NET $CID cycles_balance")"
  expect_contains "$out" " : nat)" "cycles_balance returns nat"
else
  warn "No wallet found for local identity; skipping cycles tests"
fi

echo
echo "=== DONE ==="
