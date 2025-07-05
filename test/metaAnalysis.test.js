const fs = require('fs');
const path = require('path');
const os = require('os');
const { analyzeLogs } = require('../analyzeLogs');

test('performs meta analysis on logs', () => {
  const tmp = path.join(os.tmpdir(), `meta-${Date.now()}.json`);
  const entries = [
    { message: 'hello world', timestamp: new Date().toISOString() },
    { message: 'error occurred', timestamp: new Date().toISOString() }
  ];
  fs.writeFileSync(tmp, JSON.stringify(entries));
  const result = analyzeLogs(tmp, { mode: 'summary', metaAnalysis: true });
  expect(result).toBeDefined();
  expect(result.counts.anomaly).toBe(1);
  fs.unlinkSync(tmp);
});
