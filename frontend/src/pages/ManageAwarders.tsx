<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> advFrontend
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
<<<<<<< HEAD
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { getPlugActor } from '../components/canister/reputationDao';
import { Principal } from '@dfinity/principal';

// 🔧 Utility to shorten principal ID
const formatPrincipalShort = (principal: string): string => {
  if (principal.length <= 13) return principal;
  return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
};

const ManageAwarders: React.FC = () => {
  const [awarders, setAwarders] = useState<{ id: string; name: string }[]>([]);
  const [newAwarderId, setNewAwarderId] = useState('');
  const [newAwarderName, setNewAwarderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchAwarders = async () => {
      try {
        const actor = await getPlugActor();
        const fetched = await actor.getTrustedAwarders();
        setAwarders(
          fetched.map((a: { id: Principal; name: string }) => ({
            id: a.id.toText(),
            name: a.name,
          }))
        );
      } catch (e) {
        console.error('Failed to fetch awarders:', e);
      }
    };

    fetchAwarders();
  }, []);

  const handleAddAwarder = async () => {
    try {
      setError('');
      setSuccessMsg('');
      setLoading(true);

      const principal = Principal.fromText(newAwarderId.trim());
      const actor = await getPlugActor();
      const result = await actor.addTrustedAwarder(principal, newAwarderName.trim() || 'Unnamed');

      if (result.startsWith('Success')) {
        setAwarders([
          ...awarders,
          { id: newAwarderId.trim(), name: newAwarderName.trim() || 'Unnamed' },
        ]);
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

=======
  Alert,
  Snackbar,
  InputAdornment,
  Avatar,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Group,
  PersonAdd,
  Email,
  AdminPanelSettings,
  MoreVert,
  Edit,
  Delete,
  Settings,
  Search
} from '@mui/icons-material';

interface Awarder {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'awarder';
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  totalAwarded: number;
  lastActive: string;
}

const ManageAwarders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newAwarderEmail, setNewAwarderEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'awarder'>('awarder');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'remove' | 'activate' | 'deactivate' | null;
    awarder: Awarder | null;
  }>({ open: false, action: null, awarder: null });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAwarder, setSelectedAwarder] = useState<Awarder | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Mock awarders data
  const [awarders, setAwarders] = useState<Awarder[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'admin',
      status: 'active',
      joinDate: '2024-01-01',
      totalAwarded: 1250,
      lastActive: '2024-01-15'
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'moderator',
      status: 'active',
      joinDate: '2024-01-05',
      totalAwarded: 850,
      lastActive: '2024-01-14'
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      role: 'awarder',
      status: 'inactive',
      joinDate: '2024-01-10',
      totalAwarded: 320,
      lastActive: '2024-01-12'
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david@example.com',
      role: 'awarder',
      status: 'pending',
      joinDate: '2024-01-14',
      totalAwarded: 0,
      lastActive: '2024-01-14'
    }
  ]);

  const handleAddAwarder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAwarderEmail) {
      setSnackbar({
        open: true,
        message: 'Please enter an email address',
        severity: 'warning'
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newAwarder: Awarder = {
        id: Date.now().toString(),
        name: 'New User',
        email: newAwarderEmail,
        role: selectedRole,
        status: 'pending',
        joinDate: new Date().toISOString().split('T')[0],
        totalAwarded: 0,
        lastActive: new Date().toISOString().split('T')[0]
      };

      setAwarders(prev => [...prev, newAwarder]);
      setSnackbar({
        open: true,
        message: `Successfully invited ${newAwarderEmail} as ${selectedRole}`,
        severity: 'success'
      });
      
      setNewAwarderEmail('');
      setIsLoading(false);
    }, 2000);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, awarder: Awarder) => {
    setAnchorEl(event.currentTarget);
    setSelectedAwarder(awarder);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAwarder(null);
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.awarder) return;

    const updatedAwarders = awarders.map(awarder => {
      if (awarder.id === confirmDialog.awarder!.id) {
        switch (confirmDialog.action) {
          case 'remove':
            return null; // Will be filtered out
          case 'activate':
            return { ...awarder, status: 'active' as const };
          case 'deactivate':
            return { ...awarder, status: 'inactive' as const };
          default:
            return awarder;
        }
      }
      return awarder;
    }).filter(Boolean) as Awarder[];

    setAwarders(updatedAwarders);
    setSnackbar({
      open: true,
      message: `Awarder ${confirmDialog.action === 'remove' ? 'removed' : confirmDialog.action + 'd'} successfully`,
      severity: 'success'
    });
    
    setConfirmDialog({ open: false, action: null, awarder: null });
    handleMenuClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'moderator': return 'warning';
      case 'awarder': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const filteredAwarders = awarders.filter(awarder =>
    awarder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    awarder.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

>>>>>>> advFrontend
  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: 'hsl(var(--background))',
      minHeight: '100vh'
    }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          color: 'hsl(var(--foreground))',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Group sx={{ color: 'hsl(var(--primary))' }} />
        Manage Awarders
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Add Awarder Form */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ 
            backgroundColor: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PersonAdd sx={{ color: 'hsl(var(--primary))' }} />
                Invite New Awarder
              </Typography>

              <Box component="form" onSubmit={handleAddAwarder}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={newAwarderEmail}
                    onChange={(e) => setNewAwarderEmail(e.target.value)}
                    placeholder="Enter email address"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'hsl(var(--muted-foreground))' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'hsl(var(--background))',
                        '& fieldset': {
                          borderColor: 'hsl(var(--border))',
                        },
                        '&:hover fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                      '& .MuiInputBase-input': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  />

                  <TextField
                    select
                    fullWidth
                    label="Role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'hsl(var(--background))',
                        '& fieldset': {
                          borderColor: 'hsl(var(--border))',
                        },
                        '&:hover fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                      '& .MuiInputBase-input': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  >
                    <MenuItem value="awarder">Awarder</MenuItem>
                    <MenuItem value="moderator">Moderator</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </TextField>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={<PersonAdd />}
                  sx={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    '&:hover': {
                      backgroundColor: 'hsl(var(--accent))',
                    },
                    '&:disabled': {
                      backgroundColor: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                    },
                  }}
                >
                  {isLoading ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <Card sx={{ 
            backgroundColor: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <TextField
                fullWidth
                label="Search Awarders"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'hsl(var(--muted-foreground))' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'hsl(var(--background))',
                    '& fieldset': {
                      borderColor: 'hsl(var(--border))',
                    },
                    '&:hover fieldset': {
                      borderColor: 'hsl(var(--primary))',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'hsl(var(--primary))',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'hsl(var(--muted-foreground))',
                  },
                  '& .MuiInputBase-input': {
                    color: 'hsl(var(--foreground))',
                  },
                }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Statistics */}
        <Box sx={{ width: { xs: '100%', lg: '300px' } }}>
          <Card sx={{ 
            backgroundColor: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <AdminPanelSettings sx={{ color: 'hsl(var(--primary))' }} />
                Statistics
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--background))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Total Awarders
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--primary))', 
                    fontWeight: 600 
                  }}>
                    {awarders.length}
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--background))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Active
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    {awarders.filter(a => a.status === 'active').length}
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--background))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Pending
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    {awarders.filter(a => a.status === 'pending').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Awarders List */}
      <Card sx={{ 
        backgroundColor: 'hsl(var(--muted))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              color: 'hsl(var(--foreground))',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
<<<<<<< HEAD
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
=======
            <Group sx={{ color: 'hsl(var(--primary))' }} />
            Awarders ({filteredAwarders.length})
          </Typography>

          <TableContainer component={Paper} sx={{ 
            backgroundColor: 'hsl(var(--background))',
            boxShadow: 'none',
            border: '1px solid hsl(var(--border))'
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Awarder
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Role
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Total Awarded
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Last Active
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAwarders.map((awarder) => (
                  <TableRow 
                    key={awarder.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'hsl(var(--muted))' 
                      } 
                    }}
                  >
                    <TableCell sx={{ 
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          backgroundColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                          width: 32,
                          height: 32
                        }}>
                          {awarder.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ 
                            color: 'hsl(var(--foreground))',
                            fontWeight: 600
                          }}>
                            {awarder.name}
                          </Typography>
                          <Typography sx={{ 
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '0.875rem'
                          }}>
                            {awarder.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <Chip
                        label={awarder.role}
                        color={getRoleColor(awarder.role) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <Chip
                        label={awarder.status}
                        color={getStatusColor(awarder.status) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--primary))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      {awarder.totalAwarded} REP
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--muted-foreground))',
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      {awarder.lastActive}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <IconButton 
                        size="small"
                        onClick={(e) => handleMenuClick(e, awarder)}
                        sx={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setConfirmDialog({
              open: true,
              action: selectedAwarder?.status === 'active' ? 'deactivate' : 'activate',
              awarder: selectedAwarder
            });
          }}
        >
          <Settings sx={{ mr: 1 }} />
          {selectedAwarder?.status === 'active' ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setConfirmDialog({
              open: true,
              action: 'remove',
              awarder: selectedAwarder
            });
          }}
          sx={{ color: 'hsl(var(--destructive))' }}
        >
          <Delete sx={{ mr: 1 }} />
          Remove
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null, awarder: null })}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title" sx={{ color: 'hsl(var(--foreground))' }}>
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description" sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Are you sure you want to {confirmDialog.action} <strong>{confirmDialog.awarder?.name}</strong>?
            {confirmDialog.action === 'remove' && ' This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, action: null, awarder: null })} 
            sx={{ color: 'hsl(var(--muted-foreground))' }}
>>>>>>> advFrontend
          >
            Cancel
          </Button>
<<<<<<< HEAD

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
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}
                  >
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
                        title={awarder.id}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                        }}
                      >
                        {formatPrincipalShort(awarder.id)}
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
=======
          <Button 
            onClick={handleConfirmAction} 
            sx={{ 
              color: confirmDialog.action === 'remove' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
              fontWeight: 600
            }}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
>>>>>>> advFrontend
    </Box>
  );
};

export default ManageAwarders;
