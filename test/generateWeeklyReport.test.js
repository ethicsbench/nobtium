const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateWeeklyReport } = require('../generateWeeklyReport');

test('creates weekly report from logs', () => {
  const logFile = path.join(os.tmpdir(), `log-${Date.now()}.json`);
  const errFile = path.join(os.tmpdir(), `err-${Date.now()}.json`);
  const outFile = path.join(os.tmpdir(), `out-${Date.now()}.md`);

  const ts = new Date().toISOString();
  const logs = [
    { timestamp: ts, model: 'GPT-4', tokens_used: 1000, agent_name: 'a', latency_ms: 100 },
    { timestamp: ts, model: 'GPT-4', tokens_used: 500, agent_name: 'a', latency_ms: 200 }
  ];
  fs.writeFileSync(logFile, logs.map(e => JSON.stringify(e)).join('\n'));

  const errors = [ { timestamp: ts, error: 'fail' } ];
  fs.writeFileSync(errFile, errors.map(e => JSON.stringify(e)).join('\n'));

  generateWeeklyReport(logFile, errFile, outFile);

  const md = fs.readFileSync(outFile, 'utf8');
  expect(md).toContain('Total API calls');
  expect(md).toContain('GPT-4');
  fs.unlinkSync(logFile);
  fs.unlinkSync(errFile);
  fs.unlinkSync(outFile);
});

test('writes summary.json and sends Slack when anomalies exist', () => {
  const logFile = path.join(os.tmpdir(), `log-${Date.now()}.json`);
  const errFile = path.join(os.tmpdir(), `err-${Date.now()}.json`);
  const outFile = path.join(os.tmpdir(), `out-${Date.now()}.md`);

  const ts = new Date().toISOString();
  const logs = [
    { timestamp: ts, model: 'GPT-4', tokens_used: 4000, agent_name: 'b', latency_ms: 5000 }
  ];
  fs.writeFileSync(logFile, logs.map(e => JSON.stringify(e)).join('\n'));
  fs.writeFileSync(errFile, '');

  process.env.SLACK_WEBHOOK_URL = 'http://example.com/hook';
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

  generateWeeklyReport(logFile, errFile, outFile);

  const summaryPath = path.join(path.dirname(outFile), 'summary.json');
  const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  expect(data.anomalyCount).toBeGreaterThan(0);
  expect(fetch).toHaveBeenCalled();

  delete process.env.SLACK_WEBHOOK_URL;
  global.fetch.mockRestore();
  fs.unlinkSync(logFile);
  fs.unlinkSync(errFile);
  fs.unlinkSync(outFile);
  fs.unlinkSync(summaryPath);
});
