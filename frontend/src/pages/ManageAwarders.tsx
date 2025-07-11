import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  TextField,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { getPlugActor } from '../components/canister/reputationDao';
import { Principal } from '@dfinity/principal';

const ManageAwarders: React.FC = () => {
  const [awarders, setAwarders] = useState<{ id: string; name: string }[]>([]);
  const [newAwarderId, setNewAwarderId] = useState('');
  const [newAwarderName, setNewAwarderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddAwarder = async () => {
    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      const principal = Principal.fromText(newAwarderId.trim());
      const actor = await getPlugActor();
      const result = await actor.addTrustedAwarder(principal);

      if (result.startsWith('Success')) {
        setAwarders([...awarders, { id: newAwarderId.trim(), name: newAwarderName.trim() || 'Unnamed' }]);
        setNewAwarderId('');
        setNewAwarderName('');
        setSuccessMsg('Awarder added.');
      } else {
        setError(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add awarder');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAwarder = async (principalId: string) => {
    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      const principal = Principal.fromText(principalId);
      const actor = await getPlugActor();
      const result = await actor.removeTrustedAwarder(principal);

      if (result.startsWith('Success')) {
        setAwarders(awarders.filter((a) => a.id !== principalId));
        setSuccessMsg('Awarder removed.');
      } else {
        setError(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove awarder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        px: { xs: 2, sm: 4, md: 8 },
        py: { xs: 6, sm: 8 },
        transition: 'background-color var(--transition-smooth), color var(--transition-smooth)',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 500,
          mx: 'auto',
          mt: { xs: 4, md: 6 },
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, hsla(var(--primary), 0.2), hsla(var(--muted), 0.9))',
          color: 'hsl(var(--foreground))',
          border: 'var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              width: 64,
              height: 64,
            }}
          >
            <GroupIcon fontSize="large" />
          </Avatar>

          <Typography variant="h5" fontWeight={600}>
            Manage Awarders
          </Typography>

          <TextField
            label="Awarder Nickname"
            variant="outlined"
            fullWidth
            value={newAwarderName}
            onChange={(e) => setNewAwarderName(e.target.value)}
            InputLabelProps={{ sx: { color: 'hsl(var(--foreground))' } }}
            InputProps={{
              sx: {
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--muted))',
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Principal ID"
            variant="outlined"
            fullWidth
            value={newAwarderId}
            onChange={(e) => setNewAwarderId(e.target.value)}
            InputLabelProps={{ sx: { color: 'hsl(var(--foreground))' } }}
            InputProps={{
              sx: {
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--muted))',
                borderRadius: 2,
              },
            }}
          />

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAddAwarder}
            disabled={loading || !newAwarderId.trim()}
            sx={{
              borderRadius: 2,
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              '&:hover': {
                backgroundColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))',
              },
            }}
          >
            Add Awarder
          </Button>

          <List sx={{ width: '100%' }}>
            {awarders.map((awarder) => (
              <React.Fragment key={awarder.id}>
                <ListItem
  disableGutters
  sx={{
    px: 2,
    py: 1.5,
    borderRadius: 2,
    backgroundColor: 'hsla(var(--muted), 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
    <ListItemAvatar>
      <Avatar
        sx={{
          bgcolor: 'hsl(var(--muted))',
          color: 'hsl(var(--foreground))',
          width: 48,
          height: 48,
        }}
      >
        <PersonAddIcon />
      </Avatar>
    </ListItemAvatar>
    <Box sx={{ overflow: 'hidden' }}>
      <Typography
        fontWeight={600}
        color="hsl(var(--foreground))"
        sx={{ fontSize: '1rem', overflowWrap: 'break-word' }}
      >
        {awarder.name}
      </Typography>
      <Typography
        variant="body2"
        color="hsl(var(--muted-foreground))"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          wordBreak: 'break-all',
        }}
      >
        {awarder.id}
      </Typography>
    </Box>
  </Box>

  <Button
    startIcon={<PersonRemoveIcon />}
    onClick={() => handleRemoveAwarder(awarder.id)}
    disabled={loading}
    sx={{
      color: 'hsl(var(--destructive))',
      ml: 2,
      mt: { xs: 1.5, sm: 0 },
      whiteSpace: 'nowrap',
      alignSelf: 'flex-start',
      '&:hover': {
        color: 'hsl(var(--destructive-foreground))',
        backgroundColor: 'transparent',
      },
    }}
  >
    Remove
  </Button>
</ListItem>

                <Divider sx={{ backgroundColor: 'hsl(var(--border))', my: 0.5 }} />
              </React.Fragment>
            ))}
          </List>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          {successMsg && (
            <Typography color="success.main" variant="body2">
              {successMsg}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ManageAwarders;
