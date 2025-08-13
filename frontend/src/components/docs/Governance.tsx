// src/components/docs/Governance.tsx
import { Box, Container, Typography, Paper, Divider } from "@mui/material";

export default function Governance() {
  return (
    <Container
      maxWidth="md"
      disableGutters
      sx={{ py: 6, px: 3, color: "hsl(var(--foreground))" }}
    >
      <Typography variant="h3" fontWeight={900} gutterBottom sx={{ color: "hsl(var(--foreground))" }}>
        Governance
      </Typography>

      <Typography
        variant="body1"
        sx={{ fontSize: "1.1rem", color: "hsl(var(--muted-foreground))", mb: 4 }}
      >
        Governance in Reputation DAO is a cornerstone feature that empowers
        contributors to shape the evolution, rules, and policies of the system
        transparently and securely. By tying governance power directly to
        soulbound reputation points, we ensure that decision-making reflects
        the merit and trustworthiness of community members.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 5,
          bgcolor: "hsl(var(--background))",
          borderRadius: "var(--radius)",
          border: "1px solid hsl(var(--border))",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Core Governance Principles */}
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Core Governance Principles
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            "& li": { mb: 1, color: "hsl(var(--foreground))" },
          }}
        >
          <li>
            <strong>Decentralized & Community-Driven:</strong> No central
            authority controls Reputation DAO. Governance is fully
            decentralized, ensuring all changes reflect community consensus.
          </li>
          <li>
            <strong>Reputation-Weighted Voting:</strong> Voting power is
            proportional to soulbound reputation points, rewarding consistent
            positive contributions.
          </li>
          <li>
            <strong>Transparency & Auditability:</strong> Every proposal, vote,
            and outcome is recorded on-chain, guaranteeing a public,
            tamper-proof governance record.
          </li>
          <li>
            <strong>Inclusivity & Meritocracy:</strong> All reputation holders
            can participate in governance, balancing openness with merit-based
            influence.
          </li>
          <li>
            <strong>Security & Abuse Prevention:</strong> Measures like voting
            thresholds, proposal cooldowns, and reputation decay prevent
            manipulation and spam.
          </li>
          <li>
            <strong>Adaptive & Evolvable:</strong> Governance structures and
            parameters can evolve as the DAO grows and community needs change.
          </li>
        </Box>

        <Divider sx={{ my: 4, borderColor: "hsl(var(--border))" }} />

        {/* Governance Roles */}
        <Typography variant="h5" fontWeight={700} mb={2} sx={{ color: "hsl(var(--primary))" }}>
          Governance Roles & Rights
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            "& li": { mb: 1, color: "hsl(var(--foreground))" },
          }}
        >
          <li>
            <strong>Reputation Holders:</strong> Individuals who hold soulbound
            reputation tokens. They have the right to submit proposals and vote.
          </li>
          <li>
            <strong>Proposal Creators:</strong> Any reputation holder can create
            proposals that suggest changes to protocol parameters, reputation
            rules, or system upgrades.
          </li>
          <li>
            <strong>Voters:</strong> Reputation holders who cast votes during
            active proposal periods. Votes are weighted by the holder’s
            reputation.
          </li>
          <li>
            <strong>Governance Executors:</strong> Smart contract mechanisms
            that automatically execute passed proposals or trigger multisig
            actions if necessary.
          </li>
        </Box>

        <Divider sx={{ my: 4, borderColor: "hsl(var(--border))" }} />

        {/* Proposal Lifecycle */}
        <Typography variant="h5" fontWeight={700} mb={2} sx={{ color: "hsl(var(--primary))" }}>
          Proposal Lifecycle
        </Typography>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}>
          The governance process follows a structured lifecycle:
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            "& li": { mb: 1, color: "hsl(var(--foreground))" },
          }}
        >
          <li>
            <strong>Submission:</strong> A proposal is drafted by a reputation
            holder describing the suggested changes.
          </li>
          <li>
            <strong>Discussion & Feedback:</strong> The proposal is discussed
            publicly in forums or governance channels to gather feedback and
            improvements.
          </li>
          <li>
            <strong>Voting:</strong> The proposal enters a voting period where
            reputation holders cast their weighted votes.
          </li>
          <li>
            <strong>Execution:</strong> If the proposal meets quorum and
            majority thresholds, it is executed automatically on-chain or
            manually by governance executors.
          </li>
          <li>
            <strong>Post-Execution Review:</strong> Outcomes and impacts are
            monitored, and lessons inform future governance improvements.
          </li>
        </Box>

        <Divider sx={{ my: 4, borderColor: "hsl(var(--border))" }} />

        {/* Voting Mechanics */}
        <Typography variant="h5" fontWeight={700} mb={2} sx={{ color: "hsl(var(--primary))" }}>
          Voting Mechanics & Security
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            "& li": { mb: 1, color: "hsl(var(--foreground))" },
          }}
        >
          <li>
            <strong>Weighted Votes:</strong> Votes are weighted by the holder’s
            current reputation balance, ensuring contributors with more at stake
            have proportional influence.
          </li>
          <li>
            <strong>Quorum & Thresholds:</strong> Proposals require minimum
            participation (quorum) and majority approval thresholds to pass,
            preventing low-engagement or malicious changes.
          </li>
          <li>
            <strong>Proposal Cooldowns:</strong> Limits on how frequently
            proposals can be submitted or voted on to prevent spam or rushed
            governance.
          </li>
          <li>
            <strong>Reputation Decay:</strong> To maintain active and relevant
            participation, inactive or malicious users’ reputation may decay
            over time.
          </li>
          <li>
            <strong>Auditability:</strong> On-chain records allow anyone to
            verify the integrity of votes and proposal outcomes, fostering
            trust.
          </li>
        </Box>

        <Divider sx={{ my: 4, borderColor: "hsl(var(--border))" }} />

        {/* Future Adaptability */}
        <Typography variant="h5" fontWeight={700} mb={2} sx={{ color: "hsl(var(--primary))" }}>
          Future Adaptability
        </Typography>
        <Typography variant="body1" sx={{ color: "hsl(var(--muted-foreground))", mb: 4 }}>
          Reputation DAO’s governance model is designed for flexibility and
          growth. As the ecosystem evolves, governance parameters and
          mechanisms can be updated to better fit community needs, technological
          advances, and security requirements — all through the same transparent
          proposal and voting process.
        </Typography>
      </Paper>
    </Container>
  );
}
