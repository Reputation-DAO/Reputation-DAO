import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { TrendingUp, Refresh } from '@mui/icons-material';

interface OverviewCardProps {
  totalUsers: number;
  activeUsers: number;
  totalReputation: number;
  refreshing: boolean;
  onRefresh: () => void;
  width?: string | object;
  bgColor?: string;
  borderColor?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  totalUsers,
  activeUsers,
  totalReputation,
  refreshing,
  onRefresh,
  width = { xs: '100%', lg: '300px' },
  bgColor = 'hsl(var(--background))',
  borderColor = 'hsl(var(--border))',
}) => {
  const stats = [
    { label: 'Total Users', value: totalUsers, color: 'hsl(var(--foreground))' },
    { label: 'Active Users', value: activeUsers, color: 'hsl(var(--primary))' },
    { label: 'Total Reputation', value: `${totalReputation.toLocaleString()} REP`, color: 'hsl(var(--foreground))' },
  ];

  return (
    <Box sx={{ width }}>
      <Card
        sx={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: "var(--radius)",
          boxShadow: `
            4px 4px 10px hsl(var(--muted) / 0.4),
            -4px -4px 10px hsl(var(--muted) / 0.1)
          `,
          transition: "var(--transition-smooth)",
          "&:hover": {
            boxShadow: `
              6px 6px 14px hsl(var(--primary) / 0.5),
              -6px -6px 14px hsl(var(--primary) / 0.2)
            `,
          },
          mb: 4,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "hsl(var(--muted-foreground))",
                fontSize: "0.9rem",
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                letterSpacing: 0.3,
              }}
            >
              <TrendingUp sx={{ color: 'hsl(var(--primary))' }} />
              Overview
            </Typography>
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={refreshing}
              sx={{
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              {refreshing ? <CircularProgress size={16} /> : <Refresh />}
            </IconButton>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stats.map((stat, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  background: 'hsl(var(--card))',
                  borderRadius: "var(--radius)",
                  border: `1px solid ${borderColor}`,
                  boxShadow: `
                    inset 2px 2px 4px hsl(var(--muted) / 0.2),
                    inset -2px -2px 4px hsl(var(--muted) / 0.05)
                  `,
                  transition: "var(--transition-smooth)",
                  "&:hover": {
                    boxShadow: `
                      inset 2px 2px 6px hsl(var(--muted) / 0.3),
                      inset -2px -2px 6px hsl(var(--muted) / 0.1)
                    `,
                  },
                }}
              >
                <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ color: stat.color, fontWeight: 600 }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OverviewCard;
