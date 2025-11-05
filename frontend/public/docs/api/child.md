# Child Canister API

Complete API reference for the Child reputation canister.

## Overview

Each organization gets a dedicated child canister that manages soulbound reputation. This reference covers all available methods.

## Core Methods

### awardRep

Award reputation to a user.

```motoko
public shared(msg) func awardRep(
  user: Principal,
  amount: Nat,
  reason: ?Text
) : async Result.Result<(), Text>
```

**Example:**

```bash
dfx canister call <child_id> awardRep \
  '(principal "xxxxx-xxxxx", 10:nat, opt "Great contribution")'
```

### getBalance

Get a user's current reputation balance.

```motoko
public query func getBalance(user: Principal) : async Nat
```

**Example:**

```bash
dfx canister call <child_id> getBalance '(principal "xxxxx-xxxxx")'
```

### leaderboard

Get the top reputation holders.

```motoko
public query func leaderboard() : async [(Principal, Nat)]
```

## More Documentation Coming Soon

This page is being expanded. For now, see:

- [Factory API](/docs/api/factory) - Complete factory reference
- [Getting Started](/docs/getting-started) - Quick start guide
- [TypeScript SDK](/docs/api/sdk) - SDK documentation
