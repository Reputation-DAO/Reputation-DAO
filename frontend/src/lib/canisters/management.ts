import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";

export const MANAGEMENT_CANISTER_ID = "aaaaa-aa";

const idl = ({ IDL }: { IDL: typeof import("@dfinity/candid").IDL }) =>
  IDL.Service({
    update_settings: IDL.Func(
      [IDL.Record({
        canister_id: IDL.Principal,
        settings: IDL.Record({
          controllers: IDL.Opt(IDL.Vec(IDL.Principal)),
          compute_allocation: IDL.Opt(IDL.Nat),
          memory_allocation: IDL.Opt(IDL.Nat),
          freezing_threshold: IDL.Opt(IDL.Nat),
        }),
      })],
      [],
      []
    ),
    canister_status: IDL.Func(
      [IDL.Record({ canister_id: IDL.Principal })],
      [IDL.Record({
        status: IDL.Variant({ running: IDL.Null, stopping: IDL.Null, stopped: IDL.Null }),
        settings: IDL.Record({
          controllers: IDL.Vec(IDL.Principal),
          compute_allocation: IDL.Nat,
          memory_allocation: IDL.Nat,
          freezing_threshold: IDL.Nat,
        }),
        module_hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
        memory_size: IDL.Nat,
        cycles: IDL.Nat,
        idle_cycles_burned_per_day: IDL.Nat,
      })],
      ["query"]
    ),
  });

export function getManagementActor(agent: HttpAgent) {
  return Actor.createActor<any>(idl as any, {
    agent,
    canisterId: Principal.fromText(MANAGEMENT_CANISTER_ID),
  });
}
