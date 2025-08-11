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


    // --- Stable State ---

    // Reputation balances: Principal -> Nat
    var balances : Trie.Trie<Principal, Nat> = Trie.empty();

    // Trusted awarders: Principal -> () (acts as a set)
    var trustedAwarders : Trie.Trie<Principal, Text> = Trie.empty();

    // Daily minted amount per awarder: Principal -> Nat
    var dailyMinted : Trie.Trie<Principal, Nat> = Trie.empty();

    // Last mint timestamp per awarder: Principal -> Nat (epoch seconds)
    var lastMintTimestamp : Trie.Trie<Principal, Nat> = Trie.empty();

    // Transaction log storage
    var transactionHistory : [Transaction] = [];
    var nextTransactionId : Nat = 1;

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

    var owner : Principal = Principal.fromText("ofkbl-m6bgx-xlgm3-ko4y6-mh7i4-kp6b4-sojbh-wyy2r-aznnp-gmqtb-xqe"); 

    // --- AUTOMATIC DECAY TIMER ---


    // Automatic decay processing function
    private func processAutomaticDecay() : async () {
        if (not decayConfig.enabled) return;

        Debug.print("Processing automatic decay...");

        var processedUsers = 0;
        var totalDecayed = 0;

        for ((user, _) in Trie.iter(balances)) {
            let decayAmount = applyDecayToUser(user);
            if (decayAmount > 0) {
                processedUsers += 1;
                totalDecayed += decayAmount;
            };
        };

        lastGlobalDecayProcess := now();
        Debug.print("Automatic decay processed " # debug_show(processedUsers) # " users, total decayed: " # debug_show(totalDecayed));
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

    // Helper: Add transaction to log
    private func addTransaction(txType: TransactionType, from: Principal, to: Principal, amount: Nat, reason: ?Text) {
        let transaction : Transaction = {
            id = nextTransactionId;
            transactionType = txType;
            from = from;
            to = to;
            amount = amount;
            timestamp = now();
            reason = reason;
        };
        
        let buffer = Buffer.fromArray<Transaction>(transactionHistory);
        buffer.add(transaction);
        transactionHistory := Buffer.toArray(buffer);
        nextTransactionId += 1;
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
        let currentBalance = switch (Trie.get<Principal, Nat>(balances, userKey, Principal.equal)) {
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
        balances := Trie.put<Principal, Nat>(balances, userKey, Principal.equal, newBalance).0;

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

    // --- 1️⃣ awardRep: Trusted awarder mints rep to another user ---
public shared({caller}) func awardRep(to: Principal, amount: Nat, reason: ?Text) : async Text {
    Debug.print("awardRep called by " # Principal.toText(caller));

    let callerKey = { key = caller; hash = Principal.hash(caller) };
    let toKey = { key = to; hash = Principal.hash(to) };

    // Check: caller is trusted awarder or owner
    let isOwner = Principal.equal(caller, owner);
    let isAwarder = switch (Trie.get<Principal, Text>(trustedAwarders, callerKey, Principal.equal)) { case null false; case _ true; };
    if (not isOwner and not isAwarder) {
        return "Error: Not a trusted awarder or owner. Caller: " # Principal.toText(caller);
    };

    // Check: cannot mint to self
    if (Principal.equal(caller, to)) {
        return "Error: Cannot award rep to yourself.";
    };

    // Apply decay to recipient before awarding (to ensure accurate balance)
    ignore applyDecayToUser(to);

    // Check: daily mint cap (assume 100 per day for demo)
    let cap = 100;
    let currentTime = now();
    let lastTime = switch (Trie.get<Principal, Nat>(lastMintTimestamp, callerKey, Principal.equal)) { case (?t) t; case null 0; };
    var mintedToday = switch (Trie.get<Principal, Nat>(dailyMinted, callerKey, Principal.equal)) { case (?amt) amt; case null 0; };

    // Reset daily mint if 24h passed
    if (Nat.sub(currentTime, lastTime) >= 86400) {
        dailyMinted := Trie.put<Principal, Nat>(dailyMinted, callerKey, Principal.equal, 0).0;
        mintedToday := 0;
    };

    if (mintedToday + amount > cap) {
        return "Error: Daily mint cap exceeded.";
    };

    // Update state
    dailyMinted := Trie.put<Principal, Nat>(dailyMinted, callerKey, Principal.equal, mintedToday + amount).0;
    lastMintTimestamp := Trie.put<Principal, Nat>(lastMintTimestamp, callerKey, Principal.equal, currentTime).0;
    let prev = switch (Trie.get<Principal, Nat>(balances, toKey, Principal.equal)) { case (?b) b; case null 0; };
    balances := Trie.put<Principal, Nat>(balances, toKey, Principal.equal, prev + amount).0;

    // Initialize or update user decay info
    ignore initializeUserDecayInfo(to);

    // Log the transaction
    addTransaction(#Award, caller, to, amount, reason);

    Debug.print("Rep awarded: " # Nat.toText(amount) # " to " # Principal.toText(to));
    return "Success: Rep awarded.";
};
    
    // --- 2️⃣ revokeRep: Admin can slash (burn) rep from any user ---
public shared({caller}) func revokeRep(from: Principal, amount: Nat, reason: ?Text) : async Text {
    if (not Principal.equal(caller, owner)) {
        return "Error: Only owner can revoke rep.";
    };
    let fromKey = { key = from; hash = Principal.hash(from) };
    let prev = switch (Trie.get<Principal, Nat>(balances, fromKey, Principal.equal)) { case (?b) b; case null 0; };
    if (prev < amount) {
        return "Error: Not enough rep to revoke.";
    };
    balances := Trie.put<Principal, Nat>(balances, fromKey, Principal.equal, prev - amount).0;
    
    // Log the transaction
    addTransaction(#Revoke, caller, from, amount, reason);
    
    Debug.print("Rep revoked: " # Nat.toText(amount) # " from " # Principal.toText(from));
    return "Success: Rep revoked.";
};

    // --- 3️⃣ addTrustedAwarder: Owner can add a trusted awarder ---
public shared({caller}) func addTrustedAwarder(p: Principal, name: Text) : async Text {
    if (not Principal.equal(caller, owner)) {
        return "Error: Only owner can add awarders.";
    };
    let pKey = { key = p; hash = Principal.hash(p) };
    trustedAwarders := Trie.put<Principal, Text>(trustedAwarders, pKey, Principal.equal, name).0;
    Debug.print("Trusted awarder added: " # Principal.toText(p) # " with name: " # name);
    return "Success: Awarder added.";
};

    // --- 4️⃣ removeTrustedAwarder: Owner can remove a trusted awarder ---
public shared({caller}) func removeTrustedAwarder(p: Principal) : async Text {
    if (not Principal.equal(caller, owner)) {
        return "Error: Only owner can remove awarders.";
    };
    let pKey = { key = p; hash = Principal.hash(p) };
    trustedAwarders := Trie.remove<Principal, Text>(trustedAwarders, pKey, Principal.equal).0;
    Debug.print("Trusted awarder removed: " # Principal.toText(p));
    return "Success: Awarder removed.";
};

    // --- 5️⃣ getBalance: Query any user's rep (with decay applied) ---
    public query func getBalance(p: Principal) : async Nat {
        let pKey = { key = p; hash = Principal.hash(p) };
        let rawBalance = switch (Trie.get<Principal, Nat>(balances, pKey, Principal.equal)) {
            case (?b) b;
            case null 0;
        };
        
        // For query functions, we can't modify state, so we calculate decay without applying it
        let decayAmount = calculateDecayAmount(p, rawBalance);
        let currentBalance = if (rawBalance >= decayAmount) {
            Nat.sub(rawBalance, decayAmount)
        } else {
            0
        };
        
        currentBalance
    };

    // --- 6️⃣ getTransactionHistory: Get all transactions ---
    public query func getTransactionHistory() : async [Transaction] {
        transactionHistory
    };

    // --- 7️⃣ getTransactionsByUser: Get transactions for a specific user ---
    public query func getTransactionsByUser(user: Principal) : async [Transaction] {
        Array.filter<Transaction>(transactionHistory, func(tx: Transaction) : Bool {
            Principal.equal(tx.from, user) or Principal.equal(tx.to, user)
        })
    };

    // --- 8️⃣ getTransactionById: Get a specific transaction by ID ---
    public query func getTransactionById(id: Nat) : async ?Transaction {
        Array.find<Transaction>(transactionHistory, func(tx: Transaction) : Bool {
            tx.id == id
        })
    };

    // --- 9️⃣ getTransactionCount: Get total number of transactions ---
    public query func getTransactionCount() : async Nat {
        transactionHistory.size()
    };

    // basically to get already registered awarders
    public query func getTrustedAwarders() : async [Awarder] {
      let entries = Iter.toArray(Trie.iter(trustedAwarders));
      Array.map<(Principal, Text), Awarder>(
        entries,
        func((p: Principal, name: Text)) : Awarder {
          { id = p; name = name }
        }
      )
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
        switch (Trie.get<Principal, Nat>(balances, pKey, Principal.equal)) {
            case (?b) b;
            case null 0;
        }
    };

    // 1️⃣3️⃣ Preview decay amount for a user
    public query func previewDecayAmount(p: Principal) : async Nat {
        let pKey = { key = p; hash = Principal.hash(p) };
        let currentBalance = switch (Trie.get<Principal, Nat>(balances, pKey, Principal.equal)) {
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

    // 1️⃣6️⃣ Batch process decay for all users (Owner only)
    public shared({caller}) func processBatchDecay() : async Text {
        if (not Principal.equal(caller, owner)) {
            return "Error: Only owner can process batch decay.";
        };

        let balanceEntries = Iter.toArray(Trie.iter(balances));
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

    // 1️⃣7️⃣ Get decay statistics
    public query func getDecayStatistics() : async {
        totalDecayedPoints: Nat;
        lastGlobalDecayProcess: Nat;
        configEnabled: Bool;
    } {
        {
            totalDecayedPoints = totalDecayedPoints;
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
        let rawBalance = switch (Trie.get<Principal, Nat>(balances, pKey, Principal.equal)) {
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

};
