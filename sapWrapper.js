'use strict';
const fs = require('fs');
const path = require('path');
const { sanitizeLogs } = require('./logUtils');

const LOG_PATH = path.join(__dirname, 'sap_logs.json');

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
