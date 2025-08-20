// Reputation DAO Canister
// main.mo
// Soulbound reputation system for Discord trading community
// Built for ICP in Motoko


import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Text "mo:base/Text";


// Main Reputation DAO actor
persistent actor ReputationDAO {

    // Transaction log entry type
    public type TransactionType = {
        #Award;
        #Revoke;
        #Decay;  // New type for decay transactions
    };

    public type Transaction = {
        id: Nat;
        transactionType: TransactionType;
        from: Principal;  // Who performed the action
        to: Principal;    // Who received/lost points
        amount: Nat;
        timestamp: Nat;   // Unix timestamp
        reason: ?Text;    // Optional reason for the transaction
    };
    
    public type Awarder = {
      id: Principal;
      name: Text;
    };

    // Decay configuration type
    public type DecayConfig = {
        decayRate: Nat;          // Decay rate in basis points (100 = 1%)
        decayInterval: Nat;      // Decay interval in seconds (e.g., 2592000 = 30 days)
        minThreshold: Nat;       // Minimum points below which no decay applies
        gracePeriod: Nat;        // Grace period for new users in seconds (e.g., 2592000 = 30 days)
        enabled: Bool;           // Whether decay is enabled
    };

    // User decay info type
    public type UserDecayInfo = {
        lastDecayTime: Nat;      // Last time decay was applied
        registrationTime: Nat;   // When user first received points
        lastActivityTime: Nat;   // Last time user had any transaction
        totalDecayed: Nat;       // Total amount decayed over time
    };

    // Multi-Organization Types
    public type OrgID = Text;
    
    public type OrgData = {
        admin: Principal;
        trustedAwarders: [(Principal, Text)];
        userBalances: [(Principal, Nat)];
        dailyMinted: [(Principal, Nat)];
        lastMintTimestamp: [(Principal, Nat)];
        userDecayInfo: [(Principal, UserDecayInfo)];
        transactionHistory: [Transaction];
        nextTransactionId: Nat;
        totalDecayedPoints: Nat;
        lastGlobalDecayProcess: Nat;
    };

    public type OrgStats = {
        admin: Principal; 
        awarderCount: Nat; 
        userCount: Nat;
        totalPoints: Nat;
        totalTransactions: Nat;
    };


    // --- Legacy Stable State - DEPRECATED (use multi-org functions) ---

    // Reputation balances: Principal -> Nat (DEPRECATED - use org-specific functions)
    var _balances : Trie.Trie<Principal, Nat> = Trie.empty();

    // Trusted awarders: Principal -> Text (DEPRECATED - use org-specific functions)
    var _trustedAwarders : Trie.Trie<Principal, Text> = Trie.empty();

    // Daily minted amount per awarder: Principal -> Nat (DEPRECATED - use org-specific functions)
    var _dailyMinted : Trie.Trie<Principal, Nat> = Trie.empty();

    // Last mint timestamp per awarder: Principal -> Nat (DEPRECATED - use org-specific functions) 
    var _lastMintTimestamp : Trie.Trie<Principal, Nat> = Trie.empty();

    // Transaction log storage (DEPRECATED - use org-specific functions)
    var _transactionHistory : [Transaction] = [];
    var _nextTransactionId : Nat = 1;

    // --- DECAY SYSTEM STATE ---
    
    // Decay configuration
    var decayConfig : DecayConfig = {
        decayRate = 500;         // 5% decay rate (500 basis points)
        decayInterval = 300;     // 5 minutes for testing (was 2592000 = 30 days)
        minThreshold = 10;       // No decay below 10 points
        gracePeriod = 300;       // 5 minutes grace period for testing (was 2592000 = 30 days)
        enabled = true;          // Decay is enabled by default
    };

    // User decay information: Principal -> UserDecayInfo
    var userDecayInfo : Trie.Trie<Principal, UserDecayInfo> = Trie.empty();

    // Global decay statistics
    var totalDecayedPoints : Nat = 0;
    var lastGlobalDecayProcess : Nat = 0;

    // Owner/admin principal (replace with your actual principal before deploy)


    // TODO: Set your admin principal aka your plug id here 

    var owner : Principal = Principal.fromText("gvlvr-wz5ef-7evg7-bphlu-yld24-vgds7-ghcic-do3kl-ecvlh-3mdkp-2ae"); 

    // --- MULTI-ORGANIZATION STATE ---
    
    // Organizations storage: OrgID -> OrgData
    var organizations : Trie.Trie<Text, OrgData> = Trie.empty(); 

    // --- AUTOMATIC DECAY TIMER ---


    // Automatic decay processing function - now processes all organizations
    private func processAutomaticDecay() : async () {
        if (not decayConfig.enabled) return;

        Debug.print("Processing automatic decay for all organizations...");

        var totalProcessedUsers = 0;
        var totalDecayed = 0;

        // Process each organization
        for ((orgId, orgData) in Trie.iter(organizations)) {
            var orgProcessedUsers = 0;
            var orgTotalDecayed = 0;

            // Process each user in this organization
            for ((user, balance) in orgData.userBalances.vals()) {
                if (balance > 0) {
                    let decayAmount = applyDecayToUserInOrg(orgId, user);
                    if (decayAmount > 0) {
                        orgProcessedUsers += 1;
                        orgTotalDecayed += decayAmount;
                    };
                };
            };

            totalProcessedUsers += orgProcessedUsers;
            totalDecayed += orgTotalDecayed;
            
            if (orgProcessedUsers > 0) {
                Debug.print("Org " # orgId # ": processed " # debug_show(orgProcessedUsers) # " users, decayed " # debug_show(orgTotalDecayed) # " points");
            };
        };

        lastGlobalDecayProcess := now();
        Debug.print("Automatic decay processed " # debug_show(totalProcessedUsers) # " users across all orgs, total decayed: " # debug_show(totalDecayed));
    };

    // Heartbeat throttle: only process when full interval elapsed
    system func heartbeat() : async () {
        if (decayConfig.enabled and now() >= (lastGlobalDecayProcess + decayConfig.decayInterval)) {
            await processAutomaticDecay();
        };
    };

    // On upgrade we just preserve state; no timer IDs to recreate
    system func postupgrade() {
        // Force immediate decay check after upgrade by rewinding lastGlobalDecayProcess
        if (decayConfig.enabled) {
            if (lastGlobalDecayProcess > 0) { lastGlobalDecayProcess := lastGlobalDecayProcess - decayConfig.decayInterval; };
        };
    };

    // Restart logic after config changes: set lastGlobalDecayProcess so next heartbeat triggers soon
    private func restartDecayTimer() : async () {
        if (decayConfig.enabled) {
            // Set to an old time to trigger immediate processing on next heartbeat
            if (lastGlobalDecayProcess > decayConfig.decayInterval) {
                lastGlobalDecayProcess := lastGlobalDecayProcess - decayConfig.decayInterval;
            } else {
                lastGlobalDecayProcess := 0;
            };
        };
    };


    // --- Utility functions and core logic ---


    // Helper: Get current time (epoch seconds)


    func now() : Nat {
        Int.abs(Time.now() / 1_000_000_000)
    };

    // --- Multi-Organization Helper Functions ---
    
    // Helper: Create text key for Trie operations
    private func textKey(t: Text) : Trie.Key<Text> {
        { key = t; hash = Text.hash(t) }
    };
    
    // Helper: Validate organization exists
    private func validateOrgExists(orgId: OrgID) : ?OrgData {
        Trie.find(organizations, textKey(orgId), Text.equal)
    };
    
    // Helper: Update organization data
    private func updateOrgData(orgId: OrgID, orgData: OrgData) {
        organizations := Trie.replace(
            organizations,
            textKey(orgId),
            Text.equal,
            ?orgData
        ).0;
    };
    
    // Helper: Check if user is trusted awarder in organization
    private func isOrgTrustedAwarder(orgData: OrgData, user: Principal) : Bool {
        Array.find<(Principal, Text)>(
            orgData.trustedAwarders,
            func((p, _)) = Principal.equal(p, user)
        ) != null
    };
    
    // Helper: Get user balance in organization
    private func getOrgUserBalance(orgData: OrgData, user: Principal) : Nat {
        switch (Array.find<(Principal, Nat)>(
            orgData.userBalances,
            func((p, _)) = Principal.equal(p, user)
        )) {
            case (?(_, balance)) { balance };
            case null { 0 };
        }
    };
    
    // Helper: Find organization that user belongs to (as admin or trusted awarder)
    private func getUserOrganization(user: Principal) : ?Text {
        for ((orgId, orgData) in Trie.iter(organizations)) {
            // Check if user is admin
            if (Principal.equal(orgData.admin, user)) {
                return ?orgId;
            };
            // Check if user is trusted awarder
            if (isOrgTrustedAwarder(orgData, user)) {
                return ?orgId;
            };
        };
        null
    };
    
    // Helper: Update user balance in organization
    private func updateOrgUserBalance(orgData: OrgData, user: Principal, newBalance: Nat) : OrgData {
        let updatedBalances = Array.map<(Principal, Nat), (Principal, Nat)>(
            orgData.userBalances,
            func((p, balance)) = if (Principal.equal(p, user)) (p, newBalance) else (p, balance)
        );
        
        // If user not found, add them
        let finalBalances = if (Array.find<(Principal, Nat)>(
            orgData.userBalances,
            func((p, _)) = Principal.equal(p, user)
        ) == null) {
            Array.append(updatedBalances, [(user, newBalance)])
        } else {
            updatedBalances
        };
        
        {
            admin = orgData.admin;
            trustedAwarders = orgData.trustedAwarders;
            userBalances = finalBalances;
            dailyMinted = orgData.dailyMinted;
            lastMintTimestamp = orgData.lastMintTimestamp;
            userDecayInfo = orgData.userDecayInfo;
            transactionHistory = orgData.transactionHistory;
            nextTransactionId = orgData.nextTransactionId;
            totalDecayedPoints = orgData.totalDecayedPoints;
            lastGlobalDecayProcess = orgData.lastGlobalDecayProcess;
        }
    };

    // Helper: Add transaction to log
    private func addTransaction(txType: TransactionType, from: Principal, to: Principal, amount: Nat, reason: ?Text) {
        let transaction : Transaction = {
            id = _nextTransactionId;
            transactionType = txType;
            from = from;
            to = to;
            amount = amount;
            timestamp = now();
            reason = reason;
        };
        
        let buffer = Buffer.fromArray<Transaction>(_transactionHistory);
        buffer.add(transaction);
        _transactionHistory := Buffer.toArray(buffer);
        _nextTransactionId += 1;
    };

    // --- DECAY SYSTEM FUNCTIONS ---

    // Helper: Initialize user decay info if not exists
    private func initializeUserDecayInfo(user: Principal) : UserDecayInfo {
        let userKey = { key = user; hash = Principal.hash(user) };
        let currentTime = now();
        
        switch (Trie.get<Principal, UserDecayInfo>(userDecayInfo, userKey, Principal.equal)) {
            case (?info) info;
            case null {
                let newInfo : UserDecayInfo = {
                    lastDecayTime = currentTime;
                    registrationTime = currentTime;
                    lastActivityTime = currentTime;
                    totalDecayed = 0;
                };
                userDecayInfo := Trie.put<Principal, UserDecayInfo>(userDecayInfo, userKey, Principal.equal, newInfo).0;
                newInfo
            };
        }
    };

    // Helper: Calculate decay amount for a user
    private func calculateDecayAmount(user: Principal, currentBalance: Nat) : Nat {
        if (not decayConfig.enabled) return 0;
        if (currentBalance < decayConfig.minThreshold) return 0;

        let _userKey = { key = user; hash = Principal.hash(user) };
        let info = initializeUserDecayInfo(user);
        let currentTime = now();

        // Check grace period
        if (currentTime < info.registrationTime + decayConfig.gracePeriod) {
            return 0;
        };

        // Check if decay interval has passed
        if (currentTime < info.lastDecayTime + decayConfig.decayInterval) {
            return 0;
        };

        // Calculate number of decay periods passed (safe subtraction using Nat.sub)
        let timeSinceLastDecay = if (currentTime >= info.lastDecayTime) {
            Nat.sub(currentTime, info.lastDecayTime)
        } else {
            0
        };
        let decayPeriods = timeSinceLastDecay / decayConfig.decayInterval;
        
        if (decayPeriods == 0) return 0;

        // Calculate simple decay amount (avoid complex loops)
        let decayAmount = (currentBalance * decayConfig.decayRate * decayPeriods) / 10000;
        
        // Ensure we don't decay below minimum threshold
        if (currentBalance >= decayAmount) {
            let newBalance = Nat.sub(currentBalance, decayAmount);
            if (newBalance < decayConfig.minThreshold and currentBalance >= decayConfig.minThreshold) {
                return Nat.sub(currentBalance, decayConfig.minThreshold);
            } else {
                return decayAmount;
            };
        } else {
            // If decay would take balance to 0, decay to minimum threshold instead
            if (currentBalance > decayConfig.minThreshold) {
                return Nat.sub(currentBalance, decayConfig.minThreshold);
            } else {
                return 0;
            };
        };
    };

    // Helper: Apply decay to a user
    private func applyDecayToUser(user: Principal) : Nat {
        let userKey = { key = user; hash = Principal.hash(user) };
        let currentBalance = switch (Trie.get<Principal, Nat>(_balances, userKey, Principal.equal)) {
            case (?b) b;
            case null 0;
        };

        if (currentBalance == 0) return 0;

        let decayAmount = calculateDecayAmount(user, currentBalance);
        if (decayAmount == 0) return 0;

        let newBalance = if (currentBalance >= decayAmount) {
            Nat.sub(currentBalance, decayAmount)
        } else {
            0
        };
        
        // Update balance
        _balances := Trie.put<Principal, Nat>(_balances, userKey, Principal.equal, newBalance).0;

        // Update user decay info with precise interval rollover
        let info = initializeUserDecayInfo(user);
        let currentTime = now();
        
        // Calculate how many complete intervals have passed
        let timeSinceLastDecay = if (currentTime >= info.lastDecayTime) {
            Nat.sub(currentTime, info.lastDecayTime)
        } else { 0 };
        
        let intervalsElapsed = if (decayConfig.decayInterval > 0) {
            timeSinceLastDecay / decayConfig.decayInterval
        } else { 1 };
        
        // Roll lastDecayTime forward by complete intervals to prevent drift
        let newLastDecayTime = info.lastDecayTime + (intervalsElapsed * decayConfig.decayInterval);
        
        let updatedInfo = {
            lastDecayTime = newLastDecayTime;
            registrationTime = info.registrationTime;
            lastActivityTime = info.lastActivityTime;
            totalDecayed = info.totalDecayed + decayAmount;
        };
        userDecayInfo := Trie.put<Principal, UserDecayInfo>(userDecayInfo, userKey, Principal.equal, updatedInfo).0;

        // Update global statistics
        totalDecayedPoints += decayAmount;

        // Log the decay transaction
        addTransaction(#Decay, user, user, decayAmount, ?"Automatic point decay");

        Debug.print("Applied decay: " # Nat.toText(decayAmount) # " points to user " # Principal.toText(user));
        
        decayAmount
    };

    // Apply decay to a user within a specific organization
    private func applyDecayToUserInOrg(orgId: OrgID, user: Principal) : Nat {
        switch (validateOrgExists(orgId)) {
            case null { return 0; }; // Organization doesn't exist
            case (?orgData) {
                // Get user's balance in this organization
                let userBalance = switch (Array.find<(Principal, Nat)>(orgData.userBalances, func(entry) = Principal.equal(entry.0, user))) {
                    case null { 0 };
                    case (?(_, balance)) { balance };
                };

                if (userBalance == 0) return 0;

                let decayAmount = calculateDecayAmountInOrg(orgId, user, userBalance);
                if (decayAmount == 0) return 0;

                let newBalance = if (userBalance >= decayAmount) {
                    Nat.sub(userBalance, decayAmount)
                } else {
                    0
                };

                // Update the user's balance in the organization
                let updatedUserBalances = Array.map<(Principal, Nat), (Principal, Nat)>(
                    orgData.userBalances,
                    func(entry: (Principal, Nat)) : (Principal, Nat) {
                        if (Principal.equal(entry.0, user)) {
                            (user, newBalance)
                        } else {
                            entry
                        }
                    }
                );

                // Update user decay info in the organization
                let currentTime = now();
                let info = getOrInitUserDecayInfoInOrg(orgId, user);
                
                // Calculate how many complete intervals have passed
                let timeSinceLastDecay = if (currentTime >= info.lastDecayTime) {
                    Nat.sub(currentTime, info.lastDecayTime)
                } else { 0 };
                
                let intervalsElapsed = if (decayConfig.decayInterval > 0) {
                    timeSinceLastDecay / decayConfig.decayInterval
                } else { 1 };
                
                // Roll lastDecayTime forward by complete intervals to prevent drift
                let newLastDecayTime = info.lastDecayTime + (intervalsElapsed * decayConfig.decayInterval);
                
                let updatedDecayInfo = {
                    lastDecayTime = newLastDecayTime;
                    registrationTime = info.registrationTime;
                    lastActivityTime = info.lastActivityTime;
                    totalDecayed = info.totalDecayed + decayAmount;
                };

                let updatedUserDecayInfo = Array.map<(Principal, UserDecayInfo), (Principal, UserDecayInfo)>(
                    orgData.userDecayInfo,
                    func(entry: (Principal, UserDecayInfo)) : (Principal, UserDecayInfo) {
                        if (Principal.equal(entry.0, user)) {
                            (user, updatedDecayInfo)
                        } else {
                            entry
                        }
                    }
                );

                // Add decay transaction to organization's history
                let decayTransaction : Transaction = {
                    id = orgData.nextTransactionId;
                    transactionType = #Decay;
                    from = user;
                    to = user;
                    amount = decayAmount;
                    timestamp = now();
                    reason = ?"Automatic point decay";
                };

                let updatedTransactionHistory = Array.append(orgData.transactionHistory, [decayTransaction]);

                // Update organization data
                let updatedOrgData: OrgData = {
                    admin = orgData.admin;
                    trustedAwarders = orgData.trustedAwarders;
                    userBalances = updatedUserBalances;
                    dailyMinted = orgData.dailyMinted;
                    lastMintTimestamp = orgData.lastMintTimestamp;
                    userDecayInfo = updatedUserDecayInfo;
                    transactionHistory = updatedTransactionHistory;
                    nextTransactionId = orgData.nextTransactionId + 1;
                    totalDecayedPoints = orgData.totalDecayedPoints + decayAmount;
                    lastGlobalDecayProcess = orgData.lastGlobalDecayProcess;
                };

                organizations := Trie.put<OrgID, OrgData>(organizations, textKey(orgId), Text.equal, updatedOrgData).0;

                Debug.print("Applied decay in org " # orgId # ": " # Nat.toText(decayAmount) # " points to user " # Principal.toText(user));
                
                decayAmount
            };
        };
    };

    // Calculate decay amount for a user within a specific organization
    private func calculateDecayAmountInOrg(orgId: OrgID, user: Principal, currentBalance: Nat) : Nat {
        if (not decayConfig.enabled) return 0;
        if (currentBalance < decayConfig.minThreshold) return 0;

        let info = getOrInitUserDecayInfoInOrg(orgId, user);
        let currentTime = now();

        // Check grace period
        if (currentTime < info.registrationTime + decayConfig.gracePeriod) {
            return 0;
        };

        // Check if decay interval has passed
        if (currentTime < info.lastDecayTime + decayConfig.decayInterval) {
            return 0;
        };

        // Calculate number of decay periods passed
        let timeSinceLastDecay = if (currentTime >= info.lastDecayTime) {
            Nat.sub(currentTime, info.lastDecayTime)
        } else {
            0
        };
        let decayPeriods = timeSinceLastDecay / decayConfig.decayInterval;
        
        if (decayPeriods == 0) return 0;

        // Calculate simple decay amount
        let decayAmount = (currentBalance * decayConfig.decayRate * decayPeriods) / 10000;
        
        // Ensure we don't decay below minimum threshold
        if (currentBalance >= decayAmount) {
            let newBalance = Nat.sub(currentBalance, decayAmount);
            if (newBalance < decayConfig.minThreshold and currentBalance >= decayConfig.minThreshold) {
                return Nat.sub(currentBalance, decayConfig.minThreshold);
            } else {
                return decayAmount;
            };
        } else {
            // If decay would take balance to 0, decay to minimum threshold instead
            if (currentBalance > decayConfig.minThreshold) {
                return Nat.sub(currentBalance, decayConfig.minThreshold);
            } else {
                return 0;
            };
        };
    };

    // Get or initialize user decay info within a specific organization
    private func getOrInitUserDecayInfoInOrg(orgId: OrgID, user: Principal) : UserDecayInfo {
        switch (validateOrgExists(orgId)) {
            case null {
                // Return default if org doesn't exist
                let currentTime = now();
                {
                    lastDecayTime = currentTime;
                    registrationTime = currentTime;
                    lastActivityTime = currentTime;
                    totalDecayed = 0;
                }
            };
            case (?orgData) {
                switch (Array.find<(Principal, UserDecayInfo)>(orgData.userDecayInfo, func(entry) = Principal.equal(entry.0, user))) {
                    case (?(_, info)) { info };
                    case null {
                        // Initialize new decay info for this user in this org
                        let currentTime = now();
                        let newInfo : UserDecayInfo = {
                            lastDecayTime = currentTime;
                            registrationTime = currentTime;
                            lastActivityTime = currentTime;
                            totalDecayed = 0;
                        };
                        
                        // Add to organization's userDecayInfo
                        let updatedUserDecayInfo = Array.append(orgData.userDecayInfo, [(user, newInfo)]);
                        let updatedOrgData: OrgData = {
                            admin = orgData.admin;
                            trustedAwarders = orgData.trustedAwarders;
                            userBalances = orgData.userBalances;
                            dailyMinted = orgData.dailyMinted;
                            lastMintTimestamp = orgData.lastMintTimestamp;
                            userDecayInfo = updatedUserDecayInfo;
                            transactionHistory = orgData.transactionHistory;
                            nextTransactionId = orgData.nextTransactionId;
                            totalDecayedPoints = orgData.totalDecayedPoints;
                            lastGlobalDecayProcess = orgData.lastGlobalDecayProcess;
                        };
                        organizations := Trie.put<OrgID, OrgData>(organizations, textKey(orgId), Text.equal, updatedOrgData).0;
                        
                        newInfo
                    };
                };
            };
        };
    };

 /// Register a new organization
    public shared(msg) func registerOrg(orgId: OrgID) : async Text {
        // Check if org already exists
        switch (validateOrgExists(orgId)) {
            case (?_) { return "Error: Organization already exists" };
            case null { };
        };

        let caller = msg.caller;

        // Create new organization data
        let orgData: OrgData = {
            admin = caller;
            trustedAwarders = [(caller, "Admin")]; // Admin is also a trusted awarder by default
            userBalances = [];
            dailyMinted = [];
            lastMintTimestamp = [];
            userDecayInfo = [];
            transactionHistory = [];
            nextTransactionId = 1;
            totalDecayedPoints = 0;
            lastGlobalDecayProcess = 0;
        };

        updateOrgData(orgId, orgData);
        "Success: Organization registered successfully"
    };

    // --- 1️⃣ awardRep: Award reputation in an organization ---
public shared({caller}) func awardRep(orgId: OrgID, to: Principal, amount: Nat, reason: ?Text) : async Text {
    Debug.print("awardRep called by " # Principal.toText(caller));
    
    if (amount == 0) {
        return "Error: Amount must be greater than 0";
    };

    switch (validateOrgExists(orgId)) {
        case null { return "Error: Organization does not exist" };
        case (?orgData) {
            // Check if caller is a trusted awarder
            if (not isOrgTrustedAwarder(orgData, caller)) {
                return "Error: Caller is not a trusted awarder";
            };

            // Check: cannot award to self (this is valid - awarders can award to others)
            if (Principal.equal(caller, to)) {
                return "Error: Cannot award reputation to yourself";
            };

            // Check daily mint limit
            let currentTime = now();
            let dailyLimit: Nat = 50; // Standardized daily limit
            
            let lastMintTime = switch (Array.find<(Principal, Nat)>(
                orgData.lastMintTimestamp,
                func((p, _)) = Principal.equal(p, caller)
            )) {
                case (?(_, time)) { time };
                case null { 0 };
            };
            
            let dailyMintedAmount = if (currentTime >= lastMintTime + 86400 or lastMintTime == 0) { // 24 hours
                0
            } else {
                switch (Array.find<(Principal, Nat)>(
                    orgData.dailyMinted,
                    func((p, _)) = Principal.equal(p, caller)
                )) {
                    case (?(_, minted)) { minted };
                    case null { 0 };
                }
            };

            if (dailyMintedAmount + amount > dailyLimit) {
                return "Error: Daily mint cap exceeded";
            };

            // Update user balance
            let currentBalance = getOrgUserBalance(orgData, to);
            let updatedOrgData = updateOrgUserBalance(orgData, to, currentBalance + amount);
            
            // Update daily minted tracking
            let updatedDailyMinted = Array.map<(Principal, Nat), (Principal, Nat)>(
                updatedOrgData.dailyMinted,
                func((p, minted)) = if (Principal.equal(p, caller)) (p, dailyMintedAmount + amount) else (p, minted)
            );
            
            let finalDailyMinted = if (Array.find<(Principal, Nat)>(
                updatedOrgData.dailyMinted,
                func((p, _)) = Principal.equal(p, caller)
            ) == null) {
                Array.append(updatedDailyMinted, [(caller, amount)])
            } else {
                updatedDailyMinted
            };
            
            // Update last mint timestamp
            let updatedLastMintTime = Array.map<(Principal, Nat), (Principal, Nat)>(
                updatedOrgData.lastMintTimestamp,
                func((p, time)) = if (Principal.equal(p, caller)) (p, currentTime) else (p, time)
            );
            
            let finalLastMintTime = if (Array.find<(Principal, Nat)>(
                updatedOrgData.lastMintTimestamp,
                func((p, _)) = Principal.equal(p, caller)
            ) == null) {
                Array.append(updatedLastMintTime, [(caller, currentTime)])
            } else {
                updatedLastMintTime
            };
            
            // Create transaction record
            let transaction: Transaction = {
                id = updatedOrgData.nextTransactionId;
                transactionType = #Award;
                from = caller;
                to = to;
                amount = amount;
                timestamp = currentTime;
                reason = reason;
            };
            
            let finalOrgData = {
                admin = updatedOrgData.admin;
                trustedAwarders = updatedOrgData.trustedAwarders;
                userBalances = updatedOrgData.userBalances;
                dailyMinted = finalDailyMinted;
                lastMintTimestamp = finalLastMintTime;
                userDecayInfo = updatedOrgData.userDecayInfo;
                transactionHistory = Array.append(updatedOrgData.transactionHistory, [transaction]);
                nextTransactionId = updatedOrgData.nextTransactionId + 1;
                totalDecayedPoints = updatedOrgData.totalDecayedPoints;
                lastGlobalDecayProcess = updatedOrgData.lastGlobalDecayProcess;
            };
            
            updateOrgData(orgId, finalOrgData);
            Debug.print("Rep awarded: " # Nat.toText(amount) # " to " # Principal.toText(to));
            return "Success: " # Nat.toText(amount) # " reputation points awarded to " # Principal.toText(to) # "."
        };
    }
};
    
    // --- 2️⃣ revokeRep: Revoke reputation from a user in an organization (admin only) ---
public shared({caller}) func revokeRep(orgId: OrgID, from: Principal, amount: Nat, reason: ?Text) : async Text {
    if (amount == 0) {
        return "Error: Amount must be greater than 0";
    };

    switch (validateOrgExists(orgId)) {
        case null { return "Error: Organization does not exist" };
        case (?orgData) {
            // Only admin can revoke reputation
            if (not Principal.equal(caller, orgData.admin)) {
                return "Error: Only admin can revoke reputation";
            };

            let currentBalance = getOrgUserBalance(orgData, from);
            
            // Check if user has enough reputation to revoke
            if (currentBalance < amount) {
                return "Error: User does not have enough reputation points (has " # Nat.toText(currentBalance) # ", trying to revoke " # Nat.toText(amount) # ")";
            };
            
            // Only revoke if user has sufficient balance
            if (currentBalance == 0) {
                return "Error: User has no reputation points to revoke";
            };
            
            let newBalance = Nat.sub(currentBalance, amount);

            let updatedOrgData = updateOrgUserBalance(orgData, from, newBalance);
            
            // Create transaction record
            let transaction: Transaction = {
                id = updatedOrgData.nextTransactionId;
                transactionType = #Revoke;
                from = caller;
                to = from;
                amount = amount;
                timestamp = now();
                reason = reason;
            };
            
            let finalOrgData = {
                admin = updatedOrgData.admin;
                trustedAwarders = updatedOrgData.trustedAwarders;
                userBalances = updatedOrgData.userBalances;
                dailyMinted = updatedOrgData.dailyMinted;
                lastMintTimestamp = updatedOrgData.lastMintTimestamp;
                userDecayInfo = updatedOrgData.userDecayInfo;
                transactionHistory = Array.append(updatedOrgData.transactionHistory, [transaction]);
                nextTransactionId = updatedOrgData.nextTransactionId + 1;
                totalDecayedPoints = updatedOrgData.totalDecayedPoints;
                lastGlobalDecayProcess = updatedOrgData.lastGlobalDecayProcess;
            };
            
            updateOrgData(orgId, finalOrgData);
            Debug.print("Rep revoked: " # Nat.toText(amount) # " from " # Principal.toText(from));
            return "Success: " # Nat.toText(amount) # " reputation points revoked from " # Principal.toText(from) # "."
        };
    }
};


    // --- 3️⃣ addTrustedAwarder: Add a trusted awarder to an organization (admin only) ---
public shared({caller}) func addTrustedAwarder(orgId: OrgID, p: Principal, name: Text) : async Text {
    switch (validateOrgExists(orgId)) {
        case null { return "Error: Organization does not exist" };
        case (?orgData) {
            // Only admin can add trusted awarders
            if (not Principal.equal(caller, orgData.admin)) {
                return "Error: Only admin can add trusted awarders";
            };

            // Check if awarder already exists
            let awarderExists = Array.find<(Principal, Text)>(orgData.trustedAwarders, func (a: (Principal, Text)) : Bool {
                Principal.equal(a.0, p)
            });

            switch (awarderExists) {
                case (?_) { return "Error: Awarder already exists for this organization" };
                case null {
                    let newAwarder: (Principal, Text) = (p, name);
                    
                    let updatedOrgData = {
                        admin = orgData.admin;
                        trustedAwarders = Array.append(orgData.trustedAwarders, [newAwarder]);
                        userBalances = orgData.userBalances;
                        dailyMinted = orgData.dailyMinted;
                        lastMintTimestamp = orgData.lastMintTimestamp;
                        userDecayInfo = orgData.userDecayInfo;
                        transactionHistory = orgData.transactionHistory;
                        nextTransactionId = orgData.nextTransactionId;
                        totalDecayedPoints = orgData.totalDecayedPoints;
                        lastGlobalDecayProcess = orgData.lastGlobalDecayProcess;
                    };
                    
                    updateOrgData(orgId, updatedOrgData);
                    Debug.print("Trusted awarder added: " # Principal.toText(p) # " with name: " # name # " to org: " # orgId);
                    return "Success: Awarder added to organization " # orgId;
                };
            };
        };
    };
};

    // --- 4️⃣ removeTrustedAwarder: Remove a trusted awarder from an organization (admin only) ---
public shared({caller}) func removeTrustedAwarder(orgId: OrgID, p: Principal) : async Text {
    switch (validateOrgExists(orgId)) {
        case null { return "Error: Organization does not exist" };
        case (?orgData) {
            // Only admin can remove trusted awarders
            if (not Principal.equal(caller, orgData.admin)) {
                return "Error: Only admin can remove trusted awarders";
            };

            // Find and remove the awarder
            let filteredAwarders = Array.filter<(Principal, Text)>(orgData.trustedAwarders, func (a: (Principal, Text)) : Bool {
                not Principal.equal(a.0, p)
            });

            // Check if awarder was actually removed
            if (Array.size(filteredAwarders) == Array.size(orgData.trustedAwarders)) {
                return "Error: Awarder not found in this organization";
            };
            
            let updatedOrgData = {
                admin = orgData.admin;
                trustedAwarders = filteredAwarders;
                userBalances = orgData.userBalances;
                dailyMinted = orgData.dailyMinted;
                lastMintTimestamp = orgData.lastMintTimestamp;
                userDecayInfo = orgData.userDecayInfo;
                transactionHistory = orgData.transactionHistory;
                nextTransactionId = orgData.nextTransactionId;
                totalDecayedPoints = orgData.totalDecayedPoints;
                lastGlobalDecayProcess = orgData.lastGlobalDecayProcess;
            };
            
            updateOrgData(orgId, updatedOrgData);
            Debug.print("Trusted awarder removed: " # Principal.toText(p) # " from org: " # orgId);
            return "Success: Awarder removed from organization " # orgId;
        };
    };
};

    // --- 5️⃣ getBalance: Query user's reputation balance in an organization (with decay applied) ---
    public query func getBalance(orgId: OrgID, p: Principal) : async ?Nat {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) {
                let currentBalance = getOrgUserBalance(orgData, p);
                ?currentBalance
            };
        };
    };

    // basically to get already registered awarders for an organization
    public query func getTrustedAwarders(orgId: OrgID) : async ?[Awarder] {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) {
                let awarders = Array.map<(Principal, Text), Awarder>(
                    orgData.trustedAwarders,
                    func((p: Principal, name: Text)) : Awarder {
                        { id = p; name = name }
                    }
                );
                ?awarders
            };
        };
    };












// MARKKK
    // --- 6️⃣ getTransactionHistory: Get all transactions for an organization ---
    public query func getTransactionHistory(orgId: OrgID) : async ?[Transaction] {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) { 
                ?orgData.transactionHistory 
            };
        };
    };

    // --- 7️⃣ getTransactionsByUser: Get transactions for a specific user in an organization ---
    public query func getTransactionsByUser(orgId: OrgID, user: Principal) : async ?[Transaction] {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) {
                let userTransactions = Array.filter<Transaction>(orgData.transactionHistory, func(tx: Transaction) : Bool {
                    Principal.equal(tx.from, user) or Principal.equal(tx.to, user)
                });
                ?userTransactions
            };
        };
    };

    // --- 8️⃣ getTransactionById: Get a specific transaction by ID in an organization ---
    public query func getTransactionById(orgId: OrgID, id: Nat) : async ?Transaction {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) {
                Array.find<Transaction>(orgData.transactionHistory, func(tx: Transaction) : Bool {
                    tx.id == id
                })
            };
        };
    };

    // --- 9️⃣ getTransactionCount: Get total number of transactions for an organization ---
    public query func getTransactionCount(orgId: OrgID) : async ?Nat {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) { 
                ?orgData.transactionHistory.size()
            };
        };
    };

    // --- GLOBAL TRANSACTION FUNCTIONS (for decay system compatibility) ---

    // Get all transactions from all organizations (for decay system)
    public query func getAllTransactions() : async [Transaction] {
        var allTransactions : [Transaction] = [];
        
        for ((orgId, orgData) in Trie.iter(organizations)) {
            allTransactions := Array.append(allTransactions, orgData.transactionHistory);
        };
        
        // Sort by timestamp (newest first)
        Array.sort<Transaction>(allTransactions, func(a: Transaction, b: Transaction) : {#less; #equal; #greater} {
            if (a.timestamp > b.timestamp) { #less }
            else if (a.timestamp < b.timestamp) { #greater }
            else { #equal }
        })
    };

 

    // --- ORGANIZATION-SPECIFIC DECAY FUNCTIONS ---

    // Get decay statistics for a specific organization
    public query func getOrgDecayStatistics(orgId: OrgID) : async ?{
        totalDecayedPoints: Nat;
        lastGlobalDecayProcess: Nat;
        configEnabled: Bool;
        userCount: Nat;
        totalPoints: Nat;
    } {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) {
                let userCount = orgData.userBalances.size();
                var totalPoints = 0;
                
                for ((user, balance) in orgData.userBalances.vals()) {
                    totalPoints += balance;
                };
                
                ?{
                    totalDecayedPoints = orgData.totalDecayedPoints;
                    lastGlobalDecayProcess = orgData.lastGlobalDecayProcess;
                    configEnabled = decayConfig.enabled;
                    userCount = userCount;
                    totalPoints = totalPoints;
                }
            };
        };
    };

    // Get transaction history for a specific organization (including decay transactions)
    public query func getOrgTransactionHistory(orgId: OrgID) : async ?[Transaction] {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) { 
                // Sort by timestamp (newest first)
                let sorted = Array.sort<Transaction>(orgData.transactionHistory, func(a: Transaction, b: Transaction) : {#less; #equal; #greater} {
                    if (a.timestamp > b.timestamp) { #less }
                    else if (a.timestamp < b.timestamp) { #greater }
                    else { #equal }
                });
                ?sorted 
            };
        };
    };

    // Get user balances for a specific organization
    public query func getOrgUserBalances(orgId: OrgID) : async ?[(Principal, Nat)] {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) { ?orgData.userBalances };
        };
    };

    // Get decay analytics for a specific organization
    public query func getOrgDecayAnalytics(orgId: OrgID) : async ?{
        totalUsers: Nat;
        usersWithDecay: Nat;
        totalPointsDecayed: Nat;
        averageDecayPerUser: Nat;
        recentDecayTransactions: [Transaction];
    } {
        switch (validateOrgExists(orgId)) {
            case null { null };
            case (?orgData) {
                let totalUsers = orgData.userBalances.size();
                var usersWithDecay = 0;
                
                // Count users who have had decay applied
                for ((user, decayInfo) in orgData.userDecayInfo.vals()) {
                    if (decayInfo.totalDecayed > 0) {
                        usersWithDecay += 1;
                    };
                };
                
                let averageDecay = if (totalUsers > 0) {
                    orgData.totalDecayedPoints / totalUsers
                } else { 0 };
                
                // Get recent decay transactions (last 10)
                let decayTransactions = Array.filter<Transaction>(orgData.transactionHistory, func(tx: Transaction) : Bool {
                    switch (tx.transactionType) {
                        case (#Decay) { true };
                        case (_) { false };
                    }
                });
                
                let recentDecayTxs = if (decayTransactions.size() > 10) {
                    let sorted = Array.sort<Transaction>(decayTransactions, func(a: Transaction, b: Transaction) : {#less; #equal; #greater} {
                        if (a.timestamp > b.timestamp) { #less }
                        else if (a.timestamp < b.timestamp) { #greater }
                        else { #equal }
                    });
                    Array.subArray<Transaction>(sorted, 0, 10)
                } else { decayTransactions };
                
                ?{
                    totalUsers = totalUsers;
                    usersWithDecay = usersWithDecay;
                    totalPointsDecayed = orgData.totalDecayedPoints;
                    averageDecayPerUser = averageDecay;
                    recentDecayTransactions = recentDecayTxs;
                }
            };
        };
    };

    // --- DECAY SYSTEM PUBLIC FUNCTIONS ---

    // 🔟 Configure decay settings (Owner only)
    public shared({caller}) func configureDecay(
        decayRate: Nat, 
        decayInterval: Nat, 
        minThreshold: Nat, 
        gracePeriod: Nat, 
        enabled: Bool
    ) : async Text {
        if (not Principal.equal(caller, owner)) {
            return "Error: Only owner can configure decay settings.";
        };

        decayConfig := {
            decayRate = decayRate;
            decayInterval = decayInterval;
            minThreshold = minThreshold;
            gracePeriod = gracePeriod;
            enabled = enabled;
        };

        // Restart the decay timer with new configuration
        ignore restartDecayTimer();

        Debug.print("Decay configuration updated");
        return "Success: Decay configuration updated.";
    };

    // 1️⃣1️⃣ Get current decay configuration
    public query func getDecayConfig() : async DecayConfig {
        decayConfig
    };

    // 1️⃣2️⃣ Get raw balance (before decay calculation)
    public query func getRawBalance(p: Principal) : async Nat {
        let pKey = { key = p; hash = Principal.hash(p) };
        switch (Trie.get<Principal, Nat>(_balances, pKey, Principal.equal)) {
            case (?b) b;
            case null 0;
        }
    };

    // 1️⃣3️⃣ Preview decay amount for a user
    public query func previewDecayAmount(p: Principal) : async Nat {
        let pKey = { key = p; hash = Principal.hash(p) };
        let currentBalance = switch (Trie.get<Principal, Nat>(_balances, pKey, Principal.equal)) {
            case (?b) b;
            case null 0;
        };
        calculateDecayAmount(p, currentBalance)
    };

    // 1️⃣4️⃣ Get user decay information
    public query func getUserDecayInfo(p: Principal) : async ?UserDecayInfo {
        let pKey = { key = p; hash = Principal.hash(p) };
        Trie.get<Principal, UserDecayInfo>(userDecayInfo, pKey, Principal.equal)
    };

    // 1️⃣5️⃣ Apply decay to a specific user (Owner only)
    public shared({caller}) func applyDecayToSpecificUser(p: Principal) : async Text {
        if (not Principal.equal(caller, owner)) {
            return "Error: Only owner can manually apply decay.";
        };

        let decayAmount = applyDecayToUser(p);
        if (decayAmount == 0) {
            return "No decay applied - user not eligible for decay.";
        };

        return "Success: Applied " # Nat.toText(decayAmount) # " points decay to user.";
    };

    // --- MULTI-ORGANIZATION PUBLIC FUNCTIONS ---










   












    // --- MULTI-ORGANIZATION QUERY FUNCTIONS ---

    /// Get user balance in an organization
    public query func getOrgBalance(orgId: OrgID, user: Principal) : async ?Nat {
        switch (validateOrgExists(orgId)) {
            case (?orgData) { ?getOrgUserBalance(orgData, user) };
            case null { null };
        }
    };

    /// Check if user is a trusted awarder in an organization
    public query func isOrgTrustedAwarderQuery(orgId: OrgID, user: Principal) : async ?Bool {
        switch (validateOrgExists(orgId)) {
            case (?orgData) { ?isOrgTrustedAwarder(orgData, user) };
            case null { null };
        }
    };

    /// Get organization admin
    public query func getOrgAdmin(orgId: OrgID) : async ?Principal {
        switch (validateOrgExists(orgId)) {
            case (?orgData) { ?orgData.admin };
            case null { null };
        }
    };

    /// Get all trusted awarders for an organization
    public query func getOrgTrustedAwarders(orgId: OrgID) : async ?[Awarder] {
        switch (validateOrgExists(orgId)) {
            case (?orgData) {
                let awarders = Array.map<(Principal, Text), Awarder>(
                    orgData.trustedAwarders,
                    func((p, name)) = { id = p; name = name }
                );
                ?awarders
            };
            case null { null };
        }
    };

    /// Get organization transaction history
    public query func getOrgTransactions(orgId: OrgID) : async ?[Transaction] {
        switch (validateOrgExists(orgId)) {
            case (?orgData) { ?orgData.transactionHistory };
            case null { null };
        }
    };

    /// Get all organizations
    public query func getAllOrgs() : async [OrgID] {
        let orgIds = Buffer.Buffer<Text>(0);
        for ((orgId, _) in Trie.iter(organizations)) {
            orgIds.add(orgId);
        };
        Buffer.toArray(orgIds)
    };

    /// Get organization stats
    public query func getOrgStats(orgId: OrgID) : async ?OrgStats {
        switch (validateOrgExists(orgId)) {
            case (?orgData) {
                let totalPoints = Array.foldLeft<(Principal, Nat), Nat>(
                    orgData.userBalances,
                    0,
                    func(acc, (_, balance)) = acc + balance
                );
                
                ?{
                    admin = orgData.admin;
                    awarderCount = Array.size(orgData.trustedAwarders);
                    userCount = Array.size(orgData.userBalances);
                    totalPoints = totalPoints;
                    totalTransactions = Array.size(orgData.transactionHistory);
                }
            };
            case null { null };
        }
    };

    // 1️⃣6️⃣ Batch process decay for all users (Owner only)
    public shared({caller}) func processBatchDecay() : async Text {
        if (not Principal.equal(caller, owner)) {
            return "Error: Only owner can process batch decay.";
        };

        let balanceEntries = Iter.toArray(Trie.iter(_balances));
        var usersProcessed = 0;
        var totalDecayApplied = 0;

        for ((principal, balance) in balanceEntries.vals()) {
            if (balance > 0) {
                let decayAmount = applyDecayToUser(principal);
                if (decayAmount > 0) {
                    usersProcessed += 1;
                    totalDecayApplied += decayAmount;
                };
            };
        };

        lastGlobalDecayProcess := now();
        
        Debug.print("Batch decay processed: " # Nat.toText(usersProcessed) # " users, " # Nat.toText(totalDecayApplied) # " points decayed");
        return "Success: Processed " # Nat.toText(usersProcessed) # " users with total decay of " # Nat.toText(totalDecayApplied) # " points.";
    };

    // 1️⃣7️⃣ Get decay statistics - aggregated from all organizations
    public query func getDecayStatistics() : async {
        totalDecayedPoints: Nat;
        lastGlobalDecayProcess: Nat;
        configEnabled: Bool;
    } {
        var totalDecayed = 0;
        
        // Aggregate decay statistics from all organizations
        for ((orgId, orgData) in Trie.iter(organizations)) {
            totalDecayed += orgData.totalDecayedPoints;
        };
        
        {
            totalDecayedPoints = totalDecayed;
            lastGlobalDecayProcess = lastGlobalDecayProcess;
            configEnabled = decayConfig.enabled;
        }
    };

    // 1️⃣8️⃣ Get balance with decay details
    public query func getBalanceWithDetails(p: Principal) : async {
        rawBalance: Nat;
        currentBalance: Nat;
        pendingDecay: Nat;
        decayInfo: ?UserDecayInfo;
    } {
        let pKey = { key = p; hash = Principal.hash(p) };
        let rawBalance = switch (Trie.get<Principal, Nat>(_balances, pKey, Principal.equal)) {
            case (?b) b;
            case null 0;
        };
        
        let pendingDecay = calculateDecayAmount(p, rawBalance);
        let currentBalance = if (rawBalance >= pendingDecay) {
            Nat.sub(rawBalance, pendingDecay)
        } else {
            0
        };
        
        let decayInfo = Trie.get<Principal, UserDecayInfo>(userDecayInfo, pKey, Principal.equal);
        
        {
            rawBalance = rawBalance;
            currentBalance = currentBalance;
            pendingDecay = pendingDecay;
            decayInfo = decayInfo;
        }
    };

    // 1️⃣9️⃣ Manual decay trigger (for testing) - Owner only
    public shared({caller}) func triggerManualDecay() : async Text {
        if (not Principal.equal(caller, owner)) {
            return "Error: Only owner can trigger manual decay.";
        };
        
        await processAutomaticDecay();
        return "Success: Manual decay processing completed.";
    };

    // --- AUTO-INJECT ORGANIZATION FUNCTIONS ---
    // These functions automatically determine the caller's organization
    
    // Auto-inject awardRep - automatically uses caller's organization
    public shared({caller}) func autoAwardRep(to: Principal, amount: Nat, reason: ?Text) : async Text {
        switch (getUserOrganization(caller)) {
            case null { return "Error: Caller is not associated with any organization" };
            case (?orgId) { 
                Debug.print("Auto-injecting orgId: " # orgId # " for caller: " # Principal.toText(caller));
                await awardRep(orgId, to, amount, reason)
            };
        }
    };
    
    // Auto-inject revokeRep - automatically uses caller's organization  
    public shared({caller}) func autoRevokeRep(from: Principal, amount: Nat, reason: ?Text) : async Text {
        switch (getUserOrganization(caller)) {
            case null { return "Error: Caller is not associated with any organization" };
            case (?orgId) { 
                Debug.print("Auto-injecting orgId: " # orgId # " for caller: " # Principal.toText(caller));
                await revokeRep(orgId, from, amount, reason)
            };
        }
    };
    
    // Get caller's organization ID
    public shared({caller}) func getMyOrganization() : async ?Text {
        getUserOrganization(caller)
    };
    
    // Check if caller is admin of their organization
    public shared({caller}) func isMyOrgAdmin() : async Bool {
        switch (getUserOrganization(caller)) {
            case null { false };
            case (?orgId) {
                switch (validateOrgExists(orgId)) {
                    case null { false };
                    case (?orgData) { Principal.equal(orgData.admin, caller) };
                }
            };
        }
    };
    
    // Auto-inject functions for transaction queries
    
    // Get transactions for caller's organization
    public shared({caller}) func getMyOrgTransactions() : async ?[Transaction] {
        switch (getUserOrganization(caller)) {
            case null { null };
            case (?orgId) { await getTransactionHistory(orgId) };
        }
    };
    
    // Get caller's balance in their organization
    public shared({caller}) func getMyBalance() : async ?Nat {
        switch (getUserOrganization(caller)) {
            case null { null };
            case (?orgId) { await getBalance(orgId, caller) };
        }
    };
    
    // Get transactions by user in caller's organization
    public shared({caller}) func getMyTransactionsByUser(user: Principal) : async ?[Transaction] {
        switch (getUserOrganization(caller)) {
            case null { null };
            case (?orgId) { await getTransactionsByUser(orgId, user) };
        }
    };

};
