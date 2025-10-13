import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Shield, Zap, ArrowRight, CheckCircle } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";

const WalletOption = ({ icon: Icon, name, description, isRecommended, isConnected, onConnect, isLoading }: {
  icon: any;
  name: string;
  description: string;
  isRecommended?: boolean;
  isConnected?: boolean;
  onConnect: () => void;
  isLoading?: boolean;
}) => (
  <Card className="glass-card p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[var(--shadow-glow)] group relative overflow-hidden">
    {isRecommended && (
      <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary-glow text-white px-3 py-1 text-xs rounded-bl-lg">
        Recommended
      </div>
    )}
    
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary-glow/20 transition-all duration-300">
        <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    
    <Button 
      onClick={onConnect}
      disabled={isLoading || isConnected}
      variant={isConnected ? "secondary" : "hero"}
      className="w-full group-hover:scale-105 transition-transform duration-200"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Connected
        </>
      ) : (
        <>
          Connect
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
        </>
      )}
    </Button>
  </Card>
);

const AuthPage = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    authMethod, 
    principal, 
    isLoading, 
    loginWithInternetIdentity, 
    logout, 
    checkConnection 
  } = useAuth();
  const { userRole, loading: roleLoading } = useRole();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [showConnected, setShowConnected] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Show connected state without auto-redirect
  useEffect(() => {
    if (isAuthenticated && principal && !roleLoading) {
      setShowConnected(true);
    }
  }, [isAuthenticated, principal, roleLoading]);

  const handleWalletConnect = async (walletType: string) => {
    setIsConnecting(walletType);
    try {
      if (walletType === "ii") {
        await loginWithInternetIdentity();
      } else {
        throw new Error(`Unsupported wallet type: ${walletType}`);
      }
      // Connection success is handled by the useEffect above
    } catch (error) {
      console.error(`Failed to connect ${walletType}:`, error);
    } finally {
      setIsConnecting(null);
    }
  };

  const walletOptions = [
    {
      icon: Shield,
      name: "Internet Identity",
      description: "Secure authentication with Internet Computer",
      isRecommended: true,
      isConnected: isAuthenticated && authMethod === 'ii',
      onConnect: () => handleWalletConnect("ii")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <Navigation />
      
      <div className="relative pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl mb-6 animate-pulse-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Connect Your Wallet
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose your wallet to access the Reputation DAO dashboard and start building your on-chain reputation.
            </p>
          </div>

          {/* Connected Status - Show if already connected */}
          {isAuthenticated && principal && (
            <div className="max-w-2xl mx-auto mb-8">
              <Card className="glass-card p-6 bg-green-500/10 border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {authMethod === 'ii' ? 'Internet Identity' : 'Internet Identity'} Connected
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {principal.toString().slice(0, 8)}...{principal.toString().slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={logout}
                      className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                    >
                      Disconnect
                    </Button>
                    <Button
                      onClick={() => navigate('/org-selector')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Wallet Options */}
          <div className="grid gap-6 max-w-2xl mx-auto">
            {walletOptions.map((option, index) => (
              <div 
                key={option.name}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <WalletOption
                  {...option}
                  isLoading={isConnecting === option.name.toLowerCase().replace(' ', '')}
                />
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="mt-16 p-6 glass-card max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Secure & Privacy-First</h3>
                <p className="text-sm text-muted-foreground">
                  Your wallet connection is secure and private. We never store your private keys or sensitive information. 
                  Your reputation data is stored on-chain and remains under your control.
                </p>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
              <div 
                key={feature.title}
                className="text-center p-6 animate-fade-in"
                style={{ animationDelay: `${0.5 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
