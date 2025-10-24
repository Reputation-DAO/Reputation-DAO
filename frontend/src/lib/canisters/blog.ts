import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../../src/declarations/blog_backend/blog_backend.did.js';
import type { _SERVICE, Post } from '../../../../src/declarations/blog_backend/blog_backend.did.d.ts';

const BLOG_BACKEND_CANISTER_ID = import.meta.env.VITE_BLOG_BACKEND_CANISTER_ID || 'oy2j4-syaaa-aaaam-qdvxq-cai';

const HOST = 
  import.meta.env.VITE_DFX_NETWORK === 'local'
    ? 'http://127.0.0.1:4943'
    : 'https://icp-api.io';

const agent = new HttpAgent({ host: HOST });

export const blogActor = Actor.createActor<_SERVICE>(idlFactory, {
  agent,
  canisterId: BLOG_BACKEND_CANISTER_ID,
});

// Re-export types for easier imports elsewhere
export type { Post };
