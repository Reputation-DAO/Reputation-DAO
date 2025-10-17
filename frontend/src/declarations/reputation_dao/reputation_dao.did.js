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
  const TopUp = IDL.Record({
    'id' : IDL.Nat,
    'from' : IDL.Principal,
    'timestamp' : IDL.Nat,
    'amount' : IDL.Nat,
  });
  const Awarder = IDL.Record({ 'id' : IDL.Principal, 'name' : IDL.Text });
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
    'getTrustedAwarders' : IDL.Func([], [IDL.Vec(Awarder)], ['query']),
    'getUserDecayInfo' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserDecayInfo)],
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
    'setDailyMintLimit' : IDL.Func([IDL.Nat], [IDL.Text], []),
    'setMinCyclesAlert' : IDL.Func([IDL.Nat], [IDL.Text], []),
    'setParent' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'setPerAwarderDailyLimit' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [IDL.Text],
        [],
      ),
    'snapshotHash' : IDL.Func([], [IDL.Nat], ['query']),
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
