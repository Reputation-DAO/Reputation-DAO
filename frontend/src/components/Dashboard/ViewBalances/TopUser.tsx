import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import { History, FilterList, Download } from '@mui/icons-material';

export interface User {
  id: string;
  rank: number;
  name: string;
  address: string;
  reputation: number;
  change: string | number;
  lastActivity: string;
  status: string;
}

interface TopUsersCardProps {
  filteredBalances: User[];
  getChangeColor: (change: string | number) => string;
  getStatusColor: (status: string) => string;
  bgColor?: string;
  borderColor?: string;
}

const TopUsersCard: React.FC<TopUsersCardProps> = ({
  filteredBalances,
  getChangeColor,
  getStatusColor,
  bgColor = 'hsl(var(--background))',
  borderColor = 'hsl(var(--border))',
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
            }}
          >
            <History sx={{ color: 'hsl(var(--primary))' }} />
            Top Users ({filteredBalances.length})
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Filter">
              <IconButton size="small" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                <FilterList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton size="small" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: bgColor,
            boxShadow: 'none',
            border: `1px solid ${borderColor}`,
            borderRadius: "var(--radius)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: bgColor }}>
                {['Rank', 'User', 'Reputation', 'Change', 'Last Activity', 'Status'].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      color: 'hsl(var(--foreground))',
                      fontWeight: 600,
                      borderBottom: `1px solid ${borderColor}`,
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBalances.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{
                    '&:hover': { backgroundColor: 'hsl(var(--card))' },
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <TableCell sx={{ color: 'hsl(var(--foreground))', fontWeight: 600, borderBottom: `1px solid ${borderColor}` }}>
                    #{user.rank}
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${borderColor}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', width: 32, height: 32 }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{user.name}</Typography>
                        <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>{user.address}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600, borderBottom: `1px solid ${borderColor}` }}>
                    {user.reputation.toLocaleString()} REP
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${borderColor}` }}>
                    <Typography sx={{ color: getChangeColor(user.change), fontWeight: 600 }}>{user.change}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'hsl(var(--muted-foreground))', borderBottom: `1px solid ${borderColor}` }}>
                    {user.lastActivity}
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${borderColor}` }}>
                    <Chip label={user.status} color={getStatusColor(user.status) as any} size="small" sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TopUsersCard;
