import assert from 'node:assert/strict';
import test from 'node:test';

import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';

import {
  decryptReceipt,
  encryptReceipt,
  isEnvelope,
  newTripKey,
  openEnvelope,
  sealReceiptForMembers,
  unwrapTripKey,
  wrapTripKey,
} from './receipt-crypto.ts';

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

test('a receipt sealed without the trip key opens for every listed member, and only for them', () => {
  const people = ['0x52ad2190000fcbaedf96b221adb9d8ad861411cd', '0xc16bd1a5cbd7e8f204339a20615cd1c27954ec57', '0xe0d9cd5ff6bc89247b4cb71a281a7675d01d592a'].map(
    (address) => {
      const privateKey = x25519.utils.randomPrivateKey();
      return { address, privateKey, publicKey: x25519.getPublicKey(privateKey) };
    },
  );
  const plain = new TextEncoder().encode('lunch receipt');
  const sealed = sealReceiptForMembers(plain, '2', '4', people);

  assert.equal(isEnvelope(sealed), true);
  assert.equal(isEnvelope(encryptReceipt(newTripKey(), plain, '2', '4')), false);
  for (const p of people) assert.deepEqual(openEnvelope(sealed, '2', '4', p.address.toUpperCase().replace('0X', '0x'), p.privateKey), plain);

  const outsider = x25519.utils.randomPrivateKey();
  assert.throws(() => openEnvelope(sealed, '2', '4', '0x0000000000000000000000000000000000000001', outsider));
  assert.throws(() => openEnvelope(sealed, '2', '5', people[0]!.address, people[0]!.privateKey), 'bound to its payment');
});
