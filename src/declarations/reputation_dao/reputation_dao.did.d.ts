import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Awarder { 'id' : Principal, 'name' : string }
export interface Transaction {
  'id' : bigint,
  'to' : Principal,
  'transactionType' : TransactionType,
  'from' : Principal,
  'timestamp' : bigint,
  'amount' : bigint,
  'reason' : [] | [string],
}
export type TransactionType = { 'Revoke' : null } |
  { 'Award' : null };
export interface _SERVICE {
  'addTrustedAwarder' : ActorMethod<[Principal, string], string>,
  'awardRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'getBalance' : ActorMethod<[Principal], bigint>,
  'getTransactionById' : ActorMethod<[bigint], [] | [Transaction]>,
  'getTransactionCount' : ActorMethod<[], bigint>,
  'getTransactionHistory' : ActorMethod<[], Array<Transaction>>,
  'getTransactionsByUser' : ActorMethod<[Principal], Array<Transaction>>,
  'getTrustedAwarders' : ActorMethod<[], Array<Awarder>>,
  'removeTrustedAwarder' : ActorMethod<[Principal], string>,
  'revokeRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
