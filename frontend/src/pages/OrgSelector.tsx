import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { getPlugActor, getCurrentPrincipal } from '../components/canister/reputationDao';

const Root = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3),
}));

const SelectorCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 500,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  padding: theme.spacing(1.5, 3),
  fontWeight: '600',
}));

const OrgSelector: React.FC = () => {
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const navigate = useNavigate();

  // Check wallet connection status
  const checkWalletConnection = async () => {
    try {
      if (window.ic?.plug?.isConnected) {
        const connected = await window.ic.plug.isConnected();
        setIsConnected(connected);
        
        if (connected) {
          const principal = await window.ic.plug.getPrincipal();
          setUserPrincipal(principal.toString());
        }
      }
    } catch (err) {
      console.warn('Error checking wallet connection:', err);
      setIsConnected(false);
    }
  };

  // Check connection on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Debug log to check what's happening
  console.log('OrgSelector render:', { isConnected, userPrincipal });

  // Redirect to auth if not connected
  /*useEffect(() => {
    if (!isConnected) {
      console.log('Not connected, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    if (principal) {
      setUserPrincipal(principal.toString());
    }
  }, [isConnected, principal, navigate]);*/

  const handleDisconnect = async () => {
    try {
      if (window.ic?.plug) {
        await window.ic.plug.disconnect();
        setIsConnected(false);
        setUserPrincipal(null);
      }
      navigate('/auth');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    clearMessages();
    
    try {
      // Use the existing getPlugActor function to trigger wallet connection
      const actor = await getPlugActor();
      if (actor) {
        // Connection successful - check connection status
        await checkWalletConnection();
        console.log('Wallet connected successfully');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err?.message || 'Failed to connect wallet. Please make sure Plug is installed.');
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleRegisterOrg = async () => {
    if (!orgId.trim()) {
      setError('Please enter an Organization ID');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const reputationDao = await getPlugActor();
      if (!reputationDao) {
        setError('Failed to connect to canister');
        return;
      }

      const result = await reputationDao.registerOrg(orgId.trim());
      
      if (typeof result === 'string') {
        if (result.includes('Success')) {
          setSuccess(`Organization "${orgId}" registered successfully! You are the admin.`);
          
          // Store org info in localStorage
          localStorage.setItem('selectedOrgId', orgId.trim());
          localStorage.setItem('userRole', 'Admin');
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setError(result);
        }
      } else {
        setError('Unexpected response format');
      }
    } catch (err: any) {
      console.error('Register org error:', err);
      setError(err?.message || 'Failed to register organization');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async () => {
    if (!orgId.trim()) {
      setError('Please enter an Organization ID');
      return;
    }

    if (!userPrincipal) {
      setError('No principal available');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const reputationDao = await getPlugActor();
      if (!reputationDao) {
        setError('Failed to connect to canister');
        return;
      }

      // First check if org exists by getting admin
      const adminResult = await reputationDao.getOrgAdmin(orgId.trim()) as any;
      
      if (!adminResult || (Array.isArray(adminResult) && adminResult.length === 0)) {
        setError('Organization not found. Please check the Organization ID.');
        setLoading(false);
        return;
      }

      // Handle the optional array format from Motoko: [] | [Principal]
      const adminPrincipal = Array.isArray(adminResult) ? adminResult[0] : adminResult;
      
      // Determine user role
      let userRole = 'RegularUser';
      
      // Check if user is admin
      if (adminPrincipal && adminPrincipal.toString() === userPrincipal) {
        userRole = 'Admin';
      } else {
        // Check if user is trusted awarder
        try {
          const trustedAwarders = await reputationDao.getTrustedAwarders(orgId.trim()) as any;
          if (trustedAwarders && Array.isArray(trustedAwarders) && trustedAwarders.length > 0) {
            const awardersList = trustedAwarders[0];
            const isAwarder = Array.isArray(awardersList) && awardersList.some((awarder: any) => 
              awarder.id && awarder.id.toString() === userPrincipal
            );
            if (isAwarder) {
              userRole = 'TrustedAwarder';
            }
          }
        } catch (awarderErr) {
          console.warn('Could not fetch trusted awarders:', awarderErr);
          // Continue with RegularUser role
        }
      }

      setSuccess(`Successfully joined organization "${orgId}" as ${userRole}`);
      
      // Store org info in localStorage
      localStorage.setItem('selectedOrgId', orgId.trim());
      localStorage.setItem('userRole', userRole);
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Join org error:', err);
      setError(err?.message || 'Failed to join organization');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || !userPrincipal) {
    return (
      <Root>
        <SelectorCard>
          <Box display="flex" flexDirection="column" alignItems="center" p={4}>
            <Typography variant="h5" fontWeight="600" mb={2}>
              Connect Your Wallet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
              Please connect your Plug wallet to select or create an organization.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3, width: '100%' }}>
                {success}
              </Alert>
            )}
            
            <ActionButton
              variant="contained"
              onClick={handleConnectWallet}
              disabled={connectingWallet}
              color="primary"
              startIcon={connectingWallet ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: 200 }}
            >
              {connectingWallet ? 'Connecting...' : 'Connect Plug Wallet'}
            </ActionButton>
            
            <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">
              Don't have Plug wallet? <br />
              <Button
                variant="text"
                size="small"
                onClick={() => window.open('https://plugwallet.ooo/', '_blank')}
                sx={{ textTransform: 'none' }}
              >
                Download here
              </Button>
            </Typography>
          </Box>
        </SelectorCard>
      </Root>
    );
  }

  return (
    <Root>
      <SelectorCard>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="600">
            Select Organization
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDisconnect}
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
            }}
          >
            Disconnect
          </Button>
        </Box>

        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Connected Principal:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-all',
              backgroundColor: 'action.hover',
              color: 'text.primary',
              padding: 1,
              borderRadius: 1,
              fontSize: '0.8rem'
            }}
          >
            {userPrincipal}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={(e) => e.preventDefault()}>
          <TextField
            fullWidth
            label="Organization ID"
            variant="outlined"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="Enter organization identifier (e.g., my-company)"
            disabled={loading}
            sx={{ mb: 3 }}
            InputProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          />

          <Box display="flex" gap={2} mb={3}>
            <ActionButton
              variant="contained"
              fullWidth
              onClick={handleRegisterOrg}
              disabled={loading || !orgId.trim()}
              color="primary"
            >
              {loading ? <CircularProgress size={20} /> : 'Register Org'}
            </ActionButton>

            <ActionButton
              variant="outlined"
              fullWidth
              onClick={handleJoinOrg}
              disabled={loading || !orgId.trim()}
              color="primary"
            >
              {loading ? <CircularProgress size={20} /> : 'Join Org'}
            </ActionButton>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              <strong>Register Org:</strong> Create a new organization (you become admin)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Join Org:</strong> Join an existing organization
            </Typography>
          </Box>
        </Box>
      </SelectorCard>
    </Root>
  );
};

export default OrgSelector;