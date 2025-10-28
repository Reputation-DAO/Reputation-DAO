// ReputationChild.mo — Unit child canister for Reputation DAO (single-org)
// Stripped + consolidated: single org, factory-friendly, with safety rails & analytics.
// Motoko 0.10+

import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Cycles "mo:base/ExperimentalCycles";
import Nat32 "mo:base/Nat32";


// Actor class so Factory can pass the admin/owner at deploy time
actor class ReputationChild(initOwner : Principal, initFactory : Principal) = this {
  // ——— Types ———
  //Defining a type for TransactionType Enum
  stable var factory : Principal = initFactory;
  public type TransactionType = { #Award; #Revoke; #Decay };

  //Transaction Item Object
  public type Transaction = {
    id: Nat;
    transactionType: TransactionType;
    from: Principal;
    to: Principal;
    amount: Nat;
    timestamp: Nat; // seconds
    reason: ?Text;
  };

  // Awarder Object
  public type Awarder = { id: Principal; name: Text };

  public type DecayConfig = {
    decayRate: Nat;        // basis points; 100 = 1%
    decayInterval: Nat;    // seconds between decays
    minThreshold: Nat;     // no decay below this balance
    gracePeriod: Nat;      // seconds since first activity
    enabled: Bool;
  };

  public type UserDecayInfo = {
    lastDecayTime: Nat;
    registrationTime: Nat;
    lastActivityTime: Nat;
    totalDecayed: Nat;
  };

  public type Event = { id: Nat; kind: Text; payload: Blob; timestamp: Nat };

  public type AwarderBreakdown = { awarder: Principal; total: Nat; lastAward: Nat };

  // NEW: Dedicated top-up record (kept separate from reputation txns)
  public type TopUp = { id: Nat; from: Principal; amount: Nat; timestamp: Nat };

  // ——— Stable State ———
  stable var owner : Principal = initOwner; // admin/owner of this child
  stable var pendingOwner : ?Principal = null; // for two-step transfer

  // Policy knobs
  stable var paused : Bool = false; // 1) pause switch
  stable var dailyMintLimit : Nat = 50; // per-awarder per 24h (default)
  stable var perAwarderDailyLimit : Trie.Trie<Principal, Nat> = Trie.empty(); // 2) overrides
  stable var blacklistT : Trie.Trie<Principal, Bool> = Trie.empty(); // 3) blacklist
  stable var minCyclesAlert : Nat = 0; // cycles alert threshold
  stable let VERSION : Text = "1.0.1";

  // Balances & Awarders use Trie for O(log n)
  stable var balances : Trie.Trie<Principal, Nat> = Trie.empty();
  stable var trustedAwarders : Trie.Trie<Principal, Text> = Trie.empty();
  stable var dailyMinted : Trie.Trie<Principal, Nat> = Trie.empty();
  stable var lastMintTimestamp : Trie.Trie<Principal, Nat> = Trie.empty();

  stable var userDecayInfo : Trie.Trie<Principal, UserDecayInfo> = Trie.empty();

  stable var transactionHistory : [Transaction] = []; // ONLY Award/Revoke/Decay
  stable var nextTransactionId : Nat = 1;
  stable var totalDecayedPoints : Nat = 0;
  stable var lastGlobalDecayProcess : Nat = 0;
  
  // Dedicated cycles top-up log (separate from reputation txns)
  stable var topUps : [TopUp] = [];
  stable var nextTopUpId : Nat = 1;

  stable var decayConfig : DecayConfig = {
    decayRate = 500;        // 5%
    decayInterval = 2_592_000; // 30 days
    minThreshold = 10;
    gracePeriod = 2_592_000;   // 30 days
    enabled = false; // decay is turned off by default
  };

  // events / parent (DX)
  stable var parent : ?Principal = null;
  stable var events : [Event] = [];
  stable var nextEventId : Nat = 1;

  // ——— Utils ———
  func now() : Nat { Int.abs(Time.now() / 1_000_000_000) }; // seconds
  func pKey(p: Principal) : Trie.Key<Principal> { { key = p; hash = Principal.hash(p) } };

  func getBalance_(p: Principal) : Nat {
    switch (Trie.get(balances, pKey(p), Principal.equal)) { case (?b) b; case null 0 };
  };

  func putBalance_(p: Principal, v: Nat) { balances := Trie.put(balances, pKey(p), Principal.equal, v).0 };

  func isTrusted_(p: Principal) : Bool {
    switch (Trie.get(trustedAwarders, pKey(p), Principal.equal)) { case (?_) true; case null false };
  };

  func isBlacklisted_(p: Principal) : Bool {
    switch (Trie.get(blacklistT, pKey(p), Principal.equal)) { case (?true) true; case _ false };
  };

  func effectiveDailyLimit_(awardee: Principal) : Nat {
    switch (Trie.get(perAwarderDailyLimit, pKey(awardee), Principal.equal)) { case (?lim) lim; case null dailyMintLimit };
  };

  func bumpDaily_(awardee: Principal, amount: Nat) : { ok: Bool; mintedToday: Nat } {
    let t = now();
    let day = 86_400;
    let lm = switch (Trie.get(lastMintTimestamp, pKey(awardee), Principal.equal)) { case (?x) x; case null 0 };
    let minted = if (lm == 0 or t >= lm + day) { 0 } else switch (Trie.get(dailyMinted, pKey(awardee), Principal.equal)) { case (?x) x; case null 0 };
    let limit = effectiveDailyLimit_(awardee);
    if (minted + amount > limit) { { ok = false; mintedToday = minted } } else {
      dailyMinted := Trie.put(dailyMinted, pKey(awardee), Principal.equal, minted + amount).0;
      lastMintTimestamp := Trie.put(lastMintTimestamp, pKey(awardee), Principal.equal, t).0;
      { ok = true; mintedToday = minted + amount }
    };
  };

  func addTx(txType: TransactionType, from: Principal, to: Principal, amount: Nat, reason: ?Text) {
    let tx : Transaction = {
      id = nextTransactionId;
      transactionType = txType;
      from = from;
      to = to;
      amount = amount;
      timestamp = now();
      reason = reason;
    };
    let buf = Buffer.fromArray<Transaction>(transactionHistory);
    buf.add(tx);
    transactionHistory := Buffer.toArray(buf);
    nextTransactionId += 1;
  };

  func addTopUp(from: Principal, amount: Nat) {
    let t : TopUp = { id = nextTopUpId; from = from; amount = amount; timestamp = now() };
    let buf = Buffer.fromArray<TopUp>(topUps); buf.add(t); topUps := Buffer.toArray(buf); nextTopUpId += 1;
  };

  func emit(kind: Text, payload: Blob) { // internal
    let e : Event = { id = nextEventId; kind; payload; timestamp = now() };
    let buf = Buffer.fromArray<Event>(events); buf.add(e); events := Buffer.toArray(buf); nextEventId += 1;
  };

  func initDecayInfo_(p: Principal) : UserDecayInfo {
    switch (Trie.get(userDecayInfo, pKey(p), Principal.equal)) {
      case (?info) info;
      case null {
        let t = now();
        let info : UserDecayInfo = { lastDecayTime = t; registrationTime = t; lastActivityTime = t; totalDecayed = 0 };
        userDecayInfo := Trie.put(userDecayInfo, pKey(p), Principal.equal, info).0; info
      }
    };
  };

  func calcDecay_(p: Principal, bal: Nat) : Nat {
    if (not decayConfig.enabled) return 0;
    if (bal < decayConfig.minThreshold) return 0;
    let info = initDecayInfo_(p);
    let t = now();
    if (t < info.registrationTime + decayConfig.gracePeriod) return 0;
    if (t < info.lastDecayTime + decayConfig.decayInterval) return 0;
    let elapsed = if (t >= info.lastDecayTime) Nat.sub(t, info.lastDecayTime) else 0;
    let periods = if (decayConfig.decayInterval > 0) elapsed / decayConfig.decayInterval else 1;
    if (periods == 0) return 0;
    let raw = (bal * decayConfig.decayRate * periods) / 10_000;
    if (bal >= raw) {
      let nb = Nat.sub(bal, raw);
      if (nb < decayConfig.minThreshold and bal >= decayConfig.minThreshold) Nat.sub(bal, decayConfig.minThreshold) else raw
    } else if (bal > decayConfig.minThreshold) { Nat.sub(bal, decayConfig.minThreshold) } else 0 ;
  };

  func touchActivity_(p: Principal) {
    let info = initDecayInfo_(p);
    let info2 : UserDecayInfo = { lastDecayTime = info.lastDecayTime; registrationTime = info.registrationTime; lastActivityTime = now(); totalDecayed = info.totalDecayed };
    userDecayInfo := Trie.put(userDecayInfo, pKey(p), Principal.equal, info2).0;
  };

  func applyDecay_(p: Principal) : Nat {
    let bal = getBalance_(p);
    if (bal == 0) return 0;
    let d = calcDecay_(p, bal);
    if (d == 0) return 0;
    let nb = if (bal >= d) Nat.sub(bal, d) else 0; putBalance_(p, nb);
    let info = initDecayInfo_(p); let t = now();
    let elapsed = if (t >= info.lastDecayTime) Nat.sub(t, info.lastDecayTime) else 0;
    let k = if (decayConfig.decayInterval > 0) elapsed / decayConfig.decayInterval else 1;
    let rolled = info.lastDecayTime + (k * decayConfig.decayInterval);
    let info2 : UserDecayInfo = { lastDecayTime = rolled; registrationTime = info.registrationTime; lastActivityTime = info.lastActivityTime; totalDecayed = info.totalDecayed + d };
    userDecayInfo := Trie.put(userDecayInfo, pKey(p), Principal.equal, info2).0;
    totalDecayedPoints += d; addTx(#Decay, p, p, d, ?"Automatic point decay"); d
  };

  // ——— Admin / Policy ———
  public shared({ caller }) func transferOwnership(newOwner: Principal) : async Text {
    if (caller != owner) return "Error: Only owner"; owner := newOwner; "Success: owner updated"
  };

  public shared({ caller }) func nominateOwner(candidate: Principal) : async Text {
    if (caller != owner) return "Error: Only owner"; pendingOwner := ?candidate; "Success: pending owner set"
  };

  public shared({ caller }) func acceptOwnership() : async Text {
    switch (pendingOwner) {
      case (?p) { if (caller != p) return "Error: Not nominated"; owner := p; pendingOwner := null; "Success: ownership accepted" };
      case null { "Error: No pending owner" }
    }
  };

  public shared({ caller }) func configureDecay(decayRate: Nat, decayInterval: Nat, minThreshold: Nat, gracePeriod: Nat, enabled: Bool) : async Text {
    if (caller != owner) return "Error: Only owner";
    decayConfig := { decayRate; decayInterval; minThreshold; gracePeriod; enabled }; "Success: Decay config updated"
  };

  public shared({ caller }) func setDailyMintLimit(limit: Nat) : async Text {
    if (caller != owner) return "Error: Only owner"; dailyMintLimit := limit; "Success: Daily limit updated"
  };

  public shared({ caller }) func setPerAwarderDailyLimit(awardee: Principal, limit: Nat) : async Text {
    if (caller != owner) return "Error: Only owner";
    perAwarderDailyLimit := Trie.put(perAwarderDailyLimit, pKey(awardee), Principal.equal, limit).0; "Success: Per-awarder limit set"
  };

  public shared({ caller }) func blacklist(user: Principal, on: Bool) : async Text {
    if (caller != owner) return "Error: Only owner";
    let v = if (on) ?true else null; let (t, _) = Trie.replace(blacklistT, pKey(user), Principal.equal, v); blacklistT := t;
    "Success: blacklist updated"
  };

  public shared({ caller }) func pause(p: Bool) : async Text {
    if (caller != owner) return "Error: Only owner"; paused := p; "Success: pause=" # (if (p) "true" else "false")
  };

  public shared({ caller }) func setParent(canisterId: Principal) : async Text {
    if (caller != owner) return "Error: Only owner"; parent := ?canisterId; "Success: parent set"
  };

  public shared({ caller }) func setMinCyclesAlert(threshold: Nat) : async Text {
    if (caller != owner) return "Error: Only owner"; minCyclesAlert := threshold; "Success: alert set"
  };

  // ——— Award / Revoke ———
  public shared({ caller }) func addTrustedAwarder(p: Principal, name: Text) : async Text {
    if (caller != owner) return "Error: Only owner";
    if (paused) return "Error: Paused";
    if (isBlacklisted_(p)) return "Error: Awarder blacklisted";
    switch (Trie.get(trustedAwarders, pKey(p), Principal.equal)) { case (?_) { return "Error: Exists" }; case null {} };
    trustedAwarders := Trie.put(trustedAwarders, pKey(p), Principal.equal, name).0; "Success: Awarder added"
  };

  public shared({ caller }) func removeTrustedAwarder(p: Principal) : async Text {
    if (caller != owner) return "Error: Only owner";
    let (t1, _) = Trie.replace(trustedAwarders, pKey(p), Principal.equal, null); trustedAwarders := t1;
    let (t2, _) = Trie.replace(dailyMinted, pKey(p), Principal.equal, null); dailyMinted := t2;
    let (t3, _) = Trie.replace(lastMintTimestamp, pKey(p), Principal.equal, null); lastMintTimestamp := t3;
    let (t4, _) = Trie.replace(perAwarderDailyLimit, pKey(p), Principal.equal, null); perAwarderDailyLimit := t4;
    "Success: Awarder removed"
  };

  public shared({ caller }) func awardRep(to: Principal, amount: Nat, reason: ?Text) : async Text {
    if (paused) return "Error: Paused";
    if (amount == 0) return "Error: Amount must be > 0";
    if (caller == to) return "Error: Cannot self-award";
    if (isBlacklisted_(caller) or isBlacklisted_(to)) return "Error: Blacklisted principal";
    if (not isTrusted_(caller)) return "Error: Not a trusted awarder";
    ignore applyDecay_(to);
    let bump = bumpDaily_(caller, amount);
    if (not bump.ok) return "Error: Daily mint cap exceeded";
    let bal = getBalance_(to); putBalance_(to, bal + amount);
    addTx(#Award, caller, to, amount, reason); touchActivity_(to);
    Debug.print("Awarded " # Nat.toText(amount) # " to " # Principal.toText(to)); "Success: " # Nat.toText(amount) # " points awarded"
  };

  public shared({ caller }) func multiAward(pairs: [(Principal, Nat, ?Text)], atomic: Bool) : async Text {
    if (paused) return "Error: Paused";
    if (not isTrusted_(caller)) return "Error: Not a trusted awarder";
    // Precheck for atomic
    if (atomic) {
      // ensure all pass caps/blacklist upfront
      for ((to, amount, _r) in pairs.vals()) {
        if (amount == 0 or caller == to or isBlacklisted_(caller) or isBlacklisted_(to)) return "Error: Atomic precheck failed";
        let tmp = bumpDaily_(caller, 0); // read current
        let lim = effectiveDailyLimit_(caller);
        if (tmp.mintedToday + amount > lim) return "Error: Daily cap would be exceeded";
      }
    };
    var success : Nat = 0;
    for ((to, amount, r) in pairs.vals()) {
      if (amount == 0 or caller == to or isBlacklisted_(caller) or isBlacklisted_(to)) { if (atomic) return "Error: Atomic fail" } else {
        let bump = bumpDaily_(caller, amount);
        if (not bump.ok) { if (atomic) return "Error: Atomic daily cap fail" } else {
          ignore applyDecay_(to); let bal = getBalance_(to); putBalance_(to, bal + amount); addTx(#Award, caller, to, amount, r); touchActivity_(to); success += 1
        }
      }
    };
    "Success: awarded to " # Nat.toText(success) # " users"
  };

  public shared({ caller }) func revokeRep(from: Principal, amount: Nat, reason: ?Text) : async Text {
    if (paused) return "Error: Paused";
    if (caller != owner) return "Error: Only owner can revoke";
    if (isBlacklisted_(from)) return "Error: Blacklisted principal";
    if (amount == 0) return "Error: Amount must be > 0";
    ignore applyDecay_(from);
    let bal = getBalance_(from);
    if (bal == 0) return "Error: User has no points";
    if (bal < amount) return "Error: Insufficient balance to revoke";
    putBalance_(from, Nat.sub(bal, amount)); addTx(#Revoke, caller, from, amount, reason); touchActivity_(from);
    Debug.print("Revoked " # Nat.toText(amount) # " from " # Principal.toText(from)); "Success: " # Nat.toText(amount) # " points revoked"
  };

  public shared({ caller }) func resetUser(user: Principal, reason: ?Text) : async Text {
    if (caller != owner) return "Error: Only owner";
    putBalance_(user, 0); addTx(#Revoke, caller, user, 0, reason); touchActivity_(user); "Success: user reset"
  };

  // ——— Queries ———
  public query func getBalance(p: Principal) : async Nat { getBalance_(p) };

  public query func getTrustedAwarders() : async [Awarder] {
    let buf = Buffer.Buffer<Awarder>(0);
    for ((k, v) in Trie.iter(trustedAwarders)) { buf.add({ id = k; name = v }) };
    Buffer.toArray(buf)
  };

  public query func getTransactionHistory() : async [Transaction] {
    let n = transactionHistory.size();
    Array.tabulate<Transaction>(
      n,
      func(i) = transactionHistory[n - 1 - i]  // flip the index
    )
  };


  public query func getTransactionsPaged(offset: Nat, limit: Nat) : async [Transaction] {
    let n = transactionHistory.size();
    if (offset >= n) { return [] };

    let end  = Nat.sub(n, offset);          // slice end (exclusive)
    let take = Nat.min(limit, end);

    Array.tabulate<Transaction>(
      take,
      func(i) = transactionHistory[end - 1 - i]  // reverse within the window
    )
  };


  public query func getTransactionsByUser(user: Principal) : async [Transaction] {
    Array.filter<Transaction>(transactionHistory, func(tx) { Principal.equal(tx.from, user) or Principal.equal(tx.to, user) })
  };

  public query func findTransactionsByReason(substr: Text, limit: Nat) : async [Transaction] {
    if (limit == 0) { return []; };

    let buf = Buffer.Buffer<Transaction>(0);
    let n = transactionHistory.size();

    var i : Nat = 0;
    while (i < n and buf.size() < limit) {
      let tx = transactionHistory[i];
      switch (tx.reason) {
        case (?r) {
          if (textContains_(r, substr)) { buf.add(tx) };
        };
        case null {};
      };
      i += 1;
    };

    Buffer.toArray(buf)
  };



  func textContains_(hay: Text, needle: Text) : Bool {
    // build char arrays
    let hb = Buffer.Buffer<Char>(0);
    for (c in hay.chars()) { hb.add(c) };
    let nb = Buffer.Buffer<Char>(0);
    for (c in needle.chars()) { nb.add(c) };

    let H = Buffer.toArray(hb);
    let N = Buffer.toArray(nb);

    let hLen = H.size();
    let nLen = N.size();

    if (nLen == 0) return true;
    if (nLen > hLen) return false;

    let max = Nat.sub(hLen, nLen); // <=— safe subtraction to avoid that mc type errors

    var i : Nat = 0;
    label L loop {
      if (i > max) break L;
      var j : Nat = 0;
      var ok = true;
      label K loop {
        if (j >= nLen) break K;
        if (H[i + j] != N[j]) { ok := false; break K };
        j += 1
      };
      if (ok) return true;
      i += 1
    };
    false
  };


  public query func getTransactionById(id: Nat) : async ?Transaction { Array.find<Transaction>(transactionHistory, func(tx) { tx.id == id }) };
  public query func getTransactionCount() : async Nat { transactionHistory.size() };
  public query func getDecayConfig() : async DecayConfig { decayConfig };
  public query func getUserDecayInfo(p: Principal) : async ?UserDecayInfo { Trie.get(userDecayInfo, pKey(p), Principal.equal) };
  public query func previewDecayAmount(p: Principal) : async Nat { calcDecay_(p, getBalance_(p)) };

  public query func getBalanceWithDetails(p: Principal) : async { rawBalance: Nat; currentBalance: Nat; pendingDecay: Nat; decayInfo: ?UserDecayInfo } {
    let raw = getBalance_(p); let pending = calcDecay_(p, raw); let current = if (raw >= pending) Nat.sub(raw, pending) else 0; let info = Trie.get(userDecayInfo, pKey(p), Principal.equal);
    { rawBalance = raw; currentBalance = current; pendingDecay = pending; decayInfo = info }
  };

  public query func getDecayStatistics() : async { totalDecayedPoints: Nat; lastGlobalDecayProcess: Nat; configEnabled: Bool } {
    { totalDecayedPoints; lastGlobalDecayProcess; configEnabled = decayConfig.enabled }
  };


  public query func leaderboard(top: Nat, offset: Nat) : async [(Principal, Nat)] {
    // collect pairs
    let pairs = Buffer.Buffer<(Principal, Nat)>(0);
    for ((p, v) in Trie.iter(balances)) { pairs.add((p, v)) };
    let base : [(Principal, Nat)] = Buffer.toArray(pairs);

    // selection sort (descending by balance) on mutable view
    let mv : [var (Principal, Nat)] = Array.thaw<(Principal, Nat)>(base);
    let n = mv.size();

    var i : Nat = 0;
    label outer loop {
      if (i >= n) break outer;
      var maxIdx : Nat = i;
      var j : Nat = i + 1;
      label inner loop {
        if (j >= n) break inner;
        if (mv[j].1 > mv[maxIdx].1) { maxIdx := j };
        j += 1;
      };
      if (maxIdx != i) {
        let tmp = mv[i];
        mv[i] := mv[maxIdx];
        mv[maxIdx] := tmp;
      };
      i += 1;
    };

    let sorted : [(Principal, Nat)] = Array.freeze<(Principal, Nat)>(mv);

    // paging without `-` operator on Nat
    if (offset >= n) return [];
    let remaining : Nat = Nat.sub(n, offset);                // safe subtraction
    let end : Nat = if (top > remaining) n else offset + top;
    Array.subArray<(Principal, Nat)>(sorted, offset, Nat.sub(end, offset))
  };


  public query func myStats(user: Principal) : async { balance: Nat; lifetimeAwarded: Nat; lifetimeRevoked: Nat; totalDecayed: Nat; lastActivity: Nat } {
    var awarded : Nat = 0; var revoked : Nat = 0; var last : Nat = 0;
    for (tx in transactionHistory.vals()) {
      if (tx.to == user and tx.transactionType == #Award) { awarded += tx.amount; if (tx.timestamp > last) { last := tx.timestamp } };
      if (tx.to == user and tx.transactionType == #Revoke) { revoked += tx.amount; if (tx.timestamp > last) { last := tx.timestamp } };
      if (tx.to == user and tx.transactionType == #Decay) { if (tx.timestamp > last) { last := tx.timestamp } }
    };
    let dec = switch (Trie.get(userDecayInfo, pKey(user), Principal.equal)) { case (?i) i.totalDecayed; case null 0 };
    { balance = getBalance_(user); lifetimeAwarded = awarded; lifetimeRevoked = revoked; totalDecayed = dec; lastActivity = last }
  };

  public query func awarderStats(awardee: Principal) : async [AwarderBreakdown] {
    // aggregate awards to `awardee` by awarder
    let map : Trie.Trie<Principal, (Nat, Nat)> = Trie.empty();
    var tmp = map;
    for (tx in transactionHistory.vals()) {
      if (tx.transactionType == #Award and tx.to == awardee) {
        let key = pKey(tx.from);
        let cur = switch (Trie.get(tmp, key, Principal.equal)) { case (?v) v; case null (0, 0) };
        let last = if (tx.timestamp > cur.1) tx.timestamp else cur.1;
        tmp := Trie.put(tmp, key, Principal.equal, (cur.0 + tx.amount, last)).0;
      }
    };
    let buf = Buffer.Buffer<AwarderBreakdown>(0);
    for ((awarder, (total, last)) in Trie.iter(tmp)) { buf.add({ awarder = awarder; total = total; lastAward = last }) };
    Buffer.toArray(buf)
  };

  public query func orgPulse(since: Nat) : async { awards: Nat; revokes: Nat; decays: Nat } {
    var a : Nat = 0; var r : Nat = 0; var d : Nat = 0; for (tx in transactionHistory.vals()) { if (tx.timestamp >= since) {
      switch (tx.transactionType) { case (#Award) { a += 1 }; case (#Revoke) { r += 1 }; case (#Decay) { d += 1 } }
    } }; { awards = a; revokes = r; decays = d }
  };


  // Top-up queries
  public query func getTopUpsPaged(offset: Nat, limit: Nat) : async [TopUp] {
    let n = topUps.size();
    if (offset >= n) return [];

    // how many items remain after the offset
    let remaining : Nat = Nat.sub(n, offset);

    // choose how many to take safely
    let take : Nat = if (limit > remaining) remaining else limit;

    // starting index n - (offset + take), computed safely
    let start : Nat = Nat.sub(n, offset + take);

    Array.subArray<TopUp>(topUps, start, take)
  };



  public query func getTopUpCount() : async Nat { topUps.size() };

  public query func version() : async Text { VERSION };


  public query func health() : async {
    paused: Bool;
    cycles: Nat;
    users: Nat;
    txCount: Nat;
    topUpCount: Nat;
    decayConfigHash: Nat
  } {
    let cyclesNow : Nat = Cycles.balance();
    let usersNow  : Nat = Trie.size(balances);
    let txNow     : Nat = transactionHistory.size();
    let topUpNow  : Nat = topUps.size();
    let dhash     : Nat = decayHash_();

    {
      paused          = paused;
      cycles          = cyclesNow;
      users           = usersNow;
      txCount         = txNow;
      topUpCount      = topUpNow;
      decayConfigHash = dhash;
    }
  };


  // ——— Maintenance ———
  public shared({ caller }) func processBatchDecay() : async Text {
    if (caller != owner and caller != Principal.fromActor(this)) return "Error: Only owner";
    let pairs = Buffer.Buffer<(Principal, Nat)>(0); for (entry in Trie.iter(balances)) { pairs.add(entry) };
    let arr = Buffer.toArray(pairs);
    var usersProcessed : Nat = 0; var total : Nat = 0;
    for ((p, bal) in arr.vals()) { if (bal > 0) { let d = applyDecay_(p); if (d > 0) { usersProcessed += 1; total += d } } };
    lastGlobalDecayProcess := now(); Debug.print("Batch decay: " # Nat.toText(usersProcessed) # " users, " # Nat.toText(total) # " points");
    "Success: Processed " # Nat.toText(usersProcessed) # " users; total decay " # Nat.toText(total)
  };

  public shared({ caller }) func triggerManualDecay() : async Text {
     if (caller != owner) return "Error: Only owner";
     await processBatchDecay()
  };


  // ——— Upgrade hooks ———
  system func postupgrade() { if (decayConfig.enabled and lastGlobalDecayProcess > 0 and lastGlobalDecayProcess > decayConfig.decayInterval) { lastGlobalDecayProcess := lastGlobalDecayProcess - decayConfig.decayInterval } };


  // === CYCLES ===
  public func wallet_receive() : async Nat {
    let avail = Cycles.available();
    let accepted = Cycles.accept<system>(avail);   // <- add <system>
    addTopUp(Principal.fromActor(this), accepted);
    accepted
  };



  // this will be only used when canister is archieved back to pool
  public shared({ caller }) func withdrawCycles(to: Principal, amount: Nat) : async Text {
    if (caller != owner) return "Error: Only owner";
    if (amount == 0) return "Error: Amount must be > 0";

    // keep some reply buffer so we don't starve the canister
    let replyBuffer : Nat = 100_000_000_000; // ~0.1T cycles (tune)
    let bal = Cycles.balance();
    if (bal <= replyBuffer or amount > bal - replyBuffer) {
      return "Error: Insufficient cycles (balance=" # Nat.toText(bal) # ")";
    };

    type Wallet = actor { wallet_receive : () -> async Nat };
    let target : Wallet = actor (Principal.toText(to));

    try {
      Cycles.add(amount);                // <-- attach cycles (old moc-compatible)
      let accepted = await target.wallet_receive();
      if (accepted == amount) {
        "Success: transferred " # Nat.toText(amount) # " cycles"
      } else {
        "Warning: target accepted " # Nat.toText(accepted) # " / " # Nat.toText(amount) # " cycles"
      }
    } catch (e) {
      "Error: transfer failed"
    }
  };


  //query function to check cycles balance in child
  public query func cycles_balance() : async Nat { Cycles.balance() };


  //a separate function to keep record of all sorts of cycles related transaction
  public shared({ caller }) func topUp() : async Nat {
    let avail = Cycles.available();
    let accepted = Cycles.accept<system>(avail);   // <- add <system>
    addTopUp(caller, accepted);
    accepted
  };


  // ——— Snapshot / Audit ———
  public query func snapshotHash() : async Nat { stateHash_() };

  // ——— DX Events ———
  public shared({ caller }) func emitEvent(kind: Text, payload: Blob) : async Text {
    if (caller != owner and (switch (parent) { case (?p) caller != p; case null true })) return "Error: Not authorized";
    emit(kind, payload); "Success: event emitted"
  };

  // ——— Internal hashing helpers ———
  let FNV_PRIME : Nat64 = 0x0000000001000001;
  func mix64_(h: Nat64, v: Nat64) : Nat64 { (h ^ v) *% FNV_PRIME };  // wrap multiply


  func decayHash_() : Nat {
    var h : Nat64 = 0xCBF29CE484222325;
    h := mix64_(h, Nat64.fromNat(decayConfig.decayRate));
    h := mix64_(h, Nat64.fromNat(decayConfig.decayInterval));
    h := mix64_(h, Nat64.fromNat(decayConfig.minThreshold));
    h := mix64_(h, Nat64.fromNat(decayConfig.gracePeriod));
    h := mix64_(h, if (decayConfig.enabled) 1 else 0);
    Nat64.toNat(h)
  };

  func stateHash_() : Nat {
    var h : Nat64 = 0xCBF29CE484222325;

    // balances
    for ((p, v) in Trie.iter(balances)) {
      // use Principal.hash(p) (Hash/Nat32) -> Nat -> Nat64
      h := mix64_(h, Nat64.fromNat(Nat32.toNat(Principal.hash(p))));
      h := mix64_(h, Nat64.fromNat(v));
    };

    // config knobs
    h := mix64_(h, Nat64.fromNat(decayHash_()));                 // decayHash_ returns Nat -> OK
    h := mix64_(h, Nat64.fromNat(dailyMintLimit));               // Nat -> OK
    h := mix64_(h, Nat64.fromNat(Trie.size(trustedAwarders)));   // Nat -> OK
    h := mix64_(h, Nat64.fromNat(if (paused) 1 else 0));         // make sure it's Nat, then to Nat64

    Nat64.toNat(h)
  };
  /// Drain (almost) all cycles to the factory's wallet_receive.
/// Only callable by the factory or the owner.
/// Returns the number of cycles successfully transferred.
  public shared({ caller }) func returnCyclesToFactory(minRemain : Nat) : async Nat {
    if (caller != factory and caller != owner) return 0;

    // Keep some headroom to reply; default to ~0.1T cycles if minRemain == 0
    let replyBuffer : Nat = if (minRemain == 0) 100_000_000_000 else minRemain;

    let bal = Cycles.balance();
    if (bal <= replyBuffer) return 0;

    let send : Nat = bal - replyBuffer;

    type Wallet = actor { wallet_receive : () -> async Nat };
    let target : Wallet = actor (Principal.toText(factory));

    try {
      Cycles.add(send);
      let accepted = await target.wallet_receive();
      // If the target accepted less, that's fine — we still return what landed.
      accepted
    } catch (_) {
      0
    }
  };
  // some non necessary code added on the basis of aomeones request
  stable var bootstrappedAwarder : Bool = false;
  if (not bootstrappedAwarder) {
    // show in getTrustedAwarders() immediately, but still removable
    trustedAwarders := Trie.put(
      trustedAwarders,
      pKey(initOwner),
      Principal.equal,
      "Admin"
    ).0;
    bootstrappedAwarder := true;
  };


}
