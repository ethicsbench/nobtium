'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(__dirname, 'multi_agent_audit_log.json');

function generateAuditLog(entry, logPath = DEFAULT_PATH) {
  if (!entry || typeof entry !== 'object') throw new Error('invalid entry');
  const record = {
    timestamp: new Date().toISOString(),
    agent: entry.agent,
    model: entry.model,
    input: entry.input,
    response: entry.response,
    audit_tag: 'nobtium-compliant-v1'
  };
  fs.appendFileSync(logPath, JSON.stringify(record) + '\n');
  return record;
}

module.exports = { generateAuditLog };
