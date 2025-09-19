// Child Canister Service - Manages connections to individual reputation DAO child canisters
import { Principal } from '@dfinity/principal';
import { makeChildWithPlug } from '../components/canister/child';
import type { ChildActor } from '../components/canister/child';
import { makeFactoriaWithPlug } from '../components/canister/factoria';

// Get the currently selected organization's child canister ID
const getSelectedChildCanisterId = (): string | null => {
  return localStorage.getItem('selectedOrgId');
};

// Set the selected organization's child canister ID
export const setSelectedChildCanisterId = (canisterId: string): void => {
  localStorage.setItem('selectedOrgId', canisterId);
};

// Set the current user principal
export const setCurrentUserPrincipal = (principal: string): void => {
  localStorage.setItem('userPrincipal', principal);
};

// Get child canister actor for the selected organization
export const getChildActor = async (): Promise<ChildActor> => {
  const canisterId = getSelectedChildCanisterId();
  console.log('🔍 Getting child actor for canister ID:', canisterId);
  
  if (!canisterId) {
    throw new Error('No organization selected. Please select an organization first.');
  }
  
  try {
    const actor = await makeChildWithPlug({
      canisterId,
      host: 'https://ic0.app'
    });
    console.log('✅ Successfully created child actor for:', canisterId);
    return actor;
  } catch (error) {
    console.error('❌ Failed to create child actor for:', canisterId, error);
    throw error;
  }
};

// Get child canister actor for a specific canister ID
export const getChildActorById = async (canisterId: string): Promise<ChildActor> => {
  return await makeChildWithPlug({
    canisterId,
    host: 'https://ic0.app'
  });
};

// === REPUTATION MANAGEMENT FUNCTIONS ===

export const getBalance = async (principal: Principal): Promise<number> => {
  const actor = await getChildActor();
  const balance = await actor.getBalance(principal);
  return Number(balance);
};

export const getOrgUserBalances = async (): Promise<{ userId: Principal; balance: number }[]> => {
  const actor = await getChildActor();
  const balances = await actor.leaderboard(BigInt(0), BigInt(100));
  
  return balances.map(([userId, balance]) => ({
    userId,
    balance: Number(balance)
  }));
};

export const getOrgTransactionHistory = async (): Promise<any[]> => {
  console.log('📋 getOrgTransactionHistory called');
  const actor = await getChildActor();
  console.log('🎭 Calling actor.getTransactionHistory()');
  
  const transactions = await actor.getTransactionHistory();
  console.log('📦 Raw transactions from canister:', transactions);
  
  const mappedTransactions = transactions.map((tx: any) => ({
    id: Number(tx.id),
    transactionType: Object.keys(tx.transactionType)[0],
    from: tx.from,
    to: tx.to,
    amount: Number(tx.amount),
    timestamp: tx.timestamp, // Keep as BigInt/number, let convertTimestampToDate handle it
    reason: tx.reason?.[0] || "No reason provided"
  }));
  
  console.log('✅ Mapped transactions:', mappedTransactions);
  return mappedTransactions;
};

export const getOrgStats = async (): Promise<any> => {
  const actor = await getChildActor();
  const health = await actor.health();
  
  return {
    admin: null, // Not available in health
    totalPoints: Number(health.txCount), // Use transaction count as proxy
    awarderCount: 0, // Not available in health
    userCount: Number(health.users),
    totalTransactions: Number(health.txCount)
  };
};

export const getTransactionsByUser = async (principal: Principal): Promise<any[]> => {
  const actor = await getChildActor();
  const transactions = await actor.getTransactionsByUser(principal);
  
  return transactions.map((tx: any) => ({
    id: Number(tx.id),
    transactionType: Object.keys(tx.transactionType)[0],
    from: tx.from,
    to: tx.to,
    amount: Number(tx.amount),
    timestamp: tx.timestamp, // Keep as BigInt/number, let convertTimestampToDate handle it
    reason: tx.reason?.[0] || "No reason provided"
  }));
};

export const awardRep = async (recipient: string, amount: number, reason?: string): Promise<string> => {
  console.log('🎯 awardRep called with:', { recipient, amount, reason });
  
  const actor = await getChildActor();
  const recipientPrincipal = Principal.fromText(recipient);
  
  console.log('🎭 Calling actor.awardRep with:', {
    recipient: recipientPrincipal.toString(),
    amount: BigInt(amount),
    reason: reason ? [reason] : []
  });
  
  const result = await actor.awardRep(
    recipientPrincipal,
    BigInt(amount),
    reason ? [reason] : []
  );
  
  console.log('✅ awardRep result:', result);
  return result;
};

export const revokeRep = async (user: Principal, amount: number, reason?: string): Promise<string> => {
  const actor = await getChildActor();
  
  return await actor.revokeRep(
    user,
    BigInt(amount),
    reason ? [reason] : []
  );
};

export const addTrustedAwarder = async (awarder: Principal, name: string): Promise<string> => {
  const actor = await getChildActor();
  
  return await actor.addTrustedAwarder(awarder, name);
};

export const removeTrustedAwarder = async (awarder: Principal): Promise<string> => {
  const actor = await getChildActor();
  
  return await actor.removeTrustedAwarder(awarder);
};

export const getTrustedAwarders = async (): Promise<any[]> => {
  const actor = await getChildActor();
  const awarders = await actor.getTrustedAwarders();
  
  return awarders.map((awarder: any) => ({
    id: awarder.id,
    name: awarder.name
  }));
};

// === DECAY SYSTEM FUNCTIONS ===

export const getDecayConfig = async (): Promise<any> => {
  const actor = await getChildActor();
  return await actor.getDecayConfig();
};

export const configureDecay = async (
  decayRate: number,
  decayInterval: number,
  minThreshold: number,
  gracePeriod: number,
  enabled: boolean
): Promise<string> => {
  const actor = await getChildActor();
  
  return await actor.configureDecay(
    BigInt(decayRate),
    BigInt(decayInterval),
    BigInt(minThreshold),
    BigInt(gracePeriod),
    enabled
  );
};

export const getDecayStatistics = async (): Promise<any> => {
  const actor = await getChildActor();
  return await actor.getDecayStatistics();
};

export const getDecayAnalytics = async (): Promise<any> => {
  const actor = await getChildActor();
  return await actor.getDecayStatistics(); // Same as getDecayStatistics
};

export const applyDecayToSpecificUser = async (userId: Principal): Promise<string> => {
  const actor = await getChildActor();
  return await actor.triggerManualDecay();
};

export const processBatchDecay = async (): Promise<string> => {
  const actor = await getChildActor();
  return await actor.processBatchDecay();
};

// === ORGANIZATION MANAGEMENT FUNCTIONS ===

export const getAllOrganizations = async (): Promise<Array<{id: string; name: string; description: string}>> => {
  console.log('🏭 Getting all organizations from factory...');
  const factoryActor = await makeFactoriaWithPlug();
  const children = await factoryActor.listChildren();
  console.log('📋 Raw children from factory:', children);
  
  // Filter only active organizations (not archived)
  const activeChildren = children.filter((child) => {
    // Check if status is Active (not Archived)
    const isActive = 'Active' in child.status;
    console.log(`🔍 Child ${child.id.toString()}: status=${JSON.stringify(child.status)}, isActive=${isActive}`);
    return isActive;
  });
  
  console.log('✅ Active children:', activeChildren);
  
  const result = activeChildren.map((child) => ({
    id: child.id.toString(),
    name: child.note || `Organization ${child.id.toString().slice(0, 8)}`,
    description: `Reputation DAO for ${child.id.toString().slice(0, 8)}`
  }));
  
  console.log('📦 Final organizations result:', result);
  return result;
};

export const createOrganization = async (name: string, description: string, category: string): Promise<string> => {
  const factoryActor = await makeFactoriaWithPlug();
  
  // Get current user principal from Plug connection
  const principal = await getCurrentPrincipal();
  if (!principal) {
    throw new Error('User not authenticated');
  }
  
  const childId = await factoryActor.createOrReuseChildFor(
    principal,
    1_000_000_000_000n, // 1T cycles
    [], // controllers (empty means default)
    name // note
  );
  
  return childId.toString();
};

// === TEST FUNCTIONS ===

export const testCanisterConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing canister connection...');
    const actor = await getChildActor();
    console.log('✅ Actor created, testing health check...');
    
    const health = await actor.health();
    console.log('✅ Health check successful:', health);
    return true;
  } catch (error) {
    console.error('❌ Canister connection test failed:', error);
    return false;
  }
};

// === AUTHENTICATION FUNCTIONS ===

export const isPlugConnected = async (): Promise<boolean> => {
  try {
    const plug = (window as any)?.ic?.plug;
    if (!plug) return false;
    
    // Check if Plug is connected by trying to get the agent
    return !!(plug.agent);
  } catch (error) {
    console.error('Error checking Plug connection:', error);
    return false;
  }
};

export const getCurrentPrincipal = async (): Promise<Principal | null> => {
  try {
    const plug = (window as any)?.ic?.plug;
    if (!plug || !plug.agent) return null;
    
    // Get principal from Plug
    const principal = await plug.agent.getPrincipal();
    return principal;
  } catch (error) {
    console.error('Error getting current principal:', error);
    return null;
  }
};

export const getPlugActor = async (): Promise<ChildActor> => {
  try {
    const plug = (window as any)?.ic?.plug;
    if (!plug) {
      throw new Error('Plug wallet not found. Please install Plug wallet extension.');
    }

    // If not connected, request connection
    if (!plug.agent) {
      await plug.requestConnect({
        whitelist: ['ttoz7-uaaaa-aaaam-qd34a-cai'], // Factory canister ID
        host: 'https://ic0.app'
      });
    }

    // Get a child canister ID (for now, we'll use a default one)
    const canisterId = localStorage.getItem('selectedOrgId') || 'owyeu-jiaaa-aaaam-qdvwq-cai';
    
    return await makeChildWithPlug({
      canisterId,
      host: 'https://ic0.app'
    });
  } catch (error) {
    console.error('Error getting Plug actor:', error);
    throw error;
  }
};

// === ADDITIONAL DECAY FUNCTIONS ===

export const getOrgDecayStatistics = async (): Promise<any> => {
  return await getDecayStatistics();
};

export const getOrgDecayAnalytics = async (): Promise<any> => {
  return await getDecayAnalytics();
};

export const configureOrgDecay = async (
  decayRate: number,
  decayInterval: number,
  minThreshold: number,
  gracePeriod: number,
  enabled: boolean
): Promise<string> => {
  return await configureDecay(decayRate, decayInterval, minThreshold, gracePeriod, enabled);
};
