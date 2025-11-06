import { Actor, HttpAgent } from "@dfinity/agent";

// Imports and re-exports candid interface
import { idlFactory } from "./blog_backend.did.js";
export { idlFactory } from "./blog_backend.did.js";

/* CANISTER_ID is replaced by webpack based on node environment
 * Note: canister environment variable will be standardized as
 * process.env.CANISTER_ID_<CANISTER_NAME_UPPERCASE>
 * beginning in dfx 0.15.0
 */
const processEnv = typeof process !== "undefined" ? process.env : undefined;
const importMetaEnv =
  typeof import.meta !== "undefined" ? import.meta.env : undefined;

const getEnvVar = (key) =>
  (processEnv && processEnv[key]) ||
  (importMetaEnv && importMetaEnv[key]) ||
  undefined;

export const canisterId =
  getEnvVar("CANISTER_ID_BLOG_BACKEND") ||
  getEnvVar("VITE_CANISTER_ID_BLOG_BACKEND");

export const createActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({ ...options.agentOptions });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  // Fetch root key for certificate validation during development
  const network = getEnvVar("DFX_NETWORK") || getEnvVar("VITE_DFX_NETWORK");
  if (network !== "ic") {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(err);
    });
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};

export const blog_backend = canisterId ? createActor(canisterId) : undefined;
