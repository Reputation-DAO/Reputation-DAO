// frontend/src/canister/factoria.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../../src/declarations/factoria/factoria.did.js';
import type { _SERVICE } from '../../../../src/declarations/factoria/factoria.did.d.ts';

// If your declarations live elsewhere, adjust the two imports above accordingly.
// From `frontend/src/canister` to project-root `src/declarations/...` is typically ../../../

// -- Canister ID from Vite env (required) --------------------------------------
const FACTORIA_CANISTER_ID = import.meta.env.VITE_FACTORIA_CANISTER_ID as string | undefined;
if (!FACTORIA_CANISTER_ID) {
  throw new Error(
    'VITE_FACTORIA_CANISTER_ID is not set. Add it to your .env (or .env.local), e.g.\n' +
    'VITE_FACTORIA_CANISTER_ID=aaaaa-aa'
  );
}
const DEFAULT_HOST = 'https://icp-api.io'; // or 'https://ic0.app'

// Build an actor with either a provided agent or a new HttpAgent.
export async function makeFactoriaActor(opts?: {
  agent?: HttpAgent;
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const host = opts?.host ?? DEFAULT_HOST;
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;

  const agent =
    opts?.agent ??
    new HttpAgent({
      host,
    });

  // Local dev: fetchRootKey only if talking to local replica
  const lowerHost = host.toLowerCase();
  const isLocal =
    lowerHost.startsWith('http://127.0.0.1') ||
    lowerHost.startsWith('http://localhost');

  if (!opts?.agent && isLocal) {
    try {
      await agent.fetchRootKey();
    } catch {
      // replica might not be running; ignore
    }
  }

  return Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId,
  });
}

/**
 * Build a Factoria actor using Plug’s agent.
 * Ensures Plug is connected and an agent exists, then reuses that agent.
 */
export async function makeFactoriaWithPlug(opts?: {
  host?: string;
  canisterId?: string;
}): Promise<_SERVICE> {
  const canisterId = opts?.canisterId ?? FACTORIA_CANISTER_ID!;
  const host = opts?.host ?? DEFAULT_HOST;

  // Basic runtime checks
  if (!window.ic?.plug) {
    throw new Error('Plug extension not found. Please install/enable Plug.');
  }

  // 1) Ensure connected (idempotent)
  const connected = await window.ic.plug.isConnected?.();
  if (!connected) {
    const ok = await window.ic.plug.requestConnect?.({
      whitelist: [canisterId],
      host,
    });
    if (!ok) throw new Error('User rejected Plug connection.');
  }

  // 2) Ensure agent exists (idempotent)
  if (!window.ic.plug.agent) {
    await window.ic.plug.createAgent?.({ whitelist: [canisterId], host });
  }

  const agent = window.ic.plug.agent as HttpAgent;
  return Actor.createActor<_SERVICE>(idlFactory, { agent, canisterId });
}

/** Convenience getter if you need to read the configured canister id elsewhere */
export const getFactoriaCanisterId = () => FACTORIA_CANISTER_ID!;

// Optional: if TS complains about window.ic.plug, add these ambient types here or in a global d.ts.
declare global {
  interface Window {
    ic?: {
      plug?: {
        isConnected?: () => Promise<boolean>;
        requestConnect?: (opts: { whitelist?: string[]; host?: string }) => Promise<boolean>;
        createAgent?: (opts: { whitelist?: string[]; host?: string }) => Promise<void>;
        agent?: HttpAgent;
      };
    };
  }
}
export {};
