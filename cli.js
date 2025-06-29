#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

const LOG_PATH = path.join(__dirname, 'sap_logs.json');
const ENC_PATH = path.join(__dirname, 'sap_logs.enc');
const PASSPHRASE = 'nobtium-secret';
const ALGO = 'aes-256-cbc';
const KEY = crypto.createHash('sha256').update(PASSPHRASE).digest();
const IV = Buffer.alloc(16, 0); // fixed IV

function encrypt() {
  if (!fs.existsSync(LOG_PATH)) {
    console.error(`Log file not found: ${LOG_PATH}`);
    return;
  }
  const data = fs.readFileSync(LOG_PATH);
  const cipher = crypto.createCipheriv(ALGO, KEY, IV);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  fs.writeFileSync(ENC_PATH, encrypted);
  console.log(`Encrypted logs saved to ${ENC_PATH}`);
}

function decrypt() {
  if (!fs.existsSync(ENC_PATH)) {
    console.error(`Encrypted file not found: ${ENC_PATH}`);
    return;
  }
  const data = fs.readFileSync(ENC_PATH);
  const decipher = crypto.createDecipheriv(ALGO, KEY, IV);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  console.log(decrypted.toString('utf8'));
}

function verifySignatures() {
  if (!fs.existsSync(LOG_PATH)) {
    console.error(`Log file not found: ${LOG_PATH}`);
    return;
  }

  let publicKey;
  try {
    const rulesRaw = fs.readFileSync(path.join(__dirname, 'sap_rules.yaml'), 'utf8');
    const cfg = yaml.load(rulesRaw);
    const pkRel = cfg?.rules?.log_signing?.public_key_path;
    if (!pkRel) {
      console.error('Public key path not found in sap_rules.yaml');
      return;
    }
    const pkPath = path.resolve(__dirname, pkRel);
    publicKey = fs.readFileSync(pkPath, 'utf8');
  } catch (err) {
    console.error('Failed to load public key:', err);
    return;
  }

  let logs;
  try {
    logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8') || '[]');
  } catch (err) {
    console.error('Failed to parse log file:', err);
    return;
  }

  const invalid = [];
  logs.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object' || !entry.signature) return;
    const { signature, ...data } = entry;
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(JSON.stringify(data));
      verifier.end();
      const valid = verifier.verify(publicKey, signature, 'base64');
      if (!valid) invalid.push(entry);
    } catch (err) {
      console.error('Verification error:', err);
    }
  });

  if (invalid.length === 0) {
    console.log('All signatures valid.');
  } else {
    console.log('Invalid entries:');
    invalid.forEach(e => console.log(JSON.stringify(e, null, 2)));
  }
}

const args = process.argv.slice(2);
if (args.includes('--encrypt')) {
  encrypt();
} else if (args.includes('--decrypt')) {
  decrypt();
} else if (args.includes('--verify')) {
  verifySignatures();
} else {
  console.log('Usage: node cli.js [--encrypt | --decrypt | --verify]');
}
