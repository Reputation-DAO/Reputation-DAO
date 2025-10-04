import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../../src/declarations/blog_backend/blog_backend.did.js';
import type { _SERVICE, Post } from '../../../../src/declarations/blog_backend/blog_backend.did.d.ts';
import { PLUG_HOST } from '../../utils/plug';

const canisterId = 'oy2j4-syaaa-aaaam-qdvxq-cai';

const agent = new HttpAgent({ host: PLUG_HOST });

export const blogActor = Actor.createActor<_SERVICE>(idlFactory, {
  agent,
  canisterId,
});

// Re-export types for easier imports elsewhere
export type { Post };
