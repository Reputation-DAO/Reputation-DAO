import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE, Awarder, Transaction } from '../../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

// Canister ID for playground deployment
const canisterId = 'mnu3f-wyaaa-aaaab-qabsa-cai';

// Playground host
const PLAYGROUND_HOST = 'https://icp-api.io';

// Create agent for playground
const createAgent = () => {
  return new HttpAgent({
    host: PLAYGROUND_HOST,
  });
};

// Get actor using Plug wallet
export const getPlugActor = async (): Promise<_SERVICE> => {
  if (!window.ic?.plug) {
    throw new Error('Plug extension not found');
  }

  try {
    // 1. Connect Plug with whitelist
    const connected = await window.ic.plug.requestConnect({
      whitelist: [canisterId],
    });

    if (!connected) {
      throw new Error('User rejected the Plug connection');
    }

    // 2. Create agent with playground host
    await window.ic.plug.createAgent({
      host: PLAYGROUND_HOST,
    });

    // 3. Return the actor
    const actor = (await window.ic.plug.createActor({
      canisterId,
      interfaceFactory: idlFactory,
    })) as _SERVICE;

    return actor;
  } catch (error: any) {
    console.error('Error creating Plug actor:', error);
    throw new Error(`Failed to connect to canister: ${error.message || 'Unknown error'}`);
  }
};

// Get actor without wallet (for read-only operations)
export const getActor = (): _SERVICE => {
  const agent = createAgent();
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};

// Backend integration functions
export const reputationService = {
  // Test connection to the canister
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing canister connection...');
      const actor = getActor();
      const count = await actor.getTransactionCount();
      console.log('Connection successful, transaction count:', count);
      return true;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      throw new Error(`Cannot connect to canister: ${error.message || 'Network error'}`);
    }
  },

  // Award reputation to a user
  async awardReputation(principal: Principal, amount: bigint, reason?: string): Promise<string> {
    try {
      const actor = await getPlugActor();
      return await actor.awardRep(principal, amount, reason ? [reason] : []);
    } catch (error) {
      console.error('Error awarding reputation:', error);
      throw error;
    }
  },

  // Revoke reputation from a user
  async revokeReputation(principal: Principal, amount: bigint, reason?: string): Promise<string> {
    try {
      const actor = await getPlugActor();
      return await actor.revokeRep(principal, amount, reason ? [reason] : []);
    } catch (error) {
      console.error('Error revoking reputation:', error);
      throw error;
    }
  },

  // Get user balance
  async getBalance(principal: Principal): Promise<bigint> {
    try {
      console.log('Getting balance for principal:', principal.toString());
      const actor = getActor();
      const balance = await actor.getBalance(principal);
      console.log('Balance received:', balance);
      return balance;
    } catch (error: any) {
      console.error('Error getting balance:', error);
      throw new Error(`Failed to get balance: ${error.message || 'Network error'}`);
    }
  },

  // Get all transactions
  async getTransactionHistory(): Promise<Transaction[]> {
    try {
      console.log('Getting transaction history...');
      const actor = getActor();
      const transactions = await actor.getTransactionHistory();
      console.log('Transactions received:', transactions);
      return transactions;
    } catch (error: any) {
      console.error('Error getting transaction history:', error);
      throw new Error(`Failed to get transaction history: ${error.message || 'Network error'}`);
    }
  },

  // Get transactions for a specific user
  async getTransactionsByUser(principal: Principal): Promise<Transaction[]> {
    try {
      const actor = getActor();
      return await actor.getTransactionsByUser(principal);
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  },

  // Get transaction count
  async getTransactionCount(): Promise<bigint> {
    try {
      const actor = getActor();
      return await actor.getTransactionCount();
    } catch (error) {
      console.error('Error getting transaction count:', error);
      throw error;
    }
  },

  // Get trusted awarders
  async getTrustedAwarders(): Promise<Awarder[]> {
    try {
      const actor = getActor();
      return await actor.getTrustedAwarders();
    } catch (error) {
      console.error('Error getting trusted awarders:', error);
      throw error;
    }
  },

  // Add trusted awarder
  async addTrustedAwarder(principal: Principal, name: string): Promise<string> {
    try {
      const actor = await getPlugActor();
      return await actor.addTrustedAwarder(principal, name);
    } catch (error) {
      console.error('Error adding trusted awarder:', error);
      throw error;
    }
  },

  // Remove trusted awarder
  async removeTrustedAwarder(principal: Principal): Promise<string> {
    try {
      const actor = await getPlugActor();
      return await actor.removeTrustedAwarder(principal);
    } catch (error) {
      console.error('Error removing trusted awarder:', error);
      throw error;
    }
  }
};
