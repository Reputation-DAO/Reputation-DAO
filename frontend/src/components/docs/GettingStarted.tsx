// src/components/docs/DocsContentGettingStarted.tsx
import { Box, Container, Typography, Paper, Divider } from "@mui/material";

const codeStyle = {
  fontFamily: "Source Code Pro, monospace",
  backgroundColor: "hsl(var(--muted))",
  borderRadius: 1,
  padding: "0.4rem 0.6rem",
  display: "inline-block",
  userSelect: "text",
  fontSize: "0.9rem",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

export default function DocsContentGettingStarted() {
  return (
    <Container maxWidth="md" disableGutters sx={{ py: 6, px: 3 }}>
      <Typography variant="h3" fontWeight={900} gutterBottom>
        Getting Started with Reputation DAO
      </Typography>

      <Typography variant="body1" color="text.secondary" mb={4} sx={{ fontSize: "1.1rem" }}>
        Reputation DAO is a soulbound, on-chain reputation system built on the Internet Computer Protocol (ICP) using Motoko.
        It provides a tamper-proof trust layer so communities can transparently manage reputation points.
      </Typography>

      <Paper
        elevation={2}
        sx={{ p: 3, mb: 5, bgcolor: "hsl(var(--background))", borderRadius: 2, border: "1px solid hsl(var(--border))" }}
      >
        <Typography variant="h5" fontWeight={700} mb={2} color="primary.main">
          Quickstart
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>
            1. Initialize backend
          </Typography>
          <Typography>
            Get your Plug principal ID and paste it inside <code style={codeStyle}>main.mo</code> as:
          </Typography>
          <Box component="pre" sx={{ ...codeStyle, mt: 1, mb: 2 }}>
            {`stable var owner : Principal = Principal.fromText("<your-principal-id>");`}
          </Box>
          <Typography>
            Then start the local replica and deploy the canister:
          </Typography>
          <Box component="pre" sx={{ ...codeStyle, mt: 1 }}>
            {`# Start local replica
$ dfx start --background --clean

# Deploy canister
$ dfx deploy --network playground
`}
          </Box>
          <Typography variant="caption" color="text.secondary" mt={1}>
            *Note:* Playground will only host backend for 20 minutes.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>
            2. Modify frontend
          </Typography>
          <Typography>
            Copy the canister ID generated from playground (e.g. <code style={codeStyle}>2uurk-ziaaa-aaaab-qacla-cai</code>) and paste it inside{" "}
            <code style={codeStyle}>frontend/src/components/canister/reputationDao.ts</code> as the <code>canisterId</code>.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" fontWeight={600} mb={1}>
            3. Run frontend
          </Typography>
          <Typography>
            Inside the <code style={codeStyle}>frontend</code> folder, install dependencies and start dev server:
          </Typography>
          <Box component="pre" sx={{ ...codeStyle, mt: 1 }}>
            {`cd frontend
npm install
npm run dev`}
          </Box>
          <Typography mt={1}>
            Refer to <code style={codeStyle}>main.mo</code> for method documentation and business logic.
          </Typography>
        </Box>
      </Paper>

      <Typography variant="h4" fontWeight={800} gutterBottom>
        Why Build Reputation DAO?
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4} sx={{ fontSize: "1.05rem" }}>
        Trust in many communities today is scattered, unverifiable, and centralized.
        Reputation DAO solves this by making trust fully <strong>on-chain, transparent, auditable, and portable.</strong>
      </Typography>

      <Divider sx={{ my: 5 }} />

      <Typography variant="h4" fontWeight={800} gutterBottom>
        Key Features & Benefits
      </Typography>
      <ul style={{ paddingLeft: 20, color: "hsl(var(--foreground))", fontSize: "1rem" }}>
        <li>⭐ Soulbound reputation points that cannot be transferred</li>
        <li>🛡️ Controlled minting by trusted parties only</li>
        <li>🚫 Abuse prevention with daily minting limits</li>
        <li>📜 Fully public and verifiable ledger on-chain</li>
        <li>🔗 Portable and modular across dApps and ecosystems</li>
        <li>⚙️ Easy integration for gating, voting, or privileges</li>
      </ul>
    </Container>
  );
}
