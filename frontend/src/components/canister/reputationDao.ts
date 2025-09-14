
import { idlFactory } from '../../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';
import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';

// === DECAY SYSTEM TYPES ===
export type TransactionType = 'Award' | 'Revoke' | 'Decay';

export interface DecayConfig {
  decayRate: number;        // Decay rate in basis points (100 = 1%)
  decayInterval: number;    // Decay interval in seconds
  minThreshold: number;     // Minimum points below which no decay applies
  gracePeriod: number;      // Grace period for new users in seconds
  enabled: boolean;         // Whether decay is enabled
}

export interface UserDecayInfo {
  lastDecayTime: number;      // Last time decay was applied
  registrationTime: number;   // When user first received points
  lastActivityTime: number;   // Last time user had any transaction
  totalDecayed: number;       // Total amount decayed over time
}

export interface BalanceWithDetails {
  rawBalance: number;
  currentBalance: number;
  pendingDecay: number;
  decayInfo?: UserDecayInfo;
}

export interface DecayStatistics {
  totalDecayedPoints: number;
  lastGlobalDecayProcess: number;
  configEnabled: boolean;
}

export interface Transaction {
  id: number;
  transactionType: TransactionType;
  from: Principal;
  to: Principal;
  amount: number;
  timestamp: number;
  reason?: string;
}

export interface Awarder {
  id: Principal;
  name: string;
}

//modify this canisterID based on where the dfx playground hosts your backend
const canisterId = '4k2wq-cqaaa-aaaab-qac7q-cai'; // From dfx.json

export const getPlugActor = async () => {
  if (!window.ic?.plug) {
    throw new Error('Plug extension not found');
  }

  try {
    console.log('🔌 Checking Plug connection status...');
    
    // 1. Check if already connected before requesting new connection
    const isConnected = await window.ic.plug.isConnected();
    console.log('🔍 Plug connected status:', isConnected);
    
    if (!isConnected) {
      console.log('🔌 Not connected, requesting new connection...');
      const connected = await window.ic.plug.requestConnect({
        whitelist: [canisterId],
      });

      if (!connected) {
        throw new Error('User rejected the Plug connection');
      }
      console.log('✅ New Plug connection established');
    } else {
      console.log('✅ Using existing Plug connection');
    }

    // 2. Create agent with playground network host (only if needed)
    const agent = window.ic.plug.agent;
    if (!agent) {
      console.log('🌐 Creating new agent...');
      await window.ic.plug.createAgent({
        host: 'https://ic0.app', // Playground network uses IC mainnet infrastructure
      });
      console.log('🌐 Agent created with playground host');
    } else {
      console.log('🌐 Using existing agent');
    }

    // 3. Return the actor
    const actor = (await window.ic.plug.createActor({
      canisterId,
      interfaceFactory: idlFactory,
    })) as _SERVICE;

    console.log('🎭 Actor created successfully');
    
    // Test the connection by calling a simple query
    try {
      const allOrgs = await actor.getAllOrgs();
      console.log('🔄 Connection test successful. Available orgs:', allOrgs.length);
    } catch (testError) {
      console.warn('⚠️ Connection test failed:', testError);
      // Don't throw here, let the caller handle it
    }
    
    return actor;
  } catch (error: any) {
    console.error('❌ Error creating Plug actor:', error);
    throw new Error(`Failed to connect to canister: ${error.message || 'Unknown error'}`);
  }
};

// Utility function to check if Plug is connected
export const isPlugConnected = async (): Promise<boolean> => {
  if (!window.ic?.plug) {
    return false;
  }
  
  try {
    return await window.ic.plug.isConnected();
  } catch (error) {
    console.error('Error checking Plug connection:', error);
    return false;
  }
};

// ===== INTERNET IDENTITY FUNCTIONS =====
export const getInternetIdentityActor = async (): Promise<_SERVICE> => {
  const authClient = await AuthClient.create();
  
  if (!(await authClient.isAuthenticated())) {
    throw new Error('User not authenticated with Internet Identity');
  }

  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ 
    identity,
    host: 'https://ic0.app'
  });

  // Only fetch root key in development
  if (process.env.NODE_ENV !== 'production') {
    try {
      await agent.fetchRootKey();
    } catch (error) {
      console.warn('Failed to fetch root key:', error);
    }
  }

  const actor = Actor.createActor<_SERVICE>(idlFactory, {
    agent,
    canisterId,
  });

  console.log('🆔 Internet Identity actor created successfully');
  return actor;
};

export const getInternetIdentityPrincipal = async (): Promise<Principal> => {
  const authClient = await AuthClient.create();
  
  if (!(await authClient.isAuthenticated())) {
    throw new Error('User not authenticated with Internet Identity');
  }

  const identity = authClient.getIdentity();
  return identity.getPrincipal();
};

export const isInternetIdentityConnected = async (): Promise<boolean> => {
  try {
    const authClient = await AuthClient.create();
    return await authClient.isAuthenticated();
  } catch (error) {
    console.error('Error checking Internet Identity connection:', error);
    return false;
  }
};

// Utility function to get current principal
export const getCurrentPrincipal = async () => {
  try {
    if (!window.ic?.plug) {
      console.log('❌ Plug extension not found');
      return null;
    }
    
    const isConnected = await isPlugConnected();
    if (!isConnected) {
      console.log('❌ Plug is not connected');
      return null;
    }
    
    const principal = await window.ic.plug.agent.getPrincipal();
    console.log('✅ Got principal:', principal.toString());
    return principal;
  } catch (error) {
    console.error('❌ Error getting current principal:', error);
    return null;
  }
};

// === DECAY SYSTEM FUNCTIONS ===

// Get current decay configuration
export const getDecayConfig = async (): Promise<DecayConfig | null> => {
  try {
    const actor = await getPlugActor();
    const config = await actor.getDecayConfig();
    return {
      decayRate: Number(config.decayRate),
      decayInterval: Number(config.decayInterval),
      minThreshold: Number(config.minThreshold),
      gracePeriod: Number(config.gracePeriod),
      enabled: config.enabled,
    };
  } catch (error) {
    console.error('Error fetching decay config:', error);
    return null;
  }
};

// Configure decay settings (Admin only)
export const configureDecay = async (
  decayRate: number,
  decayInterval: number,
  minThreshold: number,
  gracePeriod: number,
  enabled: boolean
): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.configureDecay(
      BigInt(decayRate),
      BigInt(decayInterval),
      BigInt(minThreshold),
      BigInt(gracePeriod),
      enabled
    );
  } catch (error) {
    console.error('Error configuring decay:', error);
    throw error;
  }
};

// Configure organization-specific decay settings (Organization Admin only)
export const configureOrgDecay = async (
  orgId: string,
  decayRate: number,
  decayInterval: number,
  minThreshold: number,
  gracePeriod: number,
  enabled: boolean
): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.configureOrgDecay(
      orgId,
      BigInt(decayRate),
      BigInt(decayInterval),
      BigInt(minThreshold),
      BigInt(gracePeriod),
      enabled
    );
  } catch (error) {
    console.error('Error configuring organization decay:', error);
    throw error;
  }
};

// Get user's balance with decay details
export const getBalanceWithDetails = async (principal: Principal): Promise<BalanceWithDetails | null> => {
  try {
    const actor = await getPlugActor();
    const details = await actor.getBalanceWithDetails(principal);
    
    return {
      rawBalance: Number(details.rawBalance),
      currentBalance: Number(details.currentBalance),
      pendingDecay: Number(details.pendingDecay),
      decayInfo: details.decayInfo.length > 0 && details.decayInfo[0] ? {
        lastDecayTime: Number(details.decayInfo[0].lastDecayTime),
        registrationTime: Number(details.decayInfo[0].registrationTime),
        lastActivityTime: Number(details.decayInfo[0].lastActivityTime),
        totalDecayed: Number(details.decayInfo[0].totalDecayed),
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching balance with details:', error);
    return null;
  }
};

// Get user's raw balance (before decay)
export const getRawBalance = async (principal: Principal): Promise<number> => {
  try {
    const actor = await getPlugActor();
    // @ts-ignore - Type will be available after interface regeneration
    const balance = await actor.getRawBalance(principal);
    return Number(balance);
  } catch (error) {
    console.error('Error fetching raw balance:', error);
    return 0;
  }
};

// Preview decay amount for a user
export const previewDecayAmount = async (principal: Principal): Promise<number> => {
  try {
    const actor = await getPlugActor();
    // @ts-ignore - Type will be available after interface regeneration
    const decay = await actor.previewDecayAmount(principal);
    return Number(decay);
  } catch (error) {
    console.error('Error previewing decay amount:', error);
    return 0;
  }
};

// Get user decay information
export const getUserDecayInfo = async (principal: Principal): Promise<UserDecayInfo | null> => {
  try {
    const actor = await getPlugActor();
    // @ts-ignore - Type will be available after interface regeneration
    const info = await actor.getUserDecayInfo(principal);
    
    if (!info || info.length === 0) return null;
    
    const decayInfo = info[0];
    return {
      lastDecayTime: Number(decayInfo.lastDecayTime),
      registrationTime: Number(decayInfo.registrationTime),
      lastActivityTime: Number(decayInfo.lastActivityTime),
      totalDecayed: Number(decayInfo.totalDecayed),
    };
  } catch (error) {
    console.error('Error fetching user decay info:', error);
    return null;
  }
};

// Apply decay to specific user (Admin only)
export const applyDecayToSpecificUser = async (principal: Principal): Promise<string> => {
  try {
    const actor = await getPlugActor();
    // @ts-ignore - Type will be available after interface regeneration
    return await actor.applyDecayToSpecificUser(principal);
  } catch (error) {
    console.error('Error applying decay to user:', error);
    throw error;
  }
};

// Process batch decay for all users (Admin only)
export const processBatchDecay = async (): Promise<string> => {
  try {
    const actor = await getPlugActor();
    // @ts-ignore - Type will be available after interface regeneration
    return await actor.processBatchDecay();
  } catch (error) {
    console.error('Error processing batch decay:', error);
    throw error;
  }
};

// Get decay statistics
export const getDecayStatistics = async (): Promise<DecayStatistics | null> => {
  try {
    const actor = await getPlugActor();
    const stats = await actor.getDecayStatistics();
    
    return {
      totalDecayedPoints: Number(stats.totalDecayedPoints),
      lastGlobalDecayProcess: Number(stats.lastGlobalDecayProcess),
      configEnabled: stats.configEnabled,
    };
  } catch (error) {
    console.error('Error fetching decay statistics:', error);
    return null;
  }
};

// Enhanced transaction fetching with proper type handling - now gets all transactions from all orgs
export const getTransactionHistory = async (): Promise<Transaction[]> => {
  try {
    const actor = await getPlugActor();
    const transactions = await actor.getAllTransactions();
    
    return transactions.map((tx: any) => ({
      id: Number(tx.id),
      transactionType: Object.keys(tx.transactionType)[0] as TransactionType,
      from: tx.from,
      to: tx.to,
      amount: Number(tx.amount),
      timestamp: Number(tx.timestamp),
      reason: tx.reason && tx.reason.length > 0 ? tx.reason[0] : undefined,
    }));
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

// Get transactions by user with proper type handling
export const getTransactionsByUser = async (orgId: string, principal: Principal): Promise<Transaction[]> => {
  try {
    const actor = await getPlugActor();
    const transactionsResult = await actor.getTransactionsByUser(orgId, principal);
    
    // Handle optional array result
    if (!transactionsResult || transactionsResult.length === 0) {
      return [];
    }
    
    const transactions = transactionsResult[0];
    return transactions.map((tx: any) => ({
      id: Number(tx.id),
      transactionType: Object.keys(tx.transactionType)[0] as TransactionType,
      from: tx.from,
      to: tx.to,
      amount: Number(tx.amount),
      timestamp: Number(tx.timestamp),
      reason: tx.reason && tx.reason.length > 0 ? tx.reason[0] : undefined,
    }));
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
};

// Helper function to calculate days until next decay
export const calculateDaysUntilDecay = (decayInfo: UserDecayInfo, config: DecayConfig): number => {
  const now = Math.floor(Date.now() / 1000);
  const nextDecayTime = decayInfo.lastDecayTime + config.decayInterval;
  const secondsUntilDecay = Math.max(0, nextDecayTime - now);
  return Math.floor(secondsUntilDecay / 86400); // Convert to days
};

// Helper function to check if user is in grace period
export const isInGracePeriod = (decayInfo: UserDecayInfo, config: DecayConfig): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return now < (decayInfo.registrationTime + config.gracePeriod);
};

// Helper function to get decay status
export const getDecayStatus = (
  balance: number,
  decayInfo: UserDecayInfo | null,
  config: DecayConfig | null
): 'safe' | 'grace' | 'at-risk' | 'decaying' => {
  if (!decayInfo || !config || !config.enabled) return 'safe';
  if (balance < config.minThreshold) return 'safe';
  if (isInGracePeriod(decayInfo, config)) return 'grace';
  
  const daysUntilDecay = calculateDaysUntilDecay(decayInfo, config);
  if (daysUntilDecay <= 0) return 'decaying';
  if (daysUntilDecay <= 7) return 'at-risk';
  
  return 'safe';
};

// Additional functions needed by decay components

// Get all user balances (Admin only)
export const getAllUserBalances = async (): Promise<{ userId: Principal; balance: number }[]> => {
  try {
    const actor = await getPlugActor();
    // @ts-ignore - Type will be available after interface regeneration
    const balances = await actor.getAllUserBalances();
    return balances.map((balance: any) => ({
      userId: balance.userId,
      balance: Number(balance.balance),
    }));
  } catch (error) {
    console.error('Error fetching all user balances:', error);
    return [];
  }
};

// Get decay analytics data (Admin only)
export const getDecayAnalytics = async (): Promise<any> => {
  try {
    const actor = await getPlugActor();
    // @ts-ignore - Type will be available after interface regeneration
    return await actor.getDecayAnalytics();
  } catch (error) {
    console.error('Error fetching decay analytics:', error);
    return null;
  }
};

// Get user's current balance (updated to use current balance with decay applied)
export const getBalance = async (orgId: string, principal: Principal): Promise<number> => {
  try {
    const actor = await getPlugActor();
    const balanceResult = await actor.getBalance(orgId, principal);
    
    // Handle optional return type [] | [bigint]
    if (!balanceResult || balanceResult.length === 0) {
      return 0;
    }
    
    return Number(balanceResult[0]);
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};

// Trigger manual decay for testing (Owner only)
export const triggerManualDecay = async (): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.triggerManualDecay();
  } catch (error) {
    console.error('Error triggering manual decay:', error);
    throw error;
  }
};

// === ORGANIZATION-SPECIFIC DECAY FUNCTIONS ===

// Get decay statistics for a specific organization
export const getOrgDecayStatistics = async (orgId: string): Promise<DecayStatistics & {userCount: number; totalPoints: number} | null> => {
  try {
    const actor = await getPlugActor();
    const stats = await actor.getOrgDecayStatistics(orgId);
    
    if (!stats || stats.length === 0) return null;
    
    const orgStats = stats[0];
    return {
      totalDecayedPoints: Number(orgStats.totalDecayedPoints),
      lastGlobalDecayProcess: Number(orgStats.lastGlobalDecayProcess),
      configEnabled: orgStats.configEnabled,
      userCount: Number(orgStats.userCount),
      totalPoints: Number(orgStats.totalPoints),
    };
  } catch (error) {
    console.error('Error fetching org decay statistics:', error);
    return null;
  }
};

// Get transaction history for a specific organization
export const getOrgTransactionHistory = async (orgId: string): Promise<Transaction[]> => {
  try {
    const actor = await getPlugActor();
    const transactions = await actor.getOrgTransactionHistory(orgId);
    
    if (!transactions || transactions.length === 0) return [];
    
    return transactions[0].map((tx: any) => ({
      id: Number(tx.id),
      transactionType: Object.keys(tx.transactionType)[0] as TransactionType,
      from: tx.from,
      to: tx.to,
      amount: Number(tx.amount),
      timestamp: Number(tx.timestamp),
      reason: tx.reason && tx.reason.length > 0 ? tx.reason[0] : undefined,
    }));
  } catch (error) {
    console.error('Error fetching org transaction history:', error);
    return [];
  }
};

// Get user balances for a specific organization
export const getOrgUserBalances = async (orgId: string): Promise<{ userId: Principal; balance: number }[]> => {
  try {
    const actor = await getPlugActor();
    const balances = await actor.getOrgUserBalances(orgId);
    
    if (!balances || balances.length === 0) return [];
    
    return balances[0].map(([userId, balance]: [Principal, any]) => ({
      userId,
      balance: Number(balance),
    }));
  } catch (error) {
    console.error('Error fetching org user balances:', error);
    return [];
  }
};

// Get decay analytics for a specific organization
export const getOrgDecayAnalytics = async (orgId: string): Promise<any> => {
  try {
    const actor = await getPlugActor();
    const analytics = await actor.getOrgDecayAnalytics(orgId);
    
    if (!analytics || analytics.length === 0) return null;
    
    const orgAnalytics = analytics[0];
    return {
      totalUsers: Number(orgAnalytics.totalUsers),
      usersWithDecay: Number(orgAnalytics.usersWithDecay),
      totalPointsDecayed: Number(orgAnalytics.totalPointsDecayed),
      averageDecayPerUser: Number(orgAnalytics.averageDecayPerUser),
      recentDecayTransactions: orgAnalytics.recentDecayTransactions.map((tx: any) => ({
        id: Number(tx.id),
        transactionType: Object.keys(tx.transactionType)[0] as TransactionType,
        from: tx.from,
        to: tx.to,
        amount: Number(tx.amount),
        timestamp: Number(tx.timestamp),
        reason: tx.reason && tx.reason.length > 0 ? tx.reason[0] : undefined,
      })),
    };
  } catch (error) {
    console.error('Error fetching org decay analytics:', error);
    return null;
  }
};

// === TEST CONNECTION UTILITY ===

// Test canister connectivity for debugging
export const testCanisterConnection = async (): Promise<void> => {
  console.log('🧪 Testing canister connection...');
  console.log('📍 Canister ID:', canisterId);
  console.log('🌐 IC Host: https://ic0.app');
  
  try {
    // Test 1: Check if Plug is available
    if (!window.ic?.plug) {
      console.error('❌ Plug extension not found');
      return;
    }
    console.log('✅ Plug extension detected');
    
    // Test 2: Check connection status
    const isConnected = await window.ic.plug.isConnected();
    console.log('🔌 Plug connected:', isConnected);
    
    // Test 3: Get actor and test simple query
    const actor = await getPlugActor();
    console.log('🎭 Actor created successfully');
    
    // Test 4: Try a simple query to verify canister is responding
    const allOrgs = await actor.getAllOrgs();
    console.log('✅ Connection test successful! Available orgs:', allOrgs.length, allOrgs);
    
    // Test 5: Get current principal if connected
    const principal = await getCurrentPrincipal();
    if (principal) {
      console.log('👤 Current principal:', principal.toString());
    }
    
  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    console.error('💡 Suggestions:');
    console.error('   - Check if Plug wallet is connected');
    console.error('   - Verify canister ID is correct');
    console.error('   - Try refreshing the page');
    console.error('   - Check network connectivity');
  }
};

// Attach to window for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testConnection = testCanisterConnection;
  console.log('🔧 Test function attached: window.testConnection()');
}