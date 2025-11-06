import type { ActorSubclass } from '@dfinity/agent';
import { createActor, canisterId } from '@/declarations/blog_backend';
import type { CreatePostPayload, Post, PostSummary, SupabaseRef } from '../lib/blog.types';
import {
  fromCandidPost,
  fromCandidPostSummary,
  fromCandidSupabaseRefs,
  toCandidCreatePayload,
} from '../lib/blog.mappers';

type BlogBackendActor = {
  createPost: (payload: ReturnType<typeof toCandidCreatePayload>) => Promise<any>;
  replacePost: (id: bigint, payload: ReturnType<typeof toCandidCreatePayload>) => Promise<[] | [any]>;
  getPosts: () => Promise<any[]>;
  getPostById: (id: bigint) => Promise<[] | [any]>;
  getAllMediaRefsForPost: (id: bigint) => Promise<[] | [Array<any>]>;
  listLatest: (offset: bigint, limit: bigint) => Promise<any[]>;
  listByTag: (tag: string, offset: bigint, limit: bigint) => Promise<any[]>;
  listFeatured: (limit: bigint) => Promise<any[]>;
  searchByKeyword: (keyword: string, limit: bigint) => Promise<any[]>;
};

let cachedActor: ActorSubclass<BlogBackendActor> | null = null;

export function setBlogBackendActor(actor: ActorSubclass<BlogBackendActor>) {
  cachedActor = actor;
}

async function getActor(): Promise<ActorSubclass<BlogBackendActor>> {
  if (cachedActor) return cachedActor;
  if (!canisterId) {
    throw new Error('blog_backend canister ID is not configured.');
  }
  cachedActor = createActor(canisterId) as unknown as ActorSubclass<BlogBackendActor>;
  return cachedActor;
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
