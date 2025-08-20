import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface UserReputationCardProps {
  title: string;                // e.g. "My Reputation"
  titleIcon?: React.ReactNode;  // e.g. <EmojiEventsIcon />
  value: number | string;       // e.g. 120
  valueVariant?: "h1" | "h2" | "h3" | "h4"; // default: h3
  statusLabel: string;          // e.g. "Current Score"
  statusIcon?: React.ReactNode; // e.g. <TrendingUpIcon />
  bgColor?: string;             // optional background override
  borderColor?: string;         // optional border override
}

const UserReputationCard: React.FC<UserReputationCardProps> = ({
  title,
  titleIcon = <EmojiEventsIcon sx={{ color: 'hsl(var(--warning))', fontSize: '22px' }} />,
  value,
  valueVariant = "h3",
  statusLabel,
  statusIcon = <TrendingUpIcon sx={{ color: 'hsl(var(--success))', fontSize: '18px' }} />,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}) => {
  return (
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
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: "hsl(var(--muted-foreground))",
              fontSize: "0.9rem",
              fontWeight: 500,
              letterSpacing: 0.3,
            }}
          >
            {title}
          </Typography>
          {titleIcon}
        </Box>

        {/* Main Value */}
        <Typography
          variant={valueVariant}
          sx={{
            color: "hsl(var(--foreground))",
            fontWeight: 700,
            lineHeight: 1.2,
            mb: 1,
          }}
        >
          {value}
        </Typography>

        {/* Status */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {statusIcon}
          <Typography
            variant="body2"
            sx={{
              color: "hsl(var(--success))",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            {statusLabel}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserReputationCard;
