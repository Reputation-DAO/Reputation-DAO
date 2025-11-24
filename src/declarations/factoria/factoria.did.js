export const idlFactory = ({ IDL }) => {
  const Plan = IDL.Variant({
    'Basic' : IDL.Null,
    'Trial' : IDL.Null,
    'BasicPending' : IDL.Null,
  });
  const Visibility = IDL.Variant({ 'Private' : IDL.Null, 'Public' : IDL.Null });
  const Status = IDL.Variant({ 'Active' : IDL.Null, 'Archived' : IDL.Null });
  const BasicPayInfo = IDL.Record({
    'account_owner' : IDL.Principal,
    'memo' : IDL.Text,
    'subaccount' : IDL.Vec(IDL.Nat8),
    'amount_e8s' : IDL.Nat,
  });
  const Child = IDL.Record({
    'id' : IDL.Principal,
    'status' : Status,
    'owner' : IDL.Principal,
    'note' : IDL.Text,
    'plan' : Plan,
    'created_at' : IDL.Nat64,
    'visibility' : Visibility,
    'expires_at' : IDL.Nat64,
  });
  const AuditEvent = IDL.Record({
    'id' : IDL.Nat,
    'ts' : IDL.Nat64,
    'child' : IDL.Opt(IDL.Principal),
    'kind' : IDL.Text,
    'detail' : IDL.Text,
    'caller' : IDL.Principal,
  });
  return IDL.Service({
    'activateBasicForChildAfterPayment' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'adminArchiveExpired' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'adminBackfillPlanDefaults' : IDL.Func([Plan], [IDL.Text], []),
    'adminDrainChild' : IDL.Func([IDL.Principal, IDL.Nat], [IDL.Nat], []),
    'adminForceArchive' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'adminReattachChild' : IDL.Func(
        [
          IDL.Principal,
          IDL.Principal,
          IDL.Text,
          Visibility,
          Plan,
          IDL.Opt(Status),
          IDL.Opt(IDL.Nat64),
          IDL.Bool,
        ],
        [IDL.Text],
        [],
      ),
    'adminSetPool' : IDL.Func([IDL.Vec(IDL.Principal)], [IDL.Text], []),
    'adminTreasuryWithdraw' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Vec(IDL.Nat8)), IDL.Nat],
        [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
        [],
      ),
    'archiveChild' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'auditEventCount' : IDL.Func([], [IDL.Nat], ['query']),
    'childHealth' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Opt(
            IDL.Record({
              'topUpCount' : IDL.Nat,
              'decayConfigHash' : IDL.Nat,
              'cycles' : IDL.Nat,
              'users' : IDL.Nat,
              'txCount' : IDL.Nat,
              'paused' : IDL.Bool,
            })
          ),
        ],
        [],
      ),
    'counts' : IDL.Func(
        [],
        [
          IDL.Record({
            'total' : IDL.Nat,
            'active' : IDL.Nat,
            'archived' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'createBasicForSelf' : IDL.Func([IDL.Text], [IDL.Principal], []),
    'createBasicPendingForSelf' : IDL.Func(
        [IDL.Text],
        [IDL.Record({ 'cid' : IDL.Principal, 'payment' : BasicPayInfo })],
        [],
      ),
    'createChildForOwner' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Vec(IDL.Principal), IDL.Text],
        [IDL.Principal],
        [],
      ),
    'createOrReuseChildFor' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Vec(IDL.Principal), IDL.Text],
        [IDL.Principal],
        [],
      ),
    'createTrialForSelf' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Principal, 'err' : IDL.Text })],
        [],
      ),
    'deleteChild' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'factoryHealth' : IDL.Func(
        [],
        [
          IDL.Record({
            'admin' : IDL.Principal,
            'pool' : IDL.Nat,
            'vaultCycles' : IDL.Nat,
            'totals' : IDL.Record({
              'total' : IDL.Nat,
              'active' : IDL.Nat,
              'archived' : IDL.Nat,
            }),
            'wasmSet' : IDL.Bool,
            'treasuryUsage' : IDL.Record({
              'cap' : IDL.Nat,
              'day' : IDL.Nat64,
              'used' : IDL.Nat,
            }),
            'walletEvents' : IDL.Nat,
            'schemaVersion' : IDL.Nat,
            'treasury' : IDL.Opt(IDL.Principal),
          }),
        ],
        ['query'],
      ),
    'getAdmin' : IDL.Func([], [IDL.Principal], ['query']),
    'getBasicPayInfoForChild' : IDL.Func(
        [IDL.Principal],
        [BasicPayInfo],
        ['query'],
      ),
    'getBasicPrice' : IDL.Func([], [IDL.Nat], ['query']),
    'getChild' : IDL.Func([IDL.Principal], [IDL.Opt(Child)], ['query']),
    'getChildExtended' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Opt(
            IDL.Record({ 'child' : Child, 'lastEvent' : IDL.Opt(AuditEvent) })
          ),
        ],
        ['query'],
      ),
    'getTreasuryPrincipal' : IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
    'getTreasuryUsage' : IDL.Func(
        [],
        [IDL.Record({ 'cap' : IDL.Nat, 'day' : IDL.Nat64, 'used' : IDL.Nat })],
        ['query'],
      ),
    'listAuditEvents' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(AuditEvent)],
        ['query'],
      ),
    'listByOwner' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'listChildren' : IDL.Func([], [IDL.Vec(Child)], ['query']),
    'poolSize' : IDL.Func([], [IDL.Nat], ['query']),
    'reassignOwner' : IDL.Func([IDL.Principal, IDL.Principal], [IDL.Text], []),
    'reinstallChild' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Principal],
        [],
        [],
      ),
    'setAdmin' : IDL.Func([IDL.Principal], [], []),
    'setBasicPrice' : IDL.Func([IDL.Nat], [IDL.Text], []),
    'setDefaultChildWasm' : IDL.Func([IDL.Vec(IDL.Nat8)], [], []),
    'setTreasuryPrincipal' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Text], []),
    'startChild' : IDL.Func([IDL.Principal], [], []),
    'stopChild' : IDL.Func([IDL.Principal], [], []),
    'syncTreasuryForChild' : IDL.Func(
        [IDL.Principal, IDL.Bool],
        [IDL.Text],
        [],
      ),
    'toggleVisibility' : IDL.Func([IDL.Principal], [Visibility], []),
    'topUpChild' : IDL.Func(
        [IDL.Principal, IDL.Nat],
        [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
        [],
      ),
    'upgradeChild' : IDL.Func([IDL.Principal], [], []),
    'wallet_receive' : IDL.Func([], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => { return []; };
