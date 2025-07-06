import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
} from '@mui/material';
import { Star, Gavel, Wallet } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        px: { xs: 2, sm: 4, md: 8 },
        py: { xs: 6, sm: 8, md: 8 },
        transition: 'background-color var(--transition-smooth), color var(--transition-smooth)',
      }}
    >
      {/* Header Card */}
      <Paper
        elevation={4}
        sx={{
          maxWidth: 800,
          mx: 'auto',
          mt: { xs: 4, md: 6 },
          p: { xs: 3, sm: 5, md: 6 },
          mb: { xs: 5, md: 8 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, hsla(var(--primary), 0.2), hsla(var(--muted), 0.9))',
          color: 'hsl(var(--foreground))',
          border: 'var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          gap={{ xs: 3, sm: 4 }}
        >
          <Avatar
            sx={{
              bgcolor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              width: { xs: 64, sm: 72 },
              height: { xs: 64, sm: 72 },
              fontSize: 30,
            }}
          >
            R
          </Avatar>
          <Box textAlign={{ xs: 'center', sm: 'left' }}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }, mb: 1 }}
            >
              Welcome to Reputation DAO
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, opacity: 0.85 }}
            >
              Manage, award, and track community reputation.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Action Cards Without Grid */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          justifyContent: 'center',
          maxWidth: 1100,
          mx: 'auto',
        }}
      >
        <ActionCard
          icon={<Star size={35} />}
          title="Award Reputation"
          description="Grant positive reputation to contributors."
          href="/award"
          color="--primary"
        />
        <ActionCard
          icon={<Gavel size={35} />}
          title="Revoke Reputation"
          description="Remove reputation from violators."
          href="/revoke"
          color="--primary"
        />
        <ActionCard
          icon={<Wallet size={35} />}
          title="View Balances"
          description="Check current reputation of members."
          href="/balances"
          color="--primary"
        />
      </Box>
    </Box>
  );
};

const ActionCard = ({
  icon,
  title,
  description,
  href,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}) => {
  return (
    <Box
      sx={{
        width: { xs: '100%', sm: '45%', md: '30%' },
        minWidth: 260,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: 'hsl(var(--muted))',
          color: 'hsl(var(--foreground))',
          border: 'var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all var(--transition-smooth)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Avatar
          sx={{
            bgcolor: `hsl(var(${color}))`,
            color: 'hsl(var(--primary-foreground))',
            width: 48,
            height: 48,
            mx: 'auto',
            mb: 1,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
          {title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            mb: 1.5,
            display: 'block',
            minHeight: '32px',
            fontSize: '0.75rem',
          }}
        >
          {description}
        </Typography>
        <Button
          variant="contained"
          href={href}
          size="small"
          sx={{
            mt: 0.5,
            borderRadius: 2,
            px: 2,
            backgroundColor: `hsl(var(${color}))`,
            color: 'hsl(var(--primary-foreground))',
            '&:hover': {
              backgroundColor: 'hsl(var(--accent))',
              color: 'hsl(var(--accent-foreground))',
            },
          }}
        >
          Go
        </Button>
      </Paper>
    </Box>
  );
};

export default Dashboard;
