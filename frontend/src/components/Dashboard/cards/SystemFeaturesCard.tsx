// src/components/SystemFeaturesCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Box,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';

const SystemFeaturesCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 0.5,
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
        {/* Icon avatar like ActivityCard */}
        <Avatar
          sx={{
            bgcolor: 'hsl(var(--primary))',
            width: 48,
            height: 48,
            mb: 2,
          }}
        >
          <SettingsIcon sx={{ color: 'hsl(var(--primary-foreground))' }} />
        </Avatar>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            mb: 1,
          }}
        >
          Quick Access System Features
        </Typography>

        {/* Subtext */}
        <Typography
          variant="body2"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            mb: 3,
          }}
        >
          Quick access advanced system features and monitoring tools
        </Typography>

        {/* Action button */}
        <Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/decay')}
            sx={{
              color: 'hsl(var(--primary))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: 'hsl(var(--primary))',
                backgroundColor: 'hsl(var(--muted))',
              },
            }}
          >
            View Decay System
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SystemFeaturesCard;
