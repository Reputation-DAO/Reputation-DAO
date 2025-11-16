import { DelegationChain, DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity';
import type { SiweIdentityStorage } from './storage.type';

const STORAGE_KEY = 'siweIdentity';
const ADDRESS_STORAGE_KEY = 'siweConnectedAddress';

export function loadIdentity() {
  const storedState = localStorage.getItem(STORAGE_KEY);
  if (!storedState) {
    throw new Error('No stored identity found.');
  }

  const parsed: SiweIdentityStorage = JSON.parse(storedState);
  if (!parsed.address || !parsed.sessionIdentity || !parsed.delegationChain) {
    throw new Error('Stored state is invalid.');
  }

  const delegationChain = DelegationChain.fromJSON(JSON.stringify(parsed.delegationChain));
  const identity = DelegationIdentity.fromDelegation(
    Ed25519KeyIdentity.fromJSON(JSON.stringify(parsed.sessionIdentity)),
    delegationChain,
  );

  return [parsed.address, identity, delegationChain] as const;
}

export function saveIdentity(address: string, sessionIdentity: Ed25519KeyIdentity, delegationChain: DelegationChain) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      address,
      sessionIdentity: sessionIdentity.toJSON(),
      delegationChain: delegationChain.toJSON(),
    }),
  );
}

export function clearIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveConnectedAddress(address?: string) {
  if (!address) {
    localStorage.removeItem(ADDRESS_STORAGE_KEY);
    return;
  }
  localStorage.setItem(ADDRESS_STORAGE_KEY, address);
}

export function loadConnectedAddress() {
  return localStorage.getItem(ADDRESS_STORAGE_KEY) || undefined;
}
