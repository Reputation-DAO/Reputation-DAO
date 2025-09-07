import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { 
  Building, 
  Plus, 
  Users, 
  Star, 
  ArrowRight, 
  Search,
  Crown,
  Shield,
  User,
  CheckCircle,
  Zap
} from 'lucide-react';
import { getPlugActor, getCurrentPrincipal } from '../components/canister/reputationDao';

// Types
interface Organization {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  reputationPoints: number;
  role: 'admin' | 'awarder' | 'member';
  isOwner?: boolean;
  category: string;
}

// Role Icon Component
const RoleIcon = ({ role }: { role: 'admin' | 'awarder' | 'member' }) => {
  switch (role) {
    case 'admin':
      return <Crown style={{ width: 16, height: 16, color: '#f59e0b' }} />;
    case 'awarder':
      return <Shield style={{ width: 16, height: 16, color: '#3b82f6' }} />;
    default:
      return <User style={{ width: 16, height: 16, color: '#6b7280' }} />;
  }
};

// Organization Card Component
const OrganizationCard = ({ 
  org, 
  onSelect, 
  isSelected,
  isConnected = true
}: { 
  org: Organization; 
  onSelect: (org: Organization) => void;
  isSelected: boolean;
  isConnected?: boolean;
}) => (
  <Card
    sx={{
      p: 3,
      cursor: isConnected ? 'pointer' : 'not-allowed',
      transition: 'all 0.3s ease',
      background: isSelected 
        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(147, 51, 234, 0.1))'
        : 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(20px)',
      border: isSelected 
        ? '2px solid rgba(99, 102, 241, 0.8)'
        : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      position: 'relative',
      overflow: 'hidden',
      opacity: isConnected ? 1 : 0.5,
      '&:hover': isConnected ? {
        transform: 'scale(1.02)',
        borderColor: 'rgba(99, 102, 241, 0.6)',
        boxShadow: '0 0 40px hsl(217 91% 70% / 0.3)',
      } : {}
    }}
    onClick={() => isConnected && onSelect(org)}
  >
    {/* Category Badge */}
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        px: 2,
        py: 0.5,
        borderRadius: '20px',
        background: 'rgba(99, 102, 241, 0.2)',
        backdropFilter: 'blur(10px)',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#a5b4fc'
      }}
    >
      {org.category}
    </Box>

    {/* Role Badge */}
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'capitalize'
        }}
      >
        <RoleIcon role={org.role} />
        {org.role}
        {org.isOwner && ' (Owner)'}
      </Box>
    </Box>

    {/* Content */}
    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
      {org.name}
    </Typography>
    
    <Typography 
      variant="body2" 
      sx={{ 
        color: 'text.secondary', 
        mb: 3, 
        lineHeight: 1.5,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}
    >
      {org.description}
    </Typography>

    {/* Stats */}
    <Box sx={{ display: 'flex', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Users style={{ width: 16, height: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {org.memberCount} members
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Star style={{ width: 16, height: 16, color: '#f59e0b' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {org.reputationPoints} rep
        </Typography>
      </Box>
    </Box>

    {/* Selection Indicator */}
    {isSelected && (
      <Box
        sx={{
          position: 'absolute',
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(147, 51, 234, 0.3))',
          borderRadius: '16px',
          zIndex: -1,
          animation: 'pulse-glow 2s ease-in-out infinite alternate',
          '@keyframes pulse-glow': {
            '0%': { opacity: 0.3 },
            '100%': { opacity: 0.6 }
          }
        }}
      />
    )}
  </Card>
);

// Create Organization Dialog
const CreateOrgDialog = ({ 
  open, 
  onClose, 
  onCreateOrg 
}: { 
  open: boolean; 
  onClose: () => void;
  onCreateOrg: (name: string, description: string, category: string) => void;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');

  const handleCreate = () => {
    if (name.trim() && description.trim()) {
      onCreateOrg(name.trim(), description.trim(), category);
      setName('');
      setDescription('');
      setCategory('Technology');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        fontWeight: 700, 
        fontSize: '1.5rem',
        color: 'white'
      }}>
        Create New Organization
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Organization Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused fieldset': { borderColor: 'hsl(217, 91%, 60%)' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />
          
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused fieldset': { borderColor: 'hsl(217, 91%, 60%)' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}
          />

          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Category</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label="Category"
              sx={{
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(217, 91%, 60%)' }
              }}
            >
              <MenuItem value="Technology">Technology</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Community">Community</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={onClose} 
              sx={{ flex: 1, borderRadius: '8px', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleCreate} 
              disabled={!name.trim() || !description.trim()} 
              sx={{ flex: 1, borderRadius: '8px', textTransform: 'none' }}
            >
              Create Organization
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const OrgSelector = () => {
  const navigate = useNavigate();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Wallet connection states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Organizations from canister
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Fetch organizations that the user has access to
  const fetchUserOrganizations = async () => {
    if (!isConnected || !userPrincipal) return;
    
    setLoadingOrgs(true);
    try {
      const reputationDao = await getPlugActor();
      if (!reputationDao) return;

      console.log("Fetching all organizations...");
      
      // Get all organization IDs
      const allOrgIds = await reputationDao.getAllOrgs();
      console.log("All org IDs:", allOrgIds);
      
      if (!allOrgIds || allOrgIds.length === 0) {
        setOrganizations([]);
        return;
      }

      // Get current user's principal
      const currentPrincipal = await getCurrentPrincipal();
      if (!currentPrincipal) return;

      const userOrgs: Organization[] = [];

      // Check each organization to see if user has access
      for (const orgId of allOrgIds) {
        try {
          // Get organization stats and admin info
          const [orgStats, orgAdmin, isAwarder] = await Promise.all([
            reputationDao.getOrgStats(orgId),
            reputationDao.getOrgAdmin(orgId),
            reputationDao.isOrgTrustedAwarderQuery(orgId, currentPrincipal)
          ]);

          // Check if user has any role in this organization
          let userRole: 'admin' | 'awarder' | 'member' = 'member';
          let isOwner = false;

          // Check if user is admin
          if (orgAdmin && orgAdmin.toString() === currentPrincipal.toString()) {
            userRole = 'admin';
            isOwner = true;
          }
          // Check if user is awarder  
          else if (isAwarder) {
            userRole = 'awarder';
          }
          // For now, we'll include all orgs - you might want to filter this
          // to only show orgs where user is actually a member

          const stats = Array.isArray(orgStats) ? orgStats[0] : orgStats;
          
          const org: Organization = {
            id: orgId,
            name: orgId, // Using ID as name for now - you might want to store actual names
            description: `Organization ${orgId}`, // Placeholder description
            memberCount: stats ? Number(stats.userCount) : 0,
            reputationPoints: stats ? Number(stats.totalPoints) : 0,
            role: userRole,
            isOwner,
            category: "General" // Default category
          };

          userOrgs.push(org);
          
        } catch (error) {
          console.warn(`Error fetching data for org ${orgId}:`, error);
        }
      }
      
      console.log("User organizations:", userOrgs);
      setOrganizations(userOrgs);
      
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setError("Failed to fetch organizations. You can try the 'Load Organizations' button.");
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Check wallet connection + retrieve principal
  const checkWalletConnection = async () => {
    try {
      if ((window as any).ic?.plug) {
        const connected = await (window as any).ic.plug.isConnected();
        setIsConnected(Boolean(connected));

        if (connected) {
          let principal: any = null;
          try {
            principal = await getCurrentPrincipal();
          } catch {
            /* ignore and fallback */
          }

          if (!principal && (window as any).ic?.plug?.getPrincipal) {
            try {
              principal = await (window as any).ic.plug.getPrincipal();
            } catch {
              /* ignore */
            }
          }

          setUserPrincipal(principal ? principal.toString() : null);
          return;
        }
      }
    } catch (err) {
      console.warn("Error checking wallet connection:", err);
    }

    setIsConnected(false);
    setUserPrincipal(null);
  };

  useEffect(() => {
    const initConnection = async () => {
      setCheckingConnection(true);
      await checkWalletConnection();
      setCheckingConnection(false);
    };
    
    initConnection();
  }, []);

  // Fetch organizations when connected
  useEffect(() => {
    if (isConnected && userPrincipal) {
      fetchUserOrganizations();
    }
  }, [isConnected, userPrincipal]);

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    clearMessages();

    try {
      // First try to connect to Plug Wallet
      if ((window as any).ic?.plug) {
        const connected = await (window as any).ic.plug.requestConnect({
          whitelist: [],
          timeout: 50000
        });
        
        if (connected) {
          await checkWalletConnection();
          setSuccess("Wallet connected successfully!");
        } else {
          setError("Failed to connect wallet. Please try again.");
        }
      } else {
        setError("Plug wallet not found. Please install Plug wallet extension.");
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err?.message || "Failed to connect wallet. Please make sure Plug is installed and unlocked.");
    } finally {
      setConnectingWallet(false);
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
  };

  const handleContinue = () => {
    if (selectedOrg) {
      localStorage.setItem('selectedOrgId', selectedOrg.id); // Use the actual org ID (name)
      localStorage.setItem('userRole', selectedOrg.role);
      window.dispatchEvent(new CustomEvent('orgChanged'));
      navigate('/dashboard');
    }
  };

  const handleCreateOrg = async (name: string, description: string, category: string) => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const reputationDao = await getPlugActor();
      if (!reputationDao) {
        setError("Failed to connect to canister");
        return;
      }

      // Register org with canister using the name as ID
      const result = await reputationDao.registerOrg(name);
      console.log("Register org result:", result);
      
      if (typeof result === "string" && result.toLowerCase().includes("success")) {
        const newOrg: Organization = {
          id: name, // Use name as ID to match canister
          name,
          description,
          memberCount: 1,
          reputationPoints: 0,
          role: 'admin',
          isOwner: true,
          category
        };

        setOrganizations(prev => [...prev, newOrg]);
        setSuccess(`Organization "${name}" created successfully!`);
        
        // Store the org name as selectedOrgId and set role as Admin
        localStorage.setItem('selectedOrgId', name);
        localStorage.setItem('userRole', 'Admin');
        
        // Trigger org change event
        window.dispatchEvent(new CustomEvent('orgChanged'));
        
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setError(typeof result === "string" ? result : "Failed to create organization");
      }
    } catch (err: any) {
      console.error("Create org error:", err);
      setError(err?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(220, 30%, 5%) 0%, hsl(220, 30%, 8%) 50%, hsl(220, 30%, 12%) 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 8
      }}
    >
      {/* Floating Blur Orbs */}
      {[...Array(3)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: '300px', md: '500px' },
            height: { xs: '300px', md: '500px' },
            borderRadius: '50%',
            background: `linear-gradient(135deg, 
              hsla(217, 91%, 60%, 0.1), 
              hsla(147, 51%, 60%, 0.1))`,
            filter: 'blur(60px)',
            animation: 'float 6s ease-in-out infinite',
            zIndex: 0,
            ...(i === 0 && {
              top: '10%',
              left: '10%',
              animationDelay: '0s'
            }),
            ...(i === 1 && {
              top: '50%',
              right: '10%',
              animationDelay: '2s'
            }),
            ...(i === 2 && {
              bottom: '10%',
              left: '30%',
              animationDelay: '4s'
            }),
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(5deg)' }
            }
          }}
        />
      ))}

      <Box sx={{ position: 'relative', maxWidth: '1200px', mx: 'auto', px: 2, py: 10 }}>
        {/* Wallet Address Display - Top Right */}
        {isConnected && userPrincipal && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              display: 'flex',
              gap: 2,
              zIndex: 10
            }}
          >
            {/* Refresh Organizations Button */}
            <Button
              variant="outlined"
              size="small"
              onClick={fetchUserOrganizations}
              disabled={loadingOrgs}
              startIcon={loadingOrgs ? <CircularProgress size={16} /> : <Building style={{ width: 16, height: 16 }} />}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  background: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {loadingOrgs ? 'Loading...' : 'Refresh'}
            </Button>

            {/* Wallet Info */}
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle style={{ width: 16, height: 16, color: '#4ade80' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem'
                  }}
                >
                  {userPrincipal.slice(0, 8)}...{userPrincipal.slice(-8)}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setIsConnected(false);
                  setUserPrincipal(null);
                  setOrganizations([]);
                  setSuccess("Wallet disconnected");
                }}
                sx={{
                  minWidth: 'auto',
                  px: 1,
                  py: 0.5,
                  fontSize: '0.7rem',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Disconnect
              </Button>
            </Box>
          </Box>
        )}

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, hsl(217, 91%, 60%), hsl(217, 91%, 70%))',
              borderRadius: '16px',
              mb: 3,
              animation: 'pulse-glow 2s ease-in-out infinite alternate',
              '@keyframes pulse-glow': {
                '0%': { boxShadow: '0 0 20px hsl(217 91% 70% / 0.3)' },
                '100%': { boxShadow: '0 0 60px hsl(217 91% 70% / 0.6)' }
              }
            }}
          >
            <Building style={{ width: 32, height: 32, color: 'white' }} />
          </Box>
          
          <Typography 
            variant="h2" 
            sx={{ 
              fontSize: { xs: '2.5rem', md: '3rem' },
              fontWeight: 700, 
              mb: 3,
              background: 'linear-gradient(135deg, white, rgba(255, 255, 255, 0.7))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Choose Your Organization
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              maxWidth: '600px', 
              mx: 'auto', 
              mb: 4,
              lineHeight: 1.6
            }}
          >
            Select an existing organization or create a new one to start managing reputation points.
          </Typography>

          {/* Wallet Connection Status */}
          {checkingConnection ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </Box>
          ) : !isConnected ? (
            <Alert 
              severity="warning" 
              sx={{ 
                maxWidth: '600px', 
                mx: 'auto', 
                mb: 4,
                borderRadius: '12px',
                background: 'rgba(255, 193, 7, 0.1)',
                color: 'white'
              }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleConnectWallet}
                  disabled={connectingWallet}
                  startIcon={connectingWallet ? <CircularProgress size={16} /> : <Zap style={{ width: 16, height: 16 }} />}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  {connectingWallet ? 'Connecting...' : 'Connect Plug Wallet'}
                </Button>
              }
            >
              Connect your Plug Wallet to create or join organizations
            </Alert>
          ) : null}
        </Box>

        {/* Search */}
        <Box sx={{ maxWidth: '400px', mx: 'auto', mb: 6 }}>
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ 
              position: 'absolute', 
              left: 12, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'rgba(255, 255, 255, 0.5)',
              zIndex: 1
            }}>
              <Search style={{ width: 20, height: 20 }} />
            </Box>
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizations..."
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  pl: 5,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  '& input::placeholder': { color: 'rgba(255, 255, 255, 0.5)' },
                  '& fieldset': { border: 'none' }
                }
              }}
            />
          </Box>
          
          {/* Load Organizations Button */}
          {isConnected && organizations.length === 0 && !loadingOrgs && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={fetchUserOrganizations}
                startIcon={<Building style={{ width: 16, height: 16 }} />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Load Organizations
              </Button>
            </Box>
          )}
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ maxWidth: '600px', mx: 'auto', mb: 4, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ maxWidth: '600px', mx: 'auto', mb: 4, borderRadius: '12px' }}>
            {success}
          </Alert>
        )}

        {/* Organization Grid */}
        {loadingOrgs ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 2 }}>
              Loading organizations...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 6
          }}>
            {/* Create New Organization Card */}
            <Card
              sx={{
                p: 3,
                cursor: isConnected ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(20px)',
                border: '2px dashed rgba(99, 102, 241, 0.3)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '200px',
                color: 'white',
                opacity: isConnected ? 1 : 0.5,
                '&:hover': isConnected ? {
                  transform: 'scale(1.02)',
                  borderColor: 'rgba(99, 102, 241, 0.6)',
                  boxShadow: '0 0 40px hsl(217 91% 70% / 0.3)',
                } : {}
              }}
              onClick={() => isConnected && setCreateDialogOpen(true)}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(147, 51, 234, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(147, 51, 234, 0.2))',
                  transform: 'scale(1.1)',
                }
              }}
            >
              <Plus style={{ width: 32, height: 32, color: 'hsl(217, 91%, 60%)' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Create New Organization
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {isConnected 
                ? "Set up a new organization and start building reputation"
                : "Connect your wallet to create a new organization"
              }
            </Typography>
          </Card>

          {/* Existing Organizations */}
          {filteredOrgs.map((org) => (
            <OrganizationCard
              key={org.id}
              org={org}
              onSelect={handleSelectOrg}
              isSelected={selectedOrg?.id === org.id}
              isConnected={isConnected}
            />
          ))}
          </Box>
        )}

        {/* Continue Button */}
        {selectedOrg && (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              onClick={handleContinue}
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              endIcon={<ArrowRight style={{ width: 20, height: 20 }} />}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, hsl(217, 91%, 60%), hsl(217, 91%, 70%))',
                color: 'white',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 40px hsl(217 91% 70% / 0.3)',
                }
              }}
            >
              {loading ? 'Loading...' : 'Continue to Dashboard'}
            </Button>
          </Box>
        )}
      </Box>

      {/* Create Organization Dialog */}
      <CreateOrgDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreateOrg={handleCreateOrg}
      />
    </Box>
  );
};

export default OrgSelector;
