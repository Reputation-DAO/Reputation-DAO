import type { HttpAgent } from '@dfinity/agent';

export const PLUG_HOST = 'https://icp-api.io';

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

export const ensurePlugAgent = async (options: { host?: string; whitelist?: string[] } = {}): Promise<HttpAgent> => {
  const plug = getPlug();
  if (!plug) {
    throw new Error('Plug wallet not found. Please install or enable the Plug extension.');
  }

  const host = options.host ?? PLUG_HOST;
  const whitelist = options.whitelist && options.whitelist.length > 0 ? options.whitelist : undefined;

  const connected = await plug.isConnected?.();
  if (!connected) {
    const ok = await plug.requestConnect?.({ host, whitelist });
    if (!ok) {
      throw new Error('Plug connection request was rejected.');
    }
  }

  if (!plug.agent) {
    if (typeof plug.createAgent === 'function') {
      await plug.createAgent({ host, whitelist });
    } else {
      throw new Error('Plug agent is unavailable.');
    }
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
    return;
  }
  if (plug?.disconnect?.call) {
    await plug.disconnect();
    return;
  }
  if (plug && typeof plug.requestDisconnect === 'function') {
    await plug.requestDisconnect();
    return;
  }
  if (window.ic?.plug?.disconnect) {
    await window.ic.plug.disconnect();
  }
};
