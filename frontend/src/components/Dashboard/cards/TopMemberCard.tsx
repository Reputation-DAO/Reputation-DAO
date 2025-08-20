import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Chip,
  Box,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';

interface Member {
  principal: string;
  balance: number;
}

interface TopMembersCardProps {
  balances: Member[];
  getUserDisplayName: (principal: string) => string;
}

const TopMembersCard: React.FC<TopMembersCardProps> = ({ balances, getUserDisplayName }) => {
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
        {/* Icon avatar (like SystemFeaturesCard) */}
        <Avatar
          sx={{
            bgcolor: 'hsl(var(--primary))',
            width: 48,
            height: 48,
            mb: 2,
          }}
        >
          <GroupIcon sx={{ color: 'hsl(var(--primary-foreground))' }} />
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
          Top Members
        </Typography>

        {/* Subtext */}
        <Typography
          variant="body2"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            mb: 3,
          }}
        >
          Highlighting the most active contributors in the system
        </Typography>

        {/* Members list */}
        <List sx={{ p: 0 }}>
          {balances.slice(0, 5).map((member, index) => (
            <React.Fragment key={member.principal.toString()}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontSize: '0.75rem',
                    }}
                  >
                    {getUserDisplayName(member.principal).charAt(0)}
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
                        {getUserDisplayName(member.principal)}
                      </Typography>
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{
                          bgcolor: index === 0 ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))',
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 18,
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
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
                      {Number(member.balance)} REP
                    </Typography>
                  }
                />
              </ListItem>
              {index < Math.min(balances.length, 5) - 1 && (
                <Divider sx={{ borderColor: 'hsl(var(--border))' }} />
              )}
            </React.Fragment>
          ))}

          {/* Empty state */}
          {balances.length === 0 && (
            <Typography
              sx={{
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
                py: 2,
              }}
            >
              No members found
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default TopMembersCard;
