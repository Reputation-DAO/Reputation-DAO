export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'addTrustedAwarder' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'awardRep' : IDL.Func([IDL.Principal, IDL.Nat], [IDL.Text], []),
    'getBalance' : IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
    'removeTrustedAwarder' : IDL.Func([IDL.Principal], [IDL.Text], []),
    'revokeRep' : IDL.Func([IDL.Principal, IDL.Nat], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
