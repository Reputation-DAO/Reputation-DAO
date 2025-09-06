import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Box } from "@mui/material";
import { Wallet, Shield, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';

// Hook to detect dark mode from CSS classes
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();
    
    // Create observer to watch for class changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

const StyledCard = styled(Card)(() => {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    background: isDark 
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    border: isDark
      ? '1px solid rgba(255, 255, 255, 0.1)'
      : '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '16px',
    boxShadow: isDark
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: isDark
        ? '0 8px 25px rgba(0, 0, 0, 0.4)'
        : '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
  };
});

const IconContainer = styled(Box)(() => {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDark
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(59, 130, 246, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: isDark
        ? 'rgba(59, 130, 246, 0.3)'
        : 'rgba(59, 130, 246, 0.2)',
      transform: 'scale(1.1)',
    },
  };
});

const RecommendedBadge = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  background: '#3b82f6',
  color: 'white',
  padding: '4px 12px',
  fontSize: '12px',
  borderRadius: '0 16px 0 12px',
  fontWeight: 600,
  zIndex: 1,
});

const WalletOption = ({ icon: Icon, name, description, isRecommended, isConnected, onConnect, isLoading }: {
  icon: any;
  name: string;
  description: string;
  isRecommended?: boolean;
  isConnected?: boolean;
  onConnect: () => void;
  isLoading?: boolean;
}) => {
  const isDark = useDarkMode();
  
  return (
  <StyledCard>
    {isRecommended && (
      <RecommendedBadge>
        Recommended
      </RecommendedBadge>
    )}
    
    <Box display="flex" alignItems="center" gap={2} mb={2}>
      <IconContainer>
        <Icon size={24} color="#3b82f6" />
      </IconContainer>
      <Box>
        <Box 
          fontSize="18px" 
          fontWeight="600" 
          mb={0.5}
          sx={{
            color: isDark ? '#ffffff' : '#1a1a1a'
          }}
        >
          {name}
        </Box>
        <Box 
          fontSize="14px"
          sx={{
            color: isDark ? '#b0b0b0' : '#666666'
          }}
        >
          {description}
        </Box>
      </Box>
    </Box>
    
    <Button 
      onClick={onConnect}
      disabled={isLoading || isConnected}
      variant={isConnected ? "outlined" : "contained"}
      fullWidth
      sx={{
        borderRadius: '12px',
        py: 1.5,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '16px',
        transition: 'all 0.3s ease',
        backgroundColor: isConnected ? 'transparent' : '#3b82f6',
        color: isConnected ? '#3b82f6' : 'white',
        border: isConnected ? '2px solid #3b82f6' : '2px solid #3b82f6',
        '&:hover': {
          transform: 'translateY(-2px)',
          backgroundColor: isConnected ? 'rgba(59, 130, 246, 0.1)' : '#2563eb',
          borderColor: isConnected ? '#2563eb' : '#2563eb',
        },
        '&:disabled': {
          backgroundColor: isConnected ? 'transparent' : '#94a3b8',
          color: isConnected ? '#94a3b8' : 'white',
          borderColor: '#94a3b8',
          transform: 'none',
        },
      }}
    >
      {isLoading ? (
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              width: 16,
              height: 16,
              border: '2px solid transparent',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              mr: 1,
            }}
          />
          Connecting...
        </Box>
      ) : isConnected ? (
        <Box display="flex" alignItems="center">
          <CheckCircle size={16} style={{ marginRight: 8 }} />
          Connected
        </Box>
      ) : (
        <Box display="flex" alignItems="center">
          Connect
          <ArrowRight size={16} style={{ marginLeft: 8 }} />
        </Box>
      )}
    </Button>
  </StyledCard>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const { login, error } = useAuth();
  const isDark = useDarkMode();

  const handleWalletConnect = async (walletType: string) => {
    setIsConnecting(walletType);
    
    try {
      if (walletType === 'ii') {
        // Internet Identity login
        await login();
        setConnectedWallet(walletType);
        
        // Redirect to Internet Identity specific org selector
        setTimeout(() => {
          navigate('/org-selector-ii');
        }, 1000);
      } else if (walletType === 'plug') {
        // Plug wallet connection - redirect to original org selector
        setTimeout(() => {
          navigate('/org-selector');
        }, 1000);
        setConnectedWallet(walletType);
      } else {
        // Other wallets - simulate connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        setConnectedWallet(walletType);
        
        setTimeout(() => {
          navigate('/org-selector');
        }, 1000);
      }
      
    } catch (error) {
      console.error(`Failed to connect ${walletType}:`, error);
    } finally {
      setIsConnecting(null);
    }
  };

  const walletOptions = [
    {
      icon: Zap,
      name: "Plug Wallet",
      description: "Connect with Plug wallet for Internet Computer",
      isRecommended: true,
      isConnected: connectedWallet === "plug",
      onConnect: () => handleWalletConnect("plug")
    },
    {
      icon: Shield,
      name: "Internet Identity",
      description: "Secure authentication with Internet Identity",
      isConnected: connectedWallet === "ii",
      onConnect: () => handleWalletConnect("ii")
    }
  ];

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: isDark 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
    
      
      {/* Background Effects */}
      <Box 
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
      >
        <Box 
          sx={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '384px',
            height: '384px',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: '384px',
            height: '384px',
            background: 'rgba(147, 51, 234, 0.05)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'pulse 4s ease-in-out infinite',
            animationDelay: '1s'
          }}
        />
      </Box>

      <Box sx={{ position: 'relative', maxWidth: '1024px', mx: 'auto', px: 2, py: 10 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box 
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '16px',
              mb: 3,
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            <Shield size={32} color="white" />
          </Box>
          
          <Box 
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3rem' },
              fontWeight: 'bold',
              mb: 3,
              background: isDark
                ? 'linear-gradient(135deg, #f8fafc, #e2e8f0)'
                : 'linear-gradient(135deg, #1f2937, #374151)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Connect Your Wallet
          </Box>
          
          <Box 
            sx={{
              fontSize: '1.25rem',
              color: isDark ? '#cbd5e1' : '#4b5563',
              maxWidth: '600px',
              mx: 'auto',
              mb: 4
            }}
          >
            Choose your wallet to access the Reputation DAO dashboard and start building your on-chain reputation.
          </Box>
        </Box>

        {/* Display error if any */}
        {error && (
          <Box 
            sx={{
              mb: 4,
              p: 2,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#dc2626',
              textAlign: 'center'
            }}
          >
            {error}
          </Box>
        )}

        {/* Wallet Options */}
        <Box sx={{ display: 'grid', gap: 3, maxWidth: '600px', mx: 'auto' }}>
          {walletOptions.map((option, index) => (
            <Box 
              key={option.name}
              sx={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              <WalletOption
                {...option}
                isLoading={isConnecting === option.name.toLowerCase().replace(' ', '')}
              />
            </Box>
          ))}
        </Box>

        {/* Security Notice */}
        <Box 
          sx={{
            mt: 8,
            p: 3,
            maxWidth: '600px',
            mx: 'auto',
            background: isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            animation: 'fadeInUp 0.6s ease-out 0.4s both'
          }}
        >
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Shield size={24} color="#3b82f6" style={{ marginTop: 4, flexShrink: 0 }} />
            <Box>
              <Box 
                fontWeight="600" 
                mb={1}
                sx={{
                  color: isDark ? '#ffffff' : '#1f2937'
                }}
              >
                Secure & Privacy-First
              </Box>
              <Box 
                fontSize="14px"
                sx={{
                  color: isDark ? '#cbd5e1' : '#6b7280'
                }}
              >
                Your wallet connection is secure and private. We never store your private keys or sensitive information. 
                Your reputation data is stored on-chain and remains under your control.
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Features Preview */}
        <Box 
          sx={{
            mt: 8,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            maxWidth: '1024px',
            mx: 'auto'
          }}
        >
          {[
            {
              icon: Zap,
              title: "Instant Access",
              description: "Connect and access your dashboard immediately"
            },
            {
              icon: Shield,
              title: "Secure Storage",
              description: "Your reputation is stored securely on-chain"
            },
            {
              icon: Wallet,
              title: "Multi-Wallet",
              description: "Support for multiple wallet providers"
            }
          ].map((feature, index) => (
            <Box 
              key={feature.title}
              sx={{
                textAlign: 'center',
                p: 3,
                animation: `fadeInUp 0.6s ease-out ${0.5 + index * 0.1}s both`
              }}
            >
              <Box 
                sx={{
                  width: 48,
                  height: 48,
                  background: isDark
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(59, 130, 246, 0.15)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <feature.icon size={24} color="#3b82f6" />
              </Box>
              <Box 
                fontWeight="600" 
                mb={1}
                sx={{
                  color: isDark ? '#ffffff' : '#1f2937'
                }}
              >
                {feature.title}
              </Box>
              <Box 
                fontSize="14px"
                sx={{
                  color: isDark ? '#cbd5e1' : '#6b7280'
                }}
              >
                {feature.description}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Auth;
