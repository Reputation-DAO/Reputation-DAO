// lib/canisters/factoria.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import type { Identity } from '@dfinity/agent';
import { idlFactory } from '../../declarations/factoria/factoria.did.js';
import type { _SERVICE } from '../../declarations/factoria/factoria.did.d.ts';
import { ensurePlugAgent } from '@/utils/plug';
import { ensureInternetIdentityAgent } from '@/utils/internetIdentity';

// IMPORTANT: this must be the API host, not your asset domain.
const PLUG_HOST =
  import.meta.env.VITE_DFX_NETWORK === 'local'
    ? 'http://127.0.0.1:4943'
    : 'https://icp-api.io';

const FACTORIA_CANISTER_ID =
  import.meta.env.VITE_FACTORIA_CANISTER_ID || 'ttoz7-uaaaa-aaaam-qd34a-cai';
const DEFAULT_HOST = PLUG_HOST;

export async function makeFactoriaActor(opts?: {
  agent?: HttpAgent;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;

  const agent = opts?.agent ?? new HttpAgent({ host });

  const lowerHost = host.toLowerCase();
  const isLocal =
    lowerHost.startsWith('http://127.0.0.1') ||
    lowerHost.startsWith('http://localhost');

  if (!opts?.agent && isLocal) {
    try { await agent.fetchRootKey(); } catch {}
  }

  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export async function makeFactoriaWithPlug(opts?: {
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;
  const host = opts?.host ?? DEFAULT_HOST;

  if (!window.ic?.plug) {
    throw new Error('Plug extension not found. Please install/enable Plug.');
  }

  const agent = await ensurePlugAgent({ host, whitelist: [canisterId] });

  // Only fetch root key on local
  const isLocal =
    host.startsWith('http://127.0.0.1') || host.startsWith('http://localhost');
  if (isLocal) {
    try { await (agent as any)?.fetchRootKey?.(); } catch {}
  }

  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export async function makeFactoriaWithInternetIdentity(opts?: {
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;
  const host = opts?.host ?? DEFAULT_HOST;
  const agent = await ensureInternetIdentityAgent({ host });
  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export async function makeFactoriaWithIdentity(opts: {
  identity: Identity;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const canisterId = opts.canisterId ?? FACTORIA_CANISTER_ID!;
  const host = opts.host ?? DEFAULT_HOST;
  const agent = new HttpAgent({ host, identity: opts.identity });
  if (host.startsWith('http://127.0.0.1') || host.startsWith('http://localhost')) {
    try { await agent.fetchRootKey(); } catch {}
  }
  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

export const getFactoriaCanisterId = () => FACTORIA_CANISTER_ID!;
