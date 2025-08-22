import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
import {
  Box,

  Typography,

  Button,
  Alert,
  Snackbar,

  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,

  Menu,
  MenuItem,

} from '@mui/material';
import {
  Group,
  Delete,
} from '@mui/icons-material';
import { getPlugActor } from '../components/canister/reputationDao';

import InviteAwarderCard from '../components/Dashboard/manageawarder/awarder';
import SearchCard from '../components/Dashboard/manageawarder/SearchCard';
import StatsCard from '../components/Dashboard/manageawarder/statscard';
import AwardersCard from '../components/Dashboard/manageawarder/awarderscard';

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

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };


  return (
    <Box sx={{ p: 3, backgroundColor: 'hsl(var(--background))', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'hsl(var(--foreground))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Group sx={{ color: 'hsl(var(--primary))' }} /> Manage Awarders
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left Column: Form + Search */}
        <Box sx={{ flex: 1 }}>
          {/* Add Awarder Form */}
          <InviteAwarderCard
            newAwarderPrincipal={newAwarderPrincipal}
            setNewAwarderPrincipal={setNewAwarderPrincipal}
            newAwarderName={newAwarderName}
            setNewAwarderName={setNewAwarderName}
            handleAddAwarder={handleAddAwarder}
            isLoading={isLoading}
          />


          {/* Search */}
          <SearchCard searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </Box>

        {/* Right Column: Statistics */}
        <StatsCard
            awarders={awarders}
            handleRefresh={handleRefresh}
            refreshing={refreshing}
          />
      </Box>

      {/* Awarders Table */}
      <AwardersCard
        filteredAwarders={filteredAwarders}
        refreshing={refreshing}
        handleRefresh={handleRefresh}
        handleMenuClick={handleMenuClick}
        getStatusColor={getStatusColor}
      />

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
