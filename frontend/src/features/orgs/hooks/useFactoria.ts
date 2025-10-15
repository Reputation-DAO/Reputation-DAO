// src/features/orgs/hooks/useFactoria.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { _SERVICE as Factoria } from '../../../../../src/declarations/factoria/factoria.did.d.ts';
import { makeFactoriaWithPlug, getFactoriaCanisterId } from "@/lib/canisters";
import { usePlugConnection } from "@/hooks/usePlugConnection";

/**
 * Creates the Factoria actor once Plug is connected and exposes connection state.
 * Keeps the actor fresh if the Plug session/principal changes.
 */
export function useFactoria() {
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  const [factoria, setFactoria] = useState<Factoria | null>(null);
  const [principalText, setPrincipalText] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);

  const canisterId = useMemo(() => getFactoriaCanisterId(), []);

  const connect = async () => {
    if (!isConnected || !principal) {
      setFactoria(null);
      setPrincipalText(null);
      setError(null);
      setConnecting(false);
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      const actor = await makeFactoriaWithPlug({ canisterId });
      if (mounted.current) {
        setFactoria(actor);
        setPrincipalText(principal);
      }
    } catch (e: any) {
      if (mounted.current) {
        setError(e?.message || "Failed to create Factoria actor");
        setFactoria(null);
      }
    } finally {
      if (mounted.current) setConnecting(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, principal, canisterId]);

  const refresh = () => {
    void connect();
  };

  return {
    factoria,
    connecting,
    error,
    isConnected,
    principal: principalText,
    refresh,
  };
}

export type UseFactoriaReturn = ReturnType<typeof useFactoria>;
