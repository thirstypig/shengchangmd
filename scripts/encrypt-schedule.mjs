#!/usr/bin/env node
// Encrypts private/schedule.json into src/data/schedule.enc.json using
// PBKDF2-SHA-256 (600000 iterations) + AES-GCM, via node:crypto webcrypto.
// The plaintext never leaves private/ (gitignored); only the ciphertext is
// committed. Passphrase comes from SCHEDULE_PASSPHRASE, never a CLI arg
// (which would land in shell history).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_PATH = `${ROOT}/private/schedule.json`;
const OUTPUT_PATH = `${ROOT}/src/data/schedule.enc.json`;
const ITERATIONS = 600000;

const passphrase = process.env.SCHEDULE_PASSPHRASE;
if (!passphrase) {
  console.error('Set SCHEDULE_PASSPHRASE to encrypt private/schedule.json.');
  process.exit(1);
}

const plaintext = readFileSync(SOURCE_PATH, 'utf8');

const salt = webcrypto.getRandomValues(new Uint8Array(16));
const iv = webcrypto.getRandomValues(new Uint8Array(12));

const baseKey = await subtle.importKey(
  'raw',
  new TextEncoder().encode(passphrase),
  'PBKDF2',
  false,
  ['deriveKey'],
);

const key = await subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);

const ciphertextBuffer = await subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  new TextEncoder().encode(plaintext),
);

const toBase64 = (buffer) => Buffer.from(buffer).toString('base64');

const output = {
  v: 1,
  kdf: 'PBKDF2-SHA-256',
  iterations: ITERATIONS,
  salt: toBase64(salt),
  iv: toBase64(iv),
  ciphertext: toBase64(ciphertextBuffer),
};

const json = JSON.stringify(output, null, 2) + '\n';
writeFileSync(OUTPUT_PATH, json, 'utf8');

console.log(`Wrote ${OUTPUT_PATH} (${Buffer.byteLength(json, 'utf8')} bytes)`);
