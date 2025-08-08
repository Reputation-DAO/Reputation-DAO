import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Awarder { 'id' : Principal, 'name' : string }
export interface DecayConfig {
  'minThreshold' : bigint,
  'gracePeriod' : bigint,
  'enabled' : boolean,
  'decayInterval' : bigint,
  'decayRate' : bigint,
}
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
  { 'Decay' : null } |
  { 'Award' : null };
export interface UserDecayInfo {
  'lastActivityTime' : bigint,
  'totalDecayed' : bigint,
  'lastDecayTime' : bigint,
  'registrationTime' : bigint,
}
export interface _SERVICE {
  'addTrustedAwarder' : ActorMethod<[Principal, string], string>,
  'applyDecayToSpecificUser' : ActorMethod<[Principal], string>,
  'awardRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'configureDecay' : ActorMethod<
    [bigint, bigint, bigint, bigint, boolean],
    string
  >,
  'getBalance' : ActorMethod<[Principal], bigint>,
  'getBalanceWithDetails' : ActorMethod<
    [Principal],
    {
      'rawBalance' : bigint,
      'currentBalance' : bigint,
      'pendingDecay' : bigint,
      'decayInfo' : [] | [UserDecayInfo],
    }
  >,
  'getDecayConfig' : ActorMethod<[], DecayConfig>,
  'getDecayStatistics' : ActorMethod<
    [],
    {
      'lastGlobalDecayProcess' : bigint,
      'configEnabled' : boolean,
      'totalDecayedPoints' : bigint,
    }
  >,
  'getRawBalance' : ActorMethod<[Principal], bigint>,
  'getTransactionById' : ActorMethod<[bigint], [] | [Transaction]>,
  'getTransactionCount' : ActorMethod<[], bigint>,
  'getTransactionHistory' : ActorMethod<[], Array<Transaction>>,
  'getTransactionsByUser' : ActorMethod<[Principal], Array<Transaction>>,
  'getTrustedAwarders' : ActorMethod<[], Array<Awarder>>,
  'getUserDecayInfo' : ActorMethod<[Principal], [] | [UserDecayInfo]>,
  'previewDecayAmount' : ActorMethod<[Principal], bigint>,
  'processBatchDecay' : ActorMethod<[], string>,
  'removeTrustedAwarder' : ActorMethod<[Principal], string>,
  'revokeRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
