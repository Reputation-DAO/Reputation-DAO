import { idlFactory } from '../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';
import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { actorService } from '../../services/actorService';

// Routes where Plug should be completely blocked
const RESTRICTED_ROUTES = ['/', '/docs', '/blog', '/community'];

// Helper function to check if current route allows Plug
const isPlugAllowedOnCurrentRoute = (): boolean => {
  const currentPath = window.location.pathname;
  const isRestricted = RESTRICTED_ROUTES.includes(currentPath);
  if (isRestricted) {
    console.log(`🚫 Plug access blocked on route: ${currentPath}`);
  }
  return !isRestricted;
};

// Helper function to get the selected organization
const getSelectedOrgId = (): string => {
  const orgId = localStorage.getItem('selectedOrgId');
  if (!orgId) {
    throw new Error('No organization selected. Please select an organization first.');
  }
  return orgId;
};

// Canister ID for the reputation DAO
const CANISTER_ID = "owyeu-jiaaa-aaaam-qdvwq-cai";

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
const canisterId = 'owyeu-jiaaa-aaaam-qdvwq-cai';

export const getPlugActor = async () => {
  // Block Plug access on restricted routes
  if (!isPlugAllowedOnCurrentRoute()) {
    throw new Error('Plug access is not allowed on this route');
  }

  if (!window.ic?.plug) {
    throw new Error('Plug extension not found');
  }

  try {
    console.log('🔌 Checking Plug connection status...');
    console.log('🔧 Plug Actor - Canister ID:', canisterId);
    console.log('🔧 Plug Actor - Network: Playground');
    
    // 1. Check if already connected before requesting new connection
    const isConnected = await window.ic.plug.isConnected();
    console.log('🔍 Plug connected status:', isConnected);
    
    if (!isConnected) {
      console.log('🔌 Not connected, requesting new connection...');
      console.log('🔌 Whitelist canister ID:', canisterId);
      
      const connected = await window.ic.plug.requestConnect({
        whitelist: [canisterId],
        host: 'https://ic0.app' // Explicitly set the host for playground
      });

      if (!connected) {
        throw new Error('User rejected the Plug connection');
      }
      console.log('✅ New Plug connection established');
    } else {
      console.log('✅ Using existing Plug connection');
    }

    // 2. Create agent with IC host (playground canisters run on IC mainnet)
    const agent = window.ic.plug.agent;
    if (!agent) {
      console.log('🌐 Creating new agent...');
      console.log('🌐 Agent host: https://ic0.app');
      await window.ic.plug.createAgent({
        host: 'https://ic0.app', // IC mainnet host for playground canisters
      });
      console.log('🌐 Agent created with IC host');
    } else {
      console.log('🌐 Using existing agent');
    }

    // 3. Return the actor
    console.log('🎭 Creating actor with canister ID:', canisterId);
    const actor = (await window.ic.plug.createActor({
      canisterId,
      interfaceFactory: idlFactory,
    })) as _SERVICE;

    console.log('🎭 Actor created successfully');
    
    // Test the connection by calling a simple query
    try {
      // Try a simple canister call to test connectivity
      const orgId = localStorage.getItem('selectedOrgId') || 'default';
      console.log('🔍 Testing connection with orgId:', orgId);
      console.log('🔍 Testing connection to canister:', canisterId);
      const transactionCount = await actor.getTransactionCount(orgId);
      console.log('🔄 Connection test successful. Transaction count:', transactionCount);
    } catch (testError: any) {
      console.warn('⚠️ Connection test failed:', testError);
      console.warn('⚠️ Test error details:', {
        message: testError.message,
        name: testError.name,
        stack: testError.stack
      });
      // For playground network, connection test failures are often due to network latency
      // Don't throw here, let the caller handle it - the actor might still work
      if (testError.message?.includes('Reply not received')) {
        console.log('💡 This might be a network timeout issue, but the actor should still work');
      }
    }
    
    return actor;
  } catch (error: any) {
    console.error('❌ Error creating Plug actor:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      canisterId: canisterId
    });
    throw new Error(`Failed to connect to canister: ${error.message || 'Unknown error'}`);
  }
};

// Utility function to check if Plug is connected
export const isPlugConnected = async (): Promise<boolean> => {
  // Block Plug access on restricted routes
  if (!isPlugAllowedOnCurrentRoute()) {
    return false;
  }

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
    host: 'https://ic0.app' // IC mainnet host for playground canisters
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
  // Block Plug access on restricted routes
  if (!isPlugAllowedOnCurrentRoute()) {
    throw new Error('Plug access is not allowed on this route');
  }

  try {
    const isConnected = await isPlugConnected();
    if (!isConnected) {
      throw new Error('Plug wallet not connected');
    }
    
    if (!window.ic?.plug?.agent) {
      throw new Error('Plug agent not found');
    }
    
    // Type assertion for the agent's getPrincipal method
    const principal = await (window.ic.plug.agent as any).getPrincipal();
    console.log('✅ Got principal:', principal.toString());
    return principal;
  } catch (error) {
    console.error('❌ Error getting current principal:', error);
    throw error;
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
      decayInfo: details.decayInfo && details.decayInfo.length > 0 ? {
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
export const getTransactionsByUser = async (principal: Principal): Promise<Transaction[]> => {
  try {
    const actor = await getPlugActor();
    const orgId = getSelectedOrgId();
    const transactions = await actor.getTransactionsByUser(orgId, principal);
    
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
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
export const getBalance = async (principal: Principal): Promise<number> => {
  try {
    const actor = await getPlugActor();
    const orgId = getSelectedOrgId();
    const balance = await actor.getBalance(orgId, principal);
    return balance && balance.length > 0 ? Number(balance[0]) : 0;
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

// === DAO FUNCTIONALITY ===

// Award reputation points
// Award reputation points
export const awardRep = async (
  recipient: string,
  amount: number,
  reason?: string
): Promise<any> => {
  try {
    const actor = await getPlugActor();
    const orgId = getSelectedOrgId();
    const recipientPrincipal = Principal.fromText(recipient);
    
    return await actor.awardRep(
      orgId,
      recipientPrincipal,
      BigInt(amount),
      reason ? [reason] : []
    );
  } catch (error) {
    console.error('Error awarding reputation:', error);
    throw error;
  }
};

// Award reputation points with explicit orgId (for admin use)
export const awardRepWithOrgId = async (
  orgId: string,
  recipient: Principal,
  amount: number,
  reason?: string
): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.awardRep(
      orgId,
      recipient,
      BigInt(amount),
      reason ? [reason] : []
    );
  } catch (error) {
    console.error('Error awarding reputation:', error);
    throw error;
  }
};

// Revoke reputation points
export const revokeRep = async (
  orgId: string,
  user: Principal,
  amount: number,
  reason?: string
): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.revokeRep(
      orgId,
      user,
      BigInt(amount),
      reason ? [reason] : []
    );
  } catch (error) {
    console.error('Error revoking reputation:', error);
    throw error;
  }
};

// Add trusted awarder
export const addTrustedAwarder = async (
  orgId: string,
  awarder: Principal,
  name: string
): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.addTrustedAwarder(orgId, awarder, name);
  } catch (error) {
    console.error('Error adding trusted awarder:', error);
    throw error;
  }
};

// Remove trusted awarder
export const removeTrustedAwarder = async (
  orgId: string,
  awarder: Principal
): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.removeTrustedAwarder(orgId, awarder);
  } catch (error) {
    console.error('Error removing trusted awarder:', error);
    throw error;
  }
};

// Get trusted awarders for an organization
export const getTrustedAwarders = async (orgId: string): Promise<Awarder[]> => {
  try {
    const actor = await getPlugActor();
    const awarders = await actor.getTrustedAwarders(orgId);
    return awarders[0] || [];
  } catch (error) {
    console.error('Error fetching trusted awarders:', error);
    return [];
  }
};

// Create/Register a new organization
export const createOrganization = async (
  orgId: string,
  orgName: string,
  description: string
): Promise<string> => {
  try {
    const actor = await getPlugActor();
    return await actor.registerOrg(orgId);
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

// Get organizations for a user (using available canister methods)
export const getUserOrganizations = async (user: Principal): Promise<string[]> => {
  try {
    const actor = await getPlugActor();
    // Use getAllOrgs and filter based on user permissions
    const orgs = await actor.getAllOrgs();
    return orgs || [];
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
};

// Get all organizations
export const getAllOrganizations = async (): Promise<Array<{id: string; name: string; description: string}>> => {
  try {
    const actor = await getPlugActor();
    const orgs = await actor.getAllOrgs();
    
    // Convert org names to full objects with basic info
    const orgDetails = await Promise.all(
      orgs.map(async (orgId: string) => {
        try {
          const stats = await actor.getOrgStats(orgId);
          return {
            id: orgId,
            name: orgId,
            description: stats && stats.length > 0 ? `Admin: ${stats[0].admin.toString().slice(0, 8)}...` : 'No description'
          };
        } catch (error) {
          return {
            id: orgId,
            name: orgId,
            description: 'Organization details unavailable'
          };
        }
      })
    );
    
    return orgDetails;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return [];
  }
};

// Get organization statistics including total points distributed
export const getOrgStats = async (orgId: string): Promise<{
  admin: Principal;
  totalPoints: number;
  awarderCount: number;
  userCount: number;
  totalTransactions: number;
} | null> => {
  try {
    console.log('🔍 getOrgStats: Calling actor.getOrgStats for orgId:', orgId);
    const actor = await getPlugActor();
    const stats = await actor.getOrgStats(orgId);
    
    console.log('🔍 getOrgStats: Raw stats response:', stats);
    
    if (!stats || stats.length === 0) {
      console.log('❌ getOrgStats: No stats returned or empty array');
      return null;
    }
    
    const orgStats = stats[0];
    console.log('🔍 getOrgStats: First stats object:', orgStats);
    
    const result = {
      admin: orgStats.admin,
      totalPoints: Number(orgStats.totalPoints),
      awarderCount: Number(orgStats.awarderCount),
      userCount: Number(orgStats.userCount),
      totalTransactions: Number(orgStats.totalTransactions)
    };
    
    console.log('✅ getOrgStats: Processed result:', result);
    return result;
  } catch (error) {
    console.error('❌ getOrgStats: Error fetching org stats:', error);
    return null;
  }
};

/**
 * Get unified actor that works with both Plug and Internet Identity
 * This function automatically uses the correct authentication method
 */
export const getUnifiedActor = async (): Promise<_SERVICE> => {
  return await actorService.getActor();
};
