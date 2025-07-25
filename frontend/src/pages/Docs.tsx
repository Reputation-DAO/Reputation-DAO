import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';

const navItems = [
  'Getting Started',
  'Architecture Overview',
  'Smart Contract (Motoko Canister)',
  'API Reference',
  'Integration Guide (Plug, Internet Identity, Stoic)',
  'Governance Rules',
  'FAQ',
];

const apiEndpoints = [
  { endpoint: 'getReputationScore(userId)', desc: 'Retrieves the reputation score for a given user ID.' },
  { endpoint: 'updateReputationScore(userId, delta)', desc: 'Updates the reputation score for a user by a specified delta.' },
  { endpoint: 'getGovernanceRules()', desc: 'Returns the current governance rules for the DAO.' },
];

export default function DocsPage() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'hsl(var(--background))' }}>
      {/* Sidebar */}
      <Paper
        component="aside"
        elevation={4}
        sx={{
          width: 260,
          backdropFilter: 'blur(12px)',
          bgcolor: 'hsl(var(--card) / 0.6)',
          borderRight: '1px solid hsl(var(--border))',
          px: 2,
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>
            Documentation
          </Typography>
          <List dense disablePadding>
            {navItems.map((text, idx) => (
              <ListItemButton
                key={idx}
                selected={idx === 0}
                sx={{
                  py: 1,
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--foreground))',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    bgcolor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--foreground))',
                  },
                  '&:hover': {
                    bgcolor: 'hsl(var(--primary) / 0.05)',
                  },
                }}
              >
                <ListItemText
                  primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
                  primary={text}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', mt: 4 }}>
          <Typography>Need help?</Typography>
          <Typography sx={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>Contact Support</Typography>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 6, overflowY: 'auto' }}>
        <Container maxWidth="md" disableGutters>
          <Typography variant="h6" sx={{ color: 'hsl(var(--muted-foreground))', mb: 1 }}>
            Docs
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: 'hsl(var(--foreground))' }}>
            Getting Started
          </Typography>
          <Typography sx={{ color: 'hsl(var(--muted-foreground))', mb: 4 }}>
            Welcome to the Reputation DAO documentation. This guide will help you understand the core concepts and get started with integrating Reputation DAO into your applications.
          </Typography>

          <Divider sx={{ my: 4, borderColor: 'hsl(var(--border))' }} />

          {/* Prerequisites */}
          <Typography variant="h6" sx={{ mb: 2, color: 'hsl(var(--foreground))' }}>
            Prerequisites
          </Typography>
          <Box
            component="ul"
            sx={{
              pl: 3,
              mb: 4,
              color: 'hsl(var(--muted-foreground))',
              '& li': { mb: 1.2, fontSize: 14 },
            }}
          >
            <li>Node.js and npm installed</li>
            <li>Basic understanding of blockchain concepts</li>
          </Box>

          {/* Installation */}
          <Typography variant="h6" sx={{ mb: 2, color: 'hsl(var(--foreground))' }}>
            Installation
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              fontFamily: 'monospace',
              fontSize: 14,
              p: 2,
              borderRadius: 'var(--radius)',
              bgcolor: 'hsl(var(--muted) / 0.2)',
              borderColor: 'hsl(var(--border))',
              mb: 4,
              color: 'hsl(var(--foreground))',
            }}
          >
            npm install reputation-dao
          </Paper>

          {/* Basic Usage */}
          <Typography variant="h6" sx={{ mb: 2, color: 'hsl(var(--foreground))' }}>
            Basic Usage
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              fontFamily: 'monospace',
              fontSize: 14,
              p: 2,
              borderRadius: 'var(--radius)',
              bgcolor: 'hsl(var(--muted) / 0.2)',
              borderColor: 'hsl(var(--border))',
              mb: 4,
              color: 'hsl(var(--foreground))',
            }}
          >
{`import { getReputationScore } from 'reputation-dao';

const score = await getReputationScore('user-principal-id');`}
          </Paper>

          {/* API Reference */}
          <Typography variant="h6" sx={{ mb: 2, color: 'hsl(var(--foreground))' }}>
            API Endpoints
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              mb: 4,
              borderColor: 'hsl(var(--border))',
              bgcolor: 'hsl(var(--card))',
            }}
          >
            <Box sx={{ display: 'flex', p: 1.5, fontWeight: 600, fontSize: 13, color: 'hsl(var(--foreground))' }}>
              <Box width="50%" pl={1}>Endpoint</Box>
              <Box width="50%">Description</Box>
            </Box>
            {apiEndpoints.map((api, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  borderTop: '1px solid hsl(var(--border))',
                  p: 1.5,
                  fontSize: 13,
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                <Box width="50%" pl={1} sx={{ fontFamily: 'monospace' }}>{api.endpoint}</Box>
                <Box width="50%">{api.desc}</Box>
              </Box>
            ))}
          </Paper>

          {/* Integration Link */}
          <Typography variant="h6" sx={{ mb: 2, color: 'hsl(var(--foreground))' }}>
            Integration Examples
          </Typography>
          <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
            For detailed integration examples with Plug, Internet Identity, and Stoic, refer to the <strong>Integration Guide</strong> section.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
