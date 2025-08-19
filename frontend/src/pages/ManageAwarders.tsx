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
  const [awarders, setAwarders] = useState<Awarder[]>([]);
  const [filteredAwarders, setFilteredAwarders] = useState<Awarder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAwarderPrincipal, setNewAwarderPrincipal] = useState('');
  const [newAwarderName, setNewAwarderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAwarder, setSelectedAwarder] = useState<Awarder | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'remove' | null; awarder: Awarder | null }>({ open: false, action: null, awarder: null });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrgId');
    if (storedOrgId) setOrgId(storedOrgId);
  }, []);

  useEffect(() => {
    if (orgId) loadTrustedAwarders();
  }, [orgId]);

  useEffect(() => {
    if (!searchTerm) return setFilteredAwarders(awarders);
    const filtered = awarders.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.principal.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAwarders(filtered);
  }, [searchTerm, awarders]);

  const loadTrustedAwarders = async () => {
    if (!orgId) return;
    try {
      setRefreshing(true);
      const plugActor = await getPlugActor();
      if (!plugActor) throw new Error('Failed to connect to blockchain');
      const backendAwarders = await plugActor.getTrustedAwarders(orgId);
      const awardersList = Array.isArray(backendAwarders) ? backendAwarders[0] || [] : backendAwarders || [];
      const transformedAwarders: Awarder[] = awardersList.map((a: any) => ({
        id: a.id.toString(),
        name: a.name ?? 'Unknown',
        principal: a.id.toString(),
        status: 'active',
        joinDate: new Date().toLocaleDateString(),
        totalAwarded: a.totalAwarded ?? 0,
        lastActive: new Date().toLocaleDateString()
      }));
      setAwarders(transformedAwarders);
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: 'Failed to load awarders: ' + (error as Error).message, severity: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddAwarder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAwarderPrincipal.trim() || !newAwarderName.trim()) {
      return setSnackbar({ open: true, message: 'Please enter both Principal ID and name', severity: 'warning' });
    }
    try {
      setIsLoading(true);
      const principal = Principal.fromText(newAwarderPrincipal.trim());
      const plugActor = await getPlugActor();
      if (!plugActor) throw new Error('Failed to connect to blockchain');
      if (!orgId) throw new Error('Organization ID not found');
      const result = await plugActor.addTrustedAwarder(orgId, principal, newAwarderName.trim());
      if (result.includes('Success')) {
        setSnackbar({ open: true, message: `Successfully added ${newAwarderName}`, severity: 'success' });
        setNewAwarderPrincipal('');
        setNewAwarderName('');
        await loadTrustedAwarders();
      } else throw new Error(result);
    } catch (error) {
      setSnackbar({
        open: true,
        message: (error as Error).message.includes('Invalid principal') ? 'Invalid Principal ID format' : 'Failed to add awarder: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAwarder = async (awarder: Awarder) => {
    try {
      if (!orgId) throw new Error('Organization ID not found');
      const plugActor = await getPlugActor();
      if (!plugActor) throw new Error('Failed to connect to blockchain');
      const principal = Principal.fromText(awarder.principal);
      const result = await plugActor.removeTrustedAwarder(orgId, principal);
      if (result.includes('Success')) {
        setSnackbar({ open: true, message: `Successfully removed ${awarder.name}`, severity: 'success' });
        await loadTrustedAwarders();
      } else throw new Error(result);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to remove awarder: ' + (error as Error).message, severity: 'error' });
    }
  };

  const handleRefresh = () => loadTrustedAwarders();
  const handleMenuClick = (e: React.MouseEvent<HTMLElement>, awarder: Awarder) => {
    setSelectedAwarder(awarder);
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const handleConfirmAction = async () => {
    if (confirmDialog.action === 'remove' && confirmDialog.awarder) {
      await handleRemoveAwarder(confirmDialog.awarder);
    }
    setConfirmDialog({ open: false, action: null, awarder: null });
    handleMenuClose();
  };
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const getStatusColor = (status: 'active' | 'inactive') => (status === 'active' ? 'success' : 'default');

  return (
    <Box sx={{ p: 3, backgroundColor: 'hsl(var(--background))', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'hsl(var(--foreground))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Group sx={{ color: 'hsl(var(--primary))' }} /> Manage Awarders
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left Column: Form + Search */}
        <Box sx={{ flex: 1 }}>
          {/* Add Awarder Form */}
          <Card sx={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: 'hsl(var(--foreground))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAdd sx={{ color: 'hsl(var(--primary))' }} /> Invite New Awarder
              </Typography>
              <Box component="form" onSubmit={handleAddAwarder} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Principal ID"
                  value={newAwarderPrincipal}
                  onChange={e => setNewAwarderPrincipal(e.target.value)}
                  placeholder="e.g. rdmx6-jaaaa-aaaah-qcaiq-cai"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AdminPanelSettings sx={{ color: 'hsl(var(--muted-foreground))' }} /></InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'hsl(var(--background))',
                      '& fieldset': { borderColor: 'hsl(var(--border))' },
                      '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                      '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                    },
                    '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
                    '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
                  }}
                />
                <TextField
                  fullWidth
                  label="Awarder Name"
                  value={newAwarderName}
                  onChange={e => setNewAwarderName(e.target.value)}
                  placeholder="Enter display name"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PersonAdd sx={{ color: 'hsl(var(--muted-foreground))' }} /></InputAdornment>,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'hsl(var(--background))',
                      '& fieldset': { borderColor: 'hsl(var(--border))' },
                      '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                      '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                    },
                    '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
                    '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
                  }}
                />
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
                    '&:hover': { backgroundColor: 'hsl(var(--accent))' },
                    '&:disabled': { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' },
                  }}
                >
                  {isLoading ? 'Adding...' : 'Add Trusted Awarder'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Search */}
          <Card sx={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <TextField
                fullWidth
                label="Search Awarders"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or principal ID"
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'hsl(var(--muted-foreground))' }} /></InputAdornment> }}
                sx={{
                  '& .MuiOutlinedInput-root': { backgroundColor: 'hsl(var(--background))', '& fieldset': { borderColor: 'hsl(var(--border))' }, '&:hover fieldset': { borderColor: 'hsl(var(--primary))' }, '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' } },
                  '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
                  '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
                }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Right Column: Statistics */}
        <Box sx={{ width: { xs: '100%', lg: '300px' } }}>
          <Card sx={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AdminPanelSettings sx={{ color: 'hsl(var(--primary))', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>Statistics</Typography>
                <IconButton size="small" onClick={handleRefresh} disabled={refreshing} sx={{ ml: 'auto', color: 'hsl(var(--muted-foreground))' }}>
                  {refreshing ? <CircularProgress size={16} /> : <Refresh />}
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Total Awarders', value: awarders.length },
                  { label: 'Active', value: awarders.filter(a => a.status === 'active').length },
                  { label: 'Inactive', value: awarders.filter(a => a.status === 'inactive').length }
                ].map(stat => (
                  <Box key={stat.label} sx={{ display: 'flex', justifyContent: 'space-between', p: 2, backgroundColor: 'hsl(var(--background))', borderRadius: 1, border: '1px solid hsl(var(--border))' }}>
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>{stat.label}</Typography>
                    <Typography sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{stat.value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Awarders Table */}
      <Card sx={{ backgroundColor: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              <Group sx={{ color: 'hsl(var(--primary))' }} /> Awarders ({filteredAwarders.length})
            </Typography>
            <IconButton onClick={handleRefresh} disabled={refreshing}><Refresh sx={{ color: 'hsl(var(--primary))' }} /></IconButton>
          </Box>

          {refreshing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: 'hsl(var(--primary))' }} /></Box>
          ) : (
            <TableContainer component={Paper} sx={{ backgroundColor: 'hsl(var(--background))', boxShadow: 'none', border: '1px solid hsl(var(--border))' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'hsl(var(--muted))' }}>
                    {['Awarder', 'Principal ID', 'Status', 'Total Awarded', 'Actions'].map(header => (
                      <TableCell key={header} sx={{ color: 'hsl(var(--foreground))', fontWeight: 600, borderBottom: '1px solid hsl(var(--border))' }}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAwarders.map(awarder => (
                    <TableRow key={awarder.id} sx={{ '&:hover': { backgroundColor: 'hsl(var(--muted))' } }}>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', width: 32, height: 32 }}>
                            {awarder.name.charAt(0)}
                          </Avatar>
                          <Typography sx={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{awarder.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', fontFamily: 'monospace' }}>{awarder.principal}</Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <Chip label={awarder.status} color={getStatusColor(awarder.status) as any} size="small" sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600, borderBottom: '1px solid hsl(var(--border))' }}>{awarder.totalAwarded} REP</TableCell>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <IconButton size="small" onClick={e => handleMenuClick(e, awarder)} sx={{ color: 'hsl(var(--muted-foreground))' }}><MoreVert /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => setConfirmDialog({ open: true, action: 'remove', awarder: selectedAwarder })} sx={{ color: 'hsl(var(--destructive))' }}>
          <Delete sx={{ mr: 1 }} /> Remove
        </MenuItem>
      </Menu>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null, awarder: null })}>
        <DialogTitle sx={{ color: 'hsl(var(--foreground))' }}>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Are you sure you want to {confirmDialog.action} <strong>{confirmDialog.awarder?.name}</strong>?
            {confirmDialog.action === 'remove' && ' This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null, awarder: null })} sx={{ color: 'hsl(var(--muted-foreground))' }}>Cancel</Button>
          <Button onClick={handleConfirmAction} sx={{ color: confirmDialog.action === 'remove' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', fontWeight: 600 }} autoFocus>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const ManageAwardersWithProtection: React.FC = () => <ProtectedPage><ManageAwarders /></ProtectedPage>;

export default ManageAwardersWithProtection;
