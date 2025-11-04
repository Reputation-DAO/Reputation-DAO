# Contributing Guide

Reputation DAO grows through open collaboration. This guide covers our contribution workflow, development setup, and best practices.

## Contribution Workflow

### 1. Open an Issue

Before starting work, open an issue describing:

- **Bug**: What's broken and how to reproduce
- **Feature**: What you want to add and why
- **Research**: Questions or proposals for discussion

**Tag appropriately:**
- `backend` - Motoko canister changes
- `frontend` - React/TypeScript UI changes
- `docs` - Documentation updates
- `community` - Community initiatives

**Example Issue:**

```markdown
Title: Add batch revoke functionality

Description:
Currently, revoking reputation requires individual calls. 
For moderation scenarios, we need a batch revoke function 
similar to multiAward.

Proposed API:
multiRevoke(pairs: [(Principal, Nat, ?Text)], atomic: Bool)

Impact:
- Reduces transaction costs for bulk moderation
- Improves admin UX
- Maintains audit trail

Labels: backend, enhancement
```

### 2. Fork & Branch

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Reputation-Dao.git
cd Reputation-Dao

# Add upstream remote
git remote add upstream https://github.com/Reputation-DAO/Reputation-Dao.git

# Create a feature branch
git checkout -b feature/batch-revoke
# or
git checkout -b fix/leaderboard-pagination
```

**Branch Naming:**
- `feature/<topic>` - New features
- `fix/<bug>` - Bug fixes
- `docs/<topic>` - Documentation
- `refactor/<topic>` - Code refactoring

### 3. Implement Changes

Write clear, focused commits:

```bash
# Make changes
git add src/reputation_dao/main.mo

# Commit with descriptive message
git commit -m "Add multiRevoke function for batch reputation revocation

- Implements batch revoke with atomic option
- Adds daily limit checks
- Records individual transactions
- Includes unit tests"
```

**Commit Guidelines:**

✅ **Good Commits:**
- Clear, descriptive messages
- Explain the "why" not just "what"
- Reference issue numbers
- Atomic changes (one logical change per commit)

❌ **Avoid:**
- Vague messages ("fix bug", "update code")
- Mixing unrelated changes
- Large commits with many changes
- Committing commented-out code

### 4. Add Tests

Extend test coverage for your changes:

#### Backend Tests (Motoko)

```bash
# Add test script
cat > test_batch_revoke.sh << 'EOF'
#!/bin/bash
set -e

CHILD_ID=$1
USER="2vxsx-fae"

# Award reputation
dfx canister call $CHILD_ID awardRep \
  "(principal \"$USER\", 100:nat, opt \"Test\")"

# Batch revoke
dfx canister call $CHILD_ID multiRevoke \
  "(vec { record { principal \"$USER\"; 50:nat; opt \"Spam\" } }, true)"

# Verify balance
BALANCE=$(dfx canister call $CHILD_ID getBalance "(principal \"$USER\")")
echo "Balance after revoke: $BALANCE"
EOF

chmod +x test_batch_revoke.sh
```

#### Frontend Tests (React)

```typescript
// src/components/dashboard/__tests__/BatchRevoke.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchRevokeForm } from '../BatchRevokeForm';

describe('BatchRevokeForm', () => {
  it('validates input before submission', () => {
    render(<BatchRevokeForm />);
    
    const submitButton = screen.getByRole('button', { name: /revoke/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });
  
  it('submits batch revoke with multiple users', async () => {
    const onSubmit = jest.fn();
    render(<BatchRevokeForm onSubmit={onSubmit} />);
    
    // Fill form...
    // Submit...
    
    expect(onSubmit).toHaveBeenCalledWith({
      pairs: [
        { principal: 'user1', amount: 50, reason: 'spam' },
        { principal: 'user2', amount: 25, reason: 'spam' },
      ],
      atomic: true,
    });
  });
});
```

### 5. Update Documentation

Document your changes:

```markdown
<!-- frontend/public/docs/api/child.md -->

## multiRevoke

Revoke reputation from multiple users in one transaction.

### Signature

\`\`\`motoko
public shared(msg) func multiRevoke(
  pairs : [(Principal, Nat, ?Text)],
  atomic : Bool
) : async Result.Result<[Nat], Text>
\`\`\`

### Parameters

- `pairs`: Array of (principal, amount, reason) tuples
- `atomic`: If true, all revocations succeed or all fail

### Example

\`\`\`bash
dfx canister call <child_id> multiRevoke \
  "(vec { 
    record { principal \"user1\"; 50:nat; opt \"spam\" };
    record { principal \"user2\"; 25:nat; opt \"spam\" }
  }, true)"
\`\`\`
```

### 6. Submit Pull Request

```bash
# Push to your fork
git push origin feature/batch-revoke

# Open PR on GitHub
```

**PR Template:**

```markdown
## Description
Adds batch revoke functionality for efficient moderation.

## Changes
- Added `multiRevoke` function to child canister
- Implemented atomic transaction support
- Added daily limit checks
- Created test script
- Updated API documentation

## Impact
- Reduces gas costs for bulk moderation
- Improves admin UX
- Maintains complete audit trail

## Testing
- [x] Local replica tests pass
- [x] Frontend integration tested
- [x] Documentation updated
- [x] Test script included

## Follow-up
- [ ] Add CLI command for batch revoke
- [ ] Update dashboard UI

## Ops Considerations
- No cycle budget changes
- No env variable updates
- Backward compatible
```

## Development Setup

### Prerequisites

```bash
# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Install Node.js
nvm install 18
nvm use 18

# Install dependencies
cd frontend
npm install
```

### Local Development

```bash
# Start local replica
dfx start --background --clean

# Deploy canisters
dfx deploy

# Start frontend
cd frontend
npm run dev
```

### Running Tests

```bash
# Backend tests
./factoria_test.sh
./test_factoria_child.sh $(dfx canister id reputation_dao)

# Frontend tests
cd frontend
npm test

# Linting
npm run lint

# Type checking
npm run type-check
```

## Code Style

### Motoko

```motoko
// Use clear, descriptive names
public shared(msg) func awardRep(
  recipient : Principal,
  amount : Nat,
  reason : ?Text
) : async Result.Result<Nat, Text> {
  // Validate inputs
  if (amount == 0) {
    return #err("Amount must be positive");
  };
  
  // Check authorization
  if (not isTrustedAwarder(msg.caller)) {
    return #err("Not authorized");
  };
  
  // Perform operation
  let newBalance = updateBalance(recipient, amount);
  recordTransaction(#award, msg.caller, recipient, amount, reason);
  
  #ok(newBalance)
};
```

**Guidelines:**
- Use descriptive variable names
- Add comments for non-obvious logic
- Handle errors explicitly
- Use Result types for fallible operations
- Keep functions focused and small

### TypeScript/React

```typescript
// Use TypeScript for type safety
interface AwardFormProps {
  canisterId: string;
  onSuccess: (txId: number) => void;
  onError: (error: Error) => void;
}

export function AwardForm({ canisterId, onSuccess, onError }: AwardFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(0);
  
  const awardMutation = useMutation({
    mutationFn: async () => {
      const actor = await makeChildActor('plug', { canisterId });
      return actor.awardRep(Principal.fromText(recipient), BigInt(amount), []);
    },
    onSuccess: (result) => {
      if ('ok' in result) {
        onSuccess(Number(result.ok));
      } else {
        onError(new Error(result.err));
      }
    },
  });
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      awardMutation.mutate();
    }}>
      {/* Form fields */}
    </form>
  );
}
```

**Guidelines:**
- Use TypeScript for all new code
- Follow React hooks best practices
- Use TanStack Query for data fetching
- Keep components small and focused
- Add prop types and JSDoc comments

## Testing Requirements

### Backend

- [ ] Unit tests for new functions
- [ ] Integration tests for workflows
- [ ] Test error cases
- [ ] Test edge cases (limits, boundaries)
- [ ] Test upgrade compatibility

### Frontend

- [ ] Component tests with React Testing Library
- [ ] Integration tests for user flows
- [ ] Accessibility tests
- [ ] Responsive design tests
- [ ] Error state tests

### Documentation

- [ ] API reference updated
- [ ] Usage examples added
- [ ] Migration guide (if breaking changes)
- [ ] Changelog entry

## Review Process

### What We Look For

✅ **Code Quality:**
- Clear, readable code
- Appropriate abstractions
- Error handling
- Type safety

✅ **Testing:**
- Adequate test coverage
- Tests pass locally
- Edge cases covered

✅ **Documentation:**
- API docs updated
- Examples provided
- Comments for complex logic

✅ **Impact:**
- Solves the stated problem
- No unintended side effects
- Backward compatible (or migration path)

### Review Timeline

- **Initial Review**: Within 3 business days
- **Follow-up**: Within 2 business days
- **Merge**: After approval and CI passes

## Recognition

We value all contributions:

- **Code**: Listed in contributors
- **Documentation**: Credited in docs
- **Community**: Highlighted in updates
- **Significant Contributions**: Eligible for reputation rewards

## Getting Help

Stuck? Reach out:

- **Telegram**: [@reputationdao](https://t.me/reputationdao)
- **GitHub Discussions**: Ask questions
- **Monthly Calls**: Join governance calls

## Next Steps

### 📚 [Code of Conduct](/docs/community/code-of-conduct)
Read our community standards

### 🔧 [Getting Started](/docs/getting-started)
Set up your development environment

### 💬 [Community Resources](/docs/community/resources)
Join the conversation

### 🆘 [Support](/docs/community/support)
Get help when you need it
