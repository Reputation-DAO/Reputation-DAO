import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Author {
  'bio' : [] | [string],
  'title' : [] | [string],
  'name' : string,
  'links' : Array<SocialLink>,
  'avatar' : string,
}
export type ContentBlock = {
    'Embed' : {
      'url' : string,
      'title' : [] | [string],
      'provider' : [] | [string],
    }
  } |
  { 'Callout' : { 'title' : string, 'body' : string, 'tone' : Tone } } |
  { 'Code' : { 'code' : string, 'language' : string } } |
  {
    'Heading' : { 'text' : string, 'anchor' : [] | [string], 'level' : number }
  } |
  { 'List' : { 'ordered' : boolean, 'items' : Array<string> } } |
  { 'Divider' : null } |
  { 'Image' : { 'asset' : MediaAsset, 'fullWidth' : boolean } } |
  { 'Paragraph' : { 'text' : string } } |
  { 'Quote' : { 'text' : string, 'attribution' : [] | [string] } };
export interface CreatePostPayload {
  'seo' : [] | [SeoMeta],
  'flags' : [] | [FeatureFlags],
  'status' : PostStatus,
  'title' : string,
  'content' : Array<ContentBlock>,
  'hero' : [] | [HeroSettings],
  'slug' : string,
  'tags' : Array<string>,
  'related' : Array<bigint>,
  'author' : Author,
  'excerpt' : string,
  'scheduledFor' : [] | [bigint],
  'category' : string,
  'subtitle' : [] | [string],
  'gallery' : Array<MediaAsset>,
}
export interface FeatureFlags {
  'featured' : boolean,
  'heroLayout' : string,
  'editorsPick' : boolean,
  'allowComments' : boolean,
}
export interface HeroSettings {
  'media' : MediaAsset,
  'accentColor' : [] | [string],
  'overlayTitle' : [] | [string],
  'ctaUrl' : [] | [string],
  'ctaLabel' : [] | [string],
  'overlaySubtitle' : [] | [string],
}
export interface MediaAsset {
  'alt' : string,
  'ref' : SupabaseRef,
  'credit' : [] | [string],
  'caption' : [] | [string],
  'aspectRatio' : [] | [string],
}
export interface Metrics {
  'shares' : bigint,
  'views' : bigint,
  'likes' : bigint,
}
export interface Post {
  'id' : bigint,
  'seo' : SeoMeta,
  'flags' : FeatureFlags,
  'status' : PostStatus,
  'title' : string,
  'content' : Array<ContentBlock>,
  'readingMinutes' : bigint,
  'metrics' : Metrics,
  'hero' : [] | [HeroSettings],
  'createdAt' : bigint,
  'slug' : string,
  'tags' : Array<string>,
  'publishedAt' : [] | [bigint],
  'related' : Array<bigint>,
  'author' : Author,
  'updatedAt' : bigint,
  'excerpt' : string,
  'scheduledFor' : [] | [bigint],
  'category' : string,
  'subtitle' : [] | [string],
  'gallery' : Array<MediaAsset>,
}
export type PostStatus = { 'Draft' : null } |
  { 'Scheduled' : null } |
  { 'Archived' : null } |
  { 'Published' : null };
export interface PostSummary {
  'id' : bigint,
  'flags' : FeatureFlags,
  'status' : PostStatus,
  'title' : string,
  'readingMinutes' : bigint,
  'metrics' : Metrics,
  'hero' : [] | [HeroSettings],
  'createdAt' : bigint,
  'slug' : string,
  'tags' : Array<string>,
  'publishedAt' : [] | [bigint],
  'author' : Author,
  'updatedAt' : bigint,
  'excerpt' : string,
  'category' : string,
  'subtitle' : [] | [string],
}
export interface ReplacePostPayload {
  'seo' : [] | [SeoMeta],
  'flags' : [] | [FeatureFlags],
  'status' : PostStatus,
  'title' : string,
  'content' : Array<ContentBlock>,
  'hero' : [] | [HeroSettings],
  'slug' : string,
  'tags' : Array<string>,
  'related' : Array<bigint>,
  'author' : Author,
  'excerpt' : string,
  'scheduledFor' : [] | [bigint],
  'category' : string,
  'subtitle' : [] | [string],
  'gallery' : Array<MediaAsset>,
}
export interface SeoMeta {
  'title' : [] | [string],
  'twitterCard' : [] | [string],
  'description' : [] | [string],
  'keywords' : Array<string>,
  'ogImage' : [] | [MediaAsset],
  'canonicalUrl' : [] | [string],
}
export interface SocialLink { 'url' : string, 'text' : string }
export interface SupabaseRef {
  'mime' : [] | [string],
  'path' : string,
  'size' : [] | [bigint],
  'bucket' : string,
}
export type Tone = { 'tip' : null } |
  { 'warning' : null } |
  { 'danger' : null } |
  { 'info' : null } |
  { 'success' : null };
export interface _SERVICE {
  'createPost' : ActorMethod<[CreatePostPayload], Post>,
  'getAllMediaRefsForPost' : ActorMethod<[bigint], [] | [Array<SupabaseRef>]>,
  'getPostById' : ActorMethod<[bigint], [] | [Post]>,
  'getPostBySlug' : ActorMethod<[string], [] | [Post]>,
  'getPosts' : ActorMethod<[], Array<Post>>,
  'listByTag' : ActorMethod<[string, bigint, bigint], Array<PostSummary>>,
  'listFeatured' : ActorMethod<[bigint], Array<PostSummary>>,
  'listLatest' : ActorMethod<[bigint, bigint], Array<PostSummary>>,
  'recordLike' : ActorMethod<[bigint, bigint], [] | [Metrics]>,
  'recordShare' : ActorMethod<[bigint], [] | [Metrics]>,
  'recordView' : ActorMethod<[bigint], [] | [bigint]>,
  'replacePost' : ActorMethod<[bigint, ReplacePostPayload], [] | [Post]>,
  'searchByKeyword' : ActorMethod<[string, bigint], Array<PostSummary>>,
  'updateStatus' : ActorMethod<
    [bigint, PostStatus, [] | [bigint]],
    [] | [Post]
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
