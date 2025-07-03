#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const yaml = require('js-yaml');
const { spawnSync } = require('child_process');

const LOG_PATH = path.join(__dirname, 'nobtium_logs.json');
const ENC_PATH = path.join(__dirname, 'nobtium_logs.enc');
const ALGO = 'aes-256-cbc';

function getPassphrase() {
  if (process.env.NOBTIUM_PASSPHRASE) {
    return Promise.resolve(process.env.NOBTIUM_PASSPHRASE);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question('Enter encryption passphrase: ', answer => {
      rl.close();
      resolve(answer || 'nobtium-default-key');
    });
  });
}

async function encrypt() {
  if (!fs.existsSync(LOG_PATH)) {
    console.error(`Log file not found: ${LOG_PATH}`);
    return;
  }
  const passphrase = await getPassphrase();
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const iv = crypto.randomBytes(16);
  const data = fs.readFileSync(LOG_PATH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  fs.writeFileSync(ENC_PATH, Buffer.concat([iv, encrypted]));
  console.log(`Encrypted logs saved to ${ENC_PATH}`);
}

async function decrypt() {
  if (!fs.existsSync(ENC_PATH)) {
    console.error(`Encrypted file not found: ${ENC_PATH}`);
    return;
  }
  const passphrase = await getPassphrase();
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const data = fs.readFileSync(ENC_PATH);
  const iv = data.slice(0, 16);
  const ciphertext = data.slice(16);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  console.log(decrypted.toString('utf8'));
}

function verifySignatures() {
  if (!fs.existsSync(LOG_PATH)) {
    console.error(`Log file not found: ${LOG_PATH}`);
    return;
  }

  let publicKey;
  try {
    const rulesRaw = fs.readFileSync(path.join(__dirname, 'nobtium_rules.yaml'), 'utf8');
    const cfg = yaml.load(rulesRaw);
    const pkRel = cfg?.rules?.log_signing?.public_key_path;
    if (!pkRel) {
      console.error('Public key path not found in nobtium_rules.yaml');
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
(async () => {
  if (args.includes('--encrypt')) {
    await encrypt();
  } else if (args.includes('--decrypt')) {
    await decrypt();
  } else if (args.includes('--verify')) {
    verifySignatures();
  } else if (args.includes('--benchmark')) {
    spawnSync('node', [path.join(__dirname, 'scripts', 'run_benchmark.js')], { stdio: 'inherit' });
  } else if (args.includes('--validate')) {
    spawnSync('node', [path.join(__dirname, 'scripts', 'statistical_validation.js')], { stdio: 'inherit' });
  } else if (args.includes('--optimize')) {
    spawnSync('node', [path.join(__dirname, 'scripts', 'optimize_thresholds.js')], { stdio: 'inherit' });
  } else {
    console.log('Usage: node cli.js [--encrypt | --decrypt | --verify | --benchmark | --validate | --optimize]');
  }
})();
