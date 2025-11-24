import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Badge { 'name' : string, 'rail' : [] | [Rail] }
export interface ComplianceRule {
  'tagWhitelist' : Array<string>,
  'kycRequired' : boolean,
}
export type ConversionDirection = { 'ToNative' : null } |
  { 'ToChain' : null };
export interface ConversionIntent {
  'id' : bigint,
  'org' : OrgId,
  'status' : ConversionStatus,
  'direction' : ConversionDirection,
  'memo' : [] | [string],
  'createdAt' : bigint,
  'rail' : Rail,
  'user' : UserId,
  'targetAddress' : string,
  'amount' : bigint,
}
export type ConversionStatus = { 'Failed' : { 'reason' : string } } |
  { 'Submitted' : { 'txid' : [] | [string] } } |
  { 'Completed' : { 'txid' : [] | [string] } } |
  { 'Pending' : null };
export interface DeadManConfig {
  'inactivityThresholdSeconds' : bigint,
  'enabled' : boolean,
}
export interface DepositSnapshot {
  'creditedBalance' : bigint,
  'available' : bigint,
  'account' : IcrcAccount,
  'ledgerBalance' : bigint,
}
export interface IcrcAccount {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
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
export interface NativeDeposit {
  'id' : bigint,
  'org' : OrgId,
  'memo' : [] | [string],
  'rail' : Rail,
  'txid' : string,
  'timestamp' : bigint,
  'amount' : bigint,
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
export type OrgId = Principal;
export interface OrgState {
  'child' : OrgId,
  'lastPayoutTimestamp' : bigint,
  'lastActiveTimestamp' : bigint,
  'nextPayoutDue' : bigint,
  'tipEventsInWindow' : bigint,
  'config' : OrgConfig,
  'archived' : boolean,
  'tipWindowStart' : bigint,
}
export interface PayoutEvent {
  'id' : bigint,
  'org' : OrgId,
  'rail' : Rail,
  'error' : [] | [string],
  'recipients' : bigint,
  'totalAmount' : bigint,
  'timestamp' : bigint,
  'success' : boolean,
}
export type PayoutFrequency = { 'Weekly' : null } |
  { 'Monthly' : null } |
  { 'CustomDays' : bigint };
export type Rail = { 'BTC' : null } |
  { 'ETH' : null } |
  { 'ICP' : null };
export interface RailHealth {
  'minBuffer' : bigint,
  'healthy' : boolean,
  'available' : bigint,
}
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
export interface SpendSnapshot {
  'btc' : bigint,
  'day' : bigint,
  'eth' : bigint,
  'icp' : bigint,
  'usdE8s' : bigint,
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
export interface TipEvent {
  'id' : bigint,
  'org' : OrgId,
  'rail' : Rail,
  'user' : UserId,
  'error' : [] | [string],
  'timestamp' : bigint,
  'success' : boolean,
  'amount' : bigint,
}
export type UserBadges = Array<Badge>;
export interface UserCompliance {
  'kycVerified' : boolean,
  'tags' : Array<string>,
}
export type UserId = Principal;
export interface VaultBalance { 'btc' : bigint, 'eth' : bigint, 'icp' : bigint }
export interface _SERVICE {
  'allocateFactoryFunds' : ActorMethod<[OrgId, Rail, bigint], undefined>,
  'checkAllOrgsForDeadman' : ActorMethod<[], undefined>,
  'checkAndArchiveOrg' : ActorMethod<[OrgId], undefined>,
  'configureGovernanceControllers' : ActorMethod<[Array<Principal>], undefined>,
  'forceArchiveOrg' : ActorMethod<[OrgId], undefined>,
  'getConversionIntent' : ActorMethod<[bigint], [] | [ConversionIntent]>,
  'getFactoryVaultBalance' : ActorMethod<[], VaultBalance>,
  'getOrgAdmin' : ActorMethod<[OrgId], [] | [Principal]>,
  'getOrgConfig' : ActorMethod<[OrgId], [] | [OrgConfig]>,
  'getOrgDepositStatus' : ActorMethod<
    [OrgId, Rail],
    { 'ok' : DepositSnapshot } |
      { 'err' : string }
  >,
  'getOrgRails' : ActorMethod<[OrgId], [] | [RailsEnabled]>,
  'getOrgSpendSnapshot' : ActorMethod<[OrgId], SpendSnapshot>,
  'getOrgState' : ActorMethod<[OrgId], [] | [OrgState]>,
  'getOrgVaultBalance' : ActorMethod<[OrgId], VaultBalance>,
  'getRailHealth' : ActorMethod<[OrgId, Rail], [] | [RailHealth]>,
  'getUserBadges' : ActorMethod<[OrgId, UserId], UserBadges>,
  'getUserCompliance' : ActorMethod<[OrgId, UserId], [] | [UserCompliance]>,
  'getUserOrgBalances' : ActorMethod<
    [OrgId, UserId],
    { 'btc' : bigint, 'eth' : bigint, 'icp' : bigint }
  >,
  'isOrgArchived' : ActorMethod<[OrgId], boolean>,
  'listConversionIntents' : ActorMethod<
    [bigint, bigint],
    Array<ConversionIntent>
  >,
  'listNativeDeposits' : ActorMethod<[bigint, bigint], Array<NativeDeposit>>,
  'listPayoutEvents' : ActorMethod<[bigint, bigint], Array<PayoutEvent>>,
  'listRegisteredOrgs' : ActorMethod<[], Array<OrgId>>,
  'listTipEvents' : ActorMethod<[bigint, bigint], Array<TipEvent>>,
  'markConversionCompleted' : ActorMethod<[bigint, [] | [string]], string>,
  'markConversionFailed' : ActorMethod<[bigint, string, boolean], string>,
  'myOrgBalances' : ActorMethod<
    [OrgId],
    { 'btc' : bigint, 'eth' : bigint, 'icp' : bigint }
  >,
  'notifyLedgerDeposit' : ActorMethod<
    [OrgId, Rail, bigint, [] | [string]],
    undefined
  >,
  'recordNativeDeposit' : ActorMethod<
    [OrgId, Rail, bigint, string, [] | [string]],
    bigint
  >,
  'recordOrgDeposit' : ActorMethod<
    [OrgId, Rail, bigint, [] | [string]],
    string
  >,
  'recordOrgHeartbeat' : ActorMethod<[OrgId], undefined>,
  'registerOrg' : ActorMethod<[OrgId, OrgConfig], undefined>,
  'repAwarded' : ActorMethod<[OrgId, UserId, bigint, [] | [string]], undefined>,
  'requestNativeWithdrawal' : ActorMethod<
    [OrgId, UserId, Rail, bigint, string, [] | [string]],
    bigint
  >,
  'resetOrgState' : ActorMethod<[OrgId, OrgConfig, Principal], undefined>,
  'retryConversion' : ActorMethod<[bigint], string>,
  'runDuePayoutCycles' : ActorMethod<[], undefined>,
  'runPayoutCycle' : ActorMethod<[OrgId], undefined>,
  'setAdmin' : ActorMethod<[Principal], undefined>,
  'setFactory' : ActorMethod<[Principal], undefined>,
  'setLedgers' : ActorMethod<[Principal, Principal, Principal], undefined>,
  'setOrgAdmin' : ActorMethod<[OrgId, Principal], undefined>,
  'setOrgRailSubaccount' : ActorMethod<
    [OrgId, Rail, [] | [Uint8Array | number[]]],
    string
  >,
  'setRailMinters' : ActorMethod<
    [[] | [Principal], [] | [Principal]],
    undefined
  >,
  'setRailUsdPrice' : ActorMethod<[Rail, bigint], undefined>,
  'setUserBadges' : ActorMethod<[OrgId, UserId, UserBadges], undefined>,
  'setUserCompliance' : ActorMethod<[OrgId, UserId, UserCompliance], undefined>,
  'submitPendingConversions' : ActorMethod<[bigint], bigint>,
  'updateOrgConfig' : ActorMethod<[OrgId, OrgConfig], undefined>,
  'withdrawMy' : ActorMethod<
    [OrgId, Rail, bigint, string, [] | [string]],
    string
  >,
  'withdrawOrgVault' : ActorMethod<
    [OrgId, Rail, bigint, string, [] | [string]],
    string
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
