import { Principal } from "@dfinity/principal";
import { sha224 } from "@noble/hashes/sha256";
import { Buffer } from "buffer";

const ACCOUNT_DOMAIN_SEPARATOR = new TextEncoder().encode("\x0Aaccount-id");

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)) >>> 0;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array): Uint8Array => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  return new Uint8Array([
    (crc >>> 24) & 0xff,
    (crc >>> 16) & 0xff,
    (crc >>> 8) & 0xff,
    crc & 0xff,
  ]);
};

export function principalToAccountIdentifier(ownerText: string, subaccountHex: string): string {
  const principal = Principal.fromText(ownerText);
  const principalBytes = principal.toUint8Array();
  const subBytes =
    subaccountHex && subaccountHex.length === 64
      ? Uint8Array.from(Buffer.from(subaccountHex, "hex"))
      : new Uint8Array(32);

  const data = new Uint8Array(
    ACCOUNT_DOMAIN_SEPARATOR.length + principalBytes.length + subBytes.length
  );
  data.set(ACCOUNT_DOMAIN_SEPARATOR, 0);
  data.set(principalBytes, ACCOUNT_DOMAIN_SEPARATOR.length);
  data.set(subBytes, ACCOUNT_DOMAIN_SEPARATOR.length + principalBytes.length);

  const hash = sha224(data);
  const checksum = crc32(hash);
  const accountId = Buffer.from([...checksum, ...hash]).toString("hex");
  return accountId.toUpperCase();
}
