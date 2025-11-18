// Treasury.mo — Multi-asset treasury canister for Reputation DAO.
// Provides configurable micro-tips, scheduled payouts, compliance checks, logging,
// and multi-rail vault management without ever mutating soulbound reputation.

import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Nat8 "mo:base/Nat8";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import TreasuryTypes "../common/TreasuryTypes";

actor Treasury {
  // ------------- Constants -------------
  let TIP_PERIOD_SECONDS : Nat = 86_400;            // 24h spend window per user
  let TIP_RATE_WINDOW_SECONDS : Nat = 60;           // burst limiter
  let TIP_LOG_LIMIT : Nat = 2_000;                  // ring buffer length
  let PAYOUT_LOG_LIMIT : Nat = 1_000;

  // ------------- Type aliases & records -------------
  public type OrgId = TreasuryTypes.OrgId;
  public type UserId = TreasuryTypes.UserId;
  public type Rail = TreasuryTypes.Rail;
  public type RailsEnabled = TreasuryTypes.RailsEnabled;
  public type MicroTipConfig = TreasuryTypes.MicroTipConfig;
  public type PayoutFrequency = TreasuryTypes.PayoutFrequency;
  public type Tier = TreasuryTypes.Tier;
  public type TierPayout = TreasuryTypes.TierPayout;
  public type ScheduledPayoutConfig = TreasuryTypes.ScheduledPayoutConfig;
  public type DeadManConfig = TreasuryTypes.DeadManConfig;
  public type RailThresholds = TreasuryTypes.RailThresholds;
  public type ComplianceRule = TreasuryTypes.ComplianceRule;
  public type Badge = TreasuryTypes.Badge;
  public type UserBadges = TreasuryTypes.UserBadges;
  public type UserCompliance = TreasuryTypes.UserCompliance;
  public type OrgConfig = TreasuryTypes.OrgConfig;
  public type SpendControl = TreasuryTypes.SpendControl;

  public type OrgState = {
    config : OrgConfig;
    lastActiveTimestamp : Nat;
    archived : Bool;
    child : OrgId;
    lastPayoutTimestamp : Nat;
    nextPayoutDue : Nat;
    tipWindowStart : Nat;
    tipEventsInWindow : Nat;
  };

  type VaultBalance = { btc : Nat; icp : Nat; eth : Nat };
  type SpendWindow = { day : Nat; btc : Nat; icp : Nat; eth : Nat; usdE8s : Nat };
  public type SpendSnapshot = SpendWindow;

  public type RailHealth = { available : Nat; minBuffer : Nat; healthy : Bool };

  public type TipEvent = {
    id : Nat;
    org : OrgId;
    user : UserId;
    rail : Rail;
    amount : Nat;
    timestamp : Nat;
    success : Bool;
    error : ?Text;
  };

  public type PayoutEvent = {
    id : Nat;
    org : OrgId;
    rail : Rail;
    totalAmount : Nat;
    recipients : Nat;
    timestamp : Nat;
    success : Bool;
    error : ?Text;
  };

  type ConversionDirection = { #ToNative; #ToChain };
  type ConversionStatus = {
    #Pending;
    #Submitted : { txid : ?Text };
    #Completed : { txid : ?Text };
    #Failed : { reason : Text };
  };
  type ConversionIntent = {
    id : Nat;
    org : OrgId;
    user : UserId;
    rail : Rail;
    direction : ConversionDirection;
    amount : Nat;
    targetAddress : Text;
    memo : ?Text;
    createdAt : Nat;
    status : ConversionStatus;
  };

  type NativeDeposit = {
    id : Nat;
    org : OrgId;
    rail : Rail;
    amount : Nat;
    txid : Text;
    memo : ?Text;
    timestamp : Nat;
  };

  public type TransferArgs = {
    from_subaccount : ?Blob;
    to : Blob;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };
  public type TransferResult = {
    #Ok : Nat;
    #Err : { code : Nat; message : Text };
  };
  type Ledger = actor { transfer : (TransferArgs) -> async TransferResult };

  type RetrieveArgs = {
    amount : Nat;
    destination_address : Text;
    from_subaccount : ?Blob;
    fee : ?Nat;
  };
  type RetrieveResult = { #Ok : Nat; #Err : { message : Text } };
  type CkBTCMinter = actor { retrieve_btc : (RetrieveArgs) -> async RetrieveResult };

  type EthWithdrawArgs = {
    amount : Nat;
    destination : Text;
    memo : ?Text;
    from_subaccount : ?Blob;
  };
  type EthWithdrawResult = { #Ok : Text; #Err : { message : Text } };
  type CkETHMinter = actor { withdraw : (EthWithdrawArgs) -> async EthWithdrawResult };

  type BadgeKey = { org : OrgId; user : UserId };
  type TipUsageKey = { org : OrgId; user : UserId; rail : Rail };
  type SubaccountKey = { org : OrgId; rail : Rail };

  // ------------- Stable storage -------------
  stable var admin : ?Principal = null;
  stable var factory : ?Principal = null;
  stable var governanceControllers : [Principal] = [];

  stable var ckbtcLedgerPrincipal : ?Principal = null;
  stable var icpLedgerPrincipal : ?Principal = null;
  stable var ckethLedgerPrincipal : ?Principal = null;
  stable var ckbtcMinterPrincipal : ?Principal = null;
  stable var ckethMinterPrincipal : ?Principal = null;

  stable var railPrices : { btc : Nat; icp : Nat; eth : Nat } = {
    btc = 0;
    icp = 0;
    eth = 0;
  };

  stable var orgStore : [(OrgId, OrgState)] = [];
  stable var orgAdminStore : [(OrgId, Principal)] = [];
  stable var badgeStore : [(BadgeKey, UserBadges)] = [];
  stable var tipUsageStore : [(TipUsageKey, { amount : Nat; windowStart : Nat })] = [];
  stable var complianceStore : [(BadgeKey, UserCompliance)] = [];
  stable var vaultStore : [(OrgId, VaultBalance)] = [];
  stable var tipLogStore : [TipEvent] = [];
  stable var payoutLogStore : [PayoutEvent] = [];
  stable var nextTipEventId : Nat = 1;
  stable var nextPayoutEventId : Nat = 1;
  stable var factoryVault : VaultBalance = { btc = 0; icp = 0; eth = 0 };
  stable var conversionStore : [ConversionIntent] = [];
  stable var nextConversionId : Nat = 1;
  stable var nativeDepositStore : [NativeDeposit] = [];
  stable var nextNativeDepositId : Nat = 1;
  stable var subaccountStore : [(SubaccountKey, Blob)] = [];
  stable var spendStore : [(OrgId, SpendWindow)] = [];

func principalHash(p : Principal) : Nat32 = Principal.hash(p);

func badgeKeyEq(a : BadgeKey, b : BadgeKey) : Bool =
  Principal.equal(a.org, b.org) and Principal.equal(a.user, b.user);

func badgeKeyHash(k : BadgeKey) : Nat32 {
  let a = Nat32.toNat(Principal.hash(k.org));
  let b = Nat32.toNat(Principal.hash(k.user));
  Nat32.fromNat((a * 1_678_123) + b);
};

func railTag(r : Rail) : Nat =
  switch (r) { case (#BTC) 0; case (#ICP) 1; case (#ETH) 2 };

func tipKeyEq(a : TipUsageKey, b : TipUsageKey) : Bool =
  badgeKeyEq({ org = a.org; user = a.user }, { org = b.org; user = b.user }) and railTag(a.rail) == railTag(b.rail);

func tipKeyHash(k : TipUsageKey) : Nat32 {
  let base = Nat32.toNat(badgeKeyHash({ org = k.org; user = k.user }));
  Nat32.fromNat(base * 31 + railTag(k.rail));
};

func subKeyEq(a : SubaccountKey, b : SubaccountKey) : Bool =
  Principal.equal(a.org, b.org) and railTag(a.rail) == railTag(b.rail);

func subKeyHash(k : SubaccountKey) : Nat32 {
  let base = Nat32.toNat(Principal.hash(k.org));
  Nat32.fromNat(base * 17 + railTag(k.rail));
};

// ------------- Runtime collections -------------
var orgs = HashMap.HashMap<OrgId, OrgState>(0, Principal.equal, principalHash);
var orgAdmins = HashMap.HashMap<OrgId, Principal>(0, Principal.equal, principalHash);
var badgeMap = HashMap.HashMap<BadgeKey, UserBadges>(0, badgeKeyEq, badgeKeyHash);
var tipUsageMap = HashMap.HashMap<TipUsageKey, { amount : Nat; windowStart : Nat }>(0, tipKeyEq, tipKeyHash);
var complianceMap = HashMap.HashMap<BadgeKey, UserCompliance>(0, badgeKeyEq, badgeKeyHash);
var vaultMap = HashMap.HashMap<OrgId, VaultBalance>(0, Principal.equal, principalHash);
var tipEvents : [TipEvent] = tipLogStore;
var payoutEvents : [PayoutEvent] = payoutLogStore;
var conversionBuffer = Buffer.Buffer<ConversionIntent>(conversionStore.size());
var nativeDepositsBuf = Buffer.Buffer<NativeDeposit>(nativeDepositStore.size());
for (intent in conversionStore.vals()) { conversionBuffer.add(intent) };
for (entry in nativeDepositStore.vals()) { nativeDepositsBuf.add(entry) };
var subaccountMap = HashMap.HashMap<SubaccountKey, Blob>(0, subKeyEq, subKeyHash);
var spendMap = HashMap.HashMap<OrgId, SpendWindow>(0, Principal.equal, principalHash);

  // ------------- Upgrade hooks -------------
  system func postupgrade() {
    orgs := HashMap.fromIter(orgStore.vals(), orgStore.size(), Principal.equal, principalHash);
    orgAdmins := HashMap.fromIter(orgAdminStore.vals(), orgAdminStore.size(), Principal.equal, principalHash);
    badgeMap := HashMap.fromIter(badgeStore.vals(), badgeStore.size(), badgeKeyEq, badgeKeyHash);
    complianceMap := HashMap.fromIter(complianceStore.vals(), complianceStore.size(), badgeKeyEq, badgeKeyHash);
    tipUsageMap := HashMap.fromIter(tipUsageStore.vals(), tipUsageStore.size(), tipKeyEq, tipKeyHash);
    vaultMap := HashMap.fromIter(vaultStore.vals(), vaultStore.size(), Principal.equal, principalHash);
    tipEvents := tipLogStore;
    payoutEvents := payoutLogStore;
    conversionBuffer := Buffer.Buffer<ConversionIntent>(conversionStore.size());
    for (intent in conversionStore.vals()) { conversionBuffer.add(intent) };
    nativeDepositsBuf := Buffer.Buffer<NativeDeposit>(nativeDepositStore.size());
    for (entry in nativeDepositStore.vals()) { nativeDepositsBuf.add(entry) };
    subaccountMap := HashMap.fromIter(subaccountStore.vals(), subaccountStore.size(), subKeyEq, subKeyHash);
    spendMap := HashMap.fromIter(spendStore.vals(), spendStore.size(), Principal.equal, principalHash);
  };

  system func preupgrade() {
    orgStore := Iter.toArray(orgs.entries());
    orgAdminStore := Iter.toArray(orgAdmins.entries());
    badgeStore := Iter.toArray(badgeMap.entries());
    complianceStore := Iter.toArray(complianceMap.entries());
    tipUsageStore := Iter.toArray(tipUsageMap.entries());
    vaultStore := Iter.toArray(vaultMap.entries());
    tipLogStore := tipEvents;
    payoutLogStore := payoutEvents;
    conversionStore := Buffer.toArray(conversionBuffer);
    nativeDepositStore := Buffer.toArray(nativeDepositsBuf);
    subaccountStore := Iter.toArray(subaccountMap.entries());
    spendStore := Iter.toArray(spendMap.entries());
  };

  // ------------- Helper functions -------------
  func nowSeconds() : Nat { Int.abs(Time.now() / 1_000_000_000) };

  func ensureAdmin(caller : Principal) {
    switch (admin) {
      case (?a) assert (caller == a);
      case null admin := ?caller;
    };
  };

  func isFactoryCaller(caller : Principal) : Bool =
    switch (factory) { case (?f) caller == f; case null false };

  func isGovController(p : Principal) : Bool {
    for (g in governanceControllers.vals()) { if (g == p) return true };
    false
  };

  func ensurePrivileged(caller : Principal) {
    assert (
      isFactoryCaller(caller) or
      (switch (admin) { case (?a) caller == a; case null false }) or
      isGovController(caller)
    );
  };

  func ensureOrgCaller(org : OrgId, caller : Principal) {
    if (isFactoryCaller(caller)) return;
    if (switch (admin) { case (?a) caller == a; case null false }) return;
    if (isGovController(caller)) return;
    switch (orgAdmins.get(org)) {
      case (?override) { if (caller == override) return };
      case null {};
    };
    switch (orgs.get(org)) {
      case (?state) assert (state.child == caller);
      case null Debug.trap("Unknown org");
    };
  };

  func getVault(org : OrgId) : VaultBalance {
    switch (vaultMap.get(org)) {
      case (?v) v;
      case null {
        { btc = 0; icp = 0; eth = 0 }
      };
    };
  };

  func putVault(org : OrgId, v : VaultBalance) { vaultMap.put(org, v) };

  func debitVault(org : OrgId, rail : Rail, amount : Nat) : Bool {
    if (amount == 0) return true;
    var v = getVault(org);
    switch (rail) {
      case (#BTC) { if (v.btc < amount) return false; v := { v with btc = v.btc - amount } };
      case (#ICP) { if (v.icp < amount) return false; v := { v with icp = v.icp - amount } };
      case (#ETH) { if (v.eth < amount) return false; v := { v with eth = v.eth - amount } };
    };
    putVault(org, v);
    true
  };

  func creditVault(org : OrgId, rail : Rail, amount : Nat) {
    if (amount == 0) return;
    var v = getVault(org);
    switch (rail) {
      case (#BTC) { v := { v with btc = v.btc + amount } };
      case (#ICP) { v := { v with icp = v.icp + amount } };
      case (#ETH) { v := { v with eth = v.eth + amount } };
    };
    putVault(org, v);
  };

  func creditFactoryVault(rail : Rail, amount : Nat) {
    if (amount == 0) return;
    factoryVault := switch (rail) {
      case (#BTC) { { factoryVault with btc = factoryVault.btc + amount } };
      case (#ICP) { { factoryVault with icp = factoryVault.icp + amount } };
      case (#ETH) { { factoryVault with eth = factoryVault.eth + amount } };
    }
  };

  func debitFactoryVault(rail : Rail, amount : Nat) : Bool {
    if (amount == 0) return true;
    switch (rail) {
      case (#BTC) { if (factoryVault.btc < amount) return false; factoryVault := { factoryVault with btc = factoryVault.btc - amount } };
      case (#ICP) { if (factoryVault.icp < amount) return false; factoryVault := { factoryVault with icp = factoryVault.icp - amount } };
      case (#ETH) { if (factoryVault.eth < amount) return false; factoryVault := { factoryVault with eth = factoryVault.eth - amount } };
    };
    true
  };

  func purgeOrgMaps(org : OrgId) {
    let badgeKeys = Buffer.Buffer<BadgeKey>(0);
    for ((key, _) in badgeMap.entries()) {
      if (Principal.equal(key.org, org)) badgeKeys.add(key);
    };
    for (key in badgeKeys.vals()) { ignore badgeMap.remove(key) };

    let complianceKeys = Buffer.Buffer<BadgeKey>(0);
    for ((key, _) in complianceMap.entries()) {
      if (Principal.equal(key.org, org)) complianceKeys.add(key);
    };
    for (key in complianceKeys.vals()) { ignore complianceMap.remove(key) };

    let usageKeys = Buffer.Buffer<TipUsageKey>(0);
    for ((key, _) in tipUsageMap.entries()) {
      if (Principal.equal(key.org, org)) usageKeys.add(key);
    };
    for (key in usageKeys.vals()) { ignore tipUsageMap.remove(key) };
  };

  func calcNextDue(now : Nat, cfg : ScheduledPayoutConfig) : Nat {
    if (not cfg.enabled) return 0;
    let step = switch (cfg.frequency) {
      case (#Weekly) 7 * 86_400;
      case (#Monthly) 30 * 86_400;
      case (#CustomDays d) Nat.max(1, d) * 86_400;
    };
    now + step
  };

  func ledgerActor(opt : ?Principal) : ?Ledger =
    switch (opt) { case (?pid) ?(actor (Principal.toText(pid)) : Ledger); case null null };

  func ckbtcMinterActor() : ?CkBTCMinter =
    switch (ckbtcMinterPrincipal) {
      case (?pid) ?(actor (Principal.toText(pid)) : CkBTCMinter);
      case null null;
    };

  func ckethMinterActor() : ?CkETHMinter =
    switch (ckethMinterPrincipal) {
      case (?pid) ?(actor (Principal.toText(pid)) : CkETHMinter);
      case null null;
    };

  func recordNativeDepositEntry(entry : NativeDeposit) {
    nativeDepositsBuf.add(entry);
  };

  func conversionsArray() : [ConversionIntent] { Buffer.toArray(conversionBuffer) };

  func findConversionIndex(id : Nat) : ?Nat {
    var idx : Nat = 0;
    label L for (intent in conversionBuffer.vals()) {
      if (intent.id == id) { return ?idx };
      idx += 1;
    };
    null
  };

  func getConversion(idx : Nat) : ConversionIntent { conversionBuffer.get(idx) };

  func setConversionStatus(idx : Nat, status : ConversionStatus) {
    let intent = conversionBuffer.get(idx);
    conversionBuffer.put(idx, { intent with status });
  };

  func conversionFailure(idx : Nat, intent : ConversionIntent, reason : Text) {
    creditVault(intent.org, intent.rail, intent.amount);
    rollbackRailSpend(intent.org, intent.rail, intent.amount);
    conversionBuffer.put(idx, { intent with status = #Failed({ reason }) });
  };

  func maybeSubmitConversion(index : Nat) : async () {
    if (index >= conversionBuffer.size()) return;
    let intent = getConversion(index);
    if (intent.direction != #ToNative) return;
    switch (intent.status) {
      case (#Pending) {};
      case _ return;
    };
    switch (intent.rail) {
      case (#BTC) {
        switch (ckbtcMinterActor()) {
          case (?minter) {
            setConversionStatus(index, #Submitted({ txid = null }));
            let args : RetrieveArgs = {
              amount = intent.amount;
              destination_address = intent.targetAddress;
              from_subaccount = ?orgRailSubaccount(intent.org, #BTC);
              fee = null;
            };
            try {
              let res = await minter.retrieve_btc(args);
              switch (res) {
                case (#Ok blockIndex) {
                  conversionBuffer.put(index, { intent with status = #Completed({ txid = ?("block#" # Nat.toText(blockIndex)) }) });
                };
                case (#Err err) {
                  conversionFailure(index, intent, "ckBTC minter error: " # err.message);
                };
              };
            } catch (e) {
              conversionFailure(index, intent, "ckBTC submit trap: " # Error.message(e));
            };
          };
          case null { conversionFailure(index, intent, "ckBTC minter not configured") };
        };
      };
      case (#ETH) {
        switch (ckethMinterActor()) {
          case (?minter) {
            setConversionStatus(index, #Submitted({ txid = null }));
            let args : EthWithdrawArgs = {
              amount = intent.amount;
              destination = intent.targetAddress;
              memo = intent.memo;
              from_subaccount = ?orgRailSubaccount(intent.org, #ETH);
            };
            try {
              let res = await minter.withdraw(args);
              switch (res) {
                case (#Ok txid) {
                  conversionBuffer.put(index, { intent with status = #Completed({ txid = ?txid }) });
                };
                case (#Err err) {
                  conversionFailure(index, intent, "ckETH minter error: " # err.message);
                };
              };
            } catch (e) {
              conversionFailure(index, intent, "ckETH submit trap: " # Error.message(e));
            };
          };
          case null { conversionFailure(index, intent, "ckETH minter not configured") };
        };
      };
      case (#ICP) {};
    };
  };

  func appendTipLog(ev : TipEvent) {
    tipEvents := pushBounded(tipEvents, ev, TIP_LOG_LIMIT);
  };

  func appendPayoutLog(ev : PayoutEvent) {
    payoutEvents := pushBounded(payoutEvents, ev, PAYOUT_LOG_LIMIT);
  };

  func pushBounded<T>(arr : [T], item : T, limit : Nat) : [T] {
    let len = arr.size();
    if (len == 0) return [item];
    if (len >= limit) {
      let drop = len - (limit - 1);
      let trimmed = Array.subArray(arr, drop, limit - 1);
      Array.append(trimmed, [item])
    } else {
      Array.append(arr, [item])
    }
  };

  func defaultSubaccount(org : OrgId, rail : Rail) : Blob {
    let orgBytes = Blob.toArray(Principal.toBlob(org));
    let buff = Buffer.Buffer<Nat8>(32);
    var i = 0;
    while (i < 31) {
      if (i < orgBytes.size()) buff.add(orgBytes[i]) else buff.add(0);
      i += 1;
    };
    buff.add(Nat8.fromNat(railTag(rail)));
    Blob.fromArray(Buffer.toArray(buff));
  };

  func orgRailSubaccount(org : OrgId, rail : Rail) : Blob {
    switch (subaccountMap.get({ org; rail })) {
      case (?custom) custom;
      case null defaultSubaccount(org, rail);
    }
  };

  func thresholdsFor(rails : RailThresholds, rail : Rail) : Nat =
    switch (rail) { case (#BTC) rails.btcMin; case (#ICP) rails.icpMin; case (#ETH) rails.ethMin };

  func priceFor(rail : Rail) : Nat =
    switch (rail) {
      case (#BTC) railPrices.btc;
      case (#ICP) railPrices.icp;
      case (#ETH) railPrices.eth;
    };

  func currentDayIndex() : Nat = nowSeconds() / TIP_PERIOD_SECONDS;

  func freshSpendWindow(day : Nat) : SpendWindow = { day; btc = 0; icp = 0; eth = 0; usdE8s = 0 };

  func snapshotSpendWindow(org : OrgId) : SpendWindow {
    let day = currentDayIndex();
    switch (spendMap.get(org)) {
      case (?window) { if (window.day == day) window else freshSpendWindow(day) };
      case null freshSpendWindow(day);
    }
  };

  func loadWindowForUpdate(org : OrgId) : SpendWindow {
    let day = currentDayIndex();
    switch (spendMap.get(org)) {
      case (?window) { if (window.day == day) window else freshSpendWindow(day) };
      case null freshSpendWindow(day);
    }
  };

  func railValue(window : SpendWindow, rail : Rail) : Nat =
    switch (rail) {
      case (#BTC) window.btc;
      case (#ICP) window.icp;
      case (#ETH) window.eth;
    };

  func setRailValue(window : SpendWindow, rail : Rail, value : Nat) : SpendWindow =
    switch (rail) {
      case (#BTC) ({ day = window.day; btc = value; icp = window.icp; eth = window.eth; usdE8s = window.usdE8s });
      case (#ICP) ({ day = window.day; btc = window.btc; icp = value; eth = window.eth; usdE8s = window.usdE8s });
      case (#ETH) ({ day = window.day; btc = window.btc; icp = window.icp; eth = value; usdE8s = window.usdE8s });
    };

  func setUsdValue(window : SpendWindow, value : Nat) : SpendWindow =
    { day = window.day; btc = window.btc; icp = window.icp; eth = window.eth; usdE8s = value };

  func guardRailSpend(org : OrgId, state : OrgState, rail : Rail, amount : Nat) {
    if (amount == 0) return;
    switch (state.config.spendControl) {
      case (?control) {
        let window = snapshotSpendWindow(org);
        let current = railValue(window, rail);
        let pending = Nat.add(current, amount);
        let capOpt : ?Nat = switch (rail) {
          case (#BTC) control.railDailyCaps.btc;
          case (#ICP) control.railDailyCaps.icp;
          case (#ETH) control.railDailyCaps.eth;
        };
        switch (capOpt) {
          case (?cap) { if (pending > cap) Debug.trap("rail daily cap exceeded") };
          case null {};
        };
        switch (control.usdCapE8s) {
          case (?usdCap) {
            let price = priceFor(rail);
            if (price == 0) Debug.trap("usd cap configured but price missing");
            let usdDelta = Nat.mul(amount, price);
            let usdPending = Nat.add(window.usdE8s, usdDelta);
            if (usdPending > usdCap) Debug.trap("org usd daily cap exceeded");
          };
          case null {};
        };
      };
      case null {};
    };
  };

  func recordRailSpend(org : OrgId, state : OrgState, rail : Rail, amount : Nat) {
    if (amount == 0) return;
    switch (state.config.spendControl) {
      case (?_) {
        var window = loadWindowForUpdate(org);
        let newValue = Nat.add(railValue(window, rail), amount);
        window := setRailValue(window, rail, newValue);
        let usdAdd = Nat.mul(amount, priceFor(rail));
        let usdUpdated = Nat.add(window.usdE8s, usdAdd);
        window := setUsdValue(window, usdUpdated);
        spendMap.put(org, window);
      };
      case null {};
    };
  };

  func rollbackRailSpend(org : OrgId, rail : Rail, amount : Nat) {
    if (amount == 0) return;
    switch (orgs.get(org)) {
      case (?state) {
        switch (state.config.spendControl) {
          case (?_) {
            var window = loadWindowForUpdate(org);
            let current = railValue(window, rail);
            let newValue = if (current <= amount) 0 else Nat.sub(current, amount);
            window := setRailValue(window, rail, newValue);
            let usdDelta = Nat.mul(amount, priceFor(rail));
            let usdNew = if (window.usdE8s <= usdDelta) 0 else Nat.sub(window.usdE8s, usdDelta);
            window := setUsdValue(window, usdNew);
            spendMap.put(org, window);
          };
          case null {};
        };
      };
      case null {};
    };
  };
  func railEnabled(rails : RailsEnabled, rail : Rail) : Bool =
    switch (rail) {
      case (#BTC) rails.btc;
      case (#ICP) rails.icp;
      case (#ETH) rails.eth;
    };

  func hasLiquidity(org : OrgId, state : OrgState, rail : Rail, amount : Nat) : Bool {
    if (amount == 0) return true;
    let vault = getVault(org);
    let available = switch (rail) {
      case (#BTC) vault.btc;
      case (#ICP) vault.icp;
      case (#ETH) vault.eth;
    };
    if (available < amount) return false;
    let remaining = Nat.sub(available, amount);
    remaining >= thresholdsFor(state.config.thresholds, rail);
  };

  func ensureCompliance(org : OrgId, user : UserId, rules : ComplianceRule) : Bool {
    if (not rules.kycRequired and rules.tagWhitelist.size() == 0) return true;
    switch (complianceMap.get({ org; user })) {
      case (?status) {
        if (rules.kycRequired and not status.kycVerified) return false;
        if (rules.tagWhitelist.size() == 0) return true;
        for (tag in status.tags.vals()) {
          for (need in rules.tagWhitelist.vals()) {
            if (tag == need) return true;
          };
        };
        false
      };
      case null false;
    }
  };

  func recordTipEvent(org : OrgId, user : UserId, rail : Rail, amount : Nat, success : Bool, err : ?Text) {
    let ev : TipEvent = {
      id = nextTipEventId;
      org;
      user;
      rail;
      amount;
      timestamp = nowSeconds();
      success;
      error = err;
    };
    nextTipEventId += 1;
    appendTipLog(ev);
  };

  func recordPayoutEvent(org : OrgId, rail : Rail, total : Nat, recipients : Nat, success : Bool, err : ?Text) {
    let ev : PayoutEvent = {
      id = nextPayoutEventId;
      org;
      rail;
      totalAmount = total;
      recipients;
      timestamp = nowSeconds();
      success;
      error = err;
    };
    nextPayoutEventId += 1;
    appendPayoutLog(ev);
  };

  // ------------- Governance & setup -------------
  public shared ({ caller }) func setAdmin(newAdmin : Principal) : async () {
    ensureAdmin(caller);
    admin := ?newAdmin;
  };

  public shared ({ caller }) func setFactory(p : Principal) : async () {
    ensureAdmin(caller);
    factory := ?p;
  };

  public shared ({ caller }) func configureGovernanceControllers(controllers : [Principal]) : async () {
    ensureAdmin(caller);
    governanceControllers := controllers;
  };

  public shared ({ caller }) func setLedgers(ckbtc : Principal, icp : Principal, cketh : Principal) : async () {
    ensurePrivileged(caller);
    ckbtcLedgerPrincipal := ?ckbtc;
    icpLedgerPrincipal := ?icp;
    ckethLedgerPrincipal := ?cketh;
  };

  public shared ({ caller }) func setRailMinters(ckbtc : ?Principal, cketh : ?Principal) : async () {
    ensurePrivileged(caller);
    ckbtcMinterPrincipal := ckbtc;
    ckethMinterPrincipal := cketh;
  };

  public shared ({ caller }) func setRailUsdPrice(rail : Rail, priceE8s : Nat) : async () {
    ensurePrivileged(caller);
    railPrices := switch (rail) {
      case (#BTC) { { railPrices with btc = priceE8s } };
      case (#ICP) { { railPrices with icp = priceE8s } };
      case (#ETH) { { railPrices with eth = priceE8s } };
    }
  };

  // ------------- Org management -------------
  public shared ({ caller }) func registerOrg(org : OrgId, cfg : OrgConfig) : async () {
    ensureFactoryOnly(caller);
    assert (orgs.get(org) == null);
    let now = nowSeconds();
    orgs.put(org, {
      config = cfg;
      lastActiveTimestamp = now;
      archived = false;
      child = org;
      lastPayoutTimestamp = 0;
      nextPayoutDue = calcNextDue(now, cfg.scheduled);
      tipWindowStart = now;
      tipEventsInWindow = 0;
    });
    putVault(org, { btc = 0; icp = 0; eth = 0 });
  };

  public shared ({ caller }) func resetOrgState(org : OrgId, cfg : OrgConfig, adminPrincipal : Principal) : async () {
    ensureFactoryOnly(caller);
    switch (orgs.get(org)) {
      case (?_) { await sweepOrgFunds(org) };
      case null {};
    };
    purgeOrgMaps(org);
    let now = nowSeconds();
    orgs.put(org, {
      config = cfg;
      lastActiveTimestamp = now;
      archived = false;
      child = org;
      lastPayoutTimestamp = 0;
      nextPayoutDue = calcNextDue(now, cfg.scheduled);
      tipWindowStart = now;
      tipEventsInWindow = 0;
    });
    putVault(org, { btc = 0; icp = 0; eth = 0 });
    orgAdmins.put(org, adminPrincipal);
  };

  public shared ({ caller }) func updateOrgConfig(org : OrgId, newConfig : OrgConfig) : async () {
    ensureOrgCaller(org, caller);
    switch (orgs.get(org)) {
      case (?state) {
        if (state.archived) Debug.trap("Org archived");
        let now = nowSeconds();
        orgs.put(org, {
          state with
          config = newConfig;
          nextPayoutDue = calcNextDue(now, newConfig.scheduled);
        });
      };
      case null Debug.trap("Unknown org");
    };
  };

  public shared ({ caller }) func setOrgAdmin(org : OrgId, adminPrincipal : Principal) : async () {
    ensurePrivileged(caller);
    orgAdmins.put(org, adminPrincipal);
  };

  public shared ({ caller }) func setOrgRailSubaccount(org : OrgId, rail : Rail, subaccount : ?Blob) : async Text {
    ensurePrivileged(caller);
    switch (subaccount) {
      case (?blob) {
        if (Blob.toArray(blob).size() != 32) Debug.trap("subaccount must be 32 bytes");
        subaccountMap.put({ org; rail }, blob);
        "Success: subaccount updated"
      };
      case null {
        ignore subaccountMap.remove({ org; rail });
        "Success: subaccount cleared"
      };
    }
  };

  public shared ({ caller }) func recordOrgHeartbeat(org : OrgId) : async () {
    ensureOrgCaller(org, caller);
    switch (orgs.get(org)) {
      case (?state) { orgs.put(org, { state with lastActiveTimestamp = nowSeconds() }) };
      case null Debug.trap("Unknown org");
    };
  };

  // ------------- Compliance -------------
  public shared ({ caller }) func setUserCompliance(org : OrgId, user : UserId, info : UserCompliance) : async () {
    ensureOrgCaller(org, caller);
    complianceMap.put({ org; user }, info);
  };

  public query func getUserCompliance(org : OrgId, user : UserId) : async ?UserCompliance {
    complianceMap.get({ org; user });
  };

  // ------------- Badges -------------
  public shared ({ caller }) func setUserBadges(org : OrgId, user : UserId, badges : UserBadges) : async () {
    ensureOrgCaller(org, caller);
    badgeMap.put({ org; user }, badges);
  };

  public query func getUserBadges(org : OrgId, user : UserId) : async UserBadges {
    switch (badgeMap.get({ org; user })) { case (?b) b; case null [] };
  };

  // ------------- Funding helpers -------------
  public shared ({ caller }) func notifyLedgerDeposit(org : OrgId, rail : Rail, amount : Nat, txMemo : ?Text) : async () {
    ensurePrivileged(caller);
    assert (amount > 0);
    switch (orgs.get(org)) {
      case (?_) {};
      case null Debug.trap("Unknown org");
    };
    creditVault(org, rail, amount);
    recordTipEvent(org, org, rail, amount, true, txMemo);
  };

  public shared ({ caller }) func recordNativeDeposit(org : OrgId, rail : Rail, amount : Nat, txid : Text, memo : ?Text) : async Nat {
    ensurePrivileged(caller);
    assert (amount > 0);
    creditVault(org, rail, amount);
    let entry : NativeDeposit = {
      id = nextNativeDepositId;
      org;
      rail;
      amount;
      txid;
      memo;
      timestamp = nowSeconds();
    };
    nextNativeDepositId += 1;
    recordNativeDepositEntry(entry);
    entry.id
  };

  public shared ({ caller }) func requestNativeWithdrawal(org : OrgId, user : UserId, rail : Rail, amount : Nat, destination : Text, memo : ?Text) : async Nat {
    ensureOrgCaller(org, caller);
    if (rail == #ICP) Debug.trap("Native conversions not supported for ICP");
    assert (amount > 0);
    switch (rail) {
      case (#BTC) { if (ckbtcMinterPrincipal == null) Debug.trap("ckBTC minter not configured") };
      case (#ETH) { if (ckethMinterPrincipal == null) Debug.trap("ckETH minter not configured") };
      case (#ICP) {};
    };
    let state = switch (orgs.get(org)) {
      case (?s) s;
      case null Debug.trap("Unknown org");
    };
    if (state.archived) Debug.trap("Org archived");
    if (not railEnabled(state.config.rails, rail)) Debug.trap("Rail disabled");
    guardRailSpend(org, state, rail, amount);
    if (not debitVault(org, rail, amount)) Debug.trap("Insufficient vault balance");
    let intent : ConversionIntent = {
      id = nextConversionId;
      org;
      user;
      rail;
      direction = #ToNative;
      amount;
      targetAddress = destination;
      memo;
      createdAt = nowSeconds();
      status = #Pending;
    };
    nextConversionId += 1;
    conversionBuffer.add(intent);
    recordRailSpend(org, state, rail, amount);
    ignore maybeSubmitConversion(conversionBuffer.size() - 1);
    intent.id
  };

  public shared ({ caller }) func submitPendingConversions(limit : Nat) : async Nat {
    ensurePrivileged(caller);
    var processed : Nat = 0;
    var idx : Nat = 0;
    label LOOP for (intent in conversionBuffer.vals()) {
      if (limit > 0 and processed >= limit) break LOOP;
      if (intent.direction == #ToNative) {
        switch (intent.status) {
          case (#Pending) {
            await maybeSubmitConversion(idx);
            processed += 1;
          };
          case _ {};
        };
      };
      idx += 1;
    };
    processed
  };

  public shared ({ caller }) func retryConversion(conversionId : Nat) : async Text {
    ensurePrivileged(caller);
    switch (findConversionIndex(conversionId)) {
      case (?idx) {
        await maybeSubmitConversion(idx);
        "Success: conversion retried"
      };
      case null "Error: unknown conversion";
    }
  };

  public shared ({ caller }) func markConversionCompleted(conversionId : Nat, txid : ?Text) : async Text {
    ensurePrivileged(caller);
    switch (findConversionIndex(conversionId)) {
      case (?idx) {
        let intent = getConversion(idx);
        conversionBuffer.put(idx, { intent with status = #Completed({ txid }) });
        "Success: conversion completed"
      };
      case null "Error: unknown conversion";
    }
  };

  public shared ({ caller }) func markConversionFailed(conversionId : Nat, reason : Text, refundVault : Bool) : async Text {
    ensurePrivileged(caller);
    switch (findConversionIndex(conversionId)) {
      case (?idx) {
        let intent = getConversion(idx);
        if (refundVault) {
          creditVault(intent.org, intent.rail, intent.amount);
          rollbackRailSpend(intent.org, intent.rail, intent.amount);
        };
        conversionBuffer.put(idx, { intent with status = #Failed({ reason }) });
        "Success: conversion marked failed"
      };
      case null "Error: unknown conversion";
    }
  };

  public shared ({ caller }) func allocateFactoryFunds(org : OrgId, rail : Rail, amount : Nat) : async () {
    ensurePrivileged(caller);
    if (amount == 0) return;
    if (not debitFactoryVault(rail, amount)) Debug.trap("Insufficient factory vault");
    creditVault(org, rail, amount);
  };

  // ------------- Micro-tip hook -------------
  public shared ({ caller }) func repAwarded(org : OrgId, user : UserId, _repDelta : Int, _meta : ?Text) : async () {
    ensureOrgCaller(org, caller);
    switch (orgs.get(org)) {
      case (?state) {
        if (state.archived) return;
        let cfg = state.config.microTips;
        if (not cfg.enabled) {
          orgs.put(org, { state with lastActiveTimestamp = nowSeconds() });
          return;
        };

        if (not ensureCompliance(org, user, state.config.compliance)) {
          recordTipEvent(org, user, #ICP, 0, false, ?"compliance check failed");
          return;
        };

        var windowStart = state.tipWindowStart;
        var windowCount = state.tipEventsInWindow;
        let now = nowSeconds();
        if (now >= windowStart + TIP_RATE_WINDOW_SECONDS) {
          windowStart := now;
          windowCount := 0;
        };
        if (cfg.maxEventsPerWindow > 0 and windowCount >= cfg.maxEventsPerWindow) {
          recordTipEvent(org, user, #ICP, 0, false, ?"rate limit exceeded");
          return;
        };
        windowCount += 1;

        await processMicroTip(org, user, state, #BTC, cfg.btcTipAmount, cfg.maxBtcPerPeriod);
        await processMicroTip(org, user, state, #ICP, cfg.icpTipAmount, cfg.maxIcpPerPeriod);
        await processMicroTip(org, user, state, #ETH, cfg.ethTipAmount, cfg.maxEthPerPeriod);

        orgs.put(org, {
          state with
          lastActiveTimestamp = now;
          tipWindowStart = windowStart;
          tipEventsInWindow = windowCount;
        });
      };
      case null Debug.trap("Unknown org");
    };
  };

  func processMicroTip(org : OrgId, user : UserId, state : OrgState, rail : Rail, amount : Nat, maxPerPeriod : Nat) : async () {
    if (amount == 0 or maxPerPeriod == 0) return;
    if (not state.config.rails.btc and rail == #BTC) return;
    if (not state.config.rails.icp and rail == #ICP) return;
    if (not state.config.rails.eth and rail == #ETH) return;
    guardRailSpend(org, state, rail, amount);
    if (not hasLiquidity(org, state, rail, amount)) {
      recordTipEvent(org, user, rail, amount, false, ?"insufficient buffer");
      return;
    };

    let key : TipUsageKey = { org; user; rail };
    let now = nowSeconds();
    var usage = switch (tipUsageMap.get(key)) {
      case (?u) u;
      case null {
        { amount = 0; windowStart = now }
      };
    };
    if (now >= usage.windowStart + TIP_PERIOD_SECONDS) {
      usage := { amount = 0; windowStart = now };
    };
    let projected = Nat.add(usage.amount, amount);
    if (projected > maxPerPeriod) {
      recordTipEvent(org, user, rail, amount, false, ?"period cap exceeded");
      return;
    };

    if (not debitVault(org, rail, amount)) {
      recordTipEvent(org, user, rail, amount, false, ?"vault underflow");
      return;
    };

    if (await sendRailPayment(rail, org, user, amount)) {
      tipUsageMap.put(key, { amount = projected; windowStart = usage.windowStart });
      recordRailSpend(org, state, rail, amount);
      recordTipEvent(org, user, rail, amount, true, null);
    } else {
      creditVault(org, rail, amount);
      recordTipEvent(org, user, rail, amount, false, ?"ledger transfer failed");
    };
  };

  func sendRailPayment(rail : Rail, org : OrgId, recipient : UserId, amount : Nat) : async Bool {
    if (amount == 0) return true;
    let args : TransferArgs = {
      from_subaccount = ?orgRailSubaccount(org, rail);
      to = Principal.toBlob(recipient);
      amount;
      fee = null;
      memo = null;
      created_at_time = ?Nat64.fromNat(nowSeconds());
    };
    let missing : TransferResult = #Err({ code = 500; message = "ledger not configured" });
    let res : TransferResult = switch (rail) {
      case (#BTC) {
        switch (ledgerActor(ckbtcLedgerPrincipal)) {
          case (?ledger) await ledger.transfer(args);
          case null missing;
        };
      };
      case (#ICP) {
        switch (ledgerActor(icpLedgerPrincipal)) {
          case (?ledger) await ledger.transfer(args);
          case null missing;
        };
      };
      case (#ETH) {
        switch (ledgerActor(ckethLedgerPrincipal)) {
          case (?ledger) await ledger.transfer(args);
          case null missing;
        };
      };
    };
    switch (res) {
      case (#Ok _) true;
      case (#Err e) { Debug.print("Treasury transfer failed: " # debug_show(e)); false };
    }
  };

  // ------------- Scheduled payouts -------------
  type ChildOrg = actor { getUsersByTier : () -> async [(UserId, Tier)] };

  public shared ({ caller }) func runPayoutCycle(org : OrgId) : async () {
    ensureOrgCaller(org, caller);
    switch (orgs.get(org)) {
      case (?state) {
        if (state.archived) return;
        if (not state.config.scheduled.enabled) return;
        let now = nowSeconds();
        if (state.nextPayoutDue > 0 and now < state.nextPayoutDue) return;
        await executePayout(org, state);
      };
      case null Debug.trap("Unknown org");
    };
  };

  public shared ({ caller }) func runDuePayoutCycles() : async () {
    ensurePrivileged(caller);
    for ((org, state) in orgs.entries()) {
      if (state.archived or not state.config.scheduled.enabled) {
        ();
      } else {
        let now = nowSeconds();
        if (state.nextPayoutDue == 0 or now < state.nextPayoutDue) {
          ();
        } else {
          await executePayout(org, state);
        };
      };
    };
  };

  func executePayout(org : OrgId, state : OrgState) : async () {
    let child : ChildOrg = actor (Principal.toText(state.child));
    let members = await child.getUsersByTier();
    let tiers = state.config.scheduled.tiers;
    let rails = state.config.rails;

    var paidBtc : Nat = 0;
    var paidIcp : Nat = 0;
    var paidEth : Nat = 0;
    var recipients : Nat = 0;

    for ((user, tier) in members.vals()) {
      if (not ensureCompliance(org, user, state.config.compliance)) {
        ();
      } else {
        recipients += 1;
        switch (findTierPayout(tiers, tier)) {
          case (?tp) {
            if (rails.btc and tp.btcAmount > 0) {
              guardRailSpend(org, state, #BTC, tp.btcAmount);
            };
            if (rails.btc and tp.btcAmount > 0 and hasLiquidity(org, state, #BTC, tp.btcAmount)) {
              if (debitVault(org, #BTC, tp.btcAmount)) {
                if (await sendRailPayment(#BTC, org, user, tp.btcAmount)) {
                  paidBtc += tp.btcAmount;
                  recordRailSpend(org, state, #BTC, tp.btcAmount);
                } else creditVault(org, #BTC, tp.btcAmount);
              };
          };
          if (rails.icp and tp.icpAmount > 0) {
            guardRailSpend(org, state, #ICP, tp.icpAmount);
          };
          if (rails.icp and tp.icpAmount > 0 and hasLiquidity(org, state, #ICP, tp.icpAmount)) {
            if (debitVault(org, #ICP, tp.icpAmount)) {
              if (await sendRailPayment(#ICP, org, user, tp.icpAmount)) {
                paidIcp += tp.icpAmount;
                recordRailSpend(org, state, #ICP, tp.icpAmount);
              } else creditVault(org, #ICP, tp.icpAmount);
            };
          };
          if (rails.eth and tp.ethAmount > 0) {
            guardRailSpend(org, state, #ETH, tp.ethAmount);
          };
          if (rails.eth and tp.ethAmount > 0 and hasLiquidity(org, state, #ETH, tp.ethAmount)) {
            if (debitVault(org, #ETH, tp.ethAmount)) {
              if (await sendRailPayment(#ETH, org, user, tp.ethAmount)) {
                paidEth += tp.ethAmount;
                recordRailSpend(org, state, #ETH, tp.ethAmount);
              } else creditVault(org, #ETH, tp.ethAmount);
            };
          };
        };
        case null {};
        };
      };
    };

    if (rails.btc and paidBtc > 0) recordPayoutEvent(org, #BTC, paidBtc, recipients, true, null);
    if (rails.icp and paidIcp > 0) recordPayoutEvent(org, #ICP, paidIcp, recipients, true, null);
    if (rails.eth and paidEth > 0) recordPayoutEvent(org, #ETH, paidEth, recipients, true, null);

    let now = nowSeconds();
    orgs.put(org, {
      state with
      lastPayoutTimestamp = now;
      nextPayoutDue = calcNextDue(now, state.config.scheduled);
    });
  };

  func findTierPayout(tiers : [TierPayout], target : Tier) : ?TierPayout {
    for (tp in tiers.vals()) { if (tierEquals(tp.tier, target)) return ?tp };
    null
  };

  func tierEquals(a : Tier, b : Tier) : Bool =
    switch (a, b) {
      case (#Bronze, #Bronze) true;
      case (#Silver, #Silver) true;
      case (#Gold, #Gold) true;
      case (#Custom ta, #Custom tb) ta == tb;
      case _ false;
    };

  // ------------- Dead-man / Archiving -------------
  public shared ({ caller }) func checkAndArchiveOrg(org : OrgId) : async () {
    ensureOrgCaller(org, caller);
    switch (orgs.get(org)) {
      case (?state) await maybeArchive(org, state);
      case null Debug.trap("Unknown org");
    };
  };

  public shared ({ caller }) func checkAllOrgsForDeadman() : async () {
    ensurePrivileged(caller);
    for ((org, state) in orgs.entries()) {
      await maybeArchive(org, state);
    };
  };

  public shared ({ caller }) func forceArchiveOrg(org : OrgId) : async () {
    ensurePrivileged(caller);
    switch (orgs.get(org)) {
      case (?state) await archiveOrg(org, state);
      case null Debug.trap("Unknown org");
    };
  };

  func maybeArchive(org : OrgId, state : OrgState) : async () {
    if (state.archived or not state.config.deadman.enabled) return;
    let now = nowSeconds();
    if (now < state.lastActiveTimestamp + state.config.deadman.inactivityThresholdSeconds) return;
    await archiveOrg(org, state);
  };

  func archiveOrg(org : OrgId, state : OrgState) : async () {
    await sweepOrgFunds(org);
    orgs.put(org, { state with archived = true });
  };

  func sweepOrgFunds(org : OrgId) : async () {
    let vault = getVault(org);
    if (vault.btc > 0) creditFactoryVault(#BTC, vault.btc);
    if (vault.icp > 0) creditFactoryVault(#ICP, vault.icp);
    if (vault.eth > 0) creditFactoryVault(#ETH, vault.eth);
    putVault(org, { btc = 0; icp = 0; eth = 0 });
  };

  // ------------- Queries -------------
  public query func getOrgConfig(org : OrgId) : async ?OrgConfig { switch (orgs.get(org)) { case (?s) ?s.config; case null null } };
  public query func getOrgState(org : OrgId) : async ?OrgState { orgs.get(org) };
  public query func isOrgArchived(org : OrgId) : async Bool {
    switch (orgs.get(org)) { case (?s) s.archived; case null false };
  };
  public query func getOrgRails(org : OrgId) : async ?RailsEnabled {
    switch (orgs.get(org)) { case (?s) ?s.config.rails; case null null };
  };
  public query func getOrgAdmin(org : OrgId) : async ?Principal { orgAdmins.get(org) };
  public query func getOrgVaultBalance(org : OrgId) : async VaultBalance { getVault(org) };
  public query func getFactoryVaultBalance() : async VaultBalance { factoryVault };
  public query func getOrgSpendSnapshot(org : OrgId) : async SpendSnapshot { snapshotSpendWindow(org) };

  public query func getRailHealth(org : OrgId, rail : Rail) : async ?RailHealth {
    switch (orgs.get(org)) {
      case (?state) {
        let threshold = thresholdsFor(state.config.thresholds, rail);
        let available = switch (rail) {
          case (#BTC) getVault(org).btc;
          case (#ICP) getVault(org).icp;
          case (#ETH) getVault(org).eth;
        };
        ?{ available; minBuffer = threshold; healthy = available >= threshold };
      };
      case null null;
    }
  };

  public query func listRegisteredOrgs() : async [OrgId] {
    let buf = Buffer.Buffer<OrgId>(orgs.size());
    for ((org, _) in orgs.entries()) { buf.add(org) };
    Buffer.toArray(buf);
  };

  public query func listTipEvents(offset : Nat, limit : Nat) : async [TipEvent] {
    sliceWindow(tipEvents, offset, limit);
  };

  public query func listPayoutEvents(offset : Nat, limit : Nat) : async [PayoutEvent] {
    sliceWindow(payoutEvents, offset, limit);
  };

  public query func getConversionIntent(id : Nat) : async ?ConversionIntent {
    switch (findConversionIndex(id)) {
      case (?idx) ?(getConversion(idx));
      case null null;
    }
  };

  public query func listConversionIntents(offset : Nat, limit : Nat) : async [ConversionIntent] {
    sliceWindow(conversionsArray(), offset, limit);
  };

  public query func listNativeDeposits(offset : Nat, limit : Nat) : async [NativeDeposit] {
    sliceWindow(Buffer.toArray(nativeDepositsBuf), offset, limit);
  };

  func sliceWindow<T>(arr : [T], offset : Nat, limit : Nat) : [T] {
    if (offset >= arr.size()) return [];
    let take = Nat.min(limit, arr.size() - offset);
    Array.subArray(arr, arr.size() - offset - take, take);
  };
  func ensureFactoryOnly(caller : Principal) {
    assert (isFactoryCaller(caller));
  };

}
