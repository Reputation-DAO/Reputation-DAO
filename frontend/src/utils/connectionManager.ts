import { isPlugConnected, getPlugActor } from '../components/canister/reputationDao';
import { internetIdentityService } from '../services/internetIdentity';
import type { _SERVICE } from '../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

export type ConnectionType = 'plug' | 'internetIdentity' | null;

class ConnectionManager {
  private static instance: ConnectionManager;
  private isConnected: boolean = false;
  private actor: _SERVICE | null = null;
  private connectionPromise: Promise<_SERVICE> | null = null;
  private connectionType: ConnectionType = null;

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async getActor(): Promise<_SERVICE> {
    // If we have a valid actor and are connected, return it
    if (this.actor && this.isConnected) {
      try {
        // Quick test to ensure the actor is still valid
        await this.actor.getTransactionCount();
        return this.actor;
      } catch (error) {
        console.warn('Existing actor failed, creating new one:', error);
        this.actor = null;
        this.isConnected = false;
      }
    }

    // If already connecting, wait for that connection
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection
    this.connectionPromise = this.createConnection();
    
    try {
      this.actor = await this.connectionPromise;
      this.isConnected = true;
      return this.actor;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async createConnection(): Promise<_SERVICE> {
    console.log('ConnectionManager: Creating new connection...');
    
    // First check if Internet Identity is authenticated
    const iiAuthState = await internetIdentityService.getAuthState();
    if (iiAuthState.isAuthenticated && iiAuthState.actor) {
      console.log('ConnectionManager: Using Internet Identity connection');
      this.connectionType = 'internetIdentity';
      return iiAuthState.actor;
    }

    // Fallback to Plug
    const plugConnected = await isPlugConnected();
    if (plugConnected) {
      console.log('ConnectionManager: Using existing Plug connection');
    } else {
      console.log('ConnectionManager: Will request new Plug connection');
    }
    
    this.connectionType = 'plug';
    return await getPlugActor();
  }

  async checkConnection(): Promise<boolean> {
    try {
      // Check Internet Identity first
      const iiAuthenticated = await internetIdentityService.isAuthenticated();
      if (iiAuthenticated) {
        this.isConnected = true;
        this.connectionType = 'internetIdentity';
        return true;
      }

      // Check Plug connection
      this.isConnected = await isPlugConnected();
      if (this.isConnected) {
        this.connectionType = 'plug';
      }
      
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      this.connectionType = null;
      return false;
    }
  }

  getConnectionType(): ConnectionType {
    return this.connectionType;
  }

  async disconnect() {
    if (this.connectionType === 'internetIdentity') {
      await internetIdentityService.logout();
    }
    
    this.actor = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.connectionType = null;
  }

  // Method to force a specific connection type
  async connectWith(type: 'plug' | 'internetIdentity'): Promise<_SERVICE> {
    this.disconnect();
    
    if (type === 'internetIdentity') {
      const authState = await internetIdentityService.login();
      if (authState.actor) {
        this.actor = authState.actor;
        this.isConnected = true;
        this.connectionType = 'internetIdentity';
        return authState.actor;
      }
      throw new Error('Failed to connect with Internet Identity');
    } else {
      this.connectionType = 'plug';
      this.actor = await getPlugActor();
      this.isConnected = true;
      return this.actor;
    }
  }
}

export const connectionManager = ConnectionManager.getInstance();
