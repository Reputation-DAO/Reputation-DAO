import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Awarder { 'id' : Principal, 'name' : string }
export interface AwarderBreakdown {
  'total' : bigint,
  'lastAward' : bigint,
  'awarder' : Principal,
}
export interface Badge { 'name' : string, 'rail' : [] | [Rail] }
export interface ComplianceRule {
  'tagWhitelist' : Array<string>,
  'kycRequired' : boolean,
}
export interface DeadManConfig {
  'inactivityThresholdSeconds' : bigint,
  'enabled' : boolean,
}
export interface DecayConfig {
  'minThreshold' : bigint,
  'gracePeriod' : bigint,
  'enabled' : boolean,
  'decayInterval' : bigint,
  'decayRate' : bigint,
}
export interface Event {
  'id' : bigint,
  'kind' : string,
  'timestamp' : bigint,
  'payload' : Uint8Array | number[],
}
export interface MicroTipConfig {
  'maxBtcPerPeriod' : bigint,
  'maxIcpPerPeriod' : bigint,
  'ethTipAmount' : bigint,
  'enabled' : boolean,
  'maxEthPerPeriod' : bigint,
  'maxEventsPerWindow' : bigint,
  'btcTipAmount' : bigint,
  'icpTipAmount' : bigint,
}
export interface OrgConfig {
  'scheduled' : ScheduledPayoutConfig,
  'microTips' : MicroTipConfig,
  'compliance' : ComplianceRule,
  'spendControl' : [] | [SpendControl],
  'deadman' : DeadManConfig,
  'thresholds' : RailThresholds,
  'rails' : RailsEnabled,
}
export type PayoutFrequency = { 'Weekly' : null } |
  { 'Monthly' : null } |
  { 'CustomDays' : bigint };
export type Rail = { 'BTC' : null } |
  { 'ETH' : null } |
  { 'ICP' : null };
export interface RailThresholds {
  'btcMin' : bigint,
  'icpMin' : bigint,
  'ethMin' : bigint,
}
export interface RailsEnabled {
  'btc' : boolean,
  'eth' : boolean,
  'icp' : boolean,
}
export interface ReputationChild {
  'acceptOwnership' : ActorMethod<[], string>,
  'addTrustedAwarder' : ActorMethod<[Principal, string], string>,
  'awardRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'awarderStats' : ActorMethod<[Principal], Array<AwarderBreakdown>>,
  'blacklist' : ActorMethod<[Principal, boolean], string>,
  'blacklistWithReason' : ActorMethod<
    [Principal, boolean, [] | [string]],
    string
  >,
  'configureAutoAwarder' : ActorMethod<[boolean], string>,
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
  'getBlacklistEntry' : ActorMethod<
    [Principal],
    [] | [
      { 'active' : boolean, 'updatedAt' : bigint, 'reason' : [] | [string] }
    ]
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
  'getEventsPaged' : ActorMethod<[bigint, bigint], Array<Event>>,
  'getTierRules' : ActorMethod<[], Array<TierRule>>,
  'getTopUpCount' : ActorMethod<[], bigint>,
  'getTopUpsPaged' : ActorMethod<[bigint, bigint], Array<TopUp>>,
  'getTransactionById' : ActorMethod<[bigint], [] | [Transaction]>,
  'getTransactionCount' : ActorMethod<[], bigint>,
  'getTransactionHistory' : ActorMethod<[], Array<Transaction>>,
  'getTransactionsByUser' : ActorMethod<[Principal], Array<Transaction>>,
  'getTransactionsPaged' : ActorMethod<[bigint, bigint], Array<Transaction>>,
  'getTreasuryLink' : ActorMethod<[], [] | [Principal]>,
  'getTreasuryStats' : ActorMethod<
    [],
    { 'failures' : bigint, 'events' : bigint, 'treasury' : [] | [Principal] }
  >,
  'getTrustedAwarders' : ActorMethod<[], Array<Awarder>>,
  'getUserDecayInfo' : ActorMethod<[Principal], [] | [UserDecayInfo]>,
  'getUserTier' : ActorMethod<[Principal], Tier>,
  'getUsersByTier' : ActorMethod<[], Array<[Principal, Tier]>>,
  'getUsersByTierPaged' : ActorMethod<
    [bigint, bigint],
    Array<[Principal, Tier]>
  >,
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
  'notifyTreasuryDeposit' : ActorMethod<[Rail, bigint, [] | [string]], string>,
  'orgPulse' : ActorMethod<
    [bigint],
    { 'revokes' : bigint, 'decays' : bigint, 'awards' : bigint }
  >,
  'pause' : ActorMethod<[boolean], string>,
  'previewDecayAmount' : ActorMethod<[Principal], bigint>,
  'processBatchDecay' : ActorMethod<[], string>,
  'removeTrustedAwarder' : ActorMethod<[Principal], string>,
  'resetUser' : ActorMethod<[Principal, [] | [string]], string>,
  'returnCyclesToFactory' : ActorMethod<[bigint], bigint>,
  'revokeRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'runTreasuryPayoutCycle' : ActorMethod<[], string>,
  'setDailyMintLimit' : ActorMethod<[bigint], string>,
  'setDecayBatchSize' : ActorMethod<[bigint], string>,
  'setMinCyclesAlert' : ActorMethod<[bigint], string>,
  'setParent' : ActorMethod<[Principal], string>,
  'setPerAwarderDailyLimit' : ActorMethod<[Principal, bigint], string>,
  'setTierRules' : ActorMethod<[Array<TierRule>], string>,
  'setTreasuryBadges' : ActorMethod<[Principal, UserBadges], string>,
  'setTreasuryCompliance' : ActorMethod<[Principal, UserCompliance], string>,
  'setTreasuryLink' : ActorMethod<[[] | [Principal]], string>,
  'setTreasuryRails' : ActorMethod<[RailsEnabled], string>,
  'snapshotHash' : ActorMethod<[], bigint>,
  'syncTreasuryConfig' : ActorMethod<[OrgConfig], string>,
  'topUp' : ActorMethod<[], bigint>,
  'transferOwnership' : ActorMethod<[Principal], string>,
  'triggerManualDecay' : ActorMethod<[], string>,
  'version' : ActorMethod<[], string>,
  'wallet_receive' : ActorMethod<[], bigint>,
  'withdrawCycles' : ActorMethod<[Principal, bigint], string>,
}
export interface ScheduledPayoutConfig {
  'tiers' : Array<TierPayout>,
  'maxIcpPerCycle' : bigint,
  'maxEthPerCycle' : bigint,
  'enabled' : boolean,
  'frequency' : PayoutFrequency,
  'maxBtcPerCycle' : bigint,
}
export interface SpendControl {
  'usdCapE8s' : [] | [bigint],
  'railDailyCaps' : {
    'btc' : [] | [bigint],
    'eth' : [] | [bigint],
    'icp' : [] | [bigint],
  },
}
export type Tier = { 'Gold' : null } |
  { 'Bronze' : null } |
  { 'Custom' : string } |
  { 'Silver' : null };
export interface TierPayout {
  'ethAmount' : bigint,
  'tier' : Tier,
  'btcAmount' : bigint,
  'icpAmount' : bigint,
}
export interface TierRule {
  'maxPoints' : [] | [bigint],
  'tier' : Tier,
  'minPoints' : bigint,
}
export interface TopUp {
  'id' : bigint,
  'from' : [] | [Principal],
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
export type UserBadges = Array<Badge>;
export interface UserCompliance {
  'kycVerified' : boolean,
  'tags' : Array<string>,
}
export interface UserDecayInfo {
  'lastActivityTime' : bigint,
  'totalDecayed' : bigint,
  'lastDecayTime' : bigint,
  'registrationTime' : bigint,
}
export interface _SERVICE extends ReputationChild {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
