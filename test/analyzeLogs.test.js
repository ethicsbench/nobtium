const fs = require('fs');
const path = require('path');
const os = require('os');
const { analyzeLogs } = require('../analyzeLogs');

test('records audit trail entry', () => {
  const logFile = path.join(os.tmpdir(), `log-${Date.now()}.json`);
  fs.writeFileSync(logFile, '[]');
  const auditFile = path.join(os.tmpdir(), `audit-${Date.now()}.json`);
  analyzeLogs(logFile, { mode: 'summary', auditPath: auditFile });
  const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n');
  expect(lines.length).toBe(1);
  const entry = JSON.parse(lines[0]);
  expect(entry.mode).toBe('summary');
  expect(entry.logPath).toBe(logFile);
  fs.unlinkSync(logFile);
  fs.unlinkSync(auditFile);
});
