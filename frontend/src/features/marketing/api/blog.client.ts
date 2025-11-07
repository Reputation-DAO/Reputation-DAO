import { Actor, HttpAgent, type ActorSubclass } from '@dfinity/agent';
import { idlFactory } from '@/declarations/blog_backend/blog_backend.did.js';
import type { _SERVICE as BlogBackendService } from '@/declarations/blog_backend/blog_backend.did.d.ts';
import { blogActor as defaultBlogActor } from '@/lib/canisters';
import type { CreatePostPayload, Post, PostSummary, SupabaseRef } from '../lib/blog.types';
import {
  fromCandidPost,
  fromCandidPostSummary,
  fromCandidSupabaseRefs,
  toCandidCreatePayload,
} from '../lib/blog.mappers';

type BlogBackendActor = ActorSubclass<BlogBackendService>;

export const BLOG_HOST = 'https://icp-api.io';
export const BLOG_BACKEND_CANISTER_ID =
  import.meta.env.VITE_BLOG_BACKEND_CANISTER_ID || 'oy2j4-syaaa-aaaam-qdvxq-cai';

let cachedActor: BlogBackendActor | null = defaultBlogActor as BlogBackendActor | null;

function buildAnonymousActor(): BlogBackendActor {
  const agent = new HttpAgent({ host: BLOG_HOST });
  return Actor.createActor<BlogBackendService>(idlFactory, {
    agent,
    canisterId: BLOG_BACKEND_CANISTER_ID,
  });
}

export function setBlogBackendActor(actor: BlogBackendActor) {
  cachedActor = actor;
}

async function getActor(): Promise<BlogBackendActor> {
  if (!cachedActor) {
    cachedActor = buildAnonymousActor();
  }
  return cachedActor;
}

export function resetBlogBackendActor() {
  cachedActor = buildAnonymousActor();
}

export function configureBlogBackendActor(agent: HttpAgent) {
  const actor = Actor.createActor<BlogBackendService>(idlFactory, {
    agent,
    canisterId: BLOG_BACKEND_CANISTER_ID,
  });
  setBlogBackendActor(actor);
  return actor;
}

export async function createBlogPost(payload: CreatePostPayload): Promise<Post> {
  const actor = await getActor();
  const candid = toCandidCreatePayload(payload);
  const result = await actor.createPost(candid);
  return fromCandidPost(result);
}

export async function replaceBlogPost(id: number, payload: CreatePostPayload): Promise<Post | null> {
  const actor = await getActor();
  const candid = toCandidCreatePayload(payload);
  const response = await actor.replacePost(BigInt(id), candid);
  if (!response.length) return null;
  return fromCandidPost(response[0]);
}

export async function fetchBlogPosts(): Promise<Post[]> {
  const actor = await getActor();
  const posts = await actor.getPosts();
  return posts.map(fromCandidPost);
}

export async function fetchBlogPostById(id: number): Promise<Post | null> {
  const actor = await getActor();
  const response = await actor.getPostById(BigInt(id));
  if (!response.length) return null;
  return fromCandidPost(response[0]);
}

export async function fetchMediaRefsForPost(id: number): Promise<SupabaseRef[] | null> {
  const actor = await getActor();
  const response = await actor.getAllMediaRefsForPost(BigInt(id));
  return fromCandidSupabaseRefs(response);
}

export async function fetchLatestSummaries(offset = 0, limit = 10): Promise<PostSummary[]> {
  const actor = await getActor();
  const summaries = await actor.listLatest(BigInt(offset), BigInt(limit));
  return summaries.map(fromCandidPostSummary);
}

export async function fetchSummariesByTag(tag: string, offset = 0, limit = 10): Promise<PostSummary[]> {
  const actor = await getActor();
  const summaries = await actor.listByTag(tag, BigInt(offset), BigInt(limit));
  return summaries.map(fromCandidPostSummary);
}

export async function fetchFeaturedSummaries(limit = 5): Promise<PostSummary[]> {
  const actor = await getActor();
  const summaries = await actor.listFeatured(BigInt(limit));
  return summaries.map(fromCandidPostSummary);
}

export async function searchSummaries(keyword: string, limit = 10): Promise<PostSummary[]> {
  const actor = await getActor();
  const summaries = await actor.searchByKeyword(keyword, BigInt(limit));
  return summaries.map(fromCandidPostSummary);
}
