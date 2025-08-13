import { Box, Container, Typography, Paper, Divider } from "@mui/material";

export default function DocsContentArchitecture() {
  return (
    <Container
      maxWidth="md"
      disableGutters
      sx={{
        py: 6,
        px: 3,
        color: "hsl(var(--foreground))",
      }}
    >
      <Typography variant="h3" fontWeight={900} gutterBottom>
        Architecture
      </Typography>

      {/* First flowchart and explanation */}
      <Box sx={{ mb: 4 }}>
        <Box
          component="img"
          src="docs/website.png"
          alt="Website Flow Overview"
          sx={{
            width: "100%",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
          }}
        />
      </Box>

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
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Website Flow Overview
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}
        >
          The landing page serves as the gateway to the Reputation DAO ecosystem.
          From here, users can explore key sections:
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
            Community page featuring contribution guidelines and repository links
          </li>
          <li>Comprehensive documentation and FAQs</li>
          <li>Blog with posts and updates</li>
          <li>
            Authentication flows: login, signup, and password recovery, including
            two-factor authentication for security
          </li>
        </Box>
        <Typography
          variant="body1"
          sx={{ color: "hsl(var(--muted-foreground))", mt: 2 }}
        >
          Upon successful authentication, users are routed according to their
          roles:
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
            <strong>Admin:</strong> Oversees the system, with privileges to revoke
            reputation and manage awarders
          </li>
          <li>
            <strong>Awarder:</strong> Authorized to grant reputation points to
            contributors
          </li>
          <li>
            <strong>User:</strong> Can view and verify their reputation scores and
            redeem rewards
          </li>
        </Box>
      </Paper>

      <Divider sx={{ my: 6, borderColor: "hsl(var(--border))" }} />

      {/* Second flowchart and explanation */}
      <Box sx={{ mb: 4 }}>
        <Box
          component="img"
          src="docs/core.png"
          alt="Reputation DAO Workflow"
          sx={{
            width: "100%",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
          }}
        />
      </Box>

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
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Reputation DAO Workflow
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}
        >
          Reputation in the DAO is earned and tracked via a combination of
          automated and manual mechanisms:
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
            Community contributions can be recognized automatically through
            engagement signals like “likes” on content
          </li>
          <li>
            Admins and awarders can manually assign reputation points for verified
            valuable contributions
          </li>
          <li>
            Reputation points are soulbound tokens—non-transferable and permanently
            linked to the user’s identity
          </li>
          <li>
            All reputation data is stored on-chain, ensuring transparency and
            immutability
          </li>
          <li>
            Users can redeem reputation points for rewards, encouraging continued
            positive participation
          </li>
        </Box>
      </Paper>

      <Divider sx={{ my: 6, borderColor: "hsl(var(--border))" }} />

      {/* Third flowchart and explanation */}
      <Box sx={{ mb: 4 }}>
        <Box
          component="img"
          src="docs/backend.png"
          alt="Backend Architecture & Canister Management"
          sx={{
            width: "100%",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-lg)",
          }}
        />
      </Box>

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
        <Typography
          variant="h5"
          fontWeight={700}
          mb={2}
          sx={{ color: "hsl(var(--primary))" }}
        >
          Backend Architecture & Canister Management
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "hsl(var(--muted-foreground))", mb: 2 }}
        >
          The backend leverages ICP’s canister smart contracts to provide modular,
          scalable, and secure logic:
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
            <strong>Factory Canister:</strong> Oversees deployment and recycling of
            DAO backend canisters for efficient resource management
          </li>
          <li>
            <strong>DAO Canisters:</strong> Individual instances handling user data,
            reputation minting, voting, and governance logic per DAO
          </li>
          <li>
            <strong>Key-Value Indexing:</strong> Maintains mappings between user
            principals and canister IDs for quick lookup
          </li>
          <li>
            <strong>Payment Model:</strong> DAO creation requires ICP token payments
            converted to cycles, supporting backend execution with commission-based
            fees
          </li>
          <li>
            <strong>Governance Security:</strong> Smart contracts enforce role
            permissions, enabling admins and awarders to perform sensitive actions
            securely
          </li>
        </Box>
        <Typography
          variant="body1"
          sx={{ color: "hsl(var(--muted-foreground))", mt: 3 }}
        >
          This architecture prioritizes:
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 3,
            fontSize: "1rem",
            "& li": { mb: 1, color: "hsl(var(--foreground))" },
          }}
        >
          <li>Decentralization, avoiding single points of failure</li>
          <li>On-chain transparency and tamper-proof records</li>
          <li>Scalability to support multiple DAOs and user bases</li>
          <li>Security and trust through immutable backend logic</li>
        </Box>
      </Paper>
    </Container>
  );
}
