'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const { sanitizeLogs } = require('./logUtils');

const LOG_PATH = path.join(__dirname, 'nobtium_logs.json');
const RULES_PATH = path.join(__dirname, 'nobtium_rules.yaml');

function canonicalStringify(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(v => canonicalStringify(v)).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return (
      '{' +
      keys
        .map(k => {
          return JSON.stringify(k) + ':' + canonicalStringify(value[k]);
        })
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
}

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
      console.error('Failed to read Nobtium logs:', err);
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
      signer.update(canonicalStringify(sanitized));
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
    console.error('Failed to write Nobtium logs:', err);
  }
}

function verifySignatures() {
  const signCfg = getSigningConfig();
  if (!signCfg || !signCfg.public_key_path) {
    console.error('Log signing not properly configured');
    return false;
  }
  let publicKey;
  try {
    const pkPath = path.resolve(__dirname, signCfg.public_key_path);
    publicKey = fs.readFileSync(pkPath, 'utf8');
  } catch (err) {
    console.error('Failed to load public key:', err);
    return false;
  }

  const logs = loadLogs();
  for (const entry of logs) {
    if (!entry || typeof entry !== 'object' || !entry.signature) continue;
    const { signature, ...data } = entry;
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(canonicalStringify(data));
      verifier.end();
      const valid = verifier.verify(publicKey, signature, 'base64');
      if (!valid) return false;
    } catch (err) {
      console.error('Verification error:', err);
      return false;
    }
  }
  return true;
}
function wrapWithErrorLogging(fn, metadata = {}) {
  return async function (...args) {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const latency = Date.now() - start;
      const successEntry = {
        timestamp: new Date().toISOString(),
        agent_name: metadata.agent || 'unknown',
        model: metadata.model,
        provider: metadata.provider,
        request_id: metadata.request_id || null,
        prompt: args[0],
        response: result,
        latency_ms: latency,
      };
      fs.appendFileSync(
        'multi_agent_log.json',
        JSON.stringify(successEntry) + '\n'
      );
      return result;
    } catch (error) {
      const errorEntry = {
        timestamp: new Date().toISOString(),
        agent_name: metadata.agent || 'unknown',
        model: metadata.model,
        provider: metadata.provider,
        request_id: metadata.request_id || null,
        error: error.message,
      };
      fs.appendFileSync(
        'multi_agent_error_log.json',
        JSON.stringify(errorEntry) + '\n'
      );
      throw error;
    }
  };
}

module.exports = {
  wrap: wrapWithErrorLogging,
  wrapWithErrorLogging,
  verifySignatures
};
