import type { ActorSubclass } from '@dfinity/agent';
import type { DelegationChain, DelegationIdentity } from '@dfinity/identity';
import type { SIWE_IDENTITY_SERVICE } from './service.interface';

export type PrepareLoginStatus = 'error' | 'preparing' | 'success' | 'idle';
export type LoginStatus = 'error' | 'logging-in' | 'success' | 'idle';
export type SignMessageStatus = 'error' | 'idle' | 'pending' | 'success';

export type State = {
  isInitializing: boolean;
  prepareLoginStatus: PrepareLoginStatus;
  prepareLoginError?: Error;
  loginStatus: LoginStatus;
  loginError?: Error;
  signMessageStatus: SignMessageStatus;
  signMessageError: Error | null;
  anonymousActor?: ActorSubclass<SIWE_IDENTITY_SERVICE>;
  siweMessage?: string;
  nonce?: string;
  connectedEthAddress?: string;
  identity?: DelegationIdentity;
  identityAddress?: string;
  delegationChain?: DelegationChain;
  preferredWallet?: string;
};
