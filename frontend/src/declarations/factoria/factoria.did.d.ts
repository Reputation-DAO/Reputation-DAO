import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Child {
  'id' : Principal,
  'status' : Status,
  'owner' : Principal,
  'note' : string,
  'plan' : Plan,
  'created_at' : bigint,
  'visibility' : Visibility,
  'expires_at' : bigint,
}
export type Plan = { 'Basic' : null } |
  { 'Trial' : null };
export type Status = { 'Active' : null } |
  { 'Archived' : null };
export type Visibility = { 'Private' : null } |
  { 'Public' : null };
export interface _SERVICE {
  'activateBasicForChildAfterPayment' : ActorMethod<
    [Principal],
    { 'ok' : string } |
      { 'err' : string }
  >,
  'adminArchiveExpired' : ActorMethod<[bigint], bigint>,
  'adminBackfillPlanDefaults' : ActorMethod<[Plan], string>,
  'adminDrainChild' : ActorMethod<[Principal, bigint], bigint>,
  'adminSetPool' : ActorMethod<[Array<Principal>], string>,
  'adminTreasuryWithdraw' : ActorMethod<
    [Principal, [] | [Uint8Array | number[]], bigint],
    { 'ok' : bigint } |
      { 'err' : string }
  >,
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
  'createBasicForSelf' : ActorMethod<[string], Principal>,
  'createChildForOwner' : ActorMethod<
    [Principal, bigint, Array<Principal>, string],
    Principal
  >,
  'createOrReuseChildFor' : ActorMethod<
    [Principal, bigint, Array<Principal>, string],
    Principal
  >,
  'createTrialForSelf' : ActorMethod<
    [string],
    { 'ok' : Principal } |
      { 'err' : string }
  >,
  'deleteChild' : ActorMethod<[Principal], string>,
  'forceAddOwnerIndex' : ActorMethod<[Principal, Principal], string>,
  'getAdmin' : ActorMethod<[], Principal>,
  'getBasicPayInfoForChild' : ActorMethod<
    [Principal],
    {
      'account_owner' : Principal,
      'subaccount' : Uint8Array | number[],
      'amount_e8s' : bigint,
    }
  >,
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
  'toggleVisibility' : ActorMethod<[Principal], Visibility>,
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
