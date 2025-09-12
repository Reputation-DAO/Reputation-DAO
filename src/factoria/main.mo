// factoria // ReputationFactory.mo — Factory/Registry/Pool + Cycles Vault (Motoko 0.27+)

import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";

actor ReputationFactory {

  // -------------------- IC Management (subset) --------------------

  // Persisted default child wasm (set once; survives upgrades)
  stable var wasm : ?Blob = null;

  public shared({ caller }) func setDefaultChildWasm(w : Blob) : async () {
    requireAdmin(caller); wasm := ?w;
  };

  func requireWasm() : Blob {
    switch (wasm) {
      case (?w) w;
      case null Debug.trap("Factory: default child WASM not set. Call setDefaultChildWasm(w) first.");
    }
  };



  type CanisterSettings = {
    controllers : ?[Principal];
    compute_allocation : ?Nat;
    memory_allocation  : ?Nat;
    freezing_threshold : ?Nat;
  };

  type CreateCanisterArgs   = { settings : ?CanisterSettings };
  type CreateCanisterResult = { canister_id : Principal };
  type InstallMode          = { #install; #reinstall; #upgrade };

  type InstallCodeArgs = {
    mode        : InstallMode;
    canister_id : Principal;
    wasm_module : Blob;
    arg         : Blob; // candid-encoded init/upgrade arg
  };

  type StartStopArgs = { canister_id : Principal };

  type UpdateSettingsArgs = {
    canister_id : Principal;
    settings    : CanisterSettings;
  };

  let IC : actor {
    create_canister : (CreateCanisterArgs) -> async CreateCanisterResult;
    install_code    : (InstallCodeArgs)    -> async ();
    start_canister  : (StartStopArgs)      -> async ();
    stop_canister   : (StartStopArgs)      -> async ();
    update_settings : (UpdateSettingsArgs) -> async ();
    delete_canister : (StartStopArgs)      -> async ();
  } = actor ("aaaaa-aa");

  // -------------------- Child-facing interface (only what we use) --------------------
  type ChildWallet = actor { wallet_receive : () -> async Nat };
  type ChildMgmt   = actor {
    health : () -> async {
      paused : Bool; cycles : Nat; users : Nat; txCount : Nat; topUpCount : Nat; decayConfigHash : Nat
    };
  };

  // -------------------- Registry/Pool Types --------------------
  public type Status = { #Active; #Archived };

  public type Child = {
    id         : Principal;
    owner      : Principal;  // logical owner (book-keeping)
    created_at : Nat64;      // ns
    note       : Text;
    status     : Status;
  };

  // -------------------- Stable State --------------------
  stable var store           : [Child] = [];                  // flat snapshot of children
  stable var storeOwnerPairs : [(Principal, Principal)] = []; // owner -> child ids
  stable var storePool       : [Principal] = [];              // archived pool (ids only)
  stable var admin           : Principal = Principal.fromText("ly6rq-d4d23-63ct7-e2j6c-257jk-627xo-wwwd4-lnxm6-qt7xb-573bv-bqe");

  // -------------------- Runtime Indexes (rebuilt each upgrade) --------------------
  var byId    = TrieMap.TrieMap<Principal, Child>(Principal.equal, Principal.hash);
  var byOwner = TrieMap.TrieMap<Principal, Buffer.Buffer<Principal>>(Principal.equal, Principal.hash);
  var pool    = Buffer.Buffer<Principal>(0);

  // -------------------- Upgrade hooks --------------------
  system func postupgrade() {
    // byId
    byId := TrieMap.TrieMap<Principal, Child>(Principal.equal, Principal.hash);
    for (c in store.vals()) { byId.put(c.id, c) };

    // byOwner
    byOwner := TrieMap.TrieMap<Principal, Buffer.Buffer<Principal>>(Principal.equal, Principal.hash);
    for ((o, cid) in storeOwnerPairs.vals()) {
      let buf = switch (byOwner.get(o)) { case (?b) b; case null Buffer.Buffer<Principal>(0) };
      buf.add(cid);
      byOwner.put(o, buf);
    };

    // pool
    pool := Buffer.Buffer<Principal>(storePool.size());
    for (cid in storePool.vals()) { pool.add(cid) };
  };

  system func preupgrade() {
    // persist children
    let b = Buffer.Buffer<Child>(byId.size());
    for ((_, c) in byId.entries()) { b.add(c) };
    store := Buffer.toArray(b);

    // persist owner pairs
    let op = Buffer.Buffer<(Principal, Principal)>(0);
    for ((o, buf) in byOwner.entries()) { for (cid in buf.vals()) { op.add((o, cid)) } };
    storeOwnerPairs := Buffer.toArray(op);

    // persist pool
    storePool := Buffer.toArray(pool);
  };

  // -------------------- Auth & Utils --------------------
  func requireAdmin(caller : Principal) : () {
    if (caller != admin) { assert false };
  };

  func nowNs() : Nat64 = Nat64.fromIntWrap(Time.now());

  func addOwnerIndex(owner : Principal, cid : Principal) {
    let buf = switch (byOwner.get(owner)) { case (?b) b; case null Buffer.Buffer<Principal>(0) };
    buf.add(cid);
    byOwner.put(owner, buf);
  };

  func removeOwnerIndex(owner : Principal, cid : Principal) {
    switch (byOwner.get(owner)) {
      case (?buf) {
        let tmp = Buffer.Buffer<Principal>(buf.size());
        for (x in buf.vals()) { if (x != cid) tmp.add(x) };
        byOwner.put(owner, tmp);
      };
      case null {};
    }
  };

  func recordChild(c : Child) {
    byId.put(c.id, c);
    addOwnerIndex(c.owner, c.id);

    // keep stable mirrors “live”
    let bb = Buffer.Buffer<Child>(store.size() + 1);
    for (x in store.vals()) { bb.add(x) };
    bb.add(c);
    store := Buffer.toArray(bb);

    let pairs = Buffer.Buffer<(Principal, Principal)>(storeOwnerPairs.size() + 1);
    for (xy in storeOwnerPairs.vals()) { pairs.add(xy) };
    pairs.add((c.owner, c.id));
    storeOwnerPairs := Buffer.toArray(pairs);
  };

  func updateChild(c : Child) {
    byId.put(c.id, c);
    // refresh stable store
    let out = Buffer.Buffer<Child>(store.size());
    for (x in store.vals()) { out.add(if (x.id == c.id) c else x) };
    store := Buffer.toArray(out);
  };

  func recordOrRefresh(c : Child) {
    if (byId.get(c.id) != null) { updateChild(c) } else { recordChild(c) };
    // ensure (owner, id) in stable pairs
    var seen = false;
    let pairs = Buffer.Buffer<(Principal, Principal)>(storeOwnerPairs.size() + 1);
    for ((o, cid) in storeOwnerPairs.vals()) {
      pairs.add((o, cid));
      if (o == c.owner and cid == c.id) { seen := true };
    };
    if (not seen) { pairs.add((c.owner, c.id)) };
    storeOwnerPairs := Buffer.toArray(pairs);
  };

  // -------------------- Admin config --------------------
  public shared({ caller }) func setAdmin(p : Principal) : async () {
    requireAdmin(caller);
    admin := p;
  };

  public query func getAdmin() : async Principal { admin };

  // -------------------- Vault (cycles in/out) --------------------
  public func wallet_receive() : async Nat {
    let avail = Cycles.available();
    let accepted = Cycles.accept<system>(avail);
    accepted
  };

  /// Send `amount` cycles to a child’s `wallet_receive`, and let the child log it.
  public shared({ caller }) func topUpChild(canister_id : Principal, amount : Nat)
    : async { #ok : Nat; #err : Text } {
    requireAdmin(caller);
    let target : ChildWallet = actor (Principal.toText(canister_id));
    try {
      let accepted = await (with cycles = amount) target.wallet_receive();
      if (accepted == amount) { #ok accepted } else { #err ("accepted=" # Nat.toText(accepted)) }
    } catch (_) { #err "transfer failed" }
  };




  // -------------------- Create / Reuse / CRUD --------------------
  /// Create new ReputationChild with app-level owner; if `controllers` empty, default to [factory, owner].
  public shared({ caller }) func createChildForOwner(
    owner             : Principal,
    cycles_for_create : Nat,
    controllers       : [Principal],   // optional override; empty means default

    note              : Text
  ) : async Principal {
    requireAdmin(caller);
    let defaultCtrls = [Principal.fromActor(ReputationFactory), owner];

    let res = await (with cycles = cycles_for_create) IC.create_canister({
      settings = ?{
        controllers = ?(if (controllers.size() == 0) defaultCtrls else controllers);
        compute_allocation = null; memory_allocation = null; freezing_threshold = null;
      }
    });
    let cid = res.canister_id;

    // Child expects ONE candid arg: (owner)
    let init_arg : Blob = to_candid (owner);

    await IC.install_code({
      mode = #install;
      canister_id = cid;
      wasm_module = requireWasm();
      arg = init_arg;
    });
    await IC.start_canister({ canister_id = cid });

    let rec : Child = { id = cid; owner; created_at = nowNs(); note; status = #Active };
    recordChild(rec);
    cid
  };

  /// Create or reuse from pool for given owner; `init_arg` must candid-encode the SAME SINGLE arg the child expects (owner).
  public shared({ caller }) func createOrReuseChildFor(
    owner             : Principal,
    cycles_for_create : Nat,
    controllers       : [Principal],
    init_arg          : Blob,    // candid-encoded (owner)
    note              : Text
  ) : async Principal {
    requireAdmin(caller);

    let defaultCtrls = [Principal.fromActor(ReputationFactory), owner];

    if (pool.size() > 0) {
      switch (pool.removeLast()) {
        case null { /* race: fall through to fresh create */ };
        case (?cid) {
          await IC.stop_canister({ canister_id = cid });
          await IC.update_settings({
            canister_id = cid;
            settings = {
              controllers = ?(if (controllers.size() == 0) defaultCtrls else controllers);
              compute_allocation = null; memory_allocation = null; freezing_threshold = null;
            }
          });
          await IC.install_code({ mode = #reinstall; canister_id = cid; wasm_module = requireWasm(); arg = init_arg });
          await IC.start_canister({ canister_id = cid });

          switch (byId.get(cid)) { case (?old) { removeOwnerIndex(old.owner, cid) }; case null {} };
          let rec : Child = { id = cid; owner; created_at = nowNs(); note; status = #Active };
          recordOrRefresh(rec);

          storePool := Buffer.toArray(pool);
          return cid;
        }
      };
    };

    // fresh create
    let res = await (with cycles = cycles_for_create) IC.create_canister({
      settings = ?{
        controllers = ?(if (controllers.size() == 0) defaultCtrls else controllers);
        compute_allocation = null; memory_allocation = null; freezing_threshold = null;
      }
    });
    let cid = res.canister_id;

    await IC.install_code({ mode = #install; canister_id = cid; wasm_module = requireWasm(); arg = init_arg });
    await IC.start_canister({ canister_id = cid });

    let rec : Child = { id = cid; owner; created_at = nowNs(); note; status = #Active };
    recordChild(rec);
    cid
  };

  /// Archive a child back to pool.
  public shared({ caller }) func archiveChild(canister_id : Principal) : async Text {
    requireAdmin(caller);
    switch (byId.get(canister_id)) {
      case null { "Error: unknown canister" };
      case (?c) {
        await IC.stop_canister({ canister_id = canister_id });
        await IC.update_settings({
          canister_id = canister_id;
          settings = {
            controllers = ?[Principal.fromActor(ReputationFactory)];
            compute_allocation = null; memory_allocation = null; freezing_threshold = null;
          }
        });

        let c2 : Child = { id = c.id; owner = c.owner; created_at = c.created_at; note = c.note; status = #Archived };
        updateChild(c2);

        removeOwnerIndex(c.owner, c.id);
        pool.add(c.id);
        storePool := Buffer.toArray(pool);
        "Success: archived"
      }
    }
  };

  /// Delete permanently.
  public shared({ caller }) func deleteChild(canister_id : Principal) : async Text {
    requireAdmin(caller);
    await IC.stop_canister({ canister_id = canister_id });
    await IC.delete_canister({ canister_id = canister_id });

    switch (byId.remove(canister_id)) {
      case (?c) { removeOwnerIndex(c.owner, canister_id) };
      case null {};
    };

    let b = Buffer.Buffer<Child>(0);
    for (x in store.vals()) { if (x.id != canister_id) b.add(x) };
    store := Buffer.toArray(b);

    let p = Buffer.Buffer<(Principal, Principal)>(0);
    for ((o, cid) in storeOwnerPairs.vals()) { if (cid != canister_id) p.add((o, cid)) };
    storeOwnerPairs := Buffer.toArray(p);

    let np = Buffer.Buffer<Principal>(0);
    for (cid in pool.vals()) { if (cid != canister_id) np.add(cid) };
    pool := np;
    storePool := Buffer.toArray(pool);

    "Success: deleted"
  };




  // -------------------- Lifecycle helpers --------------------
  public shared({ caller }) func upgradeChild(canister_id : Principal, arg : Blob) : async () {
    requireAdmin(caller);
    await IC.install_code({ mode = #upgrade; canister_id = canister_id; wasm_module = requireWasm(); arg = arg });
  };

  public shared({ caller }) func reinstallChild(canister_id : Principal, arg : Blob) : async () {
    requireAdmin(caller);
    await IC.stop_canister({ canister_id = canister_id });
    await IC.install_code({ mode = #reinstall; canister_id = canister_id; wasm_module = requireWasm(); arg = arg });
    await IC.start_canister({ canister_id = canister_id });
  };

  public shared({ caller }) func startChild(canister_id : Principal) : async () {
    requireAdmin(caller); await IC.start_canister({ canister_id = canister_id })
  };

  public shared({ caller }) func stopChild(canister_id : Principal) : async () {
    requireAdmin(caller); await IC.stop_canister({ canister_id = canister_id })
  };

  /// Book-keeping only (does not touch actual controller list).
  public shared({ caller }) func reassignOwner(canister_id : Principal, newOwner : Principal) : async Text {
    requireAdmin(caller);
    switch (byId.get(canister_id)) {
      case null { "Error: unknown canister" };
      case (?c) {
        removeOwnerIndex(c.owner, canister_id);
        let c2 : Child = { id = c.id; owner = newOwner; created_at = c.created_at; note = c.note; status = c.status };
        updateChild(c2);
        addOwnerIndex(newOwner, canister_id);
        "Success: owner updated"
      }
    }
  };

  // -------------------- Queries --------------------
  public query func listChildren() : async [Child] { store };

  public query func getChild(canister_id : Principal) : async ?Child { byId.get(canister_id) };

  public query func listByOwner(owner : Principal) : async [Principal] {
    switch (byOwner.get(owner)) { case (?b) { Buffer.toArray(b) }; case null { [] } }
  };

  public query func poolSize() : async Nat { pool.size() };

  public query func counts() : async { total : Nat; active : Nat; archived : Nat } {
    var a : Nat = 0; var r : Nat = 0;
    for (c in store.vals()) {
      switch (c.status) { case (#Active) { a += 1 }; case (#Archived) { r += 1 } }
    };
    { total = store.size(); active = a; archived = r }
  };

  /// Fetch child health straight from the child
  public shared({ caller }) func childHealth(cid : Principal)
    : async ?{ paused : Bool; cycles : Nat; users : Nat; txCount : Nat; topUpCount : Nat; decayConfigHash : Nat } {
    requireAdmin(caller);
    let c : ChildMgmt = actor (Principal.toText(cid));
    ?(await c.health())
  };
}
