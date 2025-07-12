import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
  Search,
  Person
} from '@mui/icons-material';
import { Principal } from '@dfinity/principal';
import { reputationService } from '../components/canister/reputationDao';

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
  const [newAwarderPrincipal, setNewAwarderPrincipal] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'awarder'>('awarder');
  const [isLoading, setIsLoading] = useState(false);
  const [awarders, setAwarders] = useState<Awarder[]>([]);
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

  // Load awarders on component mount
  useEffect(() => {
    loadAwarders();
  }, []);

  const loadAwarders = async () => {
    try {
      const backendAwarders = await reputationService.getTrustedAwarders();
      
      // Convert backend awarders to UI format
      const uiAwarders: Awarder[] = backendAwarders.map((awarder) => ({
        id: awarder.id.toString(),
        name: awarder.name,
        email: `${awarder.name.toLowerCase().replace(' ', '.')}@example.com`, // Generate email since backend doesn't store it
        role: 'awarder' as const, // Backend doesn't distinguish roles yet
        status: 'active' as const,
        joinDate: '2024-01-01', // Backend doesn't store join date yet
        totalAwarded: 0, // Would need to calculate from transactions
        lastActive: '2024-01-15' // Backend doesn't store last active yet
      }));
      
      setAwarders(uiAwarders);
    } catch (error) {
      console.error('Failed to load awarders:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load awarders',
        severity: 'error'
      });
    }
  };

  const handleAddAwarder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAwarderEmail || !newAwarderPrincipal) {
      setSnackbar({
        open: true,
        message: 'Please enter both email and principal',
        severity: 'warning'
      });
      return;
    }

    // Validate principal format
    let principal: Principal;
    try {
      principal = Principal.fromText(newAwarderPrincipal);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Invalid principal format',
        severity: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use email as name for now since we only have one name field in backend
      const name = newAwarderEmail.split('@')[0];
      await reputationService.addTrustedAwarder(principal, name);
      
      setSnackbar({
        open: true,
        message: `Successfully added ${name} as trusted awarder`,
        severity: 'success'
      });
      
      setNewAwarderEmail('');
      setNewAwarderPrincipal('');
      
      // Reload awarders list
      await loadAwarders();
      
    } catch (error: any) {
      console.error('Add awarder error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to add awarder',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, awarder: Awarder) => {
    setAnchorEl(event.currentTarget);
    setSelectedAwarder(awarder);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAwarder(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.awarder) return;

    try {
      if (confirmDialog.action === 'remove') {
        const principal = Principal.fromText(confirmDialog.awarder.id);
        await reputationService.removeTrustedAwarder(principal);
        
        setSnackbar({
          open: true,
          message: 'Awarder removed successfully',
          severity: 'success'
        });
        
        // Reload awarders list
        await loadAwarders();
      } else {
        // For activate/deactivate, we'd need backend support
        // For now, just show a message
        setSnackbar({
          open: true,
          message: `${confirmDialog.action} functionality not yet implemented in backend`,
          severity: 'info'
        });
      }
    } catch (error: any) {
      console.error('Action error:', error);
      setSnackbar({
        open: true,
        message: error.message || `Failed to ${confirmDialog.action} awarder`,
        severity: 'error'
      });
    }
    
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
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
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
                    fullWidth
                    label="Principal ID"
                    value={newAwarderPrincipal}
                    onChange={(e) => setNewAwarderPrincipal(e.target.value)}
                    placeholder="Enter principal ID"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'hsl(var(--muted-foreground))' }} />
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
                </Box>

                <Box sx={{ mb: 3 }}>
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
          >
            Cancel
          </Button>
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
    </Box>
  );
};

export default ManageAwarders;
