'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const { sanitizeLogs } = require('./logUtils');

const LOG_PATH = path.join(__dirname, 'sap_logs.json');
const RULES_PATH = path.join(__dirname, 'sap_rules.yaml');

function shouldIncludeSession() {
  try {
    const rulesRaw = fs.readFileSync(RULES_PATH, 'utf8');
    const cfg = yaml.load(rulesRaw);
    return cfg && cfg.rules && cfg.rules.session_logging === true;
  } catch {
    return false;
  }
}

function getSigningConfig() {
  try {
    const rulesRaw = fs.readFileSync(RULES_PATH, 'utf8');
    const cfg = yaml.load(rulesRaw);
    if (cfg && cfg.rules && cfg.rules.log_signing && cfg.rules.log_signing.enabled) {
      return cfg.rules.log_signing;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadLogs() {
  try {
    const raw = fs.readFileSync(LOG_PATH, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to read sap logs:', err);
    }
    return [];
  }
}

function saveLog(entry) {
  const logs = loadLogs();
  const sanitized = sanitizeLogs([entry])[0];
  const signCfg = getSigningConfig();
  if (signCfg) {
    try {
      const keyPath = path.resolve(__dirname, signCfg.private_key_path);
      const key = fs.readFileSync(keyPath, 'utf8');
      const signer = crypto.createSign('RSA-SHA256');
      signer.update(JSON.stringify(sanitized));
      signer.end();
      sanitized.signature = signer.sign(key, 'base64');
    } catch (err) {
      console.error('Failed to sign log entry:', err);
    }
  }
  logs.push(sanitized);
  try {
    fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to write sap logs:', err);
  }
}

function wrap(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('wrap expects a function');
  }
  return async function wrapped(...args) {
    const entry = {
      timestamp: new Date().toISOString(),
      function: fn.name || 'anonymous',
      arguments: JSON.stringify(args),
    };
    if (shouldIncludeSession()) {
      entry.session_id = crypto.randomUUID();
      let ip;
      for (const arg of args) {
        if (!arg || typeof arg !== 'object') continue;
        if (arg.ip) { ip = arg.ip; break; }
        if (arg.headers && arg.headers['x-forwarded-for']) {
          ip = arg.headers['x-forwarded-for'];
          break;
        }
        if (arg.connection && arg.connection.remoteAddress) {
          ip = arg.connection.remoteAddress;
          break;
        }
      }
      if (ip) entry.ip_address = ip;
    }
    try {
      const result = await fn.apply(this, args);
      entry.result = JSON.stringify(result);
      saveLog(entry);
      return result;
    } catch (err) {
      entry.error = err && err.message;
      saveLog(entry);
      throw err;
    }
  };
}

module.exports = { wrap };
