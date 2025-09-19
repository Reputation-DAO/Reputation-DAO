import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Child {
  'id' : Principal,
  'status' : Status,
  'owner' : Principal,
  'note' : string,
  'created_at' : bigint,
}
export type Status = { 'Active' : null } |
  { 'Archived' : null };
export interface _SERVICE {
  'adminSetPool' : ActorMethod<[Array<Principal>], string>,
  'archiveChild' : ActorMethod<[Principal], string>,
  'childHealth' : ActorMethod<
    [Principal],
    [] | [
      {
        'topUpCount' : bigint,
        'decayConfigHash' : bigint,
        'cycles' : bigint,
        'users' : bigint,
        'txCount' : bigint,
        'paused' : boolean,
      }
    ]
  >,
  'counts' : ActorMethod<
    [],
    { 'total' : bigint, 'active' : bigint, 'archived' : bigint }
  >,
  'createChildForOwner' : ActorMethod<
    [Principal, bigint, Array<Principal>, string],
    Principal
  >,
  'createOrReuseChildFor' : ActorMethod<
    [Principal, bigint, Array<Principal>, string],
    Principal
  >,
  'deleteChild' : ActorMethod<[Principal], string>,
  'forceAddOwnerIndex' : ActorMethod<[Principal, Principal], string>,
  'getAdmin' : ActorMethod<[], Principal>,
  'getChild' : ActorMethod<[Principal], [] | [Child]>,
  'listByOwner' : ActorMethod<[Principal], Array<Principal>>,
  'listChildren' : ActorMethod<[], Array<Child>>,
  'poolSize' : ActorMethod<[], bigint>,
  'reassignOwner' : ActorMethod<[Principal, Principal], string>,
  'reinstallChild' : ActorMethod<[Principal, Principal, Principal], undefined>,
  'setAdmin' : ActorMethod<[Principal], undefined>,
  'setDefaultChildWasm' : ActorMethod<[Uint8Array | number[]], undefined>,
  'startChild' : ActorMethod<[Principal], undefined>,
  'stopChild' : ActorMethod<[Principal], undefined>,
  'topUpChild' : ActorMethod<
    [Principal, bigint],
    { 'ok' : bigint } |
      { 'err' : string }
  >,
  'upgradeChild' : ActorMethod<[Principal], undefined>,
  'wallet_receive' : ActorMethod<[], bigint>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
