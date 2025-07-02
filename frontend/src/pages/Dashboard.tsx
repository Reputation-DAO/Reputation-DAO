import React from 'react';
import { Card, CardContent, Typography, Box, Button, Stack } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Dashboard = () => (
  <Box
    sx={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      marginLeft: '350px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: 'transparent',
      pt: 6,
    }}
  >
    <Box sx={{ width: '100%', maxWidth: 600 }}>
      <Card
        sx={{
          p: 2,
          mb: 4,
          background: 'linear-gradient(135deg, #7c3aed 0%, #00bcd4 100%)',
          color: '#fff',
          borderRadius: 3,
          boxShadow: 6,
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AccountCircleIcon sx={{ fontSize: 48 }} />
            <Box sx={{ flexGrow: 1, ml: 2 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Welcome to Reputation DAO
              </Typography>
              <Typography variant="body1">
                Manage, award, and track reputation
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <Stack
        spacing={3}
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="center"
        alignItems="center"
      >
        <Button variant="contained" color="primary" size="large" href="/award" sx={{ minWidth: 180 }}>
          Award Reputation
        </Button>
        <Button variant="contained" color="secondary" size="large" href="/revoke" sx={{ minWidth: 180 }}>
          Revoke Reputation
        </Button>
        <Button variant="outlined" color="primary" size="large" href="/balances" sx={{ minWidth: 180 }}>
          View Balances
        </Button>
      </Stack>
    </Box>
  </Box>
);

export default Dashboard;
