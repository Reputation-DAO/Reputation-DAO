/// <reference types="vite/client" />

declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (options: any) => Promise<boolean>;
        isConnected: () => Promise<boolean>;
        createAgent: (options: any) => Promise<void>;
        createActor: (options: any) => Promise<any>;
        agent: any;
        disconnect: () => Promise<void>;
      };
    };
  }
}

export {};
