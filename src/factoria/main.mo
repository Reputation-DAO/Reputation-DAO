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
import Array  "mo:base/Array";
import Nat8   "mo:base/Nat8";
import Nat32  "mo:base/Nat32";
import Error "mo:base/Error";
import TreasuryTypes "../common/TreasuryTypes";

actor ReputationFactory {
  let TREASURY_DAILY_CAP : Nat = 10_000_000_000_000;

  // -------------------- IC Management (subset) --------------------

  stable var wasm : ?Blob = null;

  public shared({ caller }) func setDefaultChildWasm(w : Blob) : async () {
    requireAdmin(caller);
    let size = Blob.toArray(w).size();
    if (size == 0) Debug.trap("WASM blob cannot be empty");
    wasm := ?w;
    logEvent(caller, null, "factory.setDefaultChildWasm", "size=" # Nat.toText(size));
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
    arg         : Blob;
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
  type ChildDrain = actor { returnCyclesToFactory : (Nat) -> async Nat };

  // -------------------- Plans & policy --------------------
  public type Status = { #Active; #Archived };
  public type Visibility = { #Public; #Private };
  public type Plan = { #Trial; #Basic; #BasicPending };

  let ONE_T   : Nat   = 1_000_000_000_000;          // 1T cycles
  let DAY_NS  : Nat64 = 86_400_000_000_000;         // 24h
  let MONTH_NS: Nat64 = 30 * DAY_NS;                // 30 days
  func dayIndex(ts : Nat64) : Nat64 = ts / DAY_NS;

  public type Child = {
    id         : Principal;
    owner      : Principal;
    created_at : Nat64;
    note       : Text;
    status     : Status;
    visibility : Visibility;
    plan       : Plan;
    expires_at : Nat64;
  };

  type TreasuryActor = actor {
    registerOrg : (Principal, TreasuryTypes.OrgConfig) -> async ();
    setOrgAdmin : (Principal, Principal) -> async ();
    getOrgConfig : (Principal) -> async ?TreasuryTypes.OrgConfig;
    resetOrgState : (Principal, TreasuryTypes.OrgConfig, Principal) -> async ();
    forceArchiveOrg : (Principal) -> async ();
  };

  type ChildTreasuryLink = actor { setTreasuryLink : (?Principal) -> async Text };

  // -------------------- Stable State --------------------
  public type AuditEvent = {
    id : Nat;
    ts : Nat64;
    caller : Principal;
    child : ?Principal;
    kind : Text;
    detail : Text;
  };

  stable var store           : [Child] = [];
  stable var storeOwnerPairs : [(Principal, Principal)] = [];
  stable var storePool       : [Principal] = [];
  stable var admin           : Principal = Principal.fromText("ly6rq-d4d23-63ct7-e2j6c-257jk-627xo-wwwd4-lnxm6-qt7xb-573bv-bqe");
  stable var schemaVersion   : Nat = 1;
  stable var treasuryPrincipal : ?Principal = null;
  stable var auditStore      : [AuditEvent] = [];
  stable var auditNextId     : Nat = 1;
  stable var walletEvents    : Nat = 0;
  stable var treasuryUsageDay : Nat64 = 0;
  stable var treasuryUsageAmount : Nat = 0;

  // Trial one-per-owner and Basic daily usage mirrors
  stable var trialIssuedStore : [Principal] = [];
  stable var usageStore       : [(Principal, Nat64, Nat)] = [];

  // -------------------- Runtime Indexes --------------------
  var byId    = TrieMap.TrieMap<Principal, Child>(Principal.equal, Principal.hash);
  var byOwner = TrieMap.TrieMap<Principal, Buffer.Buffer<Principal>>(Principal.equal, Principal.hash);
  var pool    = Buffer.Buffer<Principal>(0);

  var trialIssued = TrieMap.TrieMap<Principal, Bool>(Principal.equal, Principal.hash);
  type UsageKey = { cid : Principal; day : Nat64 };
  func usageHash(k : UsageKey) : Nat32 { Principal.hash(k.cid) ^ Nat32.fromNat64(k.day) };
  func usageEq(a : UsageKey, b : UsageKey) : Bool { Principal.equal(a.cid, b.cid) and a.day == b.day };
  var dailyUsage = TrieMap.TrieMap<UsageKey, Nat>(usageEq, usageHash);
  var auditLog : [AuditEvent] = [];
  var nextAuditId : Nat = auditNextId;

  func sliceWindow<T>(arr : [T], offset : Nat, limit : Nat) : [T] {
    let n = arr.size();
    if (offset >= n) return [];
    let remaining = Nat.sub(n, offset);
    let take = Nat.min(limit, remaining);
    if (take == 0) return [];
    Array.tabulate<T>(
      take,
      func(i : Nat) = arr[n - offset - 1 - i]
    )
  };

  // -------------------- Upgrade hooks --------------------
  system func postupgrade() {
    byId := TrieMap.TrieMap<Principal, Child>(Principal.equal, Principal.hash);
    for (c in store.vals()) { byId.put(c.id, c) };

    byOwner := TrieMap.TrieMap<Principal, Buffer.Buffer<Principal>>(Principal.equal, Principal.hash);
    for ((o, cid) in storeOwnerPairs.vals()) {
      let buf = switch (byOwner.get(o)) { case (?b) b; case null Buffer.Buffer<Principal>(0) };
      buf.add(cid); byOwner.put(o, buf);
    };

    pool := Buffer.Buffer<Principal>(storePool.size());
    for (cid in storePool.vals()) { pool.add(cid) };

    trialIssued := TrieMap.TrieMap<Principal, Bool>(Principal.equal, Principal.hash);
    for (p in trialIssuedStore.vals()) { trialIssued.put(p, true) };

    dailyUsage := TrieMap.TrieMap<UsageKey, Nat>(usageEq, usageHash);
    for ((cid, day, used) in usageStore.vals()) { dailyUsage.put({ cid; day }, used) };
    auditLog := auditStore;
    nextAuditId := auditNextId;
  };

  system func preupgrade() {
    let b = Buffer.Buffer<Child>(byId.size());
    for ((_, c) in byId.entries()) { b.add(c) };
    store := Buffer.toArray(b);

    let op = Buffer.Buffer<(Principal, Principal)>(0);
    for ((o, buf) in byOwner.entries()) { for (cid in buf.vals()) { op.add((o, cid)) } };
    storeOwnerPairs := Buffer.toArray(op);

    storePool := Buffer.toArray(pool);

    let t = Buffer.Buffer<Principal>(trialIssued.size());
    for ((p, _) in trialIssued.entries()) { t.add(p) };
    trialIssuedStore := Buffer.toArray(t);

    let u = Buffer.Buffer<(Principal, Nat64, Nat)>(dailyUsage.size());
    for ((k, v) in dailyUsage.entries()) { u.add((k.cid, k.day, v)) };
    usageStore := Buffer.toArray(u);
    auditStore := auditLog;
    auditNextId := nextAuditId;
  };

  // -------------------- Auth & Utils --------------------
  func requireAdmin(caller : Principal) : () {
    if (caller != admin) { assert false };
  };

  func requireOrgAdmin(caller : Principal, canister_id : Principal) : () {
    if (caller == admin) return;
    if (caller == Principal.fromActor(ReputationFactory)) return;
    switch (byId.get(canister_id)) {
      case (?c) { if (c.owner == caller) return; Debug.trap("unauthorized: caller is not owner of this canister") };
      case null Debug.trap("unauthorized: unknown canister");
    };
  };

  func nowNs() : Nat64 = Nat64.fromIntWrap(Time.now());

  func addOwnerIndex(owner : Principal, cid : Principal) {
    let buf = switch (byOwner.get(owner)) { case (?b) b; case null Buffer.Buffer<Principal>(0) };
    buf.add(cid); byOwner.put(owner, buf);
  };

  func removeOwnerIndex(owner : Principal, cid : Principal) {
    switch (byOwner.get(owner)) {
      case (?buf) {
        let tmp = Buffer.Buffer<Principal>(buf.size());
        for (x in buf.vals()) {
          if (x != cid) tmp.add(x);
        };
        if (tmp.size() == 0) {
          ignore byOwner.remove(owner);
        } else {
          byOwner.put(owner, tmp);
        };
      };
      case null {};
    };

    let pairs = Buffer.Buffer<(Principal, Principal)>(storeOwnerPairs.size());
    for ((o, existing) in storeOwnerPairs.vals()) {
      if (not (Principal.equal(o, owner) and Principal.equal(existing, cid))) {
        pairs.add((o, existing));
      };
    };
    storeOwnerPairs := Buffer.toArray(pairs);
  };

  func recordChild(c : Child) {
    byId.put(c.id, c);
    addOwnerIndex(c.owner, c.id);

    let bb = Buffer.Buffer<Child>(store.size() + 1);
    for (x in store.vals()) { bb.add(x) };
    bb.add(c); store := Buffer.toArray(bb);

    let pairs = Buffer.Buffer<(Principal, Principal)>(storeOwnerPairs.size() + 1);
    for (xy in storeOwnerPairs.vals()) { pairs.add(xy) };
    pairs.add((c.owner, c.id)); storeOwnerPairs := Buffer.toArray(pairs);
  };

  func updateChild(c : Child) {
    byId.put(c.id, c);
    let out = Buffer.Buffer<Child>(store.size());
    for (x in store.vals()) { out.add(if (x.id == c.id) c else x) };
    store := Buffer.toArray(out);
  };

  func recordOrRefresh(c : Child) {
    if (byId.get(c.id) != null) { updateChild(c) } else { recordChild(c) };
    var seen = false;
    let pairs = Buffer.Buffer<(Principal, Principal)>(storeOwnerPairs.size() + 1);
    for ((o, cid) in storeOwnerPairs.vals()) {
      if (Principal.equal(o, c.owner) and Principal.equal(cid, c.id)) {
        if (not seen) {
          pairs.add((o, cid));
          seen := true;
        };
      } else {
        pairs.add((o, cid));
      };
    };
    if (not seen) { pairs.add((c.owner, c.id)) };
    storeOwnerPairs := Buffer.toArray(pairs);
  };

  func childOrTrap(cid : Principal) : Child {
    switch (byId.get(cid)) { case (?c) c; case null Debug.trap("unknown canister") }
  };

  func isTrialAllowedFor(owner : Principal) : Bool { trialIssued.get(owner) == null };

  func markTrialUsed(owner : Principal) {
    trialIssued.put(owner, true);
    let tmp = Buffer.Buffer<Principal>(trialIssuedStore.size() + 1);
    for (p in trialIssuedStore.vals()) { tmp.add(p) };
    tmp.add(owner); trialIssuedStore := Buffer.toArray(tmp);
  };

  func getUsedToday(cid : Principal) : Nat {
    let key = { cid; day = dayIndex(nowNs()) };
    switch (dailyUsage.get(key)) { case (?n) n; case null 0 }
  };

  func addUsedToday(cid : Principal, amount : Nat) {
    let key = { cid; day = dayIndex(nowNs()) };
    let cur = switch (dailyUsage.get(key)) { case (?n) n; case null 0 };
    dailyUsage.put(key, cur + amount);

    // mirror to stable
    let out = Buffer.Buffer<(Principal, Nat64, Nat)>(dailyUsage.size());
    for ((k, v) in dailyUsage.entries()) { out.add((k.cid, k.day, v)) };
    usageStore := Buffer.toArray(out);
  };

  func logEvent(caller : Principal, child : ?Principal, kind : Text, detail : Text) {
    let entry : AuditEvent = {
      id = nextAuditId;
      ts = nowNs();
      caller;
      child;
      kind;
      detail;
    };
    nextAuditId += 1;
    let buf = Buffer.fromArray<AuditEvent>(auditLog);
    buf.add(entry);
    auditLog := Buffer.toArray(buf);
  };

  func defaultTreasuryConfig() : TreasuryTypes.OrgConfig = {
    rails = { btc = false; icp = false; eth = false };
    microTips = {
      enabled = false;
      btcTipAmount = 0;
      icpTipAmount = 0;
      ethTipAmount = 0;
      maxBtcPerPeriod = 0;
      maxIcpPerPeriod = 0;
      maxEthPerPeriod = 0;
      maxEventsPerWindow = 10;
    };
    scheduled = {
      enabled = false;
      frequency = #Monthly;
      maxBtcPerCycle = 0;
      maxIcpPerCycle = 0;
      maxEthPerCycle = 0;
      tiers = [];
    };
    deadman = { enabled = false; inactivityThresholdSeconds = 0 };
    thresholds = { btcMin = 0; icpMin = 0; ethMin = 0 };
    compliance = { kycRequired = false; tagWhitelist = [] };
    spendControl = null;
  };

  func treasuryActor() : ?TreasuryActor =
    switch (treasuryPrincipal) {
      case (?p) ?(actor (Principal.toText(p)) : TreasuryActor);
      case null null;
    };

  func linkChildToTreasury(cid : Principal, target : ?Principal) : async () {
    let child : ChildTreasuryLink = actor (Principal.toText(cid));
    try {
      ignore await child.setTreasuryLink(target);
    } catch (err) {
      Debug.print("treasury link sync failed for " # Principal.toText(cid) # ": " # Error.message(err));
    };
  };

  func ensureTreasuryOrg(cid : Principal, owner : Principal, reset : Bool) : async () {
    await linkChildToTreasury(cid, treasuryPrincipal);
    switch (treasuryActor()) {
      case (?treasuryCan) {
        try {
          let existing = await treasuryCan.getOrgConfig(cid);
          if (existing == null) {
            await treasuryCan.registerOrg(cid, defaultTreasuryConfig());
          } else if (reset) {
            await treasuryCan.resetOrgState(cid, defaultTreasuryConfig(), owner);
          };
          await treasuryCan.setOrgAdmin(cid, owner);
        } catch (err) {
          Debug.print("treasury bootstrap failed for " # Principal.toText(cid) # ": " # Error.message(err));
        };
      };
      case null {};
    };
  };

  func syncAllChildrenWithTreasury(reset : Bool) : async () {
    for (child in store.vals()) {
      await ensureTreasuryOrg(child.id, child.owner, reset);
    };
  };

  func archiveTreasuryOrg(cid : Principal) : async () {
    switch (treasuryActor()) {
      case (?treasuryCan) {
        try {
          await treasuryCan.forceArchiveOrg(cid);
        } catch (err) {
          Debug.print("treasury archive failed for " # Principal.toText(cid) # ": " # Error.message(err));
        };
      };
      case null {};
    };
  };

  func resetTreasuryUsage(day : Nat64) {
    if (treasuryUsageDay != day) {
      treasuryUsageDay := day;
      treasuryUsageAmount := 0;
    }
  };

  func latestChildEvent(child : Principal) : ?AuditEvent {
    var i : Nat = auditLog.size();
    while (i > 0) {
      i -= 1;
      let ev = auditLog[i];
      switch (ev.child) {
        case (?c) { if (Principal.equal(c, child)) return ?ev };
        case null {};
      };
    };
    null
  };

  func enforceTreasuryCap(amount : Nat) {
    let day = dayIndex(nowNs());
    resetTreasuryUsage(day);
    if (treasuryUsageAmount + amount > TREASURY_DAILY_CAP) {
      Debug.trap("Treasury daily cap exceeded");
    };
    treasuryUsageAmount += amount;
  };

  func checkAndAutoArchive(cid : Principal) : async () {
    let c = childOrTrap(cid);
    if (c.plan == #BasicPending) return;
    if (c.status == #Archived) return;
    if (nowNs() >= c.expires_at) { ignore await archiveChild(cid) };
  };

  func topUpInternalGlobal(cid: Principal, amount: Nat) : async () {
    if (amount == 0) return;
    let target : ChildWallet = actor (Principal.toText(cid));
    ignore await (with cycles = amount) target.wallet_receive();
  };


  // -------------------- Admin config --------------------
  public shared({ caller }) func setAdmin(p : Principal) : async () {
    requireAdmin(caller);
    admin := p;
    logEvent(caller, null, "factory.setAdmin", Principal.toText(p));
  };
  public query func getAdmin() : async Principal { admin };
  public shared({ caller }) func setBasicPrice(newPriceE8s : Nat) : async Text {
    requireAdmin(caller);
    if (newPriceE8s <= FEE_E8S) {
      return "Error: price must be greater than fee";
    };
    basicPriceE8s := newPriceE8s;
    logEvent(caller, null, "factory.setBasicPrice", "price=" # Nat.toText(newPriceE8s));
    "Success: basic plan price updated"
  };
  public query func getBasicPrice() : async Nat { basicPriceE8s };
  public shared({ caller }) func setTreasuryPrincipal(p : ?Principal) : async Text {
    requireAdmin(caller);
    treasuryPrincipal := p;
    logEvent(caller, null, "factory.setTreasury", switch (p) { case (?x) Principal.toText(x); case null "cleared" });
    ignore async {
      try {
        await syncAllChildrenWithTreasury(false);
      } catch (err) {
        Debug.print("treasury sync-all failed: " # Error.message(err));
      };
    };
    "Success: treasury updated"
  };
  public query func getTreasuryPrincipal() : async ?Principal { treasuryPrincipal };
  public query func getTreasuryUsage() : async { day : Nat64; used : Nat; cap : Nat } {
    { day = treasuryUsageDay; used = treasuryUsageAmount; cap = TREASURY_DAILY_CAP }
  };
  public shared({ caller }) func syncTreasuryForChild(canister_id : Principal, reset : Bool) : async Text {
    requireAdmin(caller);
    let child = childOrTrap(canister_id);
    await ensureTreasuryOrg(canister_id, child.owner, reset);
    "Success: treasury sync triggered"
  };

  // -------------------- Vault (cycles in/out) --------------------
  public shared({ caller }) func wallet_receive() : async Nat {
    let avail = Cycles.available();
    let accepted = Cycles.accept<system>(avail);
    walletEvents += 1;
    logEvent(caller, null, "factory.wallet_receive", "cycles=" # Nat.toText(accepted));
    accepted
  };

  // -------------------- Ledger (ICRC-1 ICP) + Plug deposits --------------------
  let ICP_LEDGER : Principal = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");

  type IcrcAccount = { owner : Principal; subaccount : ?Blob };

  type IcrcTransferArg = {
    from_subaccount : ?Blob;
    to              : IcrcAccount;
    amount          : Nat;
    fee             : ?Nat;
    memo            : ?Blob;
    created_at_time : ?Nat64;
  };

  type IcrcTransferError = {
    #BadFee                  : { expected_fee : Nat };
    #BadBurn                 : { min_burn_amount : Nat };
    #InsufficientFunds       : { balance : Nat };
    #TooOld                  : Null;
    #CreatedInFuture         : { ledger_time : Nat64 };
    #TemporarilyUnavailable  : Null;
    #Duplicate               : { duplicate_of : Nat };
    #GenericError            : { error_code : Nat; message : Text };
  };


  type IcrcTransferResult = {
    #Ok  : Nat;
    #Err : IcrcTransferError;
  };

  let Ledger : actor {
    icrc1_balance_of : (IcrcAccount) -> async Nat;
    icrc1_transfer   : (IcrcTransferArg) -> async IcrcTransferResult;
  } = actor (Principal.toText(ICP_LEDGER));


  let TREASURY_SUB : Blob = Blob.fromArray(Array.tabulate<Nat8>(32, func _ { 0 }));

  stable var basicPriceE8s : Nat = 100_000_000; // e8s, default ≈ 1 ICP (tune to your target)
  let FEE_E8S   : Nat = 10_000;

  type BasicPayInfo = {
    account_owner: Principal;
    subaccount: Blob;
    amount_e8s: Nat;
    memo: Text;
  };

  func icrcAccount(owner : Principal, sub : Blob) : IcrcAccount {
      { owner = owner; subaccount = ?sub }
    };

  func subaccountForCid(cid : Principal) : Blob {
    let p  = Principal.toBlob(cid);
    let pa = Blob.toArray(p);
    let arr = Array.tabulate<Nat8>(32, func i { if (i < pa.size()) pa[i] else 0 });
    Blob.fromArray(arr)
  };

public query func getBasicPayInfoForChild(cid : Principal) : async BasicPayInfo {
  ignore childOrTrap(cid);
  {
    account_owner = Principal.fromActor(ReputationFactory);
    subaccount = subaccountForCid(cid);
    amount_e8s = basicPriceE8s;
    memo = "Basic plan deposit";
  }
};



  public shared({ caller }) func activateBasicForChildAfterPayment(
    cid : Principal
  ) : async { #ok : Text; #err : Text } {
    // Ensure the child exists
    switch (byId.get(cid)) {
      case null { return #err "unknown canister" };
      case (?c0) {
        let fromPending = switch (c0.plan) {
          case (#BasicPending) true;
          case _ false;
        };

        if (not fromPending and c0.status != #Active) {
          return #err "not active; cannot extend";
        };

        let depSub = subaccountForCid(cid);
        let depAcc = icrcAccount(Principal.fromActor(ReputationFactory), depSub);

        // Check subaccount balance
        let price = basicPriceE8s;
        let bal = await Ledger.icrc1_balance_of(depAcc);
        if (bal < price) {
          return #err ("deposit too low: have=" # Nat.toText(bal) # " need=" # Nat.toText(price));
        };

        // Sweep from the child’s subaccount to treasury
        if (price <= FEE_E8S) {
          Debug.trap("basic price must exceed transfer fee");
        };
        let sweepAmount = price - FEE_E8S;
        let res = await Ledger.icrc1_transfer({
          from_subaccount = ?depSub;
          to              = icrcAccount(Principal.fromActor(ReputationFactory), TREASURY_SUB);
          amount          = sweepAmount;
          fee             = ?FEE_E8S;
          memo            = null;
          created_at_time = null
        });

        switch (res) {
          case (#Ok _) {
            let now = nowNs();
            let expiry = if (fromPending) {
              now + MONTH_NS
            } else if (c0.expires_at > now) {
              c0.expires_at + MONTH_NS
            } else {
              now + MONTH_NS
            };

            if (fromPending) {
              // Attempt to start the canister now that payment cleared
              try { await IC.start_canister({ canister_id = cid }) } catch (_) {};
            };

            let c1 : Child = {
              id = c0.id; owner = c0.owner; created_at = c0.created_at; note = c0.note;
              status = if (fromPending) #Active else c0.status;
              visibility = c0.visibility;
              plan = #Basic;
              expires_at = expiry
            };

            byId.put(cid, c1);

            // update stable store
            let buf = Buffer.Buffer<Child>(store.size());
            for (x in store.vals()) { buf.add(if (x.id == cid) c1 else x) };
            store := Buffer.toArray(buf);

            logEvent(caller, ?cid, "child.activateBasic", "planDuration=30d;fromPending=" # (if (fromPending) "true" else "false"));
            #ok "payment swept; Basic extended for child"
          };
          case (#Err e) { #err ("sweep failed: " # debug_show e) }
        }
      }
    }
  };


  // -------------------- Create / Reuse / CRUD --------------------
  public shared({ caller }) func createChildForOwner(
    owner             : Principal,
    cycles_for_create : Nat,
    controllers       : [Principal],
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

    let init_arg : Blob = to_candid(owner, Principal.fromActor(ReputationFactory));

    await IC.install_code({ mode = #install; canister_id = cid; wasm_module = requireWasm(); arg = init_arg });
    await IC.start_canister({ canister_id = cid });

    let rec : Child = {
      id = cid; owner; created_at = nowNs(); note;
      status = #Active; visibility = #Public; plan = #Basic; expires_at = nowNs() + MONTH_NS
    };
    recordChild(rec);
    logEvent(caller, ?cid, "child.create", "owner=" # Principal.toText(owner) # ";plan=Basic");
    cid
  };

      // helper to read current cycles from the child (already have ChildMgmt above)
  func getChildCycles(cid: Principal) : async Nat {
    let c : ChildMgmt = actor (Principal.toText(cid));
    try { (await c.health()).cycles } catch (_) { 0 }
  };

  public shared({ caller = _ }) func createOrReuseChildFor(
  owner: Principal,
  cycles_for_create: Nat,
  controllers: [Principal],
  note: Text
) : async Principal {
  var reused : Bool = false;
  // Require at least 1T on entry
  if (cycles_for_create < 1_000_000_000_000) {
    Debug.trap("createOrReuseChildFor: must attach at least 1T cycles");
  };

  let defaultCtrls = [Principal.fromActor(ReputationFactory), owner];
  let initArg : Blob = to_candid(owner, Principal.fromActor(ReputationFactory));

  // ---------- REUSE PATH ----------
  if (pool.size() > 0) {
    switch (pool.removeLast()) {
      case (?cid) {
        let have0 = await getChildCycles(cid);
        await topUpInternalGlobal(cid, cycles_for_create-have0);
        await startChild(cid);
        await IC.update_settings({
          canister_id = cid;
          settings = {
            controllers = ?(if (controllers.size() == 0) defaultCtrls else controllers);
            compute_allocation = null; memory_allocation = null; freezing_threshold = null;
          }
        });

        // Reinstall code
        try {
          await IC.install_code({
            mode = #reinstall; canister_id = cid; wasm_module = requireWasm(); arg = initArg
          });

          // Mark as Active/Basic BEFORE backfill (policy checks rely on plan state)
          switch (byId.get(cid)) { case (?old) { removeOwnerIndex(old.owner, cid) }; case null {} };
          let rec : Child = {
            id = cid; owner; created_at = nowNs(); note;
            status = #Active; visibility = #Public; plan = #Basic; expires_at = nowNs() + MONTH_NS
          };
          recordOrRefresh(rec); addOwnerIndex(owner, cid);
          storePool := Buffer.toArray(pool);

          // Backfill to ensure ≥ cycles_for_create after mgmt burns
          let have = await getChildCycles(cid);
          if (have < cycles_for_create) {
            let need = cycles_for_create - have;
            await topUpInternalGlobal(cid, need);
          };

          await ensureTreasuryOrg(cid, owner, true);
          reused := true;
          return cid;

        } catch (_) {
          // put it back and fall through to fresh create
          pool.add(cid); storePool := Buffer.toArray(pool);
        };
      };
      case null {};
    };
  };

  // ---------- FRESH CREATE ----------
  let res = await (with cycles = cycles_for_create) IC.create_canister({
    settings = ?{
      controllers = ?(if (controllers.size() == 0) defaultCtrls else controllers);
      compute_allocation = null; memory_allocation = null; freezing_threshold = null;
    }
  });
  let cid = res.canister_id;

  await IC.install_code({ mode = #install; canister_id = cid; wasm_module = requireWasm(); arg = initArg });
  await IC.start_canister({ canister_id = cid });

  // Record as Active/Basic BEFORE backfill (policy checks rely on plan state)
  let recFresh : Child = {
    id = cid; owner; created_at = nowNs(); note;
    status = #Active; visibility = #Public; plan = #Basic; expires_at = nowNs() + MONTH_NS
  };
  recordChild(recFresh);
  await ensureTreasuryOrg(cid, owner, false);

  // Backfill to guarantee ≥ cycles_for_create after creation overhead
  let have = await getChildCycles(cid);
  if (have < cycles_for_create) {
    let need = cycles_for_create - have;
    await topUpInternalGlobal(cid, need);
  };

  return cid;
};



    /// Public: one-time Trial (1T upfront, 30d expiry), no top-ups.
    public shared({ caller }) func createTrialForSelf(note : Text) : async { #ok : Principal; #err : Text } {
      let owner = caller;
      if (not isTrialAllowedFor(owner)) { return #err "Trial already used for this owner" };

      let cid = await createOrReuseChildFor(owner, 1000000000000, [], note);//1T
      let c0 = childOrTrap(cid);
    let c1 : Child = {
      id = c0.id; owner = c0.owner; created_at = c0.created_at; note = c0.note;
      status = c0.status; visibility = c0.visibility; plan = #Trial; expires_at = nowNs() + MONTH_NS
  };
  updateChild(c1);
  markTrialUsed(owner);
  logEvent(caller, ?cid, "child.createTrial", "owner=" # Principal.toText(owner) # ";note=" # note);
  #ok cid
};

  /// Public: Basic plan (activate/extend via Plug payment).
  public shared({ caller }) func createBasicForSelf(note : Text) : async Principal {
    let owner = caller;
    let cid = await createOrReuseChildFor(owner, 1000000000000, [], note);
    let c0 = childOrTrap(cid);
    let c1 : Child = {
      id = c0.id; owner = c0.owner; created_at = c0.created_at; note = c0.note;
      status = c0.status; visibility = c0.visibility; plan = #Basic; expires_at = nowNs() + MONTH_NS
    };
    updateChild(c1);
    logEvent(caller, ?cid, "child.createBasic", "note=" # note);
    cid
  };

  /// Public: Reserve Basic plan, require payment before activation.
  public shared({ caller }) func createBasicPendingForSelf(note : Text) : async {
    cid : Principal;
    payment : BasicPayInfo;
  } {
    let owner = caller;
    let cid = await createOrReuseChildFor(owner, 1_000_000_000_000, [], note);

    // Pause canister until payment clears
    try {
      await IC.stop_canister({ canister_id = cid });
    } catch (_) {};

    let base = childOrTrap(cid);
    let pending : Child = {
      id = base.id;
      owner = base.owner;
      created_at = base.created_at;
      note = base.note;
      status = #Archived;
      visibility = base.visibility;
      plan = #BasicPending;
      expires_at = 0;
    };
    updateChild(pending);
        logEvent(caller, ?cid, "child.createBasicPending", "note=" # note # ";amount=" # Nat.toText(basicPriceE8s));

    {
      cid;
      payment = {
        account_owner = Principal.fromActor(ReputationFactory);
        subaccount = subaccountForCid(cid);
        amount_e8s = basicPriceE8s;
        memo = "Basic plan deposit";
      };
    }
  };

  /// Archive a child back to pool.
  public shared({ caller }) func archiveChild(canister_id : Principal) : async Text {
    requireOrgAdmin(caller, canister_id);
    switch (byId.get(canister_id)) {
      case null { "Error: unknown canister" };
      case (?c) {
        let childDrain : ChildDrain = actor (Principal.toText(canister_id));
        ignore await childDrain.returnCyclesToFactory(100_000_000_000);

        await IC.update_settings({
          canister_id = canister_id;
          settings = {
            controllers = ?[Principal.fromActor(ReputationFactory)];
            compute_allocation = null; memory_allocation = null; freezing_threshold = null;
          }
        });

        let c2 : Child = {
          id = canister_id; owner = c.owner; created_at = c.created_at; note = c.note;
          status = #Archived; visibility = c.visibility; plan = c.plan; expires_at = c.expires_at
        };
        updateChild(c2);

        removeOwnerIndex(c.owner, c.id);
        pool.add(c.id); storePool := Buffer.toArray(pool);
        logEvent(caller, ?canister_id, "child.archive", "note=" # c.note);
        await archiveTreasuryOrg(canister_id);
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
    pool := np; storePool := Buffer.toArray(pool);

    logEvent(caller, ?canister_id, "child.delete", "");
    await archiveTreasuryOrg(canister_id);
    "Success: deleted"
  };

  // -------------------- Lifecycle helpers --------------------
  public shared({ caller }) func upgradeChild(canister_id : Principal) : async () {
    requireOrgAdmin(caller, canister_id);
    let child = childOrTrap(canister_id);
    await IC.install_code({
      mode = #upgrade; canister_id; wasm_module = requireWasm();
      arg = to_candid(child.owner, Principal.fromActor(ReputationFactory))
    });
    logEvent(caller, ?canister_id, "child.upgrade", "");
  };

  public shared({ caller }) func reinstallChild(canister_id : Principal, owner : Principal, factory : Principal) : async () {
    requireOrgAdmin(caller, canister_id);
    let arg : Blob = to_candid(owner, factory);
    await IC.stop_canister({ canister_id });
    await IC.install_code({ mode = #reinstall; canister_id = canister_id; wasm_module = requireWasm(); arg });
    await IC.start_canister({ canister_id });
    logEvent(caller, ?canister_id, "child.reinstall", "owner=" # Principal.toText(owner));
  };

  public shared({ caller }) func startChild(canister_id : Principal) : async () {
    requireOrgAdmin(caller, canister_id);
    let c = childOrTrap(canister_id);
    switch (c.plan) {
      case (#BasicPending) {
        Debug.trap("cannot start child while payment is pending");
      };
      case (_) {
        await IC.start_canister({ canister_id = canister_id })
      };
    };
    logEvent(caller, ?canister_id, "child.start", "");
  };

  public shared({ caller }) func stopChild(canister_id : Principal) : async () {
    requireOrgAdmin(caller, canister_id); await IC.stop_canister({ canister_id = canister_id });
    logEvent(caller, ?canister_id, "child.stop", "");
  };

  public shared({ caller }) func reassignOwner(canister_id : Principal, newOwner : Principal) : async Text {
    requireOrgAdmin(caller, canister_id);
    switch (byId.get(canister_id)) {
      case null { "Error: unknown canister" };
      case (?c) {
        removeOwnerIndex(c.owner, canister_id);
        let c2 : Child = {
          id = canister_id; owner = newOwner; created_at = c.created_at; note = c.note;
          status = c.status; visibility = c.visibility; plan = c.plan; expires_at = c.expires_at
        };
        updateChild(c2); addOwnerIndex(newOwner, canister_id);
        logEvent(caller, ?canister_id, "child.reassign", "owner=" # Principal.toText(newOwner));
        await ensureTreasuryOrg(canister_id, newOwner, false);
        "Success: owner updated"
      }
    }
  };

  // -------------------- Policy-enforced top-ups --------------------
  public shared({ caller }) func topUpChild(canister_id : Principal, amount : Nat)
    : async { #ok : Nat; #err : Text } {
    requireOrgAdmin(caller, canister_id);
    await checkAndAutoArchive(canister_id);

    let c = childOrTrap(canister_id);
    if (c.status == #Archived) {
      return #err "Archived: cannot top up. Renew plan or create a new child.";
    };
    switch (c.plan) {
      case (#Trial) { return #err "Trial plan: top-ups are not allowed" };
      case (#BasicPending) { return #err "Pending payment: finalize activation before topping up" };
      case (#Basic) {
        let used = getUsedToday(canister_id);
        if (used >= ONE_T) { return #err "Daily cap reached (1T)" };
        if (used + amount > ONE_T) {
          return #err ("Daily cap exceeded: remaining=" # Nat.toText(ONE_T - used));
        };
        let target : ChildWallet = actor (Principal.toText(canister_id));
        try {
          let accepted = await (with cycles = amount) target.wallet_receive();
          if (accepted != amount) { logEvent(caller, ?canister_id, "child.topUp", "partial=" # Nat.toText(accepted)); return #err ("accepted=" # Nat.toText(accepted)) };
          addUsedToday(canister_id, amount);
          logEvent(caller, ?canister_id, "child.topUp", "amount=" # Nat.toText(amount));
          #ok accepted
        } catch (_) {
          logEvent(caller, ?canister_id, "child.topUpFailed", "amount=" # Nat.toText(amount));
          #err "transfer failed"
        }
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

  func computeCounts() : { total : Nat; active : Nat; archived : Nat } {
    var a : Nat = 0; var r : Nat = 0;
    for (c in store.vals()) { switch (c.status) { case (#Active) { a += 1 }; case (#Archived) { r += 1 } } };
    { total = store.size(); active = a; archived = r }
  };

  public query func counts() : async { total : Nat; active : Nat; archived : Nat } {
    computeCounts()
  };

  public query func factoryHealth() : async {
    schemaVersion : Nat;
    admin : Principal;
    treasury : ?Principal;
    wasmSet : Bool;
    totals : { total : Nat; active : Nat; archived : Nat };
    pool : Nat;
    vaultCycles : Nat;
    walletEvents : Nat;
    treasuryUsage : { day : Nat64; used : Nat; cap : Nat };
  } {
    {
      schemaVersion;
      admin;
      treasury = treasuryPrincipal;
      wasmSet = wasm != null;
      totals = computeCounts();
      pool = pool.size();
      vaultCycles = Cycles.balance();
      walletEvents;
      treasuryUsage = { day = treasuryUsageDay; used = treasuryUsageAmount; cap = TREASURY_DAILY_CAP };
    }
  };

  public query func listAuditEvents(offset : Nat, limit : Nat) : async [AuditEvent] {
    sliceWindow(auditLog, offset, limit)
  };

  public query func auditEventCount() : async Nat { auditLog.size() };

  public query func getChildExtended(canister_id : Principal) : async ?{
    child : Child;
    lastEvent : ?AuditEvent;
  } {
    switch (byId.get(canister_id)) {
      case (?c) { ?{ child = c; lastEvent = latestChildEvent(canister_id) } };
      case null null;
    }
  };

  public shared({ caller }) func childHealth(cid : Principal)
    : async ?{ paused : Bool; cycles : Nat; users : Nat; txCount : Nat; topUpCount : Nat; decayConfigHash : Nat } {
    requireOrgAdmin(caller, cid);
    let c : ChildMgmt = actor (Principal.toText(cid));
    ?(await c.health())
  };

  public shared({ caller }) func adminSetPool(newPool : [Principal]) : async Text {
    requireAdmin(caller);
    let b = Buffer.Buffer<Principal>(newPool.size());
    for (cid in newPool.vals()) { b.add(cid) };
    pool := b; storePool := Buffer.toArray(pool);
    logEvent(caller, null, "factory.setPool", "size=" # Nat.toText(newPool.size()));
    "ok"
  };

  public shared({ caller }) func adminDrainChild(canister_id : Principal, minRemain : Nat) : async Nat {
    requireAdmin(caller);
    let child : ChildDrain = actor (Principal.toText(canister_id));
    try {
      let drained = await child.returnCyclesToFactory(minRemain);
      logEvent(caller, ?canister_id, "child.drainCycles", "returned=" # Nat.toText(drained));
      drained
    } catch (_) { 0 }
  };

  public shared({ caller }) func toggleVisibility(canister_id : Principal) : async Visibility {
    requireOrgAdmin(caller, canister_id);
    let c = childOrTrap(canister_id);
    let next : Visibility = switch (c.visibility) { case (#Public) #Private; case (#Private) #Public };
    let c2 : Child = {
      id = c.id; owner = c.owner; created_at = c.created_at; note = c.note;
      status = c.status; visibility = next; plan = c.plan; expires_at = c.expires_at
    };
    updateChild(c2);
    logEvent(caller, ?canister_id, "child.toggleVisibility", if (next == #Public) "Public" else "Private");
    next
  };

  // -------------------- Expiry sweeper & migration --------------------
  public shared({ caller }) func adminArchiveExpired(limit : Nat) : async Nat {
    requireAdmin(caller);
    var archived : Nat = 0;
    let now = nowNs();
    label L for (c in store.vals()) {
      if (archived == limit) break L;
      if (c.status == #Active and c.expires_at <= now) {
        ignore await archiveChild(c.id); archived += 1;
      }
    };
    logEvent(caller, null, "factory.archiveExpired", "count=" # Nat.toText(archived));
    archived
  };

  public shared({ caller }) func adminBackfillPlanDefaults(plan : Plan) : async Text {
    requireAdmin(caller);
    let now = nowNs();
    let buf = Buffer.Buffer<Child>(store.size());
    for (c in store.vals()) {
      let base = if (c.expires_at > now) c.expires_at else now;
      let c2 : Child = {
        id = c.id; owner = c.owner; created_at = c.created_at; note = c.note;
        status = c.status; visibility = c.visibility; plan = plan; expires_at = base + MONTH_NS
      };
      byId.put(c.id, c2); buf.add(c2);
    };
    store := Buffer.toArray(buf);
    logEvent(caller, null, "factory.backfillPlan", "plan updated");
    "ok"
  };

  // Send ICP from the factory TREASURY_SUB to any ICRC-1 account (e.g., your Plug account)
public shared({ caller }) func adminTreasuryWithdraw(
  to_owner : Principal,          // your Plug principal
  to_sub   : ?Blob,              // usually null for Plug
  amount_e8s : Nat               // amount the recipient should receive, in e8s
) : async { #ok : Nat; #err : Text } {
  requireAdmin(caller);
  enforceTreasuryCap(amount_e8s);

  // Check treasury balance first
  let fromAcc = icrcAccount(Principal.fromActor(ReputationFactory), TREASURY_SUB);
  let bal     = await Ledger.icrc1_balance_of(fromAcc);
  // icrc1_transfer will debit (amount + fee) from the treasury
  let needed  = amount_e8s + FEE_E8S;
  if (bal < needed) {
    return #err ("insufficient treasury: have=" # Nat.toText(bal) # " need=" # Nat.toText(needed));
  };

  // Perform transfer (recipient gets `amount_e8s`; fee is charged separately to the treasury)
  let res = await Ledger.icrc1_transfer({
    from_subaccount = ?TREASURY_SUB;
    to              = { owner = to_owner; subaccount = to_sub };
    amount          = amount_e8s;
    fee             = ?FEE_E8S;
    memo            = null;
    created_at_time = null
  });

  switch (res) {
    case (#Ok tx)  {
      logEvent(caller, null, "treasury.withdraw", "amount=" # Nat.toText(amount_e8s) # ";target=" # Principal.toText(to_owner));
      #ok tx
    };
    case (#Err e)  { #err ("transfer failed: " # debug_show e) };
  }
};
public shared({ caller }) func adminForceArchive(canister_id : Principal) : async Text {
  requireAdmin(caller);
  switch (byId.get(canister_id)) {
    case null { return "Error: unknown canister" };
    case (?c0) {
      // Best-effort stop (ok if already stopped)
      try { await IC.stop_canister({ canister_id }) } catch (_) {};

      // Take control so Factory owns it
      await IC.update_settings({
        canister_id;
        settings = {
          controllers = ?[Principal.fromActor(ReputationFactory)];
          compute_allocation = null; memory_allocation = null; freezing_threshold = null;
        }
      });

      // Normalize plan: BasicPending -> Basic (so start/reuse won't trap)
      let now  = nowNs();
      let planNorm : Plan = switch (c0.plan) {
        case (#BasicPending) #Basic;
        case (p) p
      };

      // If it was pending it often had expires_at = 0; give it a sane window
      let expBase : Nat64 =
        if (c0.expires_at == 0) now
        else if (c0.expires_at > now) c0.expires_at
        else now;

      let c1 : Child = {
        id         = canister_id;
        owner      = c0.owner;
        created_at = c0.created_at;
        note       = c0.note;
        status     = #Archived;        // keep archived
        visibility = c0.visibility;
        plan       = planNorm;         // <- Basic if it was BasicPending
        expires_at = expBase + MONTH_NS;
      };

      // Update registry + indices
      updateChild(c1);
      removeOwnerIndex(c0.owner, canister_id);

      // De-dupe pool then add
      for (x in pool.vals()) {
        if (x == canister_id) {
          storePool := Buffer.toArray(pool);
          return "already in pool";
        }
      };
      pool.add(canister_id);
      storePool := Buffer.toArray(pool);

      logEvent(caller, ?canister_id, "child.forceArchive", "");
      await archiveTreasuryOrg(canister_id);
      "Success: force-archived (pending normalized)"
    }
  }
};

  /// Admin: reattach a canister that is not (or no longer) tracked in byId/store.
  /// This lets the factory "remember" an orphan child and optionally add it to the reuse pool.
  public shared({ caller }) func adminReattachChild(
    canister_id : Principal,
    owner       : Principal,
    note        : Text,
    visibility  : Visibility,
    plan        : Plan,
    status      : ?Status,   // if null -> default to #Archived
    expires_opt : ?Nat64,    // if null or 0 -> use now + MONTH_NS
    addToPool   : Bool
  ) : async Text {
    requireAdmin(caller);

    // Best-effort: ensure Factory (and optionally owner) are controllers.
    // If Factory isn't a controller anymore, this may fail, but we ignore errors.
    try {
      await IC.update_settings({
        canister_id;
        settings = {
          controllers = ?[Principal.fromActor(ReputationFactory), owner];
          compute_allocation = null;
          memory_allocation  = null;
          freezing_threshold = null;
        };
      });
    } catch (_) {};

    let now = nowNs();

    let finalStatus : Status = switch (status) {
      case (?s) s;
      case null #Archived;
    };

    let expBase : Nat64 = switch (expires_opt) {
      case (?e) {
        if (e == 0) now else e;
      };
      case null now;
    };

    let c : Child = {
      id         = canister_id;
      owner      = owner;
      created_at = now;                 // we don't know the old created_at; treat this as reattached time
      note       = note;
      status     = finalStatus;
      visibility = visibility;
      plan       = plan;
      expires_at = expBase + MONTH_NS;  // give it a sane window
    };

    // This updates byId, store, and storeOwnerPairs (dedup aware)
    recordOrRefresh(c);

    if (addToPool) {
      var already : Bool = false;
      for (x in pool.vals()) {
        if (x == canister_id) {
          already := true;
        };
      };
      if (not already) {
        pool.add(canister_id);
        storePool := Buffer.toArray(pool);
      };
    };

    await ensureTreasuryOrg(canister_id, owner, false);
    "Success: reattached child " # Principal.toText(canister_id)
  };

}
