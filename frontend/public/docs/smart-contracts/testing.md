# Testing Smart Contracts

Comprehensive testing strategies for Reputation DAO canisters including unit tests, integration tests, and test scripts.

## Testing Overview

Reputation DAO uses multiple testing approaches:
- **Shell Scripts**: Quick integration tests with dfx
- **Unit Tests**: Motoko test framework (coming soon)
- **Integration Tests**: End-to-end workflows
- **Load Tests**: Performance and stress testing

## Test Scripts

### Factory Test (`factoria_test.sh`)

Tests factory canister lifecycle operations.

```bash
#!/bin/bash
set -e

FACTORY_ID=$(dfx canister id factoria)
OWNER=$(dfx identity get-principal)

echo "=== Testing Factory Canister ==="

# Test 1: Upload WASM
echo "Test 1: Upload child WASM"
dfx build reputation_dao
python3 - <<'PY'
from pathlib import Path
wasm = Path('.dfx/local/canisters/reputation_dao/reputation_dao.wasm').read_bytes()
arg = ''.join('\\%02x' % b for b in wasm)
Path('/tmp/reputation_dao_wasm.arg').write_text(f'(blob "{arg}")')
PY

dfx canister call factoria setDefaultChildWasm \
  --argument-file /tmp/reputation_dao_wasm.arg

# Test 2: Create child
echo "Test 2: Create child canister"
CHILD_ID=$(dfx canister call factoria createChildForOwner \
  "(principal \"$OWNER\", 1_000_000_000_000:nat, vec {}, \"Test Org\")" \
  | grep -oP 'principal "\K[^"]+')

echo "Created child: $CHILD_ID"

# Test 3: List children
echo "Test 3: List children"
dfx canister call factoria listChildren

# Test 4: Get child details
echo "Test 4: Get child details"
dfx canister call factoria getChild "(principal \"$CHILD_ID\")"

# Test 5: Top up child
echo "Test 5: Top up child"
dfx canister call factoria topUpChild \
  "(principal \"$CHILD_ID\", 500_000_000_000:nat)"

echo "✅ All factory tests passed"
```

### Child Canister Test (`test_factoria_child.sh`)

Tests child canister reputation operations.

```bash
#!/bin/bash
set -e

CHILD_ID=$1
if [ -z "$CHILD_ID" ]; then
  echo "Usage: $0 <child_canister_id>"
  exit 1
fi

OWNER=$(dfx identity get-principal)
USER="2vxsx-fae"

echo "=== Testing Child Canister: $CHILD_ID ==="

# Test 1: Add trusted awarder
echo "Test 1: Add trusted awarder"
dfx canister call $CHILD_ID addTrustedAwarder \
  "(principal \"$OWNER\", \"Admin\")"

# Test 2: Award reputation
echo "Test 2: Award reputation"
dfx canister call $CHILD_ID awardRep \
  "(principal \"$USER\", 100:nat, opt \"Test award\")"

# Test 3: Check balance
echo "Test 3: Check balance"
BALANCE=$(dfx canister call $CHILD_ID getBalance "(principal \"$USER\")")
echo "Balance: $BALANCE"

# Test 4: Multi-award
echo "Test 4: Multi-award"
dfx canister call $CHILD_ID multiAward \
  "(vec { record { principal \"$USER\"; 25:nat; opt \"Bonus\" } }, true)"

# Test 5: Leaderboard
echo "Test 5: Leaderboard"
dfx canister call $CHILD_ID leaderboard "(10, 0)"

# Test 6: Transaction history
echo "Test 6: Transaction history"
dfx canister call $CHILD_ID getTransactionsPaged "(0, 10)"

# Test 7: Org pulse
echo "Test 7: Organization pulse"
dfx canister call $CHILD_ID orgPulse "(24)"

# Test 8: Health check
echo "Test 8: Health check"
dfx canister call $CHILD_ID health

echo "✅ All child tests passed"
```

### Multi-Org Test (`test_multi_org_fixed.sh`)

Tests multiple organizations and cross-org scenarios.

```bash
#!/bin/bash
set -e

FACTORY_ID=$(dfx canister id factoria)
OWNER=$(dfx identity get-principal)

echo "=== Testing Multi-Organization Scenario ==="

# Create Org 1
echo "Creating Org 1..."
ORG1_ID=$(dfx canister call factoria createChildForOwner \
  "(principal \"$OWNER\", 1_000_000_000_000:nat, vec {}, \"Org 1\")" \
  | grep -oP 'principal "\K[^"]+')

# Create Org 2
echo "Creating Org 2..."
ORG2_ID=$(dfx canister call factoria createChildForOwner \
  "(principal \"$OWNER\", 1_000_000_000_000:nat, vec {}, \"Org 2\")" \
  | grep -oP 'principal "\K[^"]+')

echo "Org 1: $ORG1_ID"
echo "Org 2: $ORG2_ID"

# Add awarders to both orgs
dfx canister call $ORG1_ID addTrustedAwarder \
  "(principal \"$OWNER\", \"Admin\")"
dfx canister call $ORG2_ID addTrustedAwarder \
  "(principal \"$OWNER\", \"Admin\")"

# Award reputation in both orgs
USER="2vxsx-fae"
dfx canister call $ORG1_ID awardRep \
  "(principal \"$USER\", 100:nat, opt \"Org 1 award\")"
dfx canister call $ORG2_ID awardRep \
  "(principal \"$USER\", 50:nat, opt \"Org 2 award\")"

# Check balances
echo "Org 1 balance:"
dfx canister call $ORG1_ID getBalance "(principal \"$USER\")"

echo "Org 2 balance:"
dfx canister call $ORG2_ID getBalance "(principal \"$USER\")"

# Verify isolation
echo "Verifying reputation isolation..."
ORG1_BAL=$(dfx canister call $ORG1_ID getBalance "(principal \"$USER\")" | grep -oP '\d+')
ORG2_BAL=$(dfx canister call $ORG2_ID getBalance "(principal \"$USER\")" | grep -oP '\d+')

if [ "$ORG1_BAL" != "100" ] || [ "$ORG2_BAL" != "50" ]; then
  echo "❌ Reputation not properly isolated"
  exit 1
fi

echo "✅ Multi-org test passed"
```

## Integration Tests

### Decay Test

```bash
#!/bin/bash
set -e

CHILD_ID=$1
USER="2vxsx-fae"

echo "=== Testing Decay System ==="

# Configure decay: 10% every 30 days
dfx canister call $CHILD_ID configureDecay \
  "(1000:nat, 2592000:nat, 10:nat, 0:nat, true)"

# Award initial reputation
dfx canister call $CHILD_ID awardRep \
  "(principal \"$USER\", 1000:nat, opt \"Initial\")"

# Check balance
BEFORE=$(dfx canister call $CHILD_ID getBalance "(principal \"$USER\")")
echo "Balance before decay: $BEFORE"

# Process decay (in production, this runs automatically)
dfx canister call $CHILD_ID processBatchDecay

# Check balance after
AFTER=$(dfx canister call $CHILD_ID getBalance "(principal \"$USER\")")
echo "Balance after decay: $AFTER"

echo "✅ Decay test completed"
```

### Blacklist Test

```bash
#!/bin/bash
set -e

CHILD_ID=$1
USER="2vxsx-fae"

echo "=== Testing Blacklist ==="

# Add to blacklist
dfx canister call $CHILD_ID blacklist \
  "(principal \"$USER\", true)"

# Try to award (should fail)
if dfx canister call $CHILD_ID awardRep \
  "(principal \"$USER\", 100:nat, opt \"Test\")" 2>&1 | grep -q "blacklisted"; then
  echo "✅ Blacklist working correctly"
else
  echo "❌ Blacklist not working"
  exit 1
fi

# Remove from blacklist
dfx canister call $CHILD_ID blacklist \
  "(principal \"$USER\", false)"

# Award should work now
dfx canister call $CHILD_ID awardRep \
  "(principal \"$USER\", 100:nat, opt \"Test\")"

echo "✅ Blacklist test passed"
```

### Daily Limit Test

```bash
#!/bin/bash
set -e

CHILD_ID=$1
AWARDER=$(dfx identity get-principal)
USER="2vxsx-fae"

echo "=== Testing Daily Limits ==="

# Set daily limit to 100
dfx canister call $CHILD_ID setDailyMintLimit "(100:nat)"

# Set per-awarder limit to 50
dfx canister call $CHILD_ID setPerAwarderDailyLimit \
  "(principal \"$AWARDER\", 50:nat)"

# Award 50 (should succeed)
dfx canister call $CHILD_ID awardRep \
  "(principal \"$USER\", 50:nat, opt \"Test 1\")"

# Try to award 50 more (should fail - exceeds per-awarder limit)
if dfx canister call $CHILD_ID awardRep \
  "(principal \"$USER\", 50:nat, opt \"Test 2\")" 2>&1 | grep -q "limit"; then
  echo "✅ Per-awarder limit working"
else
  echo "❌ Per-awarder limit not working"
  exit 1
fi

echo "✅ Daily limit test passed"
```

## Load Testing

### Batch Award Test

```bash
#!/bin/bash
set -e

CHILD_ID=$1
OWNER=$(dfx identity get-principal)

echo "=== Load Testing: Batch Awards ==="

# Generate 100 test users
USERS=()
for i in {1..100}; do
  USERS+=("2vxsx-fae-$i")
done

# Award to all users
START=$(date +%s)

for USER in "${USERS[@]}"; do
  dfx canister call $CHILD_ID awardRep \
    "(principal \"$USER\", 10:nat, opt \"Load test\")" &
done

wait

END=$(date +%s)
DURATION=$((END - START))

echo "Awarded to ${#USERS[@]} users in $DURATION seconds"
echo "Rate: $((${#USERS[@]} / DURATION)) awards/second"

# Check leaderboard
dfx canister call $CHILD_ID leaderboard "(10, 0)"

echo "✅ Load test completed"
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Canisters

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install DFX
        run: |
          sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
          echo "$HOME/.local/share/dfx/bin" >> $GITHUB_PATH
      
      - name: Start local replica
        run: dfx start --background --clean
      
      - name: Deploy canisters
        run: dfx deploy
      
      - name: Run factory tests
        run: ./factoria_test.sh
      
      - name: Run child tests
        run: |
          CHILD_ID=$(dfx canister id reputation_dao)
          ./test_factoria_child.sh $CHILD_ID
      
      - name: Run multi-org tests
        run: ./test_multi_org_fixed.sh
      
      - name: Stop replica
        run: dfx stop
```

## Best Practices

### Test Organization

1. **Separate Concerns**: One test file per feature
2. **Clear Names**: Descriptive test names
3. **Setup/Teardown**: Clean state between tests
4. **Assertions**: Verify expected outcomes

### Test Data

1. **Realistic Data**: Use production-like data
2. **Edge Cases**: Test boundaries and limits
3. **Invalid Input**: Test error handling
4. **Large Datasets**: Test performance

### Automation

1. **CI/CD**: Run tests on every commit
2. **Pre-commit Hooks**: Run quick tests locally
3. **Scheduled Tests**: Run full suite nightly
4. **Monitoring**: Alert on test failures

## Next Steps

### 🏭 [Factory Contract](/docs/smart-contracts/factory)
Factory canister implementation

### 🔧 [Child Contract](/docs/smart-contracts/child)
Child canister architecture

### 🔄 [Upgrade Strategy](/docs/smart-contracts/upgrades)
Test upgrade procedures

### 🚀 [Getting Started](/docs/getting-started)
Set up your development environment
