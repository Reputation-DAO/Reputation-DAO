import Principal "mo:base/Principal";
import Text "mo:base/Text";

module {
  public type OrgId = Principal;
  public type UserId = Principal;

  public type Rail = { #BTC; #ICP; #ETH };

  public type RailsEnabled = {
    btc : Bool;
    icp : Bool;
    eth : Bool;
  };

  public type MicroTipConfig = {
    enabled : Bool;
    btcTipAmount : Nat;
    icpTipAmount : Nat;
    ethTipAmount : Nat;
    maxBtcPerPeriod : Nat;
    maxIcpPerPeriod : Nat;
    maxEthPerPeriod : Nat;
    maxEventsPerWindow : Nat;
  };

  public type PayoutFrequency = { #Weekly; #Monthly; #CustomDays : Nat };

  public type Tier = { #Bronze; #Silver; #Gold; #Custom : Text };

  public type TierPayout = {
    tier : Tier;
    btcAmount : Nat;
    icpAmount : Nat;
    ethAmount : Nat;
  };

  public type ScheduledPayoutConfig = {
    enabled : Bool;
    frequency : PayoutFrequency;
    maxBtcPerCycle : Nat;
    maxIcpPerCycle : Nat;
    maxEthPerCycle : Nat;
    tiers : [TierPayout];
  };

  public type DeadManConfig = {
    enabled : Bool;
    inactivityThresholdSeconds : Nat;
  };

  public type RailThresholds = {
    btcMin : Nat;
    icpMin : Nat;
    ethMin : Nat;
  };

  public type ComplianceRule = {
    kycRequired : Bool;
    tagWhitelist : [Text];
  };

  public type Badge = { name : Text; rail : ?Rail };
  public type UserBadges = [Badge];

  public type UserCompliance = {
    kycVerified : Bool;
    tags : [Text];
  };

  public type SpendControl = {
    usdCapE8s : ?Nat;
    railDailyCaps : {
      btc : ?Nat;
      icp : ?Nat;
      eth : ?Nat;
    };
  };

  public type OrgConfig = {
    rails : RailsEnabled;
    microTips : MicroTipConfig;
    scheduled : ScheduledPayoutConfig;
    deadman : DeadManConfig;
    thresholds : RailThresholds;
    compliance : ComplianceRule;
    spendControl : ?SpendControl;
  };
};
