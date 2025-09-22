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

  // -------------------- Child-facing interfaces --------------------
  type ChildWallet = actor { wallet_receive : () -> async Nat };
  type ChildMgmt   = actor {
    health : () -> async {
      paused : Bool; cycles : Nat; users : Nat; txCount : Nat; topUpCount : Nat; decayConfigHash : Nat
    };
  };
  // New: drain cycles back to factory when archiving
  type ChildDrain = actor { returnCyclesToFactory : (Nat) -> async Nat };

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

  func requireOrgAdmin(caller : Principal, canister_id : Principal) : () {
    // Allow global admin
    if (caller == admin) return;

    // Allow the factory canister itself
    if (caller == Principal.fromActor(ReputationFactory)) return;

    // Otherwise require the caller to be the recorded owner of that child
    switch (byId.get(canister_id)) {
      case (?c) {
        if (c.owner == caller) return;
        Debug.trap("unauthorized: caller is not owner of this canister");
      };
      case null Debug.trap("unauthorized: unknown canister");
    };
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
    requireOrgAdmin(caller, canister_id);
    let target : ChildWallet = actor (Principal.toText(canister_id));
    try {
      let accepted = await (with cycles = amount) target.wallet_receive();
      if (accepted == amount) { #ok accepted } else { #err ("accepted=" # Nat.toText(accepted)) }
    } catch (_) { #err "transfer failed" }
  };

  // -------------------- Create / Reuse / CRUD --------------------

  public shared({ caller }) func forceAddOwnerIndex(owner: Principal, cid: Principal) : async Text {
    requireAdmin(caller);
    addOwnerIndex(owner, cid);
    "ok"
  };

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

    // Child now expects TWO candid args: (owner, factory)
    let init_arg : Blob = to_candid(owner, Principal.fromActor(ReputationFactory));

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













 /// Create or reuse from pool for given owner; ensure final cycles >= cycles_for_create.
/// If reused canister has fewer cycles than requested, top up the difference.
public shared({ caller }) func createOrReuseChildFor(
  owner: Principal,
  cycles_for_create: Nat,
  controllers: [Principal],
  note: Text
) : async Principal {

  let defaultCtrls = [Principal.fromActor(ReputationFactory), owner];
  // Child takes TWO candid init args: (owner, factory)
  let initArg : Blob = to_candid(owner, Principal.fromActor(ReputationFactory));

  // --- helpers ---
  type ChildWallet = actor { wallet_receive : () -> async Nat };
  type ChildMgmt   = actor {
    health : () -> async { paused : Bool; cycles : Nat; users : Nat; txCount : Nat; topUpCount : Nat; decayConfigHash : Nat }
  };

  func getChildCycles(cid: Principal) : async Nat {
    let c : ChildMgmt = actor (Principal.toText(cid));
    // best-effort; if it fails we’ll just return 0
    try { (await c.health()).cycles } catch (_) { 0 }
  };

  func topUpInternal(cid: Principal, amount: Nat) : async () {
    if (amount == 0) return;
    let target : ChildWallet = actor (Principal.toText(cid));
    ignore await (with cycles = amount) target.wallet_receive();
  };

  func ensureCycles(cid: Principal, target: Nat) : async () {
    if (target == 0) return;
    let have = await getChildCycles(cid);
    if (have < target) { await topUpInternal(cid, target - have) };
  };

  // ===== Reuse path (pool canisters are STOPPED due to archiveChild) =====
  if (pool.size() > 0) {
    switch (pool.removeLast()) {
      case (?cid) {
        // 1) Update controllers while STOPPED (matches archiveChild behavior)
        await ensureCycles(cid, cycles_for_create);
        await startChild(cid);

        await IC.update_settings({
          canister_id = cid;
          settings = {
            controllers = ?(if (controllers.size() == 0) defaultCtrls else controllers);
            compute_allocation = null; memory_allocation = null; freezing_threshold = null;
          }
        });

        // 2) Install code while STOPPED using #reinstall (works whether wasm existed or not)
        await IC.install_code({
          mode        = #reinstall;
          canister_id = cid;
          wasm_module = requireWasm();
          arg         = initArg
        });

        // 3) Start and then top up to requested target (wallet_receive needs running code)
       

        // Bring balance up to cycles_for_create (front-loads user’s target after reuse)
      

        // 4) Book-keeping (Active again)
        switch (byId.get(cid)) { case (?old) { removeOwnerIndex(old.owner, cid) }; case null {} };
        let rec : Child = { id = cid; owner; created_at = nowNs(); note; status = #Active };
        recordOrRefresh(rec);
        addOwnerIndex(owner, cid);

        // keep stable mirror of pool in sync after removal
        storePool := Buffer.toArray(pool);

        return cid;
      };
      case null {};
    }
  };

  // ===== Fresh create =====
  let res = await (with cycles = cycles_for_create) IC.create_canister({
    settings = ?{
      controllers = ?(if (controllers.size() == 0) defaultCtrls else controllers);
      compute_allocation = null; memory_allocation = null; freezing_threshold = null;
    }
  });
  let cid = res.canister_id;

  await IC.install_code({
    mode        = #install;
    canister_id = cid;
    wasm_module = requireWasm();
    arg         = initArg
  });
  await IC.start_canister({ canister_id = cid });

  let rec : Child = { id = cid; owner; created_at = nowNs(); note: Text = note; status = #Active };
  recordChild(rec);

  // Creation burns fees; top up delta if needed to meet requested total
  await ensureCycles(cid, cycles_for_create);

  cid
};




















  /// Archive a child back to pool.
  public shared({ caller }) func archiveChild(canister_id : Principal) : async Text {
    requireOrgAdmin(caller, canister_id);
    switch (byId.get(canister_id)) {
      case null { "Error: unknown canister" };
      case (?c) {
        // Ask child to return cycles to the factory vault BEFORE stopping it.
        let childDrain : ChildDrain = actor (Principal.toText(canister_id));
        // Keep ~0.1T cycles inside child as reply buffer; tune as you like.
        ignore await childDrain.returnCyclesToFactory(100_000_000_000);

        
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
    requireOrgAdmin(caller, canister_id);
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
  public shared({ caller }) func upgradeChild(canister_id : Principal) : async () {
    requireOrgAdmin(caller, canister_id);
    let child = switch (byId.get(canister_id)) { case (?c) c; case null Debug.trap("unknown child") };
    await IC.install_code({
      mode = #upgrade;
      canister_id;
      wasm_module = requireWasm();
      // TWO-arg candid again on upgrade
      arg = to_candid(child.owner, Principal.fromActor(ReputationFactory));
    });
  };




  // In ReputationFactory.mo
public shared({ caller }) func reinstallChild(canister_id : Principal, owner : Principal, factory : Principal) : async () {
    requireOrgAdmin(caller, canister_id);

    // Encode (owner, factory) into candid Blob
    let arg : Blob = to_candid(owner, factory);

    await IC.stop_canister({ canister_id });
    await IC.install_code({
        mode        = #reinstall;
        canister_id = canister_id;
        wasm_module = requireWasm();
        arg         = arg;
    });
    await IC.start_canister({ canister_id });
};










  public shared({ caller }) func startChild(canister_id : Principal) : async () {
    requireOrgAdmin(caller, canister_id);
    await IC.start_canister({ canister_id = canister_id })
  };

  public shared({ caller }) func stopChild(canister_id : Principal) : async () {
    requireOrgAdmin(caller, canister_id);
    await IC.stop_canister({ canister_id = canister_id })
  };

  /// Book-keeping only (does not touch actual controller list).
  public shared({ caller }) func reassignOwner(canister_id : Principal, newOwner : Principal) : async Text {
    requireOrgAdmin(caller, canister_id);
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
    requireOrgAdmin(caller, cid);

    let c : ChildMgmt = actor (Principal.toText(cid));
    ?(await c.health())
  };

  // Replace pool with an explicit list
public shared({ caller }) func adminSetPool(newPool : [Principal]) : async Text {
  requireAdmin(caller);
  let b = Buffer.Buffer<Principal>(newPool.size());
  for (cid in newPool.vals()) { b.add(cid) };
  pool := b;
  storePool := Buffer.toArray(pool);
  "ok"
};
}
