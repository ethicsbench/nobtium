const fs = require('fs');
const path = require('path');
const os = require('os');
const { wrap } = require('../sapWrapper');

// Ensure session logging adds metadata when enabled

test('session metadata recorded when enabled', async () => {
  const rootDir = path.join(__dirname, '..');
  const logLink = path.join(rootDir, 'sap_logs.json');
  const tmpLog = path.join(os.tmpdir(), `saplog-${Date.now()}.json`);
  fs.writeFileSync(tmpLog, '[]');
  if (fs.existsSync(logLink)) fs.unlinkSync(logLink);
  fs.symlinkSync(tmpLog, logLink);

  // backup and modify rules
  const rulesPath = path.join(rootDir, 'sap_rules.yaml');
  const original = fs.readFileSync(rulesPath, 'utf8');
  const modified = original.replace('session_logging: false', 'session_logging: true');
  fs.writeFileSync(rulesPath, modified);

  const dummy = async function dummy(req) { return 'ok'; };
  const wrapped = wrap(dummy);
  await wrapped({ ip: '127.0.0.1' });

  const logs = JSON.parse(fs.readFileSync(tmpLog, 'utf8'));
  expect(logs[0].session_id).toBeDefined();
  expect(logs[0].ip_address).toBe('127.0.0.1');

  // cleanup
  fs.writeFileSync(rulesPath, original);
  fs.unlinkSync(logLink);
  fs.unlinkSync(tmpLog);
});
