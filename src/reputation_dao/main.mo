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

// Main Reputation DAO actor
actor ReputationDAO {

    // Transaction log entry type
    public type TransactionType = {
        #Award;
        #Revoke;
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

    // --- Stable State ---

    // Reputation balances: Principal -> Nat
    stable var balances : Trie.Trie<Principal, Nat> = Trie.empty();

    // Trusted awarders: Principal -> () (acts as a set)
    stable var trustedAwarders : Trie.Trie<Principal, ()> = Trie.empty();

    // Daily minted amount per awarder: Principal -> Nat
    stable var dailyMinted : Trie.Trie<Principal, Nat> = Trie.empty();

    // Last mint timestamp per awarder: Principal -> Nat (epoch seconds)
    stable var lastMintTimestamp : Trie.Trie<Principal, Nat> = Trie.empty();

    // Transaction log storage
    stable var transactionHistory : [Transaction] = [];
    stable var nextTransactionId : Nat = 1;

    // Owner/admin principal (replace with your actual principal before deploy)


    // TODO: Set your admin principal aka your plug id here 
    stable var owner : Principal = Principal.fromText("ofkbl-m6bgx-xlgm3-ko4y6-mh7i4-kp6b4-sojbh-wyy2r-aznnp-gmqtb-xqe"); 

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

    // --- 1️⃣ awardRep: Trusted awarder mints rep to another user ---
public shared({caller}) func awardRep(to: Principal, amount: Nat, reason: ?Text) : async Text {
    Debug.print("awardRep called by " # Principal.toText(caller));

    let callerKey = { key = caller; hash = Principal.hash(caller) };
    let toKey = { key = to; hash = Principal.hash(to) };

    // Check: caller is trusted awarder
    switch (Trie.get<Principal, ()>(trustedAwarders, callerKey, Principal.equal)) {
        case null { return "Error: Not a trusted awarder. Caller: " # Principal.toText(caller); };
        case _ {};
    };

    // Check: cannot mint to self
    if (Principal.equal(caller, to)) {
        return "Error: Cannot award rep to yourself.";
    };

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
public shared({caller}) func addTrustedAwarder(p: Principal) : async Text {
    if (not Principal.equal(caller, owner)) {
        return "Error: Only owner can add awarders.";
    };
    let pKey = { key = p; hash = Principal.hash(p) };
    trustedAwarders := Trie.put<Principal, ()>(trustedAwarders, pKey, Principal.equal, ()).0;
    Debug.print("Trusted awarder added: " # Principal.toText(p));
    return "Success: Awarder added.";
};

    // --- 4️⃣ removeTrustedAwarder: Owner can remove a trusted awarder ---
public shared({caller}) func removeTrustedAwarder(p: Principal) : async Text {
    if (not Principal.equal(caller, owner)) {
        return "Error: Only owner can remove awarders.";
    };
    let pKey = { key = p; hash = Principal.hash(p) };
    trustedAwarders := Trie.remove<Principal, ()>(trustedAwarders, pKey, Principal.equal).0;
    Debug.print("Trusted awarder removed: " # Principal.toText(p));
    return "Success: Awarder removed.";
};

    // --- 5️⃣ getBalance: Query any user's rep ---
    public query func getBalance(p: Principal) : async Nat {
        let pKey = { key = p; hash = Principal.hash(p) };
        switch (Trie.get<Principal, Nat>(balances, pKey, Principal.equal)) {
            case (?b) b;
            case null 0;
        }
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

   

};
