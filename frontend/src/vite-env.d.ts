/// <reference types="vite/client" />

declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect?: (options: any) => Promise<boolean>;
        requestDisconnect?: () => Promise<void>;
        isConnected?: () => Promise<boolean>;
        createAgent?: (options: any) => Promise<void>;
        createActor?: (options: any) => Promise<any>;
        getPrincipal?: () => Promise<any>;
        agent?: {
          getPrincipal?: () => Promise<any>;
        } & Record<string, any>;
        disconnect?: () => Promise<void>;
      };
    };
  }
}

export {};
