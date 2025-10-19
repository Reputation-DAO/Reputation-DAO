import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import type { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

const DEFAULT_IDENTITY_PROVIDER = 'https://identity.ic0.app';
const AUTH_CLIENT_OPTS = {
  idleOptions: {
    disableDefaultIdleCallback: true,
  },
};

let authClientPromise: Promise<AuthClient> | null = null;

async function getAuthClient(): Promise<AuthClient> {
  if (!authClientPromise) {
    authClientPromise = AuthClient.create({
      ...AUTH_CLIENT_OPTS,
      identityProvider: import.meta.env.VITE_IDENTITY_PROVIDER ?? DEFAULT_IDENTITY_PROVIDER,
    });
  }
  return authClientPromise;
}

export async function isInternetIdentityAuthenticated(): Promise<boolean> {
  const client = await getAuthClient();
  return client.isAuthenticated();
}

export async function ensureInternetIdentityAuthenticated(): Promise<void> {
  const ok = await isInternetIdentityAuthenticated();
  if (!ok) {
    throw new Error('Not authenticated with Internet Identity.');
  }
}

export async function loginInternetIdentity(options: {
  identityProvider?: string;
  derivationOrigin?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
} = {}): Promise<void> {
  const client = await getAuthClient();
  return new Promise((resolve, reject) => {
    client.login({
      identityProvider: options.identityProvider ?? import.meta.env.VITE_IDENTITY_PROVIDER ?? DEFAULT_IDENTITY_PROVIDER,
      derivationOrigin: options.derivationOrigin,
      onSuccess: () => {
        options.onSuccess?.();
        resolve();
      },
      onError: (err) => {
        options.onError?.(err);
        reject(err);
      },
    });
  });
}

export async function logoutInternetIdentity(): Promise<void> {
  const client = await getAuthClient();
  await client.logout();
}

export async function getInternetIdentityIdentity(): Promise<Identity | null> {
  const client = await getAuthClient();
  return (await client.isAuthenticated()) ? client.getIdentity() : null;
}

export async function getInternetIdentityPrincipal(): Promise<Principal | null> {
  const identity = await getInternetIdentityIdentity();
  return identity ? identity.getPrincipal() : null;
}

function isLocalhost(host: string): boolean {
  const h = host.toLowerCase();
  return h.startsWith('http://127.0.0.1') || h.startsWith('http://localhost');
}

export async function ensureInternetIdentityAgent(options: {
  host: string;
}): Promise<HttpAgent> {
  await ensureInternetIdentityAuthenticated();
  const identity = await getInternetIdentityIdentity();
  if (!identity) {
    throw new Error('Internet Identity identity unavailable.');
  }
  const agent = new HttpAgent({
    host: options.host,
    identity,
  });
  if (isLocalhost(options.host)) {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn('Failed to fetch root key for local replica:', err);
    }
  }
  return agent;
}
