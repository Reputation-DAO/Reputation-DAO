import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Awarder { 'id' : Principal, 'name' : string }
export interface AwarderBreakdown {
  'total' : bigint,
  'lastAward' : bigint,
  'awarder' : Principal,
}
export interface DecayConfig {
  'minThreshold' : bigint,
  'gracePeriod' : bigint,
  'enabled' : boolean,
  'decayInterval' : bigint,
  'decayRate' : bigint,
}
export interface ReputationChild {
  'acceptOwnership' : ActorMethod<[], string>,
  'addTrustedAwarder' : ActorMethod<[Principal, string], string>,
  'awardRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'awarderStats' : ActorMethod<[Principal], Array<AwarderBreakdown>>,
  'blacklist' : ActorMethod<[Principal, boolean], string>,
  'configureDecay' : ActorMethod<
    [bigint, bigint, bigint, bigint, boolean],
    string
  >,
  'cycles_balance' : ActorMethod<[], bigint>,
  'emitEvent' : ActorMethod<[string, Uint8Array | number[]], string>,
  'findTransactionsByReason' : ActorMethod<
    [string, bigint],
    Array<Transaction>
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
  'getTopUpCount' : ActorMethod<[], bigint>,
  'getTopUpsPaged' : ActorMethod<[bigint, bigint], Array<TopUp>>,
  'getTransactionById' : ActorMethod<[bigint], [] | [Transaction]>,
  'getTransactionCount' : ActorMethod<[], bigint>,
  'getTransactionHistory' : ActorMethod<[], Array<Transaction>>,
  'getTransactionsByUser' : ActorMethod<[Principal], Array<Transaction>>,
  'getTransactionsPaged' : ActorMethod<[bigint, bigint], Array<Transaction>>,
  'getTrustedAwarders' : ActorMethod<[], Array<Awarder>>,
  'getUserDecayInfo' : ActorMethod<[Principal], [] | [UserDecayInfo]>,
  'health' : ActorMethod<
    [],
    {
      'topUpCount' : bigint,
      'decayConfigHash' : bigint,
      'cycles' : bigint,
      'users' : bigint,
      'txCount' : bigint,
      'paused' : boolean,
    }
  >,
  'leaderboard' : ActorMethod<[bigint, bigint], Array<[Principal, bigint]>>,
  'multiAward' : ActorMethod<
    [Array<[Principal, bigint, [] | [string]]>, boolean],
    string
  >,
  'myStats' : ActorMethod<
    [Principal],
    {
      'lifetimeRevoked' : bigint,
      'balance' : bigint,
      'lastActivity' : bigint,
      'lifetimeAwarded' : bigint,
      'totalDecayed' : bigint,
    }
  >,
  'nominateOwner' : ActorMethod<[Principal], string>,
  'orgPulse' : ActorMethod<
    [bigint],
    { 'revokes' : bigint, 'decays' : bigint, 'awards' : bigint }
  >,
  'pause' : ActorMethod<[boolean], string>,
  'previewDecayAmount' : ActorMethod<[Principal], bigint>,
  'processBatchDecay' : ActorMethod<[], string>,
  'removeTrustedAwarder' : ActorMethod<[Principal], string>,
  'resetUser' : ActorMethod<[Principal, [] | [string]], string>,
  'revokeRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'setDailyMintLimit' : ActorMethod<[bigint], string>,
  'setMinCyclesAlert' : ActorMethod<[bigint], string>,
  'setParent' : ActorMethod<[Principal], string>,
  'setPerAwarderDailyLimit' : ActorMethod<[Principal, bigint], string>,
  'snapshotHash' : ActorMethod<[], bigint>,
  'topUp' : ActorMethod<[], bigint>,
  'transferOwnership' : ActorMethod<[Principal], string>,
  'triggerManualDecay' : ActorMethod<[], string>,
  'version' : ActorMethod<[], string>,
  'wallet_receive' : ActorMethod<[], bigint>,
  'withdrawCycles' : ActorMethod<[Principal, bigint], string>,
}
export interface TopUp {
  'id' : bigint,
  'from' : Principal,
  'timestamp' : bigint,
  'amount' : bigint,
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
export interface _SERVICE extends ReputationChild {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
