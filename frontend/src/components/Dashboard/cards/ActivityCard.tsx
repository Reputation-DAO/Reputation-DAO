import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';

interface Transaction {
  id: string;
  to: string;
  from: string;
  amount: number | bigint;
  timestamp: number;
  transactionType: { Award?: boolean; Penalty?: boolean };
}

interface ActivityCardProps {
  userRole: string;
  data: {
    userTransactions: Transaction[];
    transactions: Transaction[];
  };
  getUserDisplayName: (address: string) => string;
  formatTime: (timestamp: number) => string;
  bgColor?: string;
  borderColor?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  userRole,
  data,
  getUserDisplayName,
  formatTime,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}) => {
  const transactions =
    userRole === 'User' ? data.userTransactions : data.transactions;

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
        mb: 4,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: "hsl(var(--muted-foreground))",
              fontSize: "0.9rem",
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            {userRole === 'User' ? 'My Activity' : 'Recent Activity'}
          </Typography>

          <Button
            variant="outlined"
            size="small"
            sx={{
              color: 'hsl(var(--primary))',
              borderColor: 'hsl(var(--border))',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: "none",
              borderRadius: "var(--radius)",
              "&:hover": {
                borderColor: 'hsl(var(--primary))',
                backgroundColor: 'hsl(var(--muted))',
              },
            }}
          >
            View all
          </Button>
        </Box>

        {/* Activity List */}
        <List sx={{ p: 0 }}>
          {transactions.slice(0, 5).map((transaction, index) => (
            <React.Fragment key={transaction.id}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                {/* Avatar */}
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {getUserDisplayName(transaction.to).charAt(0)}
                  </Avatar>
                </ListItemAvatar>

                {/* Transaction Text */}
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor:
                            'Award' in transaction.transactionType
                              ? '#22c55e'
                              : '#ef4444',
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'hsl(var(--foreground))',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {getUserDisplayName(transaction.to)}{' '}
                        {'Award' in transaction.transactionType
                          ? 'earned'
                          : 'lost'}{' '}
                        {typeof transaction.amount === 'bigint'
                          ? Number(transaction.amount)
                          : transaction.amount}{' '}
                        REP
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: '0.75rem',
                        ml: 2.125,
                      }}
                    >
                      from {getUserDisplayName(transaction.from)} •{' '}
                      {formatTime(transaction.timestamp)}
                    </Typography>
                  }
                />

                {/* Amount Chip */}
                <Chip
                  label={
                    'Award' in transaction.transactionType
                      ? '+' +
                        (typeof transaction.amount === 'bigint'
                          ? Number(transaction.amount)
                          : transaction.amount)
                      : '-' +
                        (typeof transaction.amount === 'bigint'
                          ? Number(transaction.amount)
                          : transaction.amount)
                  }
                  size="small"
                  sx={{
                    backgroundColor:
                      'Award' in transaction.transactionType
                        ? '#22c55e'
                        : '#ef4444',
                    color: 'white',
                    fontSize: '0.7rem',
                    minWidth: 60,
                    fontWeight: 600,
                    borderRadius: "var(--radius)",
                  }}
                />
              </ListItem>
              {index < Math.min(transactions.length, 5) - 1 && (
                <Divider sx={{ borderColor: 'hsl(var(--border))' }} />
              )}
            </React.Fragment>
          ))}

          {/* Empty state */}
          {transactions.length === 0 && (
            <Typography
              sx={{
                color: 'hsl(var(--muted-foreground))',
                textAlign: 'center',
                py: 2,
                fontSize: "0.85rem",
              }}
            >
              {userRole === 'User' ? 'No activity yet' : 'No recent activity'}
            </Typography>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
