import { createClient } from '@connect2ic/core';
import { Connect2ICProvider } from '@connect2ic/react';
import { PlugWallet } from '@connect2ic/core/providers/plug-wallet';
import { StoicWallet } from '@connect2ic/core/providers/stoic-wallet';
import { InternetIdentity } from '@connect2ic/core/providers/internet-identity';

const client = createClient({
  providers: [new PlugWallet(), new StoicWallet(), new InternetIdentity()],
  // Optionally add canisters here
});

export { Connect2ICProvider, client };