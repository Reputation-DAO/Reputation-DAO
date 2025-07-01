# Reputation DAO for ICP

A soulbound reputation system for Discord trading communities, built on the Internet Computer Protocol (ICP) using Motoko.

## Features
- Soulbound, non-transferable reputation points
- Trusted awarders with daily mint caps
- Admin can revoke (slash) rep
- Discord bot integration (Node.js)

## Quickstart

```bash
# Start local replica
$ dfx start --background

# Deploy canister
$ dfx deploy

# Call methods (examples)
$ dfx canister call reputation_dao getBalance '(principal "<user-principal>")'
```

See main.mo for method docs and logic.
