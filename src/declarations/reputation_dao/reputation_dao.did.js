export const idlFactory = ({ IDL }) => {
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
  const Awarder = IDL.Record({ 'id' : IDL.Principal, 'name' : IDL.Text });
  return IDL.Service({
    'addTrustedAwarder' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Text], []),
    'applyDecayToSpecificUser' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'awardRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'configureDecay' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Bool],
        [IDL.Text],
        [],
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
    'getRawBalance' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
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
    'getTrustedAwarders' : IDL.Func([], [IDL.Vec(Awarder)], ['query']),
    'getUserDecayInfo' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserDecayInfo)],
        ['query'],
      ),
    'previewDecayAmount' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'processBatchDecay' : IDL.Func([], [IDL.Text], []),
    'removeTrustedAwarder' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'revokeRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
