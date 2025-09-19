import { createClient } from '@connect2ic/core';
import { Connect2ICProvider } from '@connect2ic/react';
import { PlugWallet } from '@connect2ic/core/providers/plug-wallet';
import { StoicWallet } from '@connect2ic/core/providers/stoic-wallet';
import { InternetIdentity } from '@connect2ic/core/providers/internet-identity';

// Use the same canister ID as in reputationDao.ts
const canisterId = import.meta.env.VITE_REPUTATION_DAO_CANISTER_ID || 'owyeu-jiaaa-aaaam-qdvwq-cai';

const client = createClient({
  providers: [
    new PlugWallet({
      whitelist: [canisterId],
      host: 'https://ic0.app', // Playground network
    }),
    new StoicWallet(),
    new InternetIdentity()
  ],
  globalProviderConfig: {
    host: 'https://ic0.app', // Playground network
  },
});

export { Connect2ICProvider, client };