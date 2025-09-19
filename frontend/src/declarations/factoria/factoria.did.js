export const idlFactory = ({ IDL }) => {
  const Status = IDL.Variant({ 'Active' : IDL.Null, 'Archived' : IDL.Null });
  const Child = IDL.Record({
    'id' : IDL.Principal,
    'status' : Status,
    'owner' : IDL.Principal,
    'note' : IDL.Text,
    'created_at' : IDL.Nat64,
  });
  return IDL.Service({
    'adminSetPool' : IDL.Func([IDL.Vec(IDL.Principal)], [IDL.Text], []),
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
    'deleteChild' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'forceAddOwnerIndex' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [IDL.Text],
        [],
      ),
    'getAdmin' : IDL.Func([], [IDL.Principal], ['query']),
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
