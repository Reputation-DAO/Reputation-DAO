// src/features/orgs/hooks/useFactoria.ts
import { useCallback, useEffect, useState } from "react";
import type { _SERVICE as Factoria } from "../../../declarations/factoria/factoria.did.d.ts";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Provides a Factoria actor using the active authentication method (Plug or Internet Identity).
 */
export function useFactoria() {
  const {
    isAuthenticated,
    authMethod,
    principal,
    getFactoriaActor,
    isLoading: authLoading,
  } = useAuth();

  const [factoria, setFactoria] = useState<Factoria | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [principalText, setPrincipalText] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (!isAuthenticated || !authMethod) {
      setFactoria(null);
      setPrincipalText(null);
      setError(null);
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      const actor = await getFactoriaActor();
      setFactoria(actor);
      setPrincipalText(principal ? principal.toText() : null);
    } catch (e: any) {
      setFactoria(null);
      setError(e?.message || "Failed to create Factoria actor");
    } finally {
      setConnecting(false);
    }
  }, [isAuthenticated, authMethod, getFactoriaActor, principal]);

  useEffect(() => {
    void connect();
  }, [connect]);

  return {
    factoria,
    connecting: connecting || authLoading,
    error,
    isConnected: isAuthenticated && !!factoria,
    principal: principal ? principal.toText() : null,
    refresh: connect,
  };
}

export type UseFactoriaReturn = ReturnType<typeof useFactoria>;
