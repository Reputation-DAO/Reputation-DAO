import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Author { 'name' : string, 'avatar' : string }
export interface Post {
  'id' : bigint,
  'status' : PostStatus,
  'title' : string,
  'content' : string,
  'views' : bigint,
  'date' : bigint,
  'author' : Author,
  'isEditorsPick' : boolean,
  'isFeatured' : boolean,
  'category' : string,
  'image' : string,
}
export type PostStatus = { 'Draft' : null } |
  { 'Archived' : null } |
  { 'Published' : null };
export interface _SERVICE {
  'createPost' : ActorMethod<
    [
      string,
      string,
      string,
      bigint,
      Author,
      string,
      boolean,
      boolean,
      PostStatus,
    ],
    Post
  >,
  'deletePost' : ActorMethod<[bigint], boolean>,
  'getPostById' : ActorMethod<[bigint], [] | [Post]>,
  'getPosts' : ActorMethod<[], Array<Post>>,
  'updatePost' : ActorMethod<
    [
      bigint,
      string,
      string,
      string,
      bigint,
      Author,
      string,
      boolean,
      boolean,
      bigint,
      PostStatus,
    ],
    [] | [Post]
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
