import type { HttpAgent } from '@dfinity/agent';

export const PLUG_HOST = 'https://icp-api.io';
const WL_STORAGE_KEY = 'plug:whitelist';
export const PLUG_DISABLE_KEY = 'repdao:ii-lock';

const getPlug = () => (window as any)?.ic?.plug;

export const isPlugAvailable = (): boolean => Boolean(getPlug());

export const isPlugConnected = async (): Promise<boolean> => {
  const plug = getPlug();
  if (!plug) return false;
  try {
    const connected = await plug.isConnected?.();
    return Boolean(connected && plug.agent);
  } catch {
    return Boolean(plug.agent);
  }
};

const readStoredWhitelist = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage?.getItem(WL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const storeWhitelist = (entries: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem(WL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors (e.g., Safari private mode)
  }
};

export const ensurePlugAgent = async (options: { host?: string; whitelist?: string[] } = {}): Promise<HttpAgent> => {
  const plug = getPlug();
  if (!plug) {
    throw new Error('Plug wallet not found. Please install or enable the Plug extension.');
  }

  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage?.getItem(PLUG_DISABLE_KEY) === '1') {
        throw new Error('Plug access is disabled for the current session.');
      }
    } catch (err) {
      // If storage throws (e.g., private mode), fall through; we still attempt to connect.
      if (err instanceof Error && err.message === 'Plug access is disabled for the current session.') {
        throw err;
      }
    }
  }

  const host = options.host ?? PLUG_HOST;
  const incoming = options.whitelist ?? [];
  const stored = new Set(readStoredWhitelist());
  let whitelistUpdated = false;

  for (const id of incoming) {
    if (id && !stored.has(id)) {
      stored.add(id);
      whitelistUpdated = true;
    }
  }

  const mergedWhitelist = Array.from(stored);

  const connected = await plug.isConnected?.();
  if (!connected) {
    const ok = await plug.requestConnect?.({
      host,
      whitelist: mergedWhitelist.length ? mergedWhitelist : undefined,
    });
    if (ok === false) {
      throw new Error('Plug connection request was rejected.');
    }
    if (mergedWhitelist.length) {
      storeWhitelist(mergedWhitelist);
    }
  } else if (whitelistUpdated && mergedWhitelist.length) {
    try {
      await plug.requestConnect?.({
        host,
        whitelist: mergedWhitelist,
      });
      storeWhitelist(mergedWhitelist);
    } catch (err) {
      console.warn('Plug whitelist update failed:', err);
    }
  }

  if (!plug.agent || whitelistUpdated) {
    if (typeof plug.createAgent === 'function') {
      await plug.createAgent({
        host,
        whitelist: mergedWhitelist.length ? mergedWhitelist : undefined,
      });
    } else if (!plug.agent) {
      throw new Error('Plug agent is unavailable.');
    }
  }

  if (!plug.agent) {
    throw new Error('Plug agent is unavailable after attempting connection.');
  }

  return plug.agent as HttpAgent;
};

export const getPlugPrincipal = async () => {
  const plug = getPlug();
  if (!plug?.agent) return null;
  try {
    return await plug.agent.getPrincipal?.();
  } catch (err) {
    console.error('Failed to read Plug principal:', err);
    return null;
  }
};

export const disconnectPlug = async (): Promise<void> => {
  const plug = getPlug();
  if (plug?.disconnect) {
    await plug.disconnect();
  } else if (plug?.disconnect?.call) {
    await plug.disconnect();
  } else if (plug && typeof plug.requestDisconnect === 'function') {
    await plug.requestDisconnect();
  } else if (window.ic?.plug?.disconnect) {
    await window.ic.plug.disconnect();
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.removeItem(WL_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
};
