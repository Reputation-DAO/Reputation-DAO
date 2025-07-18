import { isPlugConnected, getPlugActor } from '../components/canister/reputationDao';

class ConnectionManager {
  private static instance: ConnectionManager;
  private isConnected: boolean = false;
  private actor: any = null;
  private connectionPromise: Promise<any> | null = null;

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async getActor() {
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

  private async createConnection() {
    console.log('ConnectionManager: Creating new connection...');
    
    const connected = await isPlugConnected();
    if (connected) {
      console.log('ConnectionManager: Using existing Plug connection');
    } else {
      console.log('ConnectionManager: Will request new Plug connection');
    }
    
    return await getPlugActor();
  }

  async checkConnection(): Promise<boolean> {
    try {
      this.isConnected = await isPlugConnected();
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  disconnect() {
    this.actor = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }
}

export const connectionManager = ConnectionManager.getInstance();
