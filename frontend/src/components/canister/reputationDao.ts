
import { idlFactory } from '../../../../src/declarations/reputation_dao/reputation_dao.did.js';
import type { _SERVICE } from '../../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

//modify this canisterID based on where the dfx playground hosts your backend

const canisterId = '4n3qe-piaaa-aaaab-qac7a-cai';

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
      const transactionCount = await actor.getTransactionCount();
      console.log('🔄 Connection test successful. Transaction count:', transactionCount);
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
