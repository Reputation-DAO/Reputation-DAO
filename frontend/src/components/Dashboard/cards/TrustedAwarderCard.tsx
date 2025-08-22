// @ts-nocheck

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Box,
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

interface Awarder {
  id: string | number;
  name: string;
}

interface TrustedAwardersCardProps {
  awarders: Awarder[];
}

const TrustedAwardersCard: React.FC<TrustedAwardersCardProps> = ({ awarders }) => {
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
        transition: 'var(--transition-smooth)',
        '&:hover': {
          boxShadow: `
            6px 6px 14px hsl(var(--primary) / 0.5),
            -6px -6px 14px hsl(var(--primary) / 0.2)
          `,
        },
        mb: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Icon avatar */}
        <Avatar
          sx={{
            bgcolor: 'hsl(var(--success))',
            width: 48,
            height: 48,
            mb: 2,
          }}
        >
          <AdminPanelSettings sx={{ color: 'hsl(var(--primary-foreground))' }} />
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
          Trusted Awarders
        </Typography>

        {/* Subtext */}
        <Typography
          variant="body2"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            mb: 3,
          }}
        >
          Verified members with awarding privileges ({awarders.length})
        </Typography>

        {/* Awarders list */}
        <List sx={{ p: 0 }}>
          {awarders.slice(0, 5).map((awarder, index) => (
            <React.Fragment key={awarder.id.toString()}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'hsl(var(--success))',
                      color: 'white',
                      fontSize: '0.75rem',
                    }}
                  >
                    {awarder.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'hsl(var(--foreground))',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {awarder.name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: '0.7rem',
                      }}
                    >
                      Trusted Awarder
                    </Typography>
                  }
                />
              </ListItem>
              {index < Math.min(awarders.length, 5) - 1 && (
                <Divider sx={{ borderColor: 'hsl(var(--border))' }} />
              )}
            </React.Fragment>
          ))}

          {/* Empty state */}
          {awarders.length === 0 && (
            <Typography
              sx={{
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
                py: 2,
              }}
            >
              No awarders found
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default TrustedAwardersCard;
