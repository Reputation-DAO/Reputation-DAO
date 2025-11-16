import { DelegationChain, DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity';

import type { SiwbIdentityStorage } from './storage.type';

const STORAGE_KEY = 'siwbIdentity';
const STORAGE_ADDRESS_KEY = 'siwbConnectedAddress';

/**
 * Loads the SIWB identity from local storage.
 */
export function loadIdentity() {
  const storedState = localStorage.getItem(STORAGE_KEY);

  if (!storedState) {
    throw new Error('No stored identity found.');
  }

  const s: SiwbIdentityStorage = JSON.parse(storedState);
  if (!s.address || !s.sessionIdentity || !s.delegationChain) {
    throw new Error('Stored state is invalid.');
  }

  const d = DelegationChain.fromJSON(JSON.stringify(s.delegationChain));
  const i = DelegationIdentity.fromDelegation(Ed25519KeyIdentity.fromJSON(JSON.stringify(s.sessionIdentity)), d);

  return [s.address, i, d] as const;
}

/**
 * Saves the SIWB identity to local storage.
 */
export function saveIdentity(address: string, sessionIdentity: Ed25519KeyIdentity, delegationChain: DelegationChain) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      address: address,
      sessionIdentity: sessionIdentity.toJSON(),
      delegationChain: delegationChain.toJSON(),
    }),
  );
}

/**
 * Clears the SIWB identity from local storage.
 */
export function clearIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveConnectedAddress(address?: string) {
  if (address) {
    localStorage.setItem(STORAGE_ADDRESS_KEY, address);
  } else {
    localStorage.removeItem(STORAGE_ADDRESS_KEY);
  }
}

export function loadConnectedAddress(): string | undefined {
  return localStorage.getItem(STORAGE_ADDRESS_KEY) ?? undefined;
}
