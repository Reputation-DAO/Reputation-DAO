import { createClient } from '@supabase/supabase-js';
import type { MediaAsset, SupabaseRef } from './blog.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? 'blog-assets';
export const PRIVATE_BUCKET = (import.meta.env.VITE_SUPABASE_PRIVATE ?? 'false').toLowerCase() === 'true';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function toPublicUrl(ref: SupabaseRef): string | null {
  const { data } = supabase.storage.from(ref.bucket).getPublicUrl(ref.path);
  return data.publicUrl ?? null;
}

export async function getSignedUrl(ref: SupabaseRef, expiresSec = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, expiresSec);
  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create signed URL');
  }
  return data.signedUrl;
}

export async function uploadObject(bucket: string, path: string, file: File): Promise<{
  path: string;
  size: number;
  mime: string;
}> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined, upsert: true });

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to upload object to Supabase');
  }

  return { path: data.path, size: file.size, mime: file.type || 'application/octet-stream' };
}

export async function moveObject(bucket: string, fromPath: string, toPath: string): Promise<void> {
  if (fromPath === toPath) return;
  const { error } = await supabase.storage.from(bucket).move(fromPath, toPath);
  if (error) {
    throw new Error(error.message);
  }
}

export async function removeObjects(bucket: string, paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    throw new Error(error.message);
  }
}

export function makeMediaAsset(params: {
  bucket: string;
  path: string;
  alt: string;
  size?: number | null;
  mime?: string | null;
  caption?: string | null;
  credit?: string | null;
  aspectRatio?: string | null;
}): MediaAsset {
  const { bucket, path, alt, size = null, mime = null, caption = null, credit = null, aspectRatio = null } = params;
  const ref: SupabaseRef = { bucket, path, size, mime };
  return { ref, alt, caption, credit, aspectRatio };
}
