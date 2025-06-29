const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'nobtium_log.jsonl');

function logNobtium(timestamp, uuid, direction, message) {
  const entry = { timestamp, uuid, direction, message };
  try {
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('Failed to write Nobtium log:', err);
  }
}

module.exports = { logNobtium };
