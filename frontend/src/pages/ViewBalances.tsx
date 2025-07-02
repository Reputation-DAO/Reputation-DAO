import React from 'react';
import { Box, Paper, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const dummyBalances = [
  { id: 'aaaa-bbbb-cccc', name: 'Alice', balance: 120 },
  { id: 'dddd-eeee-ffff', name: 'Eve', balance: 80 },
];

const ViewBalances: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 'calc(100vh - 64px)',
        marginLeft: '410px',
        marginTop: '85px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'transparent',
        pt: 6,
      }}
    >
      <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 600 }}>
        <Stack spacing={3} alignItems="center">
          <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
            <AccountBalanceWalletIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={600} color="info.main">
            View Balances
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell align="right">Reputation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dummyBalances.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.id}</TableCell>
                    <TableCell align="right">{row.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ViewBalances;
