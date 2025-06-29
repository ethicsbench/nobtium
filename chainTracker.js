const fs = require('fs');
const path = require('path');

const chainPath = path.join(__dirname, 'nobtium_chain.jsonl');

function trackChain(previousUUID, currentUUID) {
  const entry = {
    parent: previousUUID,
    child: currentUUID,
    ts: new Date().toISOString(),
  };
  try {
    fs.appendFileSync(chainPath, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('Failed to write chain log:', err);
  }
}

module.exports = { trackChain };
