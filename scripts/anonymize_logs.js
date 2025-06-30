'use strict';
const fs = require('fs');
const path = require('path');

function anonymizeLogs(
  inPath = path.join(__dirname, '..', 'logs', 'multi_agent_log.json'),
  outPath = path.join(__dirname, '..', 'logs', 'anonymized_log.json')
) {
  if (!fs.existsSync(inPath)) {
    console.error(`Input file not found: ${inPath}`);
    return;
  }
  const raw = fs.readFileSync(inPath, 'utf8');
  let entries;
  try {
    entries = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse log file:', err.message);
    return;
  }
  if (!Array.isArray(entries)) entries = [entries];

  const agentMap = new Map();
  const modelMap = new Map();
  let agentCounter = 0;
  let modelCounter = 0;

  const anonymized = entries.map(entry => {
    const out = { ...entry };
    if (out.agent_name) {
      if (!agentMap.has(out.agent_name)) {
        agentCounter += 1;
        const label = `Agent_${String(agentCounter).padStart(3, '0')}`;
        agentMap.set(out.agent_name, label);
      }
      out.agent_name = agentMap.get(out.agent_name);
    }
    if (out.model) {
      if (!modelMap.has(out.model)) {
        const label = `Model_${String.fromCharCode('A'.charCodeAt(0) + modelCounter)}`;
        modelMap.set(out.model, label);
        modelCounter += 1;
      }
      out.model = modelMap.get(out.model);
    }
    if ('content' in out) {
      out.content = '[REDACTED]';
    }
    return out;
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(anonymized, null, 2));
  console.log(`Anonymized log written to ${outPath}`);
}

if (require.main === module) {
  anonymizeLogs();
}

module.exports = { anonymizeLogs };
