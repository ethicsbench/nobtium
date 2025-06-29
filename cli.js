#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOG_PATH = path.join(__dirname, 'sap_logs.json');
const ENC_PATH = path.join(__dirname, 'sap_logs.enc');
const PASSPHRASE = 'sap-tracker-secret';
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

const args = process.argv.slice(2);
if (args.includes('--encrypt')) {
  encrypt();
} else if (args.includes('--decrypt')) {
  decrypt();
} else {
  console.log('Usage: node cli.js [--encrypt | --decrypt]');
}
