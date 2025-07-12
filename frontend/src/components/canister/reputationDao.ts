import { Actor } from '@dfinity/agent';
import { idlFactory } from '../../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

//modify this canisterID based on where the dfx playground hosts your backend
const canisterId = '2uurk-ziaaa-aaaab-qacla-cai';

export const getPlugActor = async () => {
  if (!window.ic?.plug) {
    throw new Error('Plug extension not found');
  }

  // 1. Connect Plug with whitelist
  const connected = await window.ic.plug.requestConnect({
    whitelist: [canisterId],
  });

  if (!connected) {
    throw new Error('User rejected the Plug connection');
  }

  // 2. Create agent with localhost host (required for local replica)
  await window.ic.plug.createAgent({
    host: 'https://ic0.app',
  });

  // 3. Return the actor
  const actor = await window.ic.plug.createActor<_SERVICE>({
    canisterId,
    interfaceFactory: idlFactory,
  });

  return actor;
};
