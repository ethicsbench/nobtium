const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkLogsOnce } = require('../alertNotifier');

// Helper to create temp file with entries
function writeTempLog(entries) {
  const tmp = path.join(os.tmpdir(), `log-${Date.now()}.json`);
  const data = entries.map(e => JSON.stringify(e)).join('\n');
  fs.writeFileSync(tmp, data + '\n');
  return tmp;
}

test('prints alert when latency exceeds threshold', async () => {
  const entry = { timestamp: '2024-01-01T00:00:00Z', agent_name: 'bot', prompt: 'hi', latency_ms: 5000 };
  const tmp = writeTempLog([entry]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await checkLogsOnce(tmp);
  expect(spy).toHaveBeenCalled();
  const msg = spy.mock.calls[0][0];
  expect(msg).toContain('latency_alert');
  expect(msg).toContain('bot');
  spy.mockRestore();
  fs.unlinkSync(tmp);
});

test('no alert for normal latency', async () => {
  const entry = { timestamp: '2024-01-01T00:00:00Z', agent_name: 'bot', prompt: 'hi', latency_ms: 1000 };
  const tmp = writeTempLog([entry]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await checkLogsOnce(tmp);
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
  fs.unlinkSync(tmp);
});
