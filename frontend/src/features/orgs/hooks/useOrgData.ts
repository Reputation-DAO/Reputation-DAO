// src/features/orgs/hooks/useOrgData.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { _SERVICE as Factoria } from '../../../declarations/factoria/factoria.did.d.ts';
import type { OrgRecord } from "../model/org.types";
import {
  fetchOwnedOrgRecords,
  fetchPublicOrgRecords,
  createOrReuseChildFor as apiCreateOrReuse,
  createTrialForSelf as apiCreateTrialForSelf,
  createBasicPendingForSelf as apiCreateBasicPendingForSelf,
  startChild as apiStartChild,
  stopChild as apiStopChild,
  archiveChild as apiArchiveChild,
  topUpChild as apiTopUpChild,
  toggleVisibility as apiToggleVisibility,
  getBasicPayInfoForChild,
  activateBasicForChildAfterPayment,
} from "../api/factoria.client";
import { Principal } from "@dfinity/principal";
import { toast } from "sonner";

/**
 * Manages Org data (owned + public) and exposes mutation helpers.
 * Pass an initialized Factoria actor and the caller principal (text).
 */
export function useOrgData(params: {
  factoria: Factoria | null;
  principal: string | null;
}) {
  const { factoria, principal } = params;

  const [owned, setOwned] = useState<OrgRecord[]>([]);
  const [publicOrgs, setPublicOrgs] = useState<OrgRecord[]>([]);

  const [loadingOwned, setLoadingOwned] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);

  const [creating, setCreating] = useState(false);
  const [working, setWorking] = useState(false);
  const ownedRef = useRef<OrgRecord[]>([]);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchOwned = useCallback(async () => {
    if (!factoria || !principal) return;
    setLoadingOwned(true);
    try {
      const rows = await fetchOwnedOrgRecords(factoria, principal);
      if (mounted.current) {
        ownedRef.current = rows;
        setOwned(rows);
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch owned organizations");
    } finally {
      if (mounted.current) setLoadingOwned(false);
    }
  }, [factoria, principal]);

  const fetchPublic = useCallback(async () => {
    if (!factoria) return;
    setLoadingPublic(true);
    try {
      const mine = new Set(ownedRef.current.map((o) => o.id));
      const rows = await fetchPublicOrgRecords(factoria, mine);
      if (mounted.current) setPublicOrgs(rows);
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch public organizations");
    } finally {
      if (mounted.current) setLoadingPublic(false);
    }
  }, [factoria]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchOwned(), fetchPublic()]);
  }, [fetchOwned, fetchPublic]);

  // initial + when actor/principal change
  useEffect(() => {
    if (!factoria || !principal) {
      setOwned([]);
      setPublicOrgs([]);
      ownedRef.current = [];
      return;
    }
    void fetchOwned().then(() => fetchPublic());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoria, principal]);

  // ---------- Mutations ----------

  const createTrialForSelf = useCallback(
    async (note: string) => {
      if (!factoria) return { ok: undefined as string | undefined, err: "Actor not ready" };
      setCreating(true);
      try {
        const res = await apiCreateTrialForSelf(factoria, note);
        if (res.ok) {
          toast.success(`Trial created: ${res.ok}`);
          await refreshAll();
        } else {
          toast.error(res.err || "Trial create failed");
        }
        return res;
      } catch (e: any) {
        const msg = e?.message || "Trial create failed";
        toast.error(msg);
        return { err: msg };
      } finally {
        setCreating(false);
      }
    },
    [factoria, refreshAll]
  );

  const createBasicForSelf = useCallback(
    async (
      note: string
    ): Promise<Awaited<ReturnType<typeof apiCreateBasicPendingForSelf>>> => {
      if (!factoria) throw new Error("Actor not ready");
      setCreating(true);
      try {
        const res = await apiCreateBasicPendingForSelf(factoria, note);
        toast.success(`Reserved organization: ${res.id}`);
        await refreshAll();
        return res;
      } catch (e: any) {
        const msg = e?.message || "Basic reservation failed";
        toast.error(msg);
        throw e;
      } finally {
        setCreating(false);
      }
    },
    [factoria, refreshAll]
  );

  const createOrReuseChildFor = useCallback(
    async (cycles: bigint, controllers: Principal[] = [], note: string = "") => {
      if (!factoria || !principal) throw new Error("Actor/principal not ready");
      setCreating(true);
      try {
        const id = await apiCreateOrReuse(factoria, principal, cycles, controllers, note);
        toast.success(`Organization ready: ${id}`);
        await refreshAll();
        return id;
      } catch (e: any) {
        const msg = e?.message || "Create/reuse failed";
        toast.error(msg);
        throw e;
      } finally {
        setCreating(false);
      }
    },
    [factoria, principal, refreshAll]
  );

  const topUp = useCallback(
    async (childId: string, amount: bigint) => {
      if (!factoria) throw new Error("Actor not ready");
      setWorking(true);
      try {
        const res = await apiTopUpChild(factoria, childId, amount);
        if (res.ok !== undefined) {
          toast.success(`Top up OK: +${res.ok.toString()} cycles`);
          await fetchOwned(); // only owned needs refresh
        } else {
          toast.error(res.err || "Top up failed");
        }
        return res;
      } finally {
        setWorking(false);
      }
    },
    [factoria, fetchOwned]
  );

  const togglePower = useCallback(
    async (org: OrgRecord) => {
      if (!factoria) return;
      setWorking(true);
      try {
        if (org.status !== "Active" || org.isStopped) {
          await apiStartChild(factoria, org.canisterId);
          toast.success("Canister started");
        } else {
          await apiStopChild(factoria, org.canisterId);
          toast.success("Canister stopped");
        }
        await fetchOwned();
      } catch (e: any) {
        toast.error(e?.message || "Toggle failed");
      } finally {
        setWorking(false);
      }
    },
    [factoria, fetchOwned]
  );

  const archive = useCallback(
    async (childId: string) => {
      if (!factoria) throw new Error("Actor not ready");
      setWorking(true);
      try {
        const res = await apiArchiveChild(factoria, childId);
        if (/success/i.test(res)) toast.success(res);
        else toast.message(res);
        await refreshAll();
      } catch (e: any) {
        toast.error(e?.message || "Archive failed");
      } finally {
        setWorking(false);
      }
    },
    [factoria, refreshAll]
  );

  const toggleVisibility = useCallback(
    async (childId: string) => {
      if (!factoria) throw new Error("Actor not ready");
      setWorking(true);
      try {
        const next = await apiToggleVisibility(factoria, childId);
        toast.success(`Visibility: ${next}`);
        // local patch to avoid full refetch
        setOwned((prev) => {
          const updated = prev.map((o) =>
            o.id === childId ? { ...o, visibility: next } : o
          );
          ownedRef.current = updated;
          return updated;
        });
      } catch (e: any) {
        toast.error(e?.message || "Toggle visibility failed");
      } finally {
        setWorking(false);
      }
    },
    [factoria]
  );

  // ---------- Payments helpers ----------

  const getPaymentInfo = useCallback(
    async (childId: string) => {
      if (!factoria) throw new Error("Actor not ready");
      try {
        return await getBasicPayInfoForChild(factoria, childId);
      } catch (e: any) {
        const msg = e?.message || "Failed to get payment info";
        toast.error(msg);
        throw e;
      }
    },
    [factoria]
  );

  const activateAfterPayment = useCallback(
    async (childId: string) => {
      if (!factoria) throw new Error("Actor not ready");
      setWorking(true);
      try {
        const res = await activateBasicForChildAfterPayment(factoria, childId);
        if (res.ok) {
          toast.success(res.ok);
          await fetchOwned();
        } else {
          toast.error(res.err || "Activation failed");
        }
        return res;
      } finally {
        setWorking(false);
      }
    },
    [factoria, fetchOwned]
  );

  const mineIds = useMemo(() => new Set(owned.map((o) => o.id)), [owned]);

  return {
    // data
    owned,
    publicOrgs,
    loadingOwned,
    loadingPublic,
    creating,
    working,

    // derived
    mineIds,

    // reads
    fetchOwned,
    fetchPublic,
    refreshAll,

    // mutations
    createTrialForSelf,
    createBasicForSelf,
    createOrReuseChildFor,
    topUp,
    togglePower,
    archive,
    toggleVisibility,

    // payments
    getPaymentInfo,
    activateAfterPayment,
  };
}

export type UseOrgDataReturn = ReturnType<typeof useOrgData>;
