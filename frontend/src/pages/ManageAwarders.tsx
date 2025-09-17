// frontend/src/pages/ManageAwarders.tsx
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { useParams } from 'react-router-dom';
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
  Chip,
  CircularProgress,
} from '@mui/material';
import { Group, Delete } from '@mui/icons-material';
import { makeChildWithPlug } from '../components/canister/child';

import InviteAwarderCard from '../components/Dashboard/manageawarder/awarder';
import SearchCard from '../components/Dashboard/manageawarder/SearchCard';
import StatsCard from '../components/Dashboard/manageawarder/statscard';
import AwardersCard from '../components/Dashboard/manageawarder/awarderscard';

interface AwarderUI {
  id: string;
  name: string;
  principal: string;
  status: 'active' | 'inactive';
  joinDate: string;
  totalAwarded: number;
  lastActive: string;
}

const ManageAwarders: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();
  const [child, setChild] = useState<any>(null);

  const [awarders, setAwarders] = useState<AwarderUI[]>([]);
  const [filteredAwarders, setFilteredAwarders] = useState<AwarderUI[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [newAwarderPrincipal, setNewAwarderPrincipal] = useState('');
  const [newAwarderName, setNewAwarderName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAwarder, setSelectedAwarder] = useState<AwarderUI | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'remove' | null; awarder: AwarderUI | null }>({ open: false, action: null, awarder: null });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Connect to child canister for this :cid
  useEffect(() => {
    (async () => {
      try {
        if (!cid) {
          setConnectError('No organization selected.');
          return;
        }
        const actor = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
        setChild(actor);
      } catch (e: any) {
        setConnectError(e?.message || 'Failed to connect to org canister');
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid]);

  // Load awarders from child
  const loadTrustedAwarders = async () => {
    if (!child) return;
    try {
      setRefreshing(true);
      const backendAwarders = await child.getTrustedAwarders(); // [{ id: Principal, name: Text }]
      const list = Array.isArray(backendAwarders) ? backendAwarders : [];

      // Optionally compute simple stats per awarder from tx history
      const enriched: AwarderUI[] = await Promise.all(
        list.map(async (a: any) => {
          const principalStr = a.id.toString();
          let totalAwarded = 0;
          let lastActive = '—';
          try {
            const txs = await child.getTransactionsByUser(a.id);
            if (Array.isArray(txs)) {
              let latest = 0;
              for (const tx of txs) {
                const isAward = tx?.transactionType && 'Award' in tx.transactionType;
                if (isAward && tx?.from?.toString?.() === principalStr) {
                  totalAwarded += Number(tx.amount || 0);
                }
                const ts = Number(tx.timestamp || 0);
                if (ts > latest) latest = ts;
              }
              if (latest > 0) lastActive = new Date(latest * 1000).toLocaleDateString();
            }
          } catch {
            // ignore stats failure; keep defaults
          }

          return {
            id: principalStr,
            name: a.name ?? 'Unknown',
            principal: principalStr,
            status: 'active',
            joinDate: new Date().toLocaleDateString(),
            totalAwarded,
            lastActive,
          };
        })
      );

      setAwarders(enriched);
      setFilteredAwarders(filterBySearch(enriched, searchTerm));
    } catch (error: any) {
      console.error(error);
      setSnackbar({ open: true, message: 'Failed to load awarders: ' + (error?.message ?? String(error)), severity: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  // Load on child ready
  useEffect(() => {
    if (child) loadTrustedAwarders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  // Search filter
  const filterBySearch = (arr: AwarderUI[], q: string) => {
    if (!q) return arr;
    const qq = q.toLowerCase();
    return arr.filter((a) => a.name.toLowerCase().includes(qq) || a.principal.toLowerCase().includes(qq));
  };
  useEffect(() => {
    setFilteredAwarders(filterBySearch(awarders, searchTerm));
  }, [searchTerm, awarders]);

  // Add awarder on child
  const handleAddAwarder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;
    if (!newAwarderPrincipal.trim() || !newAwarderName.trim()) {
      return setSnackbar({ open: true, message: 'Please enter both Principal ID and name', severity: 'warning' });
    }
    try {
      setIsLoading(true);
      const principal = Principal.fromText(newAwarderPrincipal.trim());
      const result: string = await child.addTrustedAwarder(principal, newAwarderName.trim());
      if (typeof result === 'string' && result.includes('Success')) {
        setSnackbar({ open: true, message: `Successfully added ${newAwarderName}`, severity: 'success' });
        setNewAwarderPrincipal('');
        setNewAwarderName('');
        await loadTrustedAwarders();
      } else {
        throw new Error(result || 'Failed to add awarder');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.message?.includes('Invalid principal') ? 'Invalid Principal ID format' : 'Failed to add awarder: ' + (error?.message ?? String(error)),
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove awarder on child
  const handleRemoveAwarder = async (awarder: AwarderUI) => {
    if (!child) return;
    try {
      const principal = Principal.fromText(awarder.principal);
      const result: string = await child.removeTrustedAwarder(principal);
      if (typeof result === 'string' && result.includes('Success')) {
        setSnackbar({ open: true, message: `Successfully removed ${awarder.name}`, severity: 'success' });
        await loadTrustedAwarders();
      } else {
        throw new Error(result || 'Failed to remove awarder');
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to remove awarder: ' + (error?.message ?? String(error)), severity: 'error' });
    }
  };

  const handleRefresh = () => loadTrustedAwarders();
  const handleMenuClick = (e: React.MouseEvent<HTMLElement>, awarder: AwarderUI) => {
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
  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const getStatusColor = (status: string) => (status === 'active' ? 'success' : 'default');

  // Connect-state UI
  if (connecting) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
      </Box>
    );
  }
  if (!cid || connectError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{connectError || 'No organization selected.'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: 'hsl(var(--background))', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, color: 'hsl(var(--foreground))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <Group sx={{ color: 'hsl(var(--primary))' }} /> Manage Awarders
        <Chip label={`Org: ${cid}`} size="small" sx={{ ml: 2, bgcolor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }} />
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left: Form + Search */}
        <Box sx={{ flex: 1 }}>
          <InviteAwarderCard
            newAwarderPrincipal={newAwarderPrincipal}
            setNewAwarderPrincipal={setNewAwarderPrincipal}
            newAwarderName={newAwarderName}
            setNewAwarderName={setNewAwarderName}
            handleAddAwarder={handleAddAwarder}
            isLoading={isLoading}
          />
          <SearchCard searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </Box>

        {/* Right: Stats */}
        <StatsCard awarders={awarders} handleRefresh={handleRefresh} refreshing={refreshing} />
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
        <MenuItem
          onClick={() => setConfirmDialog({ open: true, action: 'remove', awarder: selectedAwarder })}
          sx={{ color: 'hsl(var(--destructive))' }}
        >
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
          <Button onClick={() => setConfirmDialog({ open: false, action: null, awarder: null })} sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            sx={{ color: confirmDialog.action === 'remove' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', fontWeight: 600 }}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ManageAwardersWithProtection: React.FC = () => (
  <ProtectedPage>
    <ManageAwarders />
  </ProtectedPage>
);

export default ManageAwardersWithProtection;
