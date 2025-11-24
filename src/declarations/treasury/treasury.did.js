export const idlFactory = ({ IDL }) => {
  const OrgId = IDL.Principal;
  const Rail = IDL.Variant({
    'BTC' : IDL.Null,
    'ETH' : IDL.Null,
    'ICP' : IDL.Null,
  });
  const ConversionStatus = IDL.Variant({
    'Failed' : IDL.Record({ 'reason' : IDL.Text }),
    'Submitted' : IDL.Record({ 'txid' : IDL.Opt(IDL.Text) }),
    'Completed' : IDL.Record({ 'txid' : IDL.Opt(IDL.Text) }),
    'Pending' : IDL.Null,
  });
  const ConversionDirection = IDL.Variant({
    'ToNative' : IDL.Null,
    'ToChain' : IDL.Null,
  });
  const UserId = IDL.Principal;
  const ConversionIntent = IDL.Record({
    'id' : IDL.Nat,
    'org' : OrgId,
    'status' : ConversionStatus,
    'direction' : ConversionDirection,
    'memo' : IDL.Opt(IDL.Text),
    'createdAt' : IDL.Nat,
    'rail' : Rail,
    'user' : UserId,
    'targetAddress' : IDL.Text,
    'amount' : IDL.Nat,
  });
  const VaultBalance = IDL.Record({
    'btc' : IDL.Nat,
    'eth' : IDL.Nat,
    'icp' : IDL.Nat,
  });
  const Tier = IDL.Variant({
    'Gold' : IDL.Null,
    'Bronze' : IDL.Null,
    'Custom' : IDL.Text,
    'Silver' : IDL.Null,
  });
  const TierPayout = IDL.Record({
    'ethAmount' : IDL.Nat,
    'tier' : Tier,
    'btcAmount' : IDL.Nat,
    'icpAmount' : IDL.Nat,
  });
  const PayoutFrequency = IDL.Variant({
    'Weekly' : IDL.Null,
    'Monthly' : IDL.Null,
    'CustomDays' : IDL.Nat,
  });
  const ScheduledPayoutConfig = IDL.Record({
    'tiers' : IDL.Vec(TierPayout),
    'maxIcpPerCycle' : IDL.Nat,
    'maxEthPerCycle' : IDL.Nat,
    'enabled' : IDL.Bool,
    'frequency' : PayoutFrequency,
    'maxBtcPerCycle' : IDL.Nat,
  });
  const MicroTipConfig = IDL.Record({
    'maxBtcPerPeriod' : IDL.Nat,
    'maxIcpPerPeriod' : IDL.Nat,
    'ethTipAmount' : IDL.Nat,
    'enabled' : IDL.Bool,
    'maxEthPerPeriod' : IDL.Nat,
    'maxEventsPerWindow' : IDL.Nat,
    'btcTipAmount' : IDL.Nat,
    'icpTipAmount' : IDL.Nat,
  });
  const ComplianceRule = IDL.Record({
    'tagWhitelist' : IDL.Vec(IDL.Text),
    'kycRequired' : IDL.Bool,
  });
  const SpendControl = IDL.Record({
    'usdCapE8s' : IDL.Opt(IDL.Nat),
    'railDailyCaps' : IDL.Record({
      'btc' : IDL.Opt(IDL.Nat),
      'eth' : IDL.Opt(IDL.Nat),
      'icp' : IDL.Opt(IDL.Nat),
    }),
  });
  const DeadManConfig = IDL.Record({
    'inactivityThresholdSeconds' : IDL.Nat,
    'enabled' : IDL.Bool,
  });
  const RailThresholds = IDL.Record({
    'btcMin' : IDL.Nat,
    'icpMin' : IDL.Nat,
    'ethMin' : IDL.Nat,
  });
  const RailsEnabled = IDL.Record({
    'btc' : IDL.Bool,
    'eth' : IDL.Bool,
    'icp' : IDL.Bool,
  });
  const OrgConfig = IDL.Record({
    'scheduled' : ScheduledPayoutConfig,
    'microTips' : MicroTipConfig,
    'compliance' : ComplianceRule,
    'spendControl' : IDL.Opt(SpendControl),
    'deadman' : DeadManConfig,
    'thresholds' : RailThresholds,
    'rails' : RailsEnabled,
  });
  const IcrcAccount = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const DepositSnapshot = IDL.Record({
    'creditedBalance' : IDL.Nat,
    'available' : IDL.Nat,
    'account' : IcrcAccount,
    'ledgerBalance' : IDL.Nat,
  });
  const SpendSnapshot = IDL.Record({
    'btc' : IDL.Nat,
    'day' : IDL.Nat,
    'eth' : IDL.Nat,
    'icp' : IDL.Nat,
    'usdE8s' : IDL.Nat,
  });
  const OrgState = IDL.Record({
    'child' : OrgId,
    'lastPayoutTimestamp' : IDL.Nat,
    'lastActiveTimestamp' : IDL.Nat,
    'nextPayoutDue' : IDL.Nat,
    'tipEventsInWindow' : IDL.Nat,
    'config' : OrgConfig,
    'archived' : IDL.Bool,
    'tipWindowStart' : IDL.Nat,
  });
  const RailHealth = IDL.Record({
    'minBuffer' : IDL.Nat,
    'healthy' : IDL.Bool,
    'available' : IDL.Nat,
  });
  const Badge = IDL.Record({ 'name' : IDL.Text, 'rail' : IDL.Opt(Rail) });
  const UserBadges = IDL.Vec(Badge);
  const UserCompliance = IDL.Record({
    'kycVerified' : IDL.Bool,
    'tags' : IDL.Vec(IDL.Text),
  });
  const NativeDeposit = IDL.Record({
    'id' : IDL.Nat,
    'org' : OrgId,
    'memo' : IDL.Opt(IDL.Text),
    'rail' : Rail,
    'txid' : IDL.Text,
    'timestamp' : IDL.Nat,
    'amount' : IDL.Nat,
  });
  const PayoutEvent = IDL.Record({
    'id' : IDL.Nat,
    'org' : OrgId,
    'rail' : Rail,
    'error' : IDL.Opt(IDL.Text),
    'recipients' : IDL.Nat,
    'totalAmount' : IDL.Nat,
    'timestamp' : IDL.Nat,
    'success' : IDL.Bool,
  });
  const TipEvent = IDL.Record({
    'id' : IDL.Nat,
    'org' : OrgId,
    'rail' : Rail,
    'user' : UserId,
    'error' : IDL.Opt(IDL.Text),
    'timestamp' : IDL.Nat,
    'success' : IDL.Bool,
    'amount' : IDL.Nat,
  });
  return IDL.Service({
    'allocateFactoryFunds' : IDL.Func([OrgId, Rail, IDL.Nat], [], []),
    'checkAllOrgsForDeadman' : IDL.Func([], [], []),
    'checkAndArchiveOrg' : IDL.Func([OrgId], [], []),
    'configureGovernanceControllers' : IDL.Func(
        [IDL.Vec(IDL.Principal)],
        [],
        [],
      ),
    'forceArchiveOrg' : IDL.Func([OrgId], [], []),
    'getConversionIntent' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(ConversionIntent)],
        ['query'],
      ),
    'getFactoryVaultBalance' : IDL.Func([], [VaultBalance], ['query']),
    'getOrgAdmin' : IDL.Func([OrgId], [IDL.Opt(IDL.Principal)], ['query']),
    'getOrgConfig' : IDL.Func([OrgId], [IDL.Opt(OrgConfig)], ['query']),
    'getOrgDepositStatus' : IDL.Func(
        [OrgId, Rail],
        [IDL.Variant({ 'ok' : DepositSnapshot, 'err' : IDL.Text })],
        [],
      ),
    'getOrgRails' : IDL.Func([OrgId], [IDL.Opt(RailsEnabled)], ['query']),
    'getOrgSpendSnapshot' : IDL.Func([OrgId], [SpendSnapshot], ['query']),
    'getOrgState' : IDL.Func([OrgId], [IDL.Opt(OrgState)], ['query']),
    'getOrgVaultBalance' : IDL.Func([OrgId], [VaultBalance], ['query']),
    'getRailHealth' : IDL.Func([OrgId, Rail], [IDL.Opt(RailHealth)], ['query']),
    'getUserBadges' : IDL.Func([OrgId, UserId], [UserBadges], ['query']),
    'getUserCompliance' : IDL.Func(
        [OrgId, UserId],
        [IDL.Opt(UserCompliance)],
        ['query'],
      ),
    'getUserOrgBalances' : IDL.Func(
        [OrgId, UserId],
        [IDL.Record({ 'btc' : IDL.Nat, 'eth' : IDL.Nat, 'icp' : IDL.Nat })],
        ['query'],
      ),
    'isOrgArchived' : IDL.Func([OrgId], [IDL.Bool], ['query']),
    'listConversionIntents' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(ConversionIntent)],
        ['query'],
      ),
    'listNativeDeposits' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(NativeDeposit)],
        ['query'],
      ),
    'listPayoutEvents' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(PayoutEvent)],
        ['query'],
      ),
    'listRegisteredOrgs' : IDL.Func([], [IDL.Vec(OrgId)], ['query']),
    'listTipEvents' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(TipEvent)],
        ['query'],
      ),
    'markConversionCompleted' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'markConversionFailed' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Bool],
        [IDL.Text],
        [],
      ),
    'myOrgBalances' : IDL.Func(
        [OrgId],
        [IDL.Record({ 'btc' : IDL.Nat, 'eth' : IDL.Nat, 'icp' : IDL.Nat })],
        [],
      ),
    'notifyLedgerDeposit' : IDL.Func(
        [OrgId, Rail, IDL.Nat, IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'recordNativeDeposit' : IDL.Func(
        [OrgId, Rail, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
        [IDL.Nat],
        [],
      ),
    'recordOrgDeposit' : IDL.Func(
        [OrgId, Rail, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'recordOrgHeartbeat' : IDL.Func([OrgId], [], []),
    'registerOrg' : IDL.Func([OrgId, OrgConfig], [], []),
    'repAwarded' : IDL.Func(
        [OrgId, UserId, IDL.Int, IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'requestNativeWithdrawal' : IDL.Func(
        [OrgId, UserId, Rail, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
        [IDL.Nat],
        [],
      ),
    'resetOrgState' : IDL.Func([OrgId, OrgConfig, IDL.Principal], [], []),
    'retryConversion' : IDL.Func([IDL.Nat], [IDL.Text], []),
    'runDuePayoutCycles' : IDL.Func([], [], []),
    'runPayoutCycle' : IDL.Func([OrgId], [], []),
    'setAdmin' : IDL.Func([IDL.Principal], [], []),
    'setFactory' : IDL.Func([IDL.Principal], [], []),
    'setLedgers' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Principal],
        [],
        [],
      ),
    'setOrgAdmin' : IDL.Func([OrgId, IDL.Principal], [], []),
    'setOrgRailSubaccount' : IDL.Func(
        [OrgId, Rail, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [IDL.Text],
        [],
      ),
    'setRailMinters' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Opt(IDL.Principal)],
        [],
        [],
      ),
    'setRailUsdPrice' : IDL.Func([Rail, IDL.Nat], [], []),
    'setUserBadges' : IDL.Func([OrgId, UserId, UserBadges], [], []),
    'setUserCompliance' : IDL.Func([OrgId, UserId, UserCompliance], [], []),
    'submitPendingConversions' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'updateOrgConfig' : IDL.Func([OrgId, OrgConfig], [], []),
    'withdrawMy' : IDL.Func(
        [OrgId, Rail, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'withdrawOrgVault' : IDL.Func(
        [OrgId, Rail, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
