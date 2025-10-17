import { Principal } from "@dfinity/principal";
import type {
  _SERVICE as Factoria,
  Child as FactoryChild,
} from '../../../declarations/factoria/factoria.did.d.ts';
import {
  toStatus,
  toPlan,
  toVisibility,
} from "../model/org.selectors";
import type { OrgRecord } from "../model/org.types";

async function withLogging(label: string, fn: () => Promise<any>) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[Factoria:${label}]`, err);
    throw err;
  }
}

// ---------------- Reads ----------------

export async function fetchOwnedOrgRecords(
  f: Factoria,
  principalText: string
): Promise<OrgRecord[]> {
  const owner = Principal.fromText(principalText);
  const childIds = await withLogging("listByOwner", () => f.listByOwner(owner)); // Principal[]

  // fetch metadata for each id
  const childRecords = await Promise.all(
    childIds.map(async (pid) => {
      const recOpt = await withLogging("getChild", () => f.getChild(pid)); // [] | [Child]
      return recOpt.length ? { pid, rec: recOpt[0] } : null;
    })
  );

  // health (only try for Active)
  const healthResults = await Promise.all(
    childRecords.map(async (entry) => {
      if (!entry) return null;
      const { pid, rec } = entry;
      const status = toStatus(rec.status);
      if (status !== "Active") {
        return { id: pid.toText(), health: null, isStopped: true };
      }
      try {
        const hOpt = await withLogging("childHealth", () => f.childHealth(pid)); // [] | [Health]
        return hOpt.length
          ? { id: pid.toText(), health: hOpt[0], isStopped: false }
          : { id: pid.toText(), health: null, isStopped: true };
      } catch {
        return { id: pid.toText(), health: null, isStopped: true };
      }
    })
  );

  const healthMap = new Map(
    healthResults.filter(Boolean).map((h) => [h!.id, h!])
  );

  // build UI records (include plan, visibility, expiresAt)
  const rows: OrgRecord[] = childRecords
    .filter((e): e is { pid: Principal; rec: FactoryChild } => !!e)
    .map(({ pid, rec }) => {
      const id = pid.toText();
      const status = toStatus(rec.status);
      const plan = toPlan(rec.plan);
      const visibility = toVisibility(rec.visibility);

      const hv = healthMap.get(id);
      const users = hv?.health ? hv.health.users.toString() : undefined;
      const cycles = hv?.health ? hv.health.cycles.toString() : undefined;
      const tx = hv?.health ? hv.health.txCount.toString() : undefined;
      const topUpCount = hv?.health ? hv.health.topUpCount.toString() : undefined;
      const paused = hv?.health ? hv.health.paused : undefined;
      const isStopped = hv?.isStopped ?? (status !== "Active");

      return {
        id,
        name: rec.note?.trim() ? rec.note : id,
        canisterId: id,
        status,
        plan,
        visibility,
        createdAt: Number(rec.created_at ?? 0n),
        expiresAt: Number(rec.expires_at ?? 0n),
        users,
        cycles,
        txCount: tx,
        topUpCount,
        paused,
        isStopped,
      } satisfies OrgRecord;
    });

  return rows;
}

export async function fetchPublicOrgRecords(
  f: Factoria,
  mine: Set<string>
): Promise<OrgRecord[]> {
  const allChildren = await withLogging("listChildren", () => f.listChildren()); // Child[]
  return allChildren
    .map((child): OrgRecord | null => {
      const idText = child.id.toText();
      const status = toStatus(child.status);
      const visibility = toVisibility(child.visibility);
      const plan = toPlan(child.plan);

      // only Active + Public and not mine
      if (status !== "Active" || visibility !== "Public" || mine.has(idText)) return null;

      return {
        id: idText,
        name: child.note?.trim() ? child.note : idText,
        canisterId: idText,
        status,
        plan,
        visibility,
        createdAt: Number(child.created_at ?? 0n),
        expiresAt: Number(child.expires_at ?? 0n),
        isStopped: false, // skipping health probe for speed
      };
    })
    .filter(Boolean) as OrgRecord[];
}

// ---------------- Mutations (thin wrappers) ----------------

export async function createOrReuseChildFor(
  f: Factoria,
  ownerText: string,
  cycles: bigint,                 // backend will handle floors/buffers
  controllers: Principal[],
  note: string
) {
  const owner = Principal.fromText(ownerText);
  const newId = await withLogging("createOrReuseChildFor", () =>
    f.createOrReuseChildFor(owner, cycles, controllers, note)
  );
  return newId.toText();
}

export async function createTrialForSelf(
  f: Factoria,
  note: string
): Promise<{ ok?: string; err?: string }> {
  const res = await withLogging("createTrialForSelf", () => f.createTrialForSelf(note));
  if ("ok" in res) return { ok: res.ok.toText() };
  return { err: res.err };
}

export async function createBasicForSelf(
  f: Factoria,
  note: string
): Promise<string> {
  const id = await withLogging("createBasicForSelf", () => f.createBasicForSelf(note));
  return id.toText();
}

export async function topUpChild(
  f: Factoria,
  childIdText: string,
  amount: bigint
): Promise<{ ok?: bigint; err?: string }> {
  const id = Principal.fromText(childIdText);
  const res = await withLogging("topUpChild", () => f.topUpChild(id, amount)); // {#ok Nat; #err Text}
  if ("ok" in res) return { ok: res.ok };
  return { err: res.err };
}

export async function startChild(f: Factoria, childIdText: string): Promise<void> {
  await withLogging("startChild", () => f.startChild(Principal.fromText(childIdText)));
}

export async function stopChild(f: Factoria, childIdText: string): Promise<void> {
  await withLogging("stopChild", () => f.stopChild(Principal.fromText(childIdText)));
}

export async function archiveChild(f: Factoria, childIdText: string): Promise<string> {
  return await withLogging("archiveChild", () => f.archiveChild(Principal.fromText(childIdText))); // returns Text status
}

export async function toggleVisibility(
  f: Factoria,
  childIdText: string
): Promise<"Public" | "Private"> {
  const v = await withLogging("toggleVisibility", () => f.toggleVisibility(Principal.fromText(childIdText)));
  return "Private" in v ? "Private" : "Public";
}

// ---------------- Payments (ICRC-1 via subaccounts) ----------------

/**
 * Returns the deposit account for a child and the amount (in e8s) required
 * to activate/extend Basic for one month.
 */
export async function getBasicPayInfoForChild(
  f: Factoria,
  childIdText: string
): Promise<{ account_owner: string; subaccount_hex: string; amount_e8s: bigint }> {
  const cid = Principal.fromText(childIdText);
  const info = await withLogging("getBasicPayInfoForChild", () => f.getBasicPayInfoForChild(cid));
  // Convert Blob to hex for frontend display
  const sub = (info.subaccount as unknown as Uint8Array) || new Uint8Array();
  const hex = [...sub].map((b) => b.toString(16).padStart(2, "0")).join("");
  return {
    account_owner: info.account_owner.toText(),
    subaccount_hex: hex,
    amount_e8s: info.amount_e8s,
  };
}

/**
 * After the user deposits ICP to the child’s subaccount, call this to sweep
 * funds into the treasury and extend Basic by +30 days.
 */
export async function activateBasicForChildAfterPayment(
  f: Factoria,
  childIdText: string
): Promise<{ ok?: string; err?: string }> {
  const cid = Principal.fromText(childIdText);
  const res = await withLogging("activateBasicForChildAfterPayment", () => f.activateBasicForChildAfterPayment(cid));
  if ("ok" in res) return { ok: res.ok };
  return { err: res.err };
}
