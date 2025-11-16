import type { DerEncodedPublicKey, Signature } from '@dfinity/agent';
import { Delegation, DelegationChain, type SignedDelegation } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';
import type { PublicKey, SignedDelegation as ServiceSignedDelegation } from './service.interface';

export function asSignature(signature: Uint8Array | number[]): Signature {
  const arrayBuffer: ArrayBuffer = (signature as Uint8Array).buffer;
  const sig: Signature = arrayBuffer as Signature;
  sig.__signature__ = undefined;
  return sig;
}

export function asDerEncodedPublicKey(publicKey: Uint8Array | number[]): DerEncodedPublicKey {
  const arrayBuffer: ArrayBuffer = (publicKey as Uint8Array).buffer;
  const pk: DerEncodedPublicKey = arrayBuffer as DerEncodedPublicKey;
  pk.__derEncodedPublicKey__ = undefined;
  return pk;
}

export function createDelegationChain(signedDelegation: ServiceSignedDelegation, publicKey: PublicKey) {
  const delegations: SignedDelegation[] = [
    {
      delegation: new Delegation(
        (signedDelegation.delegation.pubkey as Uint8Array).buffer,
        signedDelegation.delegation.expiration,
        signedDelegation.delegation.targets[0] as Principal[],
      ),
      signature: asSignature(signedDelegation.signature),
    },
  ];
  return DelegationChain.fromDelegations(delegations, asDerEncodedPublicKey(publicKey));
}
