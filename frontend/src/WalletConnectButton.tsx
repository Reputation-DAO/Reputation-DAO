import React from 'react';
import { Button } from '@mui/material';
import { useConnect } from '@connect2ic/react';


const WalletConnectButton: React.FC = () => {
  const { isConnected, connect, disconnect, principal } = useConnect();

  // Prompt user to select a wallet provider
  const handleConnect = () => {
    // For now, default to Plug. You can expand this to a dialog for more options.
    connect('plug');
  };
  const handleDisconnect = () => disconnect();

  return isConnected ? (
    <Button color="inherit" onClick={handleDisconnect}>
      Disconnect ({principal?.toString().slice(0, 8)}...)
    </Button>
  ) : (
    <Button color="inherit" onClick={handleConnect}>
      Connect Wallet
    </Button>
  );
};

export default WalletConnectButton;
