import assert from 'node:assert/strict';
import test from 'node:test';

import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';

import { decryptReceipt, encryptReceipt, newTripKey, unwrapTripKey, wrapTripKey } from './receipt-crypto.ts';

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

test('new receipts round-trip with the tekosue label', () => {
  const key = newTripKey();
  const plain = new TextEncoder().encode('receipt photo');
  const sealed = encryptReceipt(key, plain, '2', '1');
  assert.deepEqual(decryptReceipt(key, sealed, '2', '1'), plain);
  assert.throws(() => decryptReceipt(key, sealed, '2', '9'), 'bound to its payment');
});

test('receipts sealed before the rebrand still open (legacy AAD)', () => {
  const key = newTripKey();
  const plain = new TextEncoder().encode('old receipt');
  const nonce = randomBytes(12);
  const legacyAad = new TextEncoder().encode('tekosoe/receipt/v1/2/1');
  const sealed = new Uint8Array([...nonce, ...gcm(key, nonce, legacyAad).encrypt(plain)]);
  assert.deepEqual(decryptReceipt(key, sealed, '2', '1'), plain);
});

test('trip keys wrapped before the rebrand still unwrap (legacy HKDF info)', () => {
  const recipient = x25519.utils.randomPrivateKey();
  const tripKey = newTripKey();

  const fresh = wrapTripKey(tripKey, x25519.getPublicKey(recipient));
  assert.deepEqual(unwrapTripKey(fresh, recipient), tripKey);

  const ephemeral = x25519.utils.randomPrivateKey();
  const kek = hkdf(sha256, x25519.getSharedSecret(ephemeral, x25519.getPublicKey(recipient)), undefined, 'tekosoe/trip-key-wrap/v1', 32);
  const nonce = randomBytes(12);
  const legacy = b64(new Uint8Array([...x25519.getPublicKey(ephemeral), ...nonce, ...gcm(kek, nonce).encrypt(tripKey)]));
  assert.deepEqual(unwrapTripKey(legacy, recipient), tripKey);
});
