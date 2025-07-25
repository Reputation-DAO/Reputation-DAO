export const idlFactory = ({ IDL }) => {
  const TransactionType = IDL.Variant({
    'Revoke' : IDL.Null,
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
    'awardRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
    'getBalance' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
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
    'removeTrustedAwarder' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'revokeRep' : IDL.Func(
        [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Text)],
        [IDL.Text],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
