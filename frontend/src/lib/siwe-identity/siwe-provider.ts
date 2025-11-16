import {
  Actor,
  HttpAgent,
  type ActorConfig,
  type ActorSubclass,
  type DerEncodedPublicKey,
  type HttpAgentOptions,
} from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';
import type {
  LoginOkResponse,
  PrepareLoginOkResponse,
  SIWE_IDENTITY_SERVICE,
  SignedDelegation,
} from './service.interface';

export async function createAnonymousActor({
  idlFactory,
  canisterId,
  httpAgentOptions,
  actorOptions,
}: {
  idlFactory: IDL.InterfaceFactory;
  canisterId: string;
  httpAgentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
}) {
  const shouldFetchRootKey = process.env.DFX_NETWORK !== 'ic';
  const agent = await HttpAgent.create({
    ...httpAgentOptions,
    shouldFetchRootKey,
  });

  return Actor.createActor<SIWE_IDENTITY_SERVICE>(idlFactory, {
    agent,
    canisterId,
    ...actorOptions,
  });
}

export async function callPrepareLogin(
  anonymousActor: ActorSubclass<SIWE_IDENTITY_SERVICE>,
  address: string,
): Promise<PrepareLoginOkResponse> {
  const response = await anonymousActor.siwe_prepare_login(address);
  if ('Err' in response) {
    throw new Error(response.Err);
  }
  return response.Ok;
}

export async function callLogin(
  anonymousActor: ActorSubclass<SIWE_IDENTITY_SERVICE>,
  signature: string,
  address: string,
  sessionPublicKey: DerEncodedPublicKey,
  nonce: string,
): Promise<LoginOkResponse> {
  const response = await anonymousActor.siwe_login(signature, address, new Uint8Array(sessionPublicKey), nonce);
  if ('Err' in response) {
    throw new Error(response.Err);
  }
  return response.Ok;
}

export async function callGetDelegation(
  anonymousActor: ActorSubclass<SIWE_IDENTITY_SERVICE>,
  address: string,
  sessionPublicKey: DerEncodedPublicKey,
  expiration: bigint,
): Promise<SignedDelegation> {
  const response = await anonymousActor.siwe_get_delegation(address, new Uint8Array(sessionPublicKey), expiration);
  if ('Err' in response) {
    throw new Error(response.Err);
  }
  return response.Ok;
}
