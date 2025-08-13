// src/components/docs/DocsContentGettingStarted.tsx
import { Box, Container, Typography, Paper, Divider } from "@mui/material";

const codeBlockStyle = {
  fontFamily: "Source Code Pro, monospace",
  backgroundColor: "hsl(var(--muted))",
  borderRadius: "var(--radius)",
  padding: "1rem",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: "0.9rem",
  userSelect: "text",
  marginTop: "1rem",
  marginBottom: "1rem",
  color: "hsl(var(--foreground))",
  border: "1px solid hsl(var(--border))",
};

export default function DocsContentGettingStarted() {
  return (
    <Container
      maxWidth="md"
      disableGutters
      sx={{ py: 6, px: 3, color: "hsl(var(--foreground))" }}
    >
      <Typography variant="h3" fontWeight={900} gutterBottom>
        Smart Contracts
      </Typography>

      {/* 1 — Overview */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 5,
          bgcolor: "hsl(var(--background))",
          borderRadius: "var(--radius)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Overview
        </Typography>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}>
          Reputation DAO’s smart contracts are deployed as{" "}
          <strong>canisters</strong> on the{" "}
          <strong>Internet Computer Protocol (ICP)</strong>. A canister is
          similar to a smart contract but has its own memory, can store large
          amounts of data, and supports WebAssembly execution for efficiency.
          These canisters govern:
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            color: "hsl(var(--foreground))",
            "& li": { mb: 1 },
          }}
        >
          <li>Minting and managing non-transferable reputation tokens</li>
          <li>Enforcing role-based permissions for DAO governance</li>
          <li>Storing immutable on-chain records for transparency</li>
          <li>Automating and logging every reputation-related action</li>
        </Box>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mt: 2 }}>
          This architecture ensures trust, resilience, and independence from any
          single centralized service.
        </Typography>
      </Paper>

      <Divider sx={{ my: 6, borderColor: "hsl(var(--border))" }} />

      {/* 2 — Core Canisters */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 5,
          bgcolor: "hsl(var(--background))",
          borderRadius: "var(--radius)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Core Canisters
        </Typography>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}>
          The system is modular, meaning each canister has a focused role:
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            color: "hsl(var(--foreground))",
            "& li": { mb: 1 },
          }}
        >
          <li>
            <strong>Factory Canister:</strong> Deploys new DAO canisters and
            tracks their lifecycle.
          </li>
          <li>
            <strong>DAO Canisters:</strong> Store user reputations, manage role
            assignments, track proposals, and record votes.
          </li>
          <li>
            <strong>Reputation Token Canister:</strong> Issues{" "}
            <em>soulbound</em> tokens tied to a user’s principal ID.
          </li>
        </Box>
      </Paper>

      <Divider sx={{ my: 6, borderColor: "hsl(var(--border))" }} />

      {/* 3 — Data Structures */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 5,
          bgcolor: "hsl(var(--background))",
          borderRadius: "var(--radius)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Key Data Structures
        </Typography>
        <Box component="pre" sx={codeBlockStyle}>
{`type User = {
  principal: Principal;
  roles: [Role];
  reputation: Nat;
};

type Role = {
  Admin;
  Awarder;
  User;
};

type DAOConfig = {
  name: Text;
  description: Text;
  maxReputation: Nat;
  rewardCatalogue: [Reward];
};`}
        </Box>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mt: 2 }}>
          These types define how users, roles, and DAO settings are stored.
          <code>DAOConfig</code> enables flexible customization.
        </Typography>
      </Paper>

      <Divider sx={{ my: 6, borderColor: "hsl(var(--border))" }} />

      {/* 4 — Main Functions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 5,
          bgcolor: "hsl(var(--background))",
          borderRadius: "var(--radius)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Main Functions
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            color: "hsl(var(--foreground))",
            "& li": { mb: 1 },
          }}
        >
          <li>
            <code>awardReputation(user: Principal, points: Nat)</code> — Grants points.
          </li>
          <li>
            <code>revokeReputation(user: Principal, points: Nat)</code> — Removes points.
          </li>
          <li>
            <code>getReputation(user: Principal)</code> — Returns a user’s score.
          </li>
          <li>
            <code>redeemRewards(user: Principal, rewardId: Nat)</code> — Redeems rewards.
          </li>
          <li>
            <code>createDAO(params)</code> — Initializes a new DAO.
          </li>
        </Box>
      </Paper>

      <Divider sx={{ my: 6, borderColor: "hsl(var(--border))" }} />

      {/* 5 — Security */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: "hsl(var(--background))",
          borderRadius: "var(--radius)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Security & Access Control
        </Typography>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}>
          The system follows strict <strong>least-privilege</strong> rules:
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            color: "hsl(var(--foreground))",
            "& li": { mb: 1 },
          }}
        >
          <li>Admins manage roles and can revoke reputation.</li>
          <li>Awarders can only grant reputation.</li>
          <li>All privileged calls check the caller’s principal ID.</li>
          <li>
            Canisters are upgradeable only via governance-approved proposals.
          </li>
        </Box>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mt: 2 }}>
          Combining immutable logic, verifiable history, and role-based controls
          ensures decentralization and accountability.
        </Typography>
      </Paper>
    </Container>
  );
}
