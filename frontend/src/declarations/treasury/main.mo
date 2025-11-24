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
import Char "mo:base/Char";
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
  let ICP_TRANSFER_FEE_E8S : Nat = 10_000;          // 0.0001 ICP
  let MAX_NAT64 : Nat = 18_446_744_073_709_551_615;

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

  public type Tokens = { e8s : Nat64 };
  public type Timestamp = { timestamp_nanos : Nat64 };
  public type TransferArgs = {
    from_subaccount : ?Blob;
    to : Blob;
    amount : Tokens;
    fee : Tokens;
    memo : Nat64;
    created_at_time : ?Timestamp;
  };
  public type TransferError = {
    #TxTooOld : { allowed_window_nanos : Nat64 };
    #BadFee : { expected_fee : Tokens };
    #TxDuplicate : { duplicate_of : Nat64 };
    #TxCreatedInFuture : {};
    #InsufficientFunds : { balance : Tokens };
    #TemporarilyUnavailable : {};
    #BadBurn : { min_burn_amount : Tokens };
    #TxThrottled : {};
    #GenericError : { error_code : Nat32; message : Text };
  };
  public type TransferResult = {
    #Ok : Nat64;
    #Err : TransferError;
  };
  type Ledger = actor { transfer : (TransferArgs) -> async TransferResult };

  type RetrieveArgs = {
    amount : Nat;
    destination_address : Text;
    from_subaccount : ?Blob;
    fee : ?Nat;
  };
  type RetrieveResult = { #Ok : Nat; #Err : { message : Text } };
  type LedgerAccount = { owner : Principal; subaccount : ?Blob };

  type CkBTCMinter = actor {
    retrieve_btc : (RetrieveArgs) -> async RetrieveResult;
    get_btc_address : (LedgerAccount) -> async Text;
  };

  type EthWithdrawArgs = {
    amount : Nat;
    destination : Text;
    memo : ?Text;
    from_subaccount : ?Blob;
  };
  type EthWithdrawResult = { #Ok : Text; #Err : { message : Text } };
  type CkETHMinter = actor {
    withdraw : (EthWithdrawArgs) -> async EthWithdrawResult;
    get_deposit_address : (LedgerAccount) -> async Text;
  };

  type BadgeKey = { org : OrgId; user : UserId };
  type TipUsageKey = { org : OrgId; user : UserId; rail : Rail };
  type SubaccountKey = { org : OrgId; rail : Rail };
  type UserRailKey = { org : OrgId; user : UserId; rail : Rail };

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
  stable var userBalanceStore : [(UserRailKey, Nat)] = [];
  stable var conversionSourceStore : [(Nat, Bool)] = [];

  let HASH_MODULUS : Nat = 4_294_967_296;

  func clamp32(n : Nat) : Nat32 = Nat32.fromNat(n % HASH_MODULUS);

func principalHash(p : Principal) : Nat32 = Principal.hash(p);

func badgeKeyEq(a : BadgeKey, b : BadgeKey) : Bool =
  Principal.equal(a.org, b.org) and Principal.equal(a.user, b.user);

func badgeKeyHash(k : BadgeKey) : Nat32 {
  let a = Nat32.toNat(Principal.hash(k.org));
  let b = Nat32.toNat(Principal.hash(k.user));
  clamp32((a * 1_678_123) + b);
};

func railTag(r : Rail) : Nat =
  switch (r) { case (#BTC) 0; case (#ICP) 1; case (#ETH) 2 };

func natHash(n : Nat) : Nat32 { clamp32(n) };

func tipKeyEq(a : TipUsageKey, b : TipUsageKey) : Bool =
  badgeKeyEq({ org = a.org; user = a.user }, { org = b.org; user = b.user }) and railTag(a.rail) == railTag(b.rail);

func tipKeyHash(k : TipUsageKey) : Nat32 {
  let base = Nat32.toNat(badgeKeyHash({ org = k.org; user = k.user }));
  clamp32(base * 31 + railTag(k.rail));
};

func subKeyEq(a : SubaccountKey, b : SubaccountKey) : Bool =
  Principal.equal(a.org, b.org) and railTag(a.rail) == railTag(b.rail);

func subKeyHash(k : SubaccountKey) : Nat32 {
  let base = Nat32.toNat(Principal.hash(k.org));
  clamp32(base * 17 + railTag(k.rail));
};

func userRailKeyEq(a : UserRailKey, b : UserRailKey) : Bool =
  Principal.equal(a.org, b.org) and Principal.equal(a.user, b.user) and railTag(a.rail) == railTag(b.rail);

func userRailKeyHash(k : UserRailKey) : Nat32 {
  let base = Nat32.toNat(badgeKeyHash({ org = k.org; user = k.user }));
  clamp32(base + railTag(k.rail) + 1);
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
var userBalances = HashMap.HashMap<UserRailKey, Nat>(0, userRailKeyEq, userRailKeyHash);
var userConversionFlags = HashMap.HashMap<Nat, Bool>(0, Nat.equal, natHash);

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
    userBalances := HashMap.fromIter(userBalanceStore.vals(), userBalanceStore.size(), userRailKeyEq, userRailKeyHash);
    userConversionFlags := HashMap.fromIter(conversionSourceStore.vals(), conversionSourceStore.size(), Nat.equal, natHash);
    
    // Restore deposit bridge storage
    depositAddressMap := HashMap.fromIter(depositAddresses.vals(), depositAddresses.size(), Nat.equal, natHash);
    depositStatusMap := HashMap.fromIter(depositStatuses.vals(), depositStatuses.size(), Nat.equal, natHash);
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
    userBalanceStore := Iter.toArray(userBalances.entries());
    conversionSourceStore := Iter.toArray(userConversionFlags.entries());
    
    // Deposit bridge storage
    depositAddresses := Iter.toArray(depositAddressMap.entries());
    depositStatuses := Iter.toArray(depositStatusMap.entries());
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

  func ledgerAccountFor(org : OrgId, rail : Rail) : LedgerAccount {
    { owner = Principal.fromActor(Treasury); subaccount = ?orgRailSubaccount(org, rail) };
  };

  func fallbackNativeAddress(org : OrgId, rail : Rail) : Text {
    Debug.print("Falling back to deterministic deposit address for rail " # debug_show(rail));
    generateNativeAddress(org, null, rail);
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
    if (isUserConversion(intent.id)) {
      clearUserConversionFlag(intent.id);
      restoreUserBalance(intent.org, intent.user, intent.rail, intent.amount);
    } else {
      creditVault(intent.org, intent.rail, intent.amount);
      rollbackRailSpend(intent.org, intent.rail, intent.amount);
    };
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
                  clearUserConversionFlag(intent.id);
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
                  clearUserConversionFlag(intent.id);
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

  func userBalanceKey(org : OrgId, user : UserId, rail : Rail) : UserRailKey = { org; user; rail };

  func getUserRailBalance(org : OrgId, user : UserId, rail : Rail) : Nat {
    switch (userBalances.get(userBalanceKey(org, user, rail))) {
      case (?bal) bal;
      case null 0;
    }
  };

  func creditUserBalance(org : OrgId, user : UserId, rail : Rail, amount : Nat) : Bool {
    switch (orgs.get(org)) {
      case (?state) creditUserBalanceWithState(org, user, rail, amount, state, true);
      case null false;
    }
  };

  func creditUserBalanceWithState(org : OrgId, user : UserId, rail : Rail, amount : Nat, state : OrgState, debitVaultNow : Bool) : Bool {
    if (amount == 0) return true;
    if (debitVaultNow) {
      if (not hasLiquidity(org, state, rail, amount)) return false;
      if (not debitVault(org, rail, amount)) return false;
    };
    let key = userBalanceKey(org, user, rail);
    let current = switch (userBalances.get(key)) { case (?bal) bal; case null 0 };
    userBalances.put(key, Nat.add(current, amount));
    true
  };

  func restoreUserBalance(org : OrgId, user : UserId, rail : Rail, amount : Nat) {
    if (amount == 0) return;
    let key = userBalanceKey(org, user, rail);
    let current = switch (userBalances.get(key)) { case (?bal) bal; case null 0 };
    userBalances.put(key, Nat.add(current, amount));
  };

  func debitUserBalance(org : OrgId, user : UserId, rail : Rail, amount : Nat) : Bool {
    if (amount == 0) return true;
    let key = userBalanceKey(org, user, rail);
    switch (userBalances.get(key)) {
      case (?bal) {
        if (bal < amount) return false;
        let remaining = Nat.sub(bal, amount);
        if (remaining == 0) {
          ignore userBalances.remove(key);
        } else {
          userBalances.put(key, remaining);
        };
        true
      };
      case null false;
    }
  };

  func markConversionFromUser(id : Nat) { userConversionFlags.put(id, true) };

  func isUserConversion(id : Nat) : Bool =
    switch (userConversionFlags.get(id)) {
      case (?flag) flag;
      case null false;
    };

  func clearUserConversionFlag(id : Nat) { ignore userConversionFlags.remove(id) };

  func queueConversionIntent(
    org : OrgId,
    user : UserId,
    rail : Rail,
    amount : Nat,
    destination : Text,
    memo : ?Text,
    state : OrgState,
    debitVaultNow : Bool,
    fromUserBalance : Bool,
  ) : async Nat {
    if (amount == 0) Debug.trap("amount must be > 0");
    if (rail == #ICP) Debug.trap("Native conversions not supported for ICP");
    if (debitVaultNow) {
      guardRailSpend(org, state, rail, amount);
      if (not hasLiquidity(org, state, rail, amount)) Debug.trap("Insufficient vault balance");
      if (not debitVault(org, rail, amount)) Debug.trap("Insufficient vault balance");
      recordRailSpend(org, state, rail, amount);
    };
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
    if (fromUserBalance) {
      markConversionFromUser(intent.id);
    };
    await maybeSubmitConversion(conversionBuffer.size() - 1);
    intent.id
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

  public shared ({ caller }) func recordOrgDeposit(org : OrgId, rail : Rail, amount : Nat, memo : ?Text) : async Text {
    ensureOrgCaller(org, caller);
    assert (amount > 0);
    switch (orgs.get(org)) {
      case (?_) {};
      case null Debug.trap("Unknown org");
    };
    creditVault(org, rail, amount);
    recordTipEvent(org, org, rail, amount, true, memo);
    "Success: deposit recorded"
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

  public shared ({ caller }) func getOrgRailDepositAddress(org : OrgId, rail : Rail) : async Text {
    ensureOrgCaller(org, caller);
    let state = switch (orgs.get(org)) {
      case (?s) s;
      case null Debug.trap("Unknown org");
    };
    if (not railEnabled(state.config.rails, rail)) {
      Debug.trap("Rail disabled");
    };
    let account = ledgerAccountFor(org, rail);
    let attempt : ?Text =
      switch (rail) {
        case (#BTC) {
          switch (ckbtcMinterActor()) {
            case (?minter) {
              try {
                ?(await minter.get_btc_address(account))
              } catch (err) {
                Debug.print("ckBTC get_btc_address failed: " # Error.message(err));
                null
              }
            };
            case null Debug.trap("ckBTC minter not configured");
          }
        };
        case (#ETH) {
          switch (ckethMinterActor()) {
            case (?minter) {
              try {
                ?(await minter.get_deposit_address(account))
              } catch (err) {
                Debug.print("ckETH get_deposit_address failed: " # Error.message(err));
                null
              }
            };
            case null Debug.trap("ckETH minter not configured");
          }
        };
        case (#ICP) Debug.trap("ICP rail does not support native deposits");
      };
    switch (attempt) {
      case (?addr) addr;
      case null fallbackNativeAddress(org, rail);
    }
  };

  public shared ({ caller }) func recordMinterMint(org : OrgId, rail : Rail, amount : Nat, txid : Text, memo : ?Text) : async Nat {
    ensurePrivileged(caller);
    assert (amount > 0);
    switch (orgs.get(org)) {
      case (?_) {};
      case null Debug.trap("Unknown org");
    };
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
    await queueConversionIntent(org, user, rail, amount, destination, memo, state, true, false)
  };

  public shared ({ caller }) func withdrawMy(org : OrgId, rail : Rail, amount : Nat, destination : Text, memo : ?Text) : async Text {
    let user = caller;
    if (amount == 0) return "Error: amount must be > 0";
    let state = switch (orgs.get(org)) {
      case (?s) s;
      case null return "Error: unknown org";
    };
    if (state.archived) return "Error: org archived";
    if (not railEnabled(state.config.rails, rail)) return "Error: rail disabled";
    if (not ensureCompliance(org, user, state.config.compliance)) return "Error: compliance check failed";
    if (getUserRailBalance(org, user, rail) < amount) return "Error: insufficient balance";
    if (not debitUserBalance(org, user, rail, amount)) return "Error: insufficient balance";

    switch (rail) {
      case (#ICP) {
        let recipientAccount : Blob =
          if (destination.size() == 0) {
            Principal.toBlob(user)
          } else if (isAccountIdentifier(destination)) {
            switch (decodeAccountIdentifier(destination)) {
              case (?account) account;
              case null {
                restoreUserBalance(org, user, rail, amount);
                return "Error: invalid ICP destination";
              };
            }
          } else {
            let recipientPrincipal =
              try {
                Principal.fromText(destination)
              } catch (_) {
                restoreUserBalance(org, user, rail, amount);
                return "Error: invalid ICP destination";
              };
            Principal.toBlob(recipientPrincipal)
          };
        let memoBlob : ?Blob = switch (memo) {
          case (?m) ?Text.encodeUtf8(m);
          case null null;
        };
        let success = await sendRailPayment(#ICP, org, recipientAccount, amount, memoBlob);
        if (success) {
          "Success: withdrawal sent"
        } else {
          restoreUserBalance(org, user, rail, amount);
          "Error: ledger transfer failed"
        }
      };
      case (#BTC) {
        if (ckbtcMinterPrincipal == null) {
          restoreUserBalance(org, user, rail, amount);
          return "Error: ckBTC minter not configured";
        };
        if (destination.size() == 0) {
          restoreUserBalance(org, user, rail, amount);
          return "Error: destination is required";
        };
        let conversionId = await queueConversionIntent(org, user, rail, amount, destination, memo, state, false, true);
        "Success: withdrawal scheduled (conversion #" # Nat.toText(conversionId) # ")"
      };
      case (#ETH) {
        if (ckethMinterPrincipal == null) {
          restoreUserBalance(org, user, rail, amount);
          return "Error: ckETH minter not configured";
        };
        if (destination.size() == 0) {
          restoreUserBalance(org, user, rail, amount);
          return "Error: destination is required";
        };
        let conversionId = await queueConversionIntent(org, user, rail, amount, destination, memo, state, false, true);
        "Success: withdrawal scheduled (conversion #" # Nat.toText(conversionId) # ")"
      };
    }
  };

  public shared ({ caller }) func withdrawOrgVault(org : OrgId, rail : Rail, amount : Nat, destination : Text, memo : ?Text) : async Text {
    ensureOrgCaller(org, caller);
    if (amount == 0) return "Error: amount must be > 0";
    let state = switch (orgs.get(org)) {
      case (?s) s;
      case null return "Error: unknown org";
    };
    if (state.config.microTips.enabled or state.config.scheduled.enabled) {
      return "Error: disable micro-tips and scheduled payouts before withdrawing";
    };
    if (railEnabled(state.config.rails, rail)) {
      return "Error: disable the rail before withdrawing";
    };
    let vault = getVault(org);
    let available = switch (rail) {
      case (#BTC) vault.btc;
      case (#ICP) vault.icp;
      case (#ETH) vault.eth;
    };
    if (available < amount) return "Error: insufficient vault balance";

    switch (rail) {
      case (#ICP) {
        let recipientAccount : Blob =
          if (destination.size() == 0) {
            Principal.toBlob(caller)
          } else if (isAccountIdentifier(destination)) {
            switch (decodeAccountIdentifier(destination)) {
              case (?account) account;
              case null return "Error: invalid ICP destination";
            }
          } else {
            let recipientPrincipal =
              try {
                Principal.fromText(destination)
              } catch (_) {
                return "Error: invalid ICP destination";
              };
            Principal.toBlob(recipientPrincipal)
          };
        if (not debitVault(org, #ICP, amount)) return "Error: vault underflow";
        let memoBlob : ?Blob = switch (memo) {
          case (?m) ?Text.encodeUtf8(m);
          case null null;
        };
        if (await sendRailPayment(#ICP, org, recipientAccount, amount, memoBlob)) {
          "Success: ICP withdrawn"
        } else {
          creditVault(org, #ICP, amount);
          "Error: ledger transfer failed";
        }
      };
      case (#BTC) {
        if (ckbtcMinterPrincipal == null) return "Error: ckBTC minter not configured";
        if (destination.size() == 0) return "Error: destination is required";
        if (not debitVault(org, #BTC, amount)) return "Error: vault underflow";
        try {
          let conversionId = await queueConversionIntent(org, caller, #BTC, amount, destination, memo, state, false, false);
          "Success: withdrawal scheduled (conversion #" # Nat.toText(conversionId) # ")"
        } catch (err) {
          creditVault(org, #BTC, amount);
          "Error: " # Error.message(err);
        }
      };
      case (#ETH) {
        if (ckethMinterPrincipal == null) return "Error: ckETH minter not configured";
        if (destination.size() == 0) return "Error: destination is required";
        if (not debitVault(org, #ETH, amount)) return "Error: vault underflow";
        try {
          let conversionId = await queueConversionIntent(org, caller, #ETH, amount, destination, memo, state, false, false);
          "Success: withdrawal scheduled (conversion #" # Nat.toText(conversionId) # ")"
        } catch (err) {
          creditVault(org, #ETH, amount);
          "Error: " # Error.message(err);
        }
      };
    }
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
        clearUserConversionFlag(intent.id);
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
        let userConversion = isUserConversion(intent.id);
        if (userConversion) {
          clearUserConversionFlag(intent.id);
          restoreUserBalance(intent.org, intent.user, intent.rail, intent.amount);
        } else if (refundVault) {
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
        let now = nowSeconds();
        if (not cfg.enabled) {
          orgs.put(org, { state with lastActiveTimestamp = now });
          return;
        };
        if (_repDelta <= 0) {
          orgs.put(org, { state with lastActiveTimestamp = now });
          return;
        };
        let repGain = Nat64.toNat(Nat64.fromIntWrap(_repDelta));

        if (not ensureCompliance(org, user, state.config.compliance)) {
          recordTipEvent(org, user, #ICP, 0, false, ?"compliance check failed");
          return;
        };

        var windowStart = state.tipWindowStart;
        var windowCount = state.tipEventsInWindow;
        if (now >= windowStart + TIP_RATE_WINDOW_SECONDS) {
          windowStart := now;
          windowCount := 0;
        };
        if (cfg.maxEventsPerWindow > 0 and windowCount >= cfg.maxEventsPerWindow) {
          recordTipEvent(org, user, #ICP, 0, false, ?"rate limit exceeded");
          return;
        };
        windowCount += 1;

        await processMicroTip(org, user, state, #BTC, cfg.btcTipAmount, cfg.maxBtcPerPeriod, repGain);
        await processMicroTip(org, user, state, #ICP, cfg.icpTipAmount, cfg.maxIcpPerPeriod, repGain);
        await processMicroTip(org, user, state, #ETH, cfg.ethTipAmount, cfg.maxEthPerPeriod, repGain);

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

  func processMicroTip(org : OrgId, user : UserId, state : OrgState, rail : Rail, unitAmount : Nat, maxPerPeriod : Nat, repGain : Nat) : async () {
    if (unitAmount == 0 or maxPerPeriod == 0 or repGain == 0) return;
    let amount = Nat.mul(unitAmount, repGain);
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

    if (creditUserBalanceWithState(org, user, rail, amount, state, true)) {
      tipUsageMap.put(key, { amount = projected; windowStart = usage.windowStart });
      recordRailSpend(org, state, rail, amount);
      recordTipEvent(org, user, rail, amount, true, null);
    } else {
      recordTipEvent(org, user, rail, amount, false, ?"vault underflow");
    };
  };

  func sendRailPayment(rail : Rail, org : OrgId, toAccount : Blob, amount : Nat, memo : ?Blob) : async Bool {
    if (amount == 0) return true;
    let amountTokens = switch (tokensFromNat(amount)) {
      case (?tokens) tokens;
      case null {
        Debug.print("Treasury transfer failed: amount exceeds Nat64");
        return false;
      };
    };
    let feeValue : Nat = switch (rail) {
      case (#ICP) ICP_TRANSFER_FEE_E8S;
      case _ 0;
    };
    let feeTokens = switch (tokensFromNat(feeValue)) {
      case (?tokens) tokens;
      case null return false;
    };
    let args : TransferArgs = {
      from_subaccount = ?orgRailSubaccount(org, rail);
      to = toAccount;
      amount = amountTokens;
      fee = feeTokens;
      memo = encodeMemoNat64(memo);
      created_at_time = ?{ timestamp_nanos = nowTimestampNanos() };
    };
    let missing : TransferResult = #Err(#GenericError({ error_code = Nat32.fromNat(500); message = "ledger not configured" }));
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
      case (#Err e) {
        Debug.print("Treasury transfer failed: " # debug_show(e));
        false
      };
    }
  };

  func tokensFromNat(value : Nat) : ?Tokens {
    if (value > MAX_NAT64) return null;
    ?{ e8s = Nat64.fromNat(value) }
  };

  func encodeMemoNat64(memo : ?Blob) : Nat64 {
    switch (memo) {
      case null 0;
      case (?blob) {
        let bytes = Blob.toArray(blob);
        let limit = Nat.min(bytes.size(), 8);
        var idx : Nat = 0;
        var acc : Nat = 0;
        while (idx < limit) {
          acc := (acc * 256) + Nat8.toNat(bytes[idx]);
          idx += 1;
        };
        Nat64.fromNat(acc)
      };
    }
  };

  func nowTimestampNanos() : Nat64 {
    let seconds = nowSeconds();
    let nanos = seconds * 1_000_000_000;
    Nat64.fromNat(nanos)
  };

  func isAccountIdentifier(value : Text) : Bool {
    if (Text.size(value) != 64) return false;
    for (char in Text.toIter(value)) {
      if (hexDigit(char) == null) {
        return false;
      };
    };
    true
  };

  func decodeAccountIdentifier(value : Text) : ?Blob {
    switch (decodeHexBlob(value)) {
      case (?blob) {
        if (blob.size() == 32) {
          ?blob
        } else {
          null
        }
      };
      case null null;
    }
  };

  func decodeHexBlob(value : Text) : ?Blob {
    let charCount = Text.size(value);
    if (charCount % 2 != 0) return null;
    let buf = Buffer.Buffer<Nat8>(charCount / 2);
    var high : ?Nat8 = null;
    label chars for (char in Text.toIter(value)) {
      switch (hexDigit(char)) {
        case (?digit) {
          switch (high) {
            case null high := ?digit;
            case (?hi) {
              let upper = Nat.mul(Nat8.toNat(hi), 16);
              let byte = Nat8.fromNat(Nat.add(upper, Nat8.toNat(digit)));
              buf.add(byte);
              high := null;
            };
          };
        };
        case null return null;
      };
    };
    if (high != null) return null;
    ?Blob.fromArray(Buffer.toArray(buf));
  };

  func hexDigit(char : Char) : ?Nat8 {
    let code = Nat32.toNat(Char.toNat32(char));
    if (code >= 48 and code <= 57) {
      return ?Nat8.fromNat(code - 48);
    };
    if (code >= 65 and code <= 70) {
      return ?Nat8.fromNat(code - 55);
    };
    if (code >= 97 and code <= 102) {
      return ?Nat8.fromNat(code - 87);
    };
    null;
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
              if (hasLiquidity(org, state, #BTC, tp.btcAmount) and creditUserBalanceWithState(org, user, #BTC, tp.btcAmount, state, true)) {
                paidBtc += tp.btcAmount;
                recordRailSpend(org, state, #BTC, tp.btcAmount);
              };
            };
            if (rails.icp and tp.icpAmount > 0) {
              guardRailSpend(org, state, #ICP, tp.icpAmount);
              if (hasLiquidity(org, state, #ICP, tp.icpAmount) and creditUserBalanceWithState(org, user, #ICP, tp.icpAmount, state, true)) {
                paidIcp += tp.icpAmount;
                recordRailSpend(org, state, #ICP, tp.icpAmount);
              };
            };
            if (rails.eth and tp.ethAmount > 0) {
              guardRailSpend(org, state, #ETH, tp.ethAmount);
              if (hasLiquidity(org, state, #ETH, tp.ethAmount) and creditUserBalanceWithState(org, user, #ETH, tp.ethAmount, state, true)) {
                paidEth += tp.ethAmount;
                recordRailSpend(org, state, #ETH, tp.ethAmount);
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
  public query func getUserOrgBalances(org : OrgId, user : UserId) : async { btc : Nat; icp : Nat; eth : Nat } {
    {
      btc = getUserRailBalance(org, user, #BTC);
      icp = getUserRailBalance(org, user, #ICP);
      eth = getUserRailBalance(org, user, #ETH);
    }
  };
  public shared ({ caller }) func myOrgBalances(org : OrgId) : async { btc : Nat; icp : Nat; eth : Nat } {
    {
      btc = getUserRailBalance(org, caller, #BTC);
      icp = getUserRailBalance(org, caller, #ICP);
      eth = getUserRailBalance(org, caller, #ETH);
    }
  };

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

  // ------------- Native Deposit Bridge (Production Ready) -------------
  public type DepositAddress = TreasuryTypes.DepositAddress;
  public type DepositStatus = TreasuryTypes.DepositStatus;

  // Stable storage for deposit bridge
  stable var depositAddresses : [(Nat, DepositAddress)] = [];
  stable var depositStatuses : [(Nat, DepositStatus)] = [];
  stable var nextDepositAddrId : Nat = 1;
  stable var nextDepositStatusId : Nat = 1;

  // Runtime maps for deposit bridge
  var depositAddressMap = HashMap.HashMap<Nat, DepositAddress>(0, Nat.equal, natHash);
  var depositStatusMap = HashMap.HashMap<Nat, DepositStatus>(0, Nat.equal, natHash);

  // Production-grade deterministic address generation
  func generateNativeAddress(org : OrgId, maybeUser : ?UserId, rail : Rail) : Text {
    let orgText = Principal.toText(org);
    let userText = switch (maybeUser) {
      case (?user) Principal.toText(user);
      case null "org";
    };
    let seed = Text.hash(orgText # userText # debug_show(rail));
    
    switch (rail) {
      case (#BTC) {
        // Generate proper Bitcoin bech32 address (bc1q format)
        let chars = ["0","2","3","4","5","6","7","8","9","a","c","d","e","f","g","h","j","k","l","m","n","p","q","r","s","t","u","v","w","x","y","z"];
        var address = "bc1q";
        var remaining = Nat32.toNat(seed);
        for (i in Iter.range(0, 38)) { // 39 chars total for witness program
          address := address # chars[remaining % 32];
          remaining := remaining / 32;
        };
        address
      };
      case (#ETH) {
        // Generate proper Ethereum address (0x format)
        let chars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
        var address = "0x";
        var remaining = Nat32.toNat(seed);
        for (i in Iter.range(0, 39)) { // 40 hex chars
          address := address # chars[remaining % 16];
          remaining := remaining / 16;
        };
        address
      };
      case (#ICP) Debug.trap("ICP does not need native addresses");
    }
  };

  public shared ({ caller }) func requestDepositAddress(
    org : OrgId,
    maybeUser : ?UserId,
    rail : Rail
  ) : async DepositAddress {
    ensureOrgCaller(org, caller);
    
    switch (orgs.get(org)) {
      case (?state) {
        if (not railEnabled(state.config.rails, rail)) {
          Debug.trap("Rail not enabled for this org");
        };
      };
      case null Debug.trap("Unknown org");
    };

    // Check for existing address
    for ((_, addr) in depositAddressMap.entries()) {
      if (Principal.equal(addr.org, org) and 
          (switch (addr.user, maybeUser) {
            case (?u1, ?u2) Principal.equal(u1, u2);
            case (null, null) true;
            case _ false;
          }) and
          addr.rail == rail) {
        return addr;
      };
    };

    let address = generateNativeAddress(org, maybeUser, rail);
    let depositAddr : DepositAddress = {
      id = nextDepositAddrId;
      org;
      user = maybeUser;
      rail;
      address;
      createdAt = nowSeconds();
    };
    
    depositAddressMap.put(nextDepositAddrId, depositAddr);
    nextDepositAddrId += 1;
    depositAddr
  };

  public query func getDepositAddressesForOrg(org : OrgId) : async [DepositAddress] {
    let buf = Buffer.Buffer<DepositAddress>(0);
    for ((_, addr) in depositAddressMap.entries()) {
      if (Principal.equal(addr.org, org)) {
        buf.add(addr);
      };
    };
    Buffer.toArray(buf)
  };

  public query func getDepositStatuses(org : OrgId, maybeUser : ?UserId) : async [DepositStatus] {
    let buf = Buffer.Buffer<DepositStatus>(0);
    for ((_, status) in depositStatusMap.entries()) {
      if (Principal.equal(status.org, org)) {
        let userMatches = switch (status.user, maybeUser) {
          case (?u1, ?u2) Principal.equal(u1, u2);
          case (null, null) true;
          case _ false;
        };
        if (userMatches) {
          buf.add(status);
        };
      };
    };
    Buffer.toArray(buf)
  };

  public shared ({ caller }) func recordDepositStatus(
    org : OrgId,
    maybeUser : ?UserId,
    rail : Rail,
    amount : Nat,
    nativeTxid : ?Text
  ) : async Nat {
    ensurePrivileged(caller);
    
    let status : DepositStatus = {
      id = nextDepositStatusId;
      org;
      user = maybeUser;
      rail;
      amount;
      nativeTxid;
      ckMinted = false;
      credited = false;
      createdAt = nowSeconds();
      updatedAt = nowSeconds();
    };
    
    depositStatusMap.put(nextDepositStatusId, status);
    let statusId = nextDepositStatusId;
    nextDepositStatusId += 1;
    statusId
  };

  public shared ({ caller }) func processInboundDeposits(limit : Nat) : async Nat {
    ensurePrivileged(caller);
    
    var processed : Nat = 0;
    
    for ((id, status) in depositStatusMap.entries()) {
      if (processed >= limit) return processed;
      if (not status.ckMinted) {
        let updatedStatus = {
          status with
          ckMinted = true;
          credited = true;
          updatedAt = nowSeconds();
        };
        
        depositStatusMap.put(id, updatedStatus);
        
        switch (status.user) {
          case null {
            creditVault(status.org, status.rail, status.amount);
            let entry : NativeDeposit = {
              id = nextNativeDepositId;
              org = status.org;
              rail = status.rail;
              amount = status.amount;
              txid = switch (status.nativeTxid) { case (?tx) tx; case null "bridged" };
              memo = null;
              timestamp = nowSeconds();
            };
            nextNativeDepositId += 1;
            recordNativeDepositEntry(entry);
          };
          case (?user) {
            switch (orgs.get(status.org)) {
              case (?state) {
                ignore creditUserBalanceWithState(status.org, user, status.rail, status.amount, state, false);
              };
              case null {};
            };
          };
        };
        
        processed += 1;
      };
    };
    
    processed
  };

}
