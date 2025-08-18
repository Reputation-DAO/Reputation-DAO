import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
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
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Group,
  PersonAdd,
  AdminPanelSettings,
  MoreVert,
  Delete,
  Search,
  Refresh
} from '@mui/icons-material';
import { getPlugActor } from '../components/canister/reputationDao';

interface Awarder {
  id: string;
  name: string;
  principal: string;
  status: 'active' | 'inactive';
  joinDate: string;
  totalAwarded: number;
  lastActive: string;
}

const ManageAwarders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newAwarderPrincipal, setNewAwarderPrincipal] = useState('');
  const [newAwarderName, setNewAwarderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'remove' | null;
    awarder: Awarder | null;
  }>({ open: false, action: null, awarder: null });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAwarder, setSelectedAwarder] = useState<Awarder | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const [awarders, setAwarders] = useState<Awarder[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Get orgId from localStorage
  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrgId');
    if (storedOrgId) {
      setOrgId(storedOrgId);
    }
  }, []);

  // Load trusted awarders when orgId is available
  useEffect(() => {
    if (orgId) {
      loadTrustedAwarders();
    }
  }, [orgId]);

  // Load trusted awarders from backend
  const loadTrustedAwarders = async () => {
    if (!orgId) return;
    
    try {
      setRefreshing(true);
      
      const plugActor = await getPlugActor();
      if (!plugActor) {
        throw new Error('Failed to connect to blockchain');
      }

      console.log('Loading trusted awarders for orgId:', orgId);
      const backendAwarders = await plugActor.getTrustedAwarders(orgId);
      console.log('Backend awarders:', backendAwarders);

      // Check if backendAwarders is valid
      if (!backendAwarders || !Array.isArray(backendAwarders)) {
        console.log('No valid awarders received');
        setAwarders([]);
        return;
      }

      // Transform backend data to frontend format with safe navigation
      const transformedAwarders: Awarder[] = backendAwarders
        .filter((awarder: any) => awarder && awarder.id) // Filter out invalid awarders
        .map((awarder: any, index: number) => ({
          id: (index + 1).toString(),
          name: awarder.name || 'Unknown',
          principal: awarder.id?.toString ? awarder.id.toString() : (awarder.id || 'Unknown'),
          status: 'active' as const,
          joinDate: new Date().toLocaleDateString(), // Could be enhanced with actual join dates
          totalAwarded: 0, // Could be calculated from transaction history
          lastActive: new Date().toLocaleDateString()
        }));

      setAwarders(transformedAwarders);
      console.log('Transformed awarders:', transformedAwarders);
      
    } catch (error) {
      console.error('Error loading awarders:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load awarders: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Load awarders on component mount
  useEffect(() => {
    loadTrustedAwarders();
  }, []);

  const handleAddAwarder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAwarderPrincipal.trim() || !newAwarderName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter both Principal ID and name',
        severity: 'warning'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Validate Principal format
      const principal = Principal.fromText(newAwarderPrincipal.trim());
      
      const plugActor = await getPlugActor();
      if (!plugActor) {
        throw new Error('Failed to connect to blockchain');
      }

      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      console.log('Adding trusted awarder:', { orgId, principal: principal.toString(), name: newAwarderName.trim() });
      const result = await plugActor.addTrustedAwarder(orgId, principal, newAwarderName.trim());
      console.log('Add awarder result:', result);

      if (result.includes('Success')) {
        setSnackbar({
          open: true,
          message: `Successfully added ${newAwarderName} as a trusted awarder`,
          severity: 'success'
        });
        
        setNewAwarderPrincipal('');
        setNewAwarderName('');
        
        // Reload the list
        await loadTrustedAwarders();
      } else {
        throw new Error(result);
      }
      
    } catch (error) {
      console.error('Error adding awarder:', error);
      setSnackbar({
        open: true,
        message: (error as Error).message.includes('Invalid principal') 
          ? 'Invalid Principal ID format' 
          : 'Failed to add awarder: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAwarder = async (awarder: Awarder) => {
    try {
      const plugActor = await getPlugActor();
      if (!plugActor) {
        throw new Error('Failed to connect to blockchain');
      }

      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      const principal = Principal.fromText(awarder.principal);
      console.log('Removing trusted awarder:', { orgId, principal: principal.toString() });
      const result = await plugActor.removeTrustedAwarder(orgId, principal);
      console.log('Remove awarder result:', result);

      if (result.includes('Success')) {
        setSnackbar({
          open: true,
          message: `Successfully removed ${awarder.name}`,
          severity: 'success'
        });
        
        // Reload the list
        await loadTrustedAwarders();
      } else {
        throw new Error(result);
      }

    } catch (error) {
      console.error('Error removing awarder:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove awarder: ' + (error as Error).message,
        severity: 'error'
      });
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

    if (confirmDialog.action === 'remove') {
      await handleRemoveAwarder(confirmDialog.awarder);
    }
    
    setConfirmDialog({ open: false, action: null, awarder: null });
    handleMenuClose();
  };

  const handleRefresh = () => {
    loadTrustedAwarders();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const filteredAwarders = awarders.filter(awarder =>
    awarder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    awarder.principal.toLowerCase().includes(searchTerm.toLowerCase())
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Principal ID"
                    value={newAwarderPrincipal}
                    onChange={(e) => setNewAwarderPrincipal(e.target.value)}
                    placeholder="e.g. rdmx6-jaaaa-aaaah-qcaiq-cai"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AdminPanelSettings sx={{ color: 'hsl(var(--muted-foreground))' }} />
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
                    label="Awarder Name"
                    value={newAwarderName}
                    onChange={(e) => setNewAwarderName(e.target.value)}
                    placeholder="Enter display name"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonAdd sx={{ color: 'hsl(var(--muted-foreground))' }} />
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
                  {isLoading ? 'Adding...' : 'Add Trusted Awarder'}
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
                placeholder="Search by name or principal ID"
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
                <IconButton 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ color: 'hsl(var(--muted-foreground))', ml: 'auto' }}
                >
                  {refreshing ? <CircularProgress size={16} /> : <Refresh />}
                </IconButton>
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
                    Inactive
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    {awarders.filter(a => a.status === 'inactive').length}
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
                    Principal ID
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
                        <Typography sx={{ 
                          color: 'hsl(var(--foreground))',
                          fontWeight: 600
                        }}>
                          {awarder.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      <Typography sx={{ 
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>
                        {awarder.principal}
                      </Typography>
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

const ManageAwardersWithProtection: React.FC = () => {
  return (
    <ProtectedPage>
      <ManageAwarders />
    </ProtectedPage>
  );
};

export default ManageAwardersWithProtection;
