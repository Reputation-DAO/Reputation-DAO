import { Actor } from '@dfinity/agent';
import { idlFactory } from '../../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

//modify this canisterID based on where the dfx playground hosts your backend
const canisterId = '4r7kv-yiaaa-aaaab-qac5a-cai';

export const getPlugActor = async () => {
  if (!window.ic?.plug) {
    throw new Error('Plug extension not found');
  }

  try {
    // 1. Connect Plug with whitelist
    const connected = await window.ic.plug.requestConnect({
      whitelist: [canisterId],
    });

    if (!connected) {
      throw new Error('User rejected the Plug connection');
    }

    // 2. Create agent with mainnet host
    await window.ic.plug.createAgent({
      host: 'https://icp-api.io',
    });

    // 3. Return the actor
    const actor = (await window.ic.plug.createActor({
      canisterId,
      interfaceFactory: idlFactory,
    })) as _SERVICE;

    return actor;
  } catch (error: any) {
    console.error('Error creating Plug actor:', error);
    throw new Error(`Failed to connect to canister: ${error.message || 'Unknown error'}`);
  }
};
