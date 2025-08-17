export const idlFactory = ({ IDL }) => {
  const OrgID = IDL.Text;
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
  const OrgStats = IDL.Record({
    'admin' : IDL.Principal,
    'totalPoints' : IDL.Nat,
    'awarderCount' : IDL.Nat,
    'userCount' : IDL.Nat,
    'totalTransactions' : IDL.Nat,
  });
  const Awarder = IDL.Record({ 'id' : IDL.Principal, 'name' : IDL.Text });
  return IDL.Service({
    'addOrgTrustedAwarder' : IDL.Func(
        [OrgID, IDL.Principal, IDL.Text],
        [IDL.Text],
        [],
      ),
    'addTrustedAwarder' : IDL.Func(
        [OrgID, IDL.Principal, IDL.Text],
        [IDL.Text],
        [],
      ),
    'applyDecayToSpecificUser' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'autoAwardRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'autoRevokeRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'awardOrgRep' : IDL.Func(
        [OrgID, IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'awardRep' : IDL.Func(
        [OrgID, IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'configureDecay' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Bool],
        [IDL.Text],
        [],
      ),
    'getAllOrgs' : IDL.Func([], [IDL.Vec(OrgID)], ['query']),
    'getBalance' : IDL.Func(
        [OrgID, IDL.Principal],
        [IDL.Opt(IDL.Nat)],
        ['query'],
      ),
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
    'getMyBalance' : IDL.Func([], [IDL.Opt(IDL.Nat)], []),
    'getMyOrgTransactions' : IDL.Func([], [IDL.Opt(IDL.Vec(Transaction))], []),
    'getMyOrganization' : IDL.Func([], [IDL.Opt(IDL.Text)], []),
    'getMyTransactionsByUser' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Vec(Transaction))],
        [],
      ),
    'getOrgAdmin' : IDL.Func([OrgID], [IDL.Opt(IDL.Principal)], ['query']),
    'getOrgBalance' : IDL.Func(
        [OrgID, IDL.Principal],
        [IDL.Opt(IDL.Nat)],
        ['query'],
      ),
    'getOrgStats' : IDL.Func([OrgID], [IDL.Opt(OrgStats)], ['query']),
    'getOrgTransactions' : IDL.Func(
        [OrgID],
        [IDL.Opt(IDL.Vec(Transaction))],
        ['query'],
      ),
    'getOrgTrustedAwarders' : IDL.Func(
        [OrgID],
        [IDL.Opt(IDL.Vec(Awarder))],
        ['query'],
      ),
    'getRawBalance' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'getTransactionById' : IDL.Func(
        [OrgID, IDL.Nat],
        [IDL.Opt(Transaction)],
        ['query'],
      ),
    'getTransactionCount' : IDL.Func([OrgID], [IDL.Opt(IDL.Nat)], ['query']),
    'getTransactionHistory' : IDL.Func(
        [OrgID],
        [IDL.Opt(IDL.Vec(Transaction))],
        ['query'],
      ),
    'getTransactionsByUser' : IDL.Func(
        [OrgID, IDL.Principal],
        [IDL.Opt(IDL.Vec(Transaction))],
        ['query'],
      ),
    'getTrustedAwarders' : IDL.Func(
        [OrgID],
        [IDL.Opt(IDL.Vec(Awarder))],
        ['query'],
      ),
    'getUserDecayInfo' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserDecayInfo)],
        ['query'],
      ),
    'isMyOrgAdmin' : IDL.Func([], [IDL.Bool], []),
    'isOrgTrustedAwarderQuery' : IDL.Func(
        [OrgID, IDL.Principal],
        [IDL.Opt(IDL.Bool)],
        ['query'],
      ),
    'previewDecayAmount' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'processBatchDecay' : IDL.Func([], [IDL.Text], []),
    'registerOrg' : IDL.Func([OrgID], [IDL.Text], []),
    'removeTrustedAwarder' : IDL.Func([OrgID, IDL.Principal], [IDL.Text], []),
    'revokeOrgRep' : IDL.Func(
        [OrgID, IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'revokeRep' : IDL.Func(
        [OrgID, IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
