import { Box, Typography, GridLegacy as Grid, Avatar, Paper } from '@mui/material';

const contributors = [
  {
    name: 'Danis Pratap Singh',
    role: 'Radical User',
    img: '/user/user1.png',
    description:
      'Founder & Lead Developer — Leads the vision, architecture, and development of Reputation DAO. Responsible for smart contract design (Motoko), backend logic, and overall project strategy.',
  },
  {
    name: 'Ayush Kumar Gaur',
    role: 'Ayush3941',
    img: '/user/user2.png',
    description:
      'Frontend & Integration Developer — Focused on the user-facing experience and technical integrations. Implemented frontend UI components, wallet connections, and linking the canister with the frontend for seamless interactions.',
  },
];

export default function SpotlightContributors() {
  return (
    <Box sx={{ mb: 14 }}>
      <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          textAlign: 'center',
          mb: 2,
          color: 'hsl(var(--foreground))',
        }}
      >
        Spotlight on Contributors
      </Typography>
      <Typography
        sx={{
          textAlign: 'center',
          color: 'hsl(var(--muted-foreground))',
          maxWidth: 600,
          mx: 'auto',
          mb: 6,
        }}
      >
        Meet some of the amazing individuals who help build, grow, and sustain Reputation DAO.
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {contributors.map((person, idx) => (
          <Grid item key={idx}>
            <Paper
              sx={{
                width: 280,
                height: 280, // 🔹 Fixed square size
                p: 3,
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--muted) / 0.2)',
                border: 'var(--glass-border)',
                transition: 'var(--transition-smooth)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: 'hsl(var(--foreground))',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px hsl(var(--primary) / 0.2)',
                  border: '1px solid hsl(var(--primary))',
                  background: 'hsl(var(--background))',
                },
              }}
            >
              <Avatar
                src={person.img}
                alt={person.name}
                sx={{
                  width: 70,
                  height: 70,
                  mx: 'auto',
                  mb: 2,
                  border: '2px solid hsl(var(--primary))',
                }}
              />
              <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{person.name}</Typography>
              <Typography sx={{ color: 'hsl(var(--primary))', mb: 1, fontSize: 14 }}>
                {person.role}
              </Typography>
              <Typography
                sx={{
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                {person.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box
        sx={{
          width: '100%',
          height: '1px',
          my: 8,
          background: 'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
        }}
      />
    </Box>
  );
}
