import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'addTrustedAwarder' : ActorMethod<[Principal], string>,
  'awardRep' : ActorMethod<[Principal, bigint], string>,
  'getBalance' : ActorMethod<[Principal], bigint>,
  'removeTrustedAwarder' : ActorMethod<[Principal], string>,
  'revokeRep' : ActorMethod<[Principal, bigint], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
