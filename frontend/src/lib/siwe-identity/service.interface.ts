import type { ActorMethod } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';

export type Address = string;
export type Nonce = string;
export type Signature = string;
export type PublicKey = Uint8Array | number[];
export type SessionKey = PublicKey;
export type Timestamp = bigint;

export interface PrepareLoginOkResponse {
  siwe_message: string;
  nonce: string;
}

export type PrepareLoginResponse = { Ok: PrepareLoginOkResponse } | { Err: string };

export interface Delegation {
  pubkey: PublicKey;
  targets: [] | [Array<Principal>];
  expiration: Timestamp;
}

export interface SignedDelegation {
  signature: Uint8Array | number[];
  delegation: Delegation;
}

export type GetDelegationResponse = { Ok: SignedDelegation } | { Err: string };

export interface LoginOkResponse {
  user_canister_pubkey: PublicKey;
  expiration: Timestamp;
}

export type LoginResponse = { Ok: LoginOkResponse } | { Err: string };

export interface SIWE_IDENTITY_SERVICE {
  siwe_prepare_login: ActorMethod<[Address], PrepareLoginResponse>;
  siwe_login: ActorMethod<[Signature, Address, SessionKey, Nonce], LoginResponse>;
  siwe_get_delegation: ActorMethod<[Address, SessionKey, Timestamp], GetDelegationResponse>;
}
