export const idlFactory = ({ IDL }) => {
  const Plan = IDL.Variant({ 'Basic' : IDL.Null, 'Trial' : IDL.Null });
  const Status = IDL.Variant({ 'Active' : IDL.Null, 'Archived' : IDL.Null });
  const Visibility = IDL.Variant({ 'Private' : IDL.Null, 'Public' : IDL.Null });
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
  return IDL.Service({
    'activateBasicForChildAfterPayment' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'adminArchiveExpired' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'adminBackfillPlanDefaults' : IDL.Func([Plan], [IDL.Text], []),
    'adminDrainChild' : IDL.Func([IDL.Principal, IDL.Nat], [IDL.Nat], []),
    'adminSetPool' : IDL.Func([IDL.Vec(IDL.Principal)], [IDL.Text], []),
    'adminTreasuryWithdraw' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Vec(IDL.Nat8)), IDL.Nat],
        [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
        [],
      ),
    'archiveChild' : IDL.Func([IDL.Principal], [IDL.Text], []),
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
    'getAdmin' : IDL.Func([], [IDL.Principal], ['query']),
    'getBasicPayInfoForChild' : IDL.Func(
        [IDL.Principal],
        [
          IDL.Record({
            'account_owner' : IDL.Principal,
            'subaccount' : IDL.Vec(IDL.Nat8),
            'amount_e8s' : IDL.Nat,
          }),
        ],
        ['query'],
      ),
    'getChild' : IDL.Func([IDL.Principal], [IDL.Opt(Child)], ['query']),
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
    'setDefaultChildWasm' : IDL.Func([IDL.Vec(IDL.Nat8)], [], []),
    'startChild' : IDL.Func([IDL.Principal], [], []),
    'stopChild' : IDL.Func([IDL.Principal], [], []),
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
