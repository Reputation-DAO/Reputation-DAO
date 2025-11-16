/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode, useEffect, useRef, useState } from 'react';
import { DelegationIdentity, Ed25519KeyIdentity } from '@dfinity/identity';
import type { ActorConfig, HttpAgentOptions } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';

import type { EthereumWalletKey, SiweIdentityContextType } from './context.type';
import { getAddress } from 'ethers';
import type {
  LoginOkResponse,
  PrepareLoginOkResponse,
  SIWE_IDENTITY_SERVICE,
  SignedDelegation as ServiceSignedDelegation,
} from './service.interface';
import type { State } from './state.type';
import { createDelegationChain } from './delegation';
import { normalizeError } from './error';
import { clearIdentity, loadConnectedAddress, loadIdentity, saveConnectedAddress, saveIdentity } from './local-storage';
import { callGetDelegation, callLogin, callPrepareLogin, createAnonymousActor } from './siwe-provider';

export * from './context.type';
export * from './service.interface';
export * from './storage.type';

export const SiweIdentityContext = createContext<SiweIdentityContextType | undefined>(undefined);

export const useSiweIdentity = () => {
  const context = useContext(SiweIdentityContext);
  if (!context) {
    throw new Error('useSiweIdentity must be used within a SiweIdentityProvider');
  }
  return context;
};

type InjectedEthereum = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  providers?: InjectedEthereum[];
  isMetaMask?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
};

const walletFlagMap: Record<EthereumWalletKey, keyof InjectedEthereum | null> = {
  metamask: 'isMetaMask',
  rabby: 'isRabby',
  brave: 'isBraveWallet',
  coinbase: 'isCoinbaseWallet',
  other: null,
};

function matchesPreferred(provider: InjectedEthereum, walletKey?: EthereumWalletKey) {
  if (!walletKey) return false;
  const flag = walletFlagMap[walletKey];
  if (!flag) return false;
  return Boolean(provider[flag]);
}

function selectInjectedProvider(source?: InjectedEthereum, preferred?: EthereumWalletKey): InjectedEthereum | undefined {
  if (!source) return undefined;
  if (Array.isArray(source.providers) && source.providers.length > 0) {
    if (preferred) {
      const match = source.providers.find(provider => provider && matchesPreferred(provider, preferred));
      if (match) {
        return match;
      }
    }
    const priorityFlags: (keyof InjectedEthereum)[] = ['isMetaMask', 'isRabby', 'isBraveWallet', 'isCoinbaseWallet'];
    for (const flag of priorityFlags) {
      const match = source.providers.find(provider => provider && provider[flag]);
      if (match) {
        return match;
      }
    }
    return source.providers[0];
  }
  return source;
}

function getInjectedEthereumProvider(preferred?: EthereumWalletKey): InjectedEthereum | undefined {
  if (typeof window === 'undefined') return undefined;
  const { ethereum } = window as typeof window & { ethereum?: InjectedEthereum };
  return selectInjectedProvider(ethereum, preferred);
}

async function detectEthereumProvider(preferred?: EthereumWalletKey, timeout = 3000): Promise<InjectedEthereum | undefined> {
  const current = getInjectedEthereumProvider(preferred);
  if (current) return current;
  if (typeof window === 'undefined') return undefined;

  return await new Promise(resolve => {
    let handled = false;
    const handle = () => {
      if (handled) return;
      handled = true;
      resolve(getInjectedEthereumProvider(preferred));
    };

    window.addEventListener('ethereum#initialized', handle as EventListener, { once: true });
    setTimeout(() => {
      window.removeEventListener('ethereum#initialized', handle as EventListener);
      handle();
    }, timeout);
  });
}

function normalizeAddress(address?: string | null) {
  if (!address) return undefined;
  try {
    return getAddress(address);
  } catch {
    return undefined;
  }
}

export function SiweIdentityProvider<T extends SIWE_IDENTITY_SERVICE>({
  idlFactory,
  canisterId,
  children,
  httpAgentOptions,
  actorOptions,
}: {
  idlFactory: IDL.InterfaceFactory;
  canisterId: string;
  httpAgentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
  children: ReactNode;
}) {
  const [state, setState] = useState<State>({
    isInitializing: true,
    prepareLoginStatus: 'idle',
    loginStatus: 'idle',
    signMessageStatus: 'idle',
    signMessageError: null,
  });

  function updateState(newState: Partial<State>) {
    setState(prev => ({
      ...prev,
      ...newState,
    }));
  }

  const loginPromiseHandlers = useRef<{
    resolve: (value: DelegationIdentity | PromiseLike<DelegationIdentity>) => void;
    reject: (reason?: Error) => void;
  } | null>(null);

  const requestSiweMessage = async (address: string): Promise<PrepareLoginOkResponse> => {
    const checksumAddress = getAddress(address);
    if (!state.anonymousActor) {
      throw new Error('SIWE provider is not initialized yet.');
    }

    updateState({
      prepareLoginStatus: 'preparing',
      prepareLoginError: undefined,
    });

    try {
      const response = await callPrepareLogin(state.anonymousActor, checksumAddress);
      updateState({
        siweMessage: response.siwe_message,
        nonce: response.nonce,
        prepareLoginStatus: 'success',
      });
      return response;
    } catch (error) {
      const normalized = normalizeError(error);
      updateState({
        prepareLoginStatus: 'error',
        prepareLoginError: normalized,
      });
      throw normalized;
    }
  };

async function connectWallet(walletKey?: EthereumWalletKey): Promise<string> {
  const provider = await detectEthereumProvider(walletKey);
  if (!provider?.request) {
    throw new Error('No Ethereum provider detected. Install MetaMask or a compatible wallet.');
  }
  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet did not return an address.');
  }
  const address = getAddress(accounts[0]!);
  updateState({ connectedEthAddress: address, preferredWallet: walletKey ?? state.preferredWallet });
  saveConnectedAddress(address);
  return address;
}

  async function prepareLogin() {
    const address =
      state.connectedEthAddress ??
      normalizeAddress(loadConnectedAddress()) ??
      (await connectWallet(state.preferredWallet as EthereumWalletKey | undefined));
    await requestSiweMessage(address);
  }

  async function rejectLoginWithError(error: Error | unknown, message?: string) {
    const normalized = normalizeError(error);
    const errorMessage = message || normalized.message;

    console.error(normalized);

    updateState({
      loginStatus: 'error',
      loginError: new Error(errorMessage),
      signMessageStatus: 'error',
      signMessageError: normalized,
      siweMessage: undefined,
      nonce: undefined,
    });

    loginPromiseHandlers.current?.reject(new Error(errorMessage));
  }

  async function login() {
    const promise = new Promise<DelegationIdentity>((resolve, reject) => {
      loginPromiseHandlers.current = { resolve, reject };
    });

    if (!state.anonymousActor) {
      rejectLoginWithError(new Error('SIWE provider is not initialized.'));
      return promise;
    }

    let address = state.connectedEthAddress ?? normalizeAddress(loadConnectedAddress());
    try {
      if (!address) {
        address = await connectWallet(state.preferredWallet as EthereumWalletKey | undefined);
      }
    } catch (error) {
      rejectLoginWithError(error);
      return promise;
    }

    updateState({
      loginStatus: 'logging-in',
      loginError: undefined,
    });

    let message = state.siweMessage;
    let nonce = state.nonce;
    const checksumAddress = getAddress(address!);
    try {
      if (!message || !nonce) {
        const response = await requestSiweMessage(checksumAddress);
        message = response.siwe_message;
        nonce = response.nonce;
      }
    } catch (error) {
      rejectLoginWithError(error);
      return promise;
    }

    const provider = await detectEthereumProvider(state.preferredWallet as EthereumWalletKey | undefined);
    if (!provider?.request) {
      rejectLoginWithError(new Error('No Ethereum provider available.'));
      return promise;
    }

    updateState({
      signMessageStatus: 'pending',
      signMessageError: null,
    });

    let signature: string;
    try {
      signature = (await provider.request({
        method: 'personal_sign',
        params: [message, checksumAddress],
      })) as string;
      if (!signature) {
        throw new Error('Wallet returned no signature.');
      }
      updateState({ signMessageStatus: 'success' });
    } catch (error) {
      updateState({ signMessageStatus: 'error', signMessageError: normalizeError(error) });
      rejectLoginWithError(error, 'An error occurred while signing the SIWE message.');
      return promise;
    }

    const sessionIdentity = Ed25519KeyIdentity.generate();
    const sessionPublicKey = sessionIdentity.getPublicKey().toDer();

    let loginResponse: LoginOkResponse;
    let signedDelegation: ServiceSignedDelegation;
    try {
      loginResponse = await callLogin(state.anonymousActor, signature, checksumAddress, sessionPublicKey, nonce!);
      signedDelegation = await callGetDelegation(state.anonymousActor, checksumAddress, sessionPublicKey, loginResponse.expiration);
    } catch (error) {
      rejectLoginWithError(error, 'Unable to complete SIWE login.');
      return promise;
    }

    const delegationChain = createDelegationChain(signedDelegation, loginResponse.user_canister_pubkey);
    const identity = DelegationIdentity.fromDelegation(sessionIdentity, delegationChain);

    saveIdentity(checksumAddress, sessionIdentity, delegationChain);
    saveConnectedAddress(checksumAddress);

    updateState({
      loginStatus: 'success',
      identity,
      identityAddress: checksumAddress,
      delegationChain,
      signMessageStatus: 'idle',
      signMessageError: null,
      siweMessage: undefined,
      nonce: undefined,
    });

    loginPromiseHandlers.current?.resolve(identity);

    return promise;
  }

  function clear() {
    updateState({
      isInitializing: false,
      prepareLoginStatus: 'idle',
      prepareLoginError: undefined,
      loginStatus: 'idle',
      loginError: undefined,
      signMessageStatus: 'idle',
      signMessageError: null,
      siweMessage: undefined,
      nonce: undefined,
      identity: undefined,
      identityAddress: undefined,
      delegationChain: undefined,
      preferredWallet: undefined,
    });
    clearIdentity();
    saveConnectedAddress(undefined);
  }

  useEffect(() => {
    const addressFromStorage = normalizeAddress(loadConnectedAddress());
    if (addressFromStorage) {
      updateState({ connectedEthAddress: addressFromStorage });
    }
    try {
      const [address, identity, delegationChain] = loadIdentity();
      const normalizedAddress = normalizeAddress(address) ?? address;
      updateState({
        identity,
        identityAddress: normalizedAddress,
        delegationChain,
      });
    } catch (error) {
      if (error instanceof Error && error.message !== 'No stored identity found.') {
        console.warn('Unable to restore SIWE identity from storage:', error.message);
      }
    } finally {
      updateState({ isInitializing: false });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const actor = await createAnonymousActor({ idlFactory, canisterId, httpAgentOptions, actorOptions });
        if (!cancelled) {
          updateState({ anonymousActor: actor });
        }
      } catch (error) {
        console.error('Failed to create SIWE anonymous actor:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actorOptions, canisterId, httpAgentOptions, idlFactory]);

  return (
    <SiweIdentityContext.Provider
      value={{
        isInitializing: state.isInitializing,
        connectWallet,
        connectedEthAddress: state.connectedEthAddress,
        prepareLogin,
        prepareLoginStatus: state.prepareLoginStatus,
        isPreparingLogin: state.prepareLoginStatus === 'preparing',
        isPrepareLoginError: state.prepareLoginStatus === 'error',
        isPrepareLoginSuccess: state.prepareLoginStatus === 'success',
        isPrepareLoginIdle: state.prepareLoginStatus === 'idle',
        prepareLoginError: state.prepareLoginError,
        login,
        loginStatus: state.loginStatus,
        isLoggingIn: state.loginStatus === 'logging-in',
        isLoginError: state.loginStatus === 'error',
        isLoginSuccess: state.loginStatus === 'success',
        isLoginIdle: state.loginStatus === 'idle',
        loginError: state.loginError,
        signMessageStatus: state.signMessageStatus,
        signMessageError: state.signMessageError,
        delegationChain: state.delegationChain,
        identity: state.identity,
        identityAddress: state.identityAddress,
        clear,
      }}
    >
      {children}
    </SiweIdentityContext.Provider>
  );
}
