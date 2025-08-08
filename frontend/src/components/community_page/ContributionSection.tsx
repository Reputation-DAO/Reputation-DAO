import { Box, Typography, Paper } from '@mui/material';

export default function ContributionSection(): JSX.Element {
  return (
    <Box sx={{ mb: 14 }}>
      {/* Section Heading */}
      <Typography
        variant="h2"
        sx={{
          fontWeight: 700,
          textAlign: 'center',
          mb: 2,
          color: 'hsl(var(--foreground))',
          py:3,
        }}
      >
        Contributing to Reputation DAO
      </Typography>

      {/* Contribution Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 4,
        }}
      >
        {/* Community Contributions */}
        <Paper
          sx={{
            p: 4,
            background: 'hsl(var(--muted) / 0.5)',
            
            border: 'var(--glass-border)',
            borderRadius: 'var(--radius)',
            transition: 'var(--transition-smooth)',
            color:"hsl(var(--foreground))",
            '&:hover': {
              background: 'hsl(var(--background))',
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px hsl(var(--primary) / 0.2)',
              border: '1px solid hsl(var(--primary))',
            },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Community Contributions
          </Typography>
          <Typography sx={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.7 }}>
            There are many ways to contribute to Reputation DAO — submit pull requests to improve the codebase, participate in governance discussions, share innovative ideas for new features, or provide constructive feedback that helps the community grow stronger.
You can also help by writing documentation, creating tutorials, producing educational content, assisting newcomers in our community channels, or promoting our mission on social media to reach a wider audience. Every contribution, no matter the size, plays a role in moving the DAO forward.
          </Typography>
        </Paper>

        {/* Open Source Ethos */}
        <Paper
          sx={{
            p: 4,
            background: 'hsl(var(--muted) / 0.5)',
           
            border: 'var(--glass-border)',
            borderRadius: 'var(--radius)',
            transition: 'var(--transition-smooth)',
            color:"hsl(var(--foreground))",
            '&:hover': {
              background: 'hsl(var(--background))',
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px hsl(var(--primary) / 0.2)',
              border: '1px solid hsl(var(--primary))',
            },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Open Source Ethos
          </Typography>
          <Typography sx={{ color: 'hsl(var(--muted-foreground))', lineHeight: 1.7 }}>
            Reputation DAO is built on the principles of decentralization, transparency, and open governance — values that ensure trust, inclusivity, and long-term sustainability.
All of our work is open source, allowing anyone to inspect, improve, and adapt it for the benefit of the wider Web3 community. By contributing, you’re not just helping build a protocol — you’re joining a global movement that’s shaping a fairer, more accountable digital future.


          </Typography>
        </Paper>
      </Box>
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
