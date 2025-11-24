import { DelegationChain, DelegationIdentity } from '@dfinity/identity';
import type { LoginStatus, PrepareLoginStatus, SignMessageStatus } from './state.type';

export type EthereumWalletKey = 'metamask' | 'rabby' | 'brave' | 'coinbase' | 'other';

export type SiweIdentityContextType = {
  isInitializing: boolean;
  connectWallet: (walletKey?: EthereumWalletKey) => Promise<string>;
  connectedEthAddress?: string;

  prepareLogin: () => Promise<void>;
  prepareLoginStatus: PrepareLoginStatus;
  isPreparingLogin: boolean;
  isPrepareLoginError: boolean;
  isPrepareLoginSuccess: boolean;
  isPrepareLoginIdle: boolean;
  prepareLoginError?: Error;

  login: () => Promise<DelegationIdentity | undefined>;
  loginStatus: LoginStatus;
  isLoggingIn: boolean;
  isLoginError: boolean;
  isLoginSuccess: boolean;
  isLoginIdle: boolean;
  loginError?: Error;

  signMessageStatus: SignMessageStatus;
  signMessageError: Error | null;

  delegationChain?: DelegationChain;
  identity?: DelegationIdentity;
  identityAddress?: string;

  clear: () => void;
};
