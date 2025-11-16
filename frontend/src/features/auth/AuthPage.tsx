import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Shield, Zap, ArrowRight, CheckCircle, Coins } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useSiwbIdentity, type WalletProviderKey } from "@/lib/siwb-identity";
import { useSiweIdentity, type EthereumWalletKey } from "@/lib/siwe-identity";

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
    loginWithPlug, 
    loginWithInternetIdentity,
    loginWithSiwb,
    loginWithSiwe,
    logout, 
    checkConnection 
  } = useAuth();
  const siwb = useSiwbIdentity();
  const siwe = useSiweIdentity();
  const { userRole, loading: roleLoading } = useRole();
  const [isConnecting, setIsConnecting] = useState<"plug" | "internetIdentity" | "siwb" | "siwe" | null>(null);
  const [showConnected, setShowConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProviderKey | null>(null);
  const [selectedEthWallet, setSelectedEthWallet] = useState<EthereumWalletKey | null>(null);
  const [siwbStatus, setSiwbStatus] = useState<string | null>(null);
  const [siweStatus, setSiweStatus] = useState<string | null>(null);

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

  useEffect(() => {
    if (siwb.selectedProvider) {
      setSelectedWallet(siwb.selectedProvider);
    }
  }, [siwb.selectedProvider]);

  useEffect(() => {
    if (siwb.connectedBtcAddress) {
      setSiwbStatus(`Wallet ready: ${siwb.connectedBtcAddress.slice(0, 6)}...${siwb.connectedBtcAddress.slice(-4)}`);
    }
  }, [siwb.connectedBtcAddress]);

  useEffect(() => {
    if (siwe.connectedEthAddress) {
      setSiweStatus(`Wallet ready: ${siwe.connectedEthAddress.slice(0, 6)}...${siwe.connectedEthAddress.slice(-4)}`);
    }
  }, [siwe.connectedEthAddress]);

  const handleWalletConnect = async (walletType: "plug" | "internetIdentity") => {
    setIsConnecting(walletType);
    try {
      if (walletType === "plug") {
        await loginWithPlug();
      } else if (walletType === "internetIdentity") {
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

  const walletOptions: Array<{
    id: "plug" | "internetIdentity";
    icon: any;
    name: string;
    description: string;
    isRecommended?: boolean;
    isConnected: boolean;
    onConnect: () => void;
  }> = [
    {
      id: "plug",
      icon: Zap,
      name: "Plug Wallet",
      description: "Connect with Plug wallet for Internet Computer",
      isRecommended: true,
      isConnected: isAuthenticated && authMethod === 'plug',
      onConnect: () => handleWalletConnect("plug")
    },
    {
      id: "internetIdentity",
      icon: Shield,
      name: "Internet Identity",
      description: "Authenticate with Internet Identity for browser-based access",
      isConnected: isAuthenticated && authMethod === 'internetIdentity',
      onConnect: () => handleWalletConnect("internetIdentity")
    },
  ];

  const btcWalletOptions: { id: WalletProviderKey; label: string; description: string }[] = [
    { id: "xverse", label: "Xverse", description: "Recommended Taproot wallet" },
    { id: "unisat", label: "Unisat", description: "Popular ordinals wallet" },
    { id: "okxwallet.bitcoin", label: "OKX Wallet", description: "Mainnet" },
    { id: "okxwallet.bitcoinTestnet", label: "OKX Wallet (Testnet)", description: "Testing networks" },
    { id: "BitcoinProvider", label: "LaserEyes (Generic)", description: "Browser provider" },
  ];

  const ethWalletOptions: { id: EthereumWalletKey; label: string; description: string }[] = [
    { id: "metamask", label: "MetaMask", description: "Most common browser wallet" },
    { id: "rabby", label: "Rabby", description: "DeBank's alternative wallet" },
    { id: "brave", label: "Brave Wallet", description: "Built into Brave browser" },
    { id: "coinbase", label: "Coinbase Wallet", description: "Coinbase browser extension" },
    { id: "other", label: "Generic (EIP-1193)", description: "Any other injected wallet" },
  ];

  const handleBitcoinWalletSelect = async (wallet: WalletProviderKey) => {
    setSiwbStatus(null);
    try {
      setIsConnecting("siwb");
      await siwb.setWalletProvider(wallet);
      setSelectedWallet(wallet);
      setSiwbStatus("Wallet connected. You can now sign the login request.");
    } catch (error: any) {
      const msg = error?.message || "Unable to connect wallet";
      setSiwbStatus(msg);
      console.error("Failed to connect SIWB wallet:", error);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleBitcoinLogin = async () => {
    if (!selectedWallet) {
      setSiwbStatus("Select a Bitcoin wallet first.");
      return;
    }
    setSiwbStatus(null);
    setIsConnecting("siwb");
    try {
      await loginWithSiwb();
    } catch (error: any) {
      const msg = error?.message || "Bitcoin login failed";
      setSiwbStatus(msg);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleEthereumConnect = async () => {
    if (!selectedEthWallet) {
      setSiweStatus("Select an Ethereum wallet first.");
      return;
    }
    setSiweStatus(null);
    setIsConnecting("siwe");
    try {
      const address = await siwe.connectWallet(selectedEthWallet);
      setSiweStatus(`Wallet ready: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error: any) {
      const msg = error?.message || "Unable to connect wallet";
      setSiweStatus(msg);
      console.error("Failed to connect SIWE wallet:", error);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleEthereumLogin = async () => {
    if (!selectedEthWallet) {
      setSiweStatus("Select an Ethereum wallet first.");
      return;
    }
    setSiweStatus(null);
    setIsConnecting("siwe");
    try {
      await loginWithSiwe();
    } catch (error: any) {
      const msg = error?.message || "Ethereum login failed";
      setSiweStatus(msg);
    } finally {
      setIsConnecting(null);
    }
  };

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
                        {authMethod === 'plug'
                          ? 'Plug Wallet'
                          : authMethod === 'internetIdentity'
                          ? 'Internet Identity'
                          : authMethod === 'siwb'
                          ? 'Bitcoin Wallet'
                          : 'Ethereum Wallet'}{' '}
                        Connected
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {principal.toString().slice(0, 8)}...{principal.toString().slice(-8)}
                      </p>
                      {authMethod === 'siwb' && siwb.identityAddress && (
                        <p className="text-xs text-muted-foreground font-mono">
                          BTC · {siwb.identityAddress.slice(0, 6)}...{siwb.identityAddress.slice(-4)}
                        </p>
                      )}
                      {authMethod === 'siwe' && siwe.identityAddress && (
                        <p className="text-xs text-muted-foreground font-mono">
                          ETH · {siwe.identityAddress.slice(0, 6)}...{siwe.identityAddress.slice(-4)}
                        </p>
                      )}
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
                  isLoading={isConnecting === option.id}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: `${walletOptions.length * 0.1 + 0.1}s` }}>
            <Card className="glass-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">Sign in with Ethereum</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect an Ethereum wallet that injects <code className="font-mono text-xs">window.ethereum</code> (for example MetaMask, Rabby, Frame, Brave Wallet, or other EIP-1193 compatible wallets) and sign a SIWE request for access.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {ethWalletOptions.map(wallet => (
                  <Button
                    key={wallet.id}
                    variant={selectedEthWallet === wallet.id ? "hero" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedEthWallet(wallet.id);
                      setSiweStatus(null);
                    }}
                    disabled={isConnecting === "siwe"}
                  >
                    {wallet.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {selectedEthWallet
                  ? ethWalletOptions.find(option => option.id === selectedEthWallet)?.description
                  : "Select an Ethereum wallet to continue"}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleEthereumConnect}
                  disabled={isConnecting === "siwe" || siwe.isLoggingIn}
                  variant="outline"
                  className="flex-1"
                >
                  {isConnecting === "siwe" ? "Connecting..." : "Connect Ethereum Wallet"}
                </Button>
                <Button
                  onClick={handleEthereumLogin}
                  disabled={isConnecting === "siwe" || siwe.isLoggingIn}
                  className="flex-1"
                >
                  {siwe.isLoggingIn ? "Awaiting signature..." : "Sign in with Ethereum"}
                </Button>
              </div>

              {siweStatus && <p className="text-xs text-red-400 mt-3">{siweStatus}</p>}
              {siwe.identityAddress && (
                <p className="text-xs text-muted-foreground mt-3 font-mono">
                  Active ETH address: {siwe.identityAddress.slice(0, 8)}...{siwe.identityAddress.slice(-6)}
                </p>
              )}
            </Card>
          </div>

          <div className="mt-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: `${walletOptions.length * 0.1 + 0.2}s` }}>
            <Card className="glass-card p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">Sign in with Bitcoin</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect a LaserEyes-compatible wallet and sign a Sign-In with Bitcoin (SIWB) request to access the dashboard.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {btcWalletOptions.map((wallet) => (
                  <Button
                    key={wallet.id}
                    variant={selectedWallet === wallet.id ? "hero" : "outline"}
                    size="sm"
                    onClick={() => handleBitcoinWalletSelect(wallet.id)}
                    disabled={isConnecting === "siwb"}
                  >
                    {wallet.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {selectedWallet
                  ? btcWalletOptions.find((w) => w.id === selectedWallet)?.description
                  : "Select a wallet to continue"}
              </p>

              <Button
                onClick={handleBitcoinLogin}
                disabled={isConnecting === "siwb" || siwb.isLoggingIn}
                className="w-full"
              >
                {isConnecting === "siwb" || siwb.isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    {siwb.isLoggingIn ? "Awaiting signature..." : "Preparing..."}
                  </>
                ) : (
                  <>
                    Connect Bitcoin Wallet
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {siwbStatus && (
                <p className="text-xs text-red-400 mt-3">{siwbStatus}</p>
              )}
              {siwb.identityAddress && (
                <p className="text-xs text-muted-foreground mt-3 font-mono">
                  Active BTC address: {siwb.identityAddress.slice(0, 8)}...{siwb.identityAddress.slice(-6)}
                </p>
              )}
            </Card>
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
