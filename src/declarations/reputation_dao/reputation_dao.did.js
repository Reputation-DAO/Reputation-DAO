export const idlFactory = ({ IDL }) => {
  const AwarderBreakdown = IDL.Record({
    'total' : IDL.Nat,
    'lastAward' : IDL.Nat,
    'awarder' : IDL.Principal,
  });
  const TransactionType = IDL.Variant({
    'Revoke' : IDL.Null,
    'Decay' : IDL.Null,
    'Award' : IDL.Null,
  });
  const Transaction = IDL.Record({
    'id' : IDL.Nat,
    'to' : IDL.Principal,
    'transactionType' : TransactionType,
    'from' : IDL.Principal,
    'timestamp' : IDL.Nat,
    'amount' : IDL.Nat,
    'reason' : IDL.Opt(IDL.Text),
  });
  const UserDecayInfo = IDL.Record({
    'lastActivityTime' : IDL.Nat,
    'totalDecayed' : IDL.Nat,
    'lastDecayTime' : IDL.Nat,
    'registrationTime' : IDL.Nat,
  });
  const DecayConfig = IDL.Record({
    'minThreshold' : IDL.Nat,
    'gracePeriod' : IDL.Nat,
    'enabled' : IDL.Bool,
    'decayInterval' : IDL.Nat,
    'decayRate' : IDL.Nat,
  });
  const Event = IDL.Record({
    'id' : IDL.Nat,
    'kind' : IDL.Text,
    'timestamp' : IDL.Nat,
    'payload' : IDL.Vec(IDL.Nat8),
  });
  const Tier = IDL.Variant({
    'Gold' : IDL.Null,
    'Bronze' : IDL.Null,
    'Custom' : IDL.Text,
    'Silver' : IDL.Null,
  });
  const TierRule = IDL.Record({
    'maxPoints' : IDL.Opt(IDL.Nat),
    'tier' : Tier,
    'minPoints' : IDL.Nat,
  });
  const TopUp = IDL.Record({
    'id' : IDL.Nat,
    'from' : IDL.Opt(IDL.Principal),
    'timestamp' : IDL.Nat,
    'amount' : IDL.Nat,
  });
  const Awarder = IDL.Record({ 'id' : IDL.Principal, 'name' : IDL.Text });
  const Rail = IDL.Variant({
    'BTC' : IDL.Null,
    'ETH' : IDL.Null,
    'ICP' : IDL.Null,
  });
  const Badge = IDL.Record({ 'name' : IDL.Text, 'rail' : IDL.Opt(Rail) });
  const UserBadges = IDL.Vec(Badge);
  const UserCompliance = IDL.Record({
    'kycVerified' : IDL.Bool,
    'tags' : IDL.Vec(IDL.Text),
  });
  const RailsEnabled = IDL.Record({
    'btc' : IDL.Bool,
    'eth' : IDL.Bool,
    'icp' : IDL.Bool,
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
  const OrgConfig = IDL.Record({
    'scheduled' : ScheduledPayoutConfig,
    'microTips' : MicroTipConfig,
    'compliance' : ComplianceRule,
    'spendControl' : IDL.Opt(SpendControl),
    'deadman' : DeadManConfig,
    'thresholds' : RailThresholds,
    'rails' : RailsEnabled,
  });
  const ReputationChild = IDL.Service({
    'acceptOwnership' : IDL.Func([], [IDL.Text], []),
    'addTrustedAwarder' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Text], []),
    'awardRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'awarderStats' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(AwarderBreakdown)],
        ['query'],
      ),
    'blacklist' : IDL.Func([IDL.Principal, IDL.Bool], [IDL.Text], []),
    'blacklistWithReason' : IDL.Func(
        [IDL.Principal, IDL.Bool, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'configureAutoAwarder' : IDL.Func([IDL.Bool], [IDL.Text], []),
    'configureDecay' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Bool],
        [IDL.Text],
        [],
      ),
    'cycles_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'emitEvent' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [IDL.Text], []),
    'findTransactionsByReason' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Vec(Transaction)],
        ['query'],
      ),
    'getBalance' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'getBalanceWithDetails' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Record({
            'rawBalance' : IDL.Nat,
            'currentBalance' : IDL.Nat,
            'pendingDecay' : IDL.Nat,
            'decayInfo' : IDL.Opt(UserDecayInfo),
          }),
        ],
        ['query'],
      ),
    'getBlacklistEntry' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Opt(
            IDL.Record({
              'active' : IDL.Bool,
              'updatedAt' : IDL.Nat,
              'reason' : IDL.Opt(IDL.Text),
            })
          ),
        ],
        ['query'],
      ),
    'getDecayConfig' : IDL.Func([], [DecayConfig], ['query']),
    'getDecayStatistics' : IDL.Func(
        [],
        [
          IDL.Record({
            'lastGlobalDecayProcess' : IDL.Nat,
            'configEnabled' : IDL.Bool,
            'totalDecayedPoints' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getEventsPaged' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(Event)],
        ['query'],
      ),
    'getTierRules' : IDL.Func([], [IDL.Vec(TierRule)], ['query']),
    'getTopUpCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTopUpsPaged' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(TopUp)],
        ['query'],
      ),
    'getTransactionById' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(Transaction)],
        ['query'],
      ),
    'getTransactionCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTransactionHistory' : IDL.Func([], [IDL.Vec(Transaction)], ['query']),
    'getTransactionsByUser' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(Transaction)],
        ['query'],
      ),
    'getTransactionsPaged' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(Transaction)],
        ['query'],
      ),
    'getTreasuryLink' : IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
    'getTreasuryStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'failures' : IDL.Nat,
            'events' : IDL.Nat,
            'treasury' : IDL.Opt(IDL.Principal),
          }),
        ],
        ['query'],
      ),
    'getTrustedAwarders' : IDL.Func([], [IDL.Vec(Awarder)], ['query']),
    'getUserDecayInfo' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserDecayInfo)],
        ['query'],
      ),
    'getUserTier' : IDL.Func([IDL.Principal], [Tier], ['query']),
    'getUsersByTier' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Principal, Tier))],
        ['query'],
      ),
    'getUsersByTierPaged' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(IDL.Tuple(IDL.Principal, Tier))],
        ['query'],
      ),
    'health' : IDL.Func(
        [],
        [
          IDL.Record({
            'topUpCount' : IDL.Nat,
            'decayConfigHash' : IDL.Nat,
            'cycles' : IDL.Nat,
            'users' : IDL.Nat,
            'txCount' : IDL.Nat,
            'paused' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
    'leaderboard' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
        ['query'],
      ),
    'multiAward' : IDL.Func(
        [
          IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text))),
          IDL.Bool,
        ],
        [IDL.Text],
        [],
      ),
    'myStats' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Record({
            'lifetimeRevoked' : IDL.Nat,
            'balance' : IDL.Nat,
            'lastActivity' : IDL.Nat,
            'lifetimeAwarded' : IDL.Nat,
            'totalDecayed' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'nominateOwner' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'notifyTreasuryDeposit' : IDL.Func(
        [Rail, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'orgPulse' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Record({
            'revokes' : IDL.Nat,
            'decays' : IDL.Nat,
            'awards' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'pause' : IDL.Func([IDL.Bool], [IDL.Text], []),
    'previewDecayAmount' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'processBatchDecay' : IDL.Func([], [IDL.Text], []),
    'removeTrustedAwarder' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'resetUser' : IDL.Func([IDL.Principal, IDL.Opt(IDL.Text)], [IDL.Text], []),
    'returnCyclesToFactory' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'revokeRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'runTreasuryPayoutCycle' : IDL.Func([], [IDL.Text], []),
    'setDailyMintLimit' : IDL.Func([IDL.Nat], [IDL.Text], []),
    'setDecayBatchSize' : IDL.Func([IDL.Nat], [IDL.Text], []),
    'setMinCyclesAlert' : IDL.Func([IDL.Nat], [IDL.Text], []),
    'setParent' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'setPerAwarderDailyLimit' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'setTierRules' : IDL.Func([IDL.Vec(TierRule)], [IDL.Text], []),
    'setTreasuryBadges' : IDL.Func([IDL.Principal, UserBadges], [IDL.Text], []),
    'setTreasuryCompliance' : IDL.Func(
        [IDL.Principal, UserCompliance],
        [IDL.Text],
        [],
      ),
    'setTreasuryLink' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
    'setTreasuryRails' : IDL.Func([RailsEnabled], [IDL.Text], []),
    'snapshotHash' : IDL.Func([], [IDL.Nat], ['query']),
    'syncTreasuryConfig' : IDL.Func([OrgConfig], [IDL.Text], []),
    'topUp' : IDL.Func([], [IDL.Nat], []),
    'transferOwnership' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'triggerManualDecay' : IDL.Func([], [IDL.Text], []),
    'version' : IDL.Func([], [IDL.Text], ['query']),
    'wallet_receive' : IDL.Func([], [IDL.Nat], []),
    'withdrawCycles' : IDL.Func([IDL.Principal, IDL.Nat], [IDL.Text], []),
  });
  return ReputationChild;
};
export const init = ({ IDL }) => { return [IDL.Principal, IDL.Principal]; };
