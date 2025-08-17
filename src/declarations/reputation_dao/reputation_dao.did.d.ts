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
export type OrgID = string;
export interface OrgStats {
  'admin' : Principal,
  'totalPoints' : bigint,
  'awarderCount' : bigint,
  'userCount' : bigint,
  'totalTransactions' : bigint,
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
  'addOrgTrustedAwarder' : ActorMethod<[OrgID, Principal, string], string>,
  'addTrustedAwarder' : ActorMethod<[OrgID, Principal, string], string>,
  'applyDecayToSpecificUser' : ActorMethod<[Principal], string>,
  'autoAwardRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'autoRevokeRep' : ActorMethod<[Principal, bigint, [] | [string]], string>,
  'awardOrgRep' : ActorMethod<
    [OrgID, Principal, bigint, [] | [string]],
    string
  >,
  'awardRep' : ActorMethod<[OrgID, Principal, bigint, [] | [string]], string>,
  'configureDecay' : ActorMethod<
    [bigint, bigint, bigint, bigint, boolean],
    string
  >,
  'getAllOrgs' : ActorMethod<[], Array<OrgID>>,
  'getBalance' : ActorMethod<[OrgID, Principal], [] | [bigint]>,
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
  'getMyBalance' : ActorMethod<[], [] | [bigint]>,
  'getMyOrgTransactions' : ActorMethod<[], [] | [Array<Transaction>]>,
  'getMyOrganization' : ActorMethod<[], [] | [string]>,
  'getMyTransactionsByUser' : ActorMethod<
    [Principal],
    [] | [Array<Transaction>]
  >,
  'getOrgAdmin' : ActorMethod<[OrgID], [] | [Principal]>,
  'getOrgBalance' : ActorMethod<[OrgID, Principal], [] | [bigint]>,
  'getOrgStats' : ActorMethod<[OrgID], [] | [OrgStats]>,
  'getOrgTransactions' : ActorMethod<[OrgID], [] | [Array<Transaction>]>,
  'getOrgTrustedAwarders' : ActorMethod<[OrgID], [] | [Array<Awarder>]>,
  'getRawBalance' : ActorMethod<[Principal], bigint>,
  'getTransactionById' : ActorMethod<[OrgID, bigint], [] | [Transaction]>,
  'getTransactionCount' : ActorMethod<[OrgID], [] | [bigint]>,
  'getTransactionHistory' : ActorMethod<[OrgID], [] | [Array<Transaction>]>,
  'getTransactionsByUser' : ActorMethod<
    [OrgID, Principal],
    [] | [Array<Transaction>]
  >,
  'getTrustedAwarders' : ActorMethod<[OrgID], [] | [Array<Awarder>]>,
  'getUserDecayInfo' : ActorMethod<[Principal], [] | [UserDecayInfo]>,
  'isMyOrgAdmin' : ActorMethod<[], boolean>,
  'isOrgTrustedAwarderQuery' : ActorMethod<[OrgID, Principal], [] | [boolean]>,
  'previewDecayAmount' : ActorMethod<[Principal], bigint>,
  'processBatchDecay' : ActorMethod<[], string>,
  'registerOrg' : ActorMethod<[OrgID], string>,
  'removeTrustedAwarder' : ActorMethod<[OrgID, Principal], string>,
  'revokeOrgRep' : ActorMethod<
    [OrgID, Principal, bigint, [] | [string]],
    string
  >,
  'revokeRep' : ActorMethod<[OrgID, Principal, bigint, [] | [string]], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
