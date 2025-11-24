import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AuditEvent {
  'id' : bigint,
  'ts' : bigint,
  'child' : [] | [Principal],
  'kind' : string,
  'detail' : string,
  'caller' : Principal,
}
export interface BasicPayInfo {
  'account_owner' : Principal,
  'memo' : string,
  'subaccount' : Uint8Array | number[],
  'amount_e8s' : bigint,
}
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
  { 'Trial' : null } |
  { 'BasicPending' : null };
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
  'adminForceArchive' : ActorMethod<[Principal], string>,
  'adminReattachChild' : ActorMethod<
    [
      Principal,
      Principal,
      string,
      Visibility,
      Plan,
      [] | [Status],
      [] | [bigint],
      boolean,
    ],
    string
  >,
  'adminSetPool' : ActorMethod<[Array<Principal>], string>,
  'adminTreasuryWithdraw' : ActorMethod<
    [Principal, [] | [Uint8Array | number[]], bigint],
    { 'ok' : bigint } |
      { 'err' : string }
  >,
  'archiveChild' : ActorMethod<[Principal], string>,
  'auditEventCount' : ActorMethod<[], bigint>,
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
  'createBasicPendingForSelf' : ActorMethod<
    [string],
    { 'cid' : Principal, 'payment' : BasicPayInfo }
  >,
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
  'factoryHealth' : ActorMethod<
    [],
    {
      'admin' : Principal,
      'pool' : bigint,
      'vaultCycles' : bigint,
      'totals' : { 'total' : bigint, 'active' : bigint, 'archived' : bigint },
      'wasmSet' : boolean,
      'treasuryUsage' : { 'cap' : bigint, 'day' : bigint, 'used' : bigint },
      'walletEvents' : bigint,
      'schemaVersion' : bigint,
      'treasury' : [] | [Principal],
    }
  >,
  'getAdmin' : ActorMethod<[], Principal>,
  'getBasicPayInfoForChild' : ActorMethod<[Principal], BasicPayInfo>,
  'getBasicPrice' : ActorMethod<[], bigint>,
  'getChild' : ActorMethod<[Principal], [] | [Child]>,
  'getChildExtended' : ActorMethod<
    [Principal],
    [] | [{ 'child' : Child, 'lastEvent' : [] | [AuditEvent] }]
  >,
  'getTreasuryPrincipal' : ActorMethod<[], [] | [Principal]>,
  'getTreasuryUsage' : ActorMethod<
    [],
    { 'cap' : bigint, 'day' : bigint, 'used' : bigint }
  >,
  'listAuditEvents' : ActorMethod<[bigint, bigint], Array<AuditEvent>>,
  'listByOwner' : ActorMethod<[Principal], Array<Principal>>,
  'listChildren' : ActorMethod<[], Array<Child>>,
  'poolSize' : ActorMethod<[], bigint>,
  'reassignOwner' : ActorMethod<[Principal, Principal], string>,
  'reinstallChild' : ActorMethod<[Principal, Principal, Principal], undefined>,
  'setAdmin' : ActorMethod<[Principal], undefined>,
  'setBasicPrice' : ActorMethod<[bigint], string>,
  'setDefaultChildWasm' : ActorMethod<[Uint8Array | number[]], undefined>,
  'setTreasuryPrincipal' : ActorMethod<[[] | [Principal]], string>,
  'startChild' : ActorMethod<[Principal], undefined>,
  'stopChild' : ActorMethod<[Principal], undefined>,
  'syncTreasuryForChild' : ActorMethod<[Principal, boolean], string>,
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
