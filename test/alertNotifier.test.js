const fs = require('fs');
const os = require('os');
const path = require('path');
function getNotifier() {
  jest.resetModules();
  return require('../alertNotifier');
}

function writeTempLog(entries) {
  const tmp = path.join(os.tmpdir(), `log-${Date.now()}.json`);
  fs.writeFileSync(tmp, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
  return tmp;
}

test('logs alert when entry contains latency_alert', async () => {
  const { checkLogsOnce } = getNotifier();
  const entry = { timestamp: '2024-01-01T00:00:00Z', agent_name: 'bot', alert: 'latency_alert', prompt: 'hi' };
  const tmp = writeTempLog([entry]);
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await checkLogsOnce(tmp);
  expect(spy).toHaveBeenCalled();
  const msg = spy.mock.calls[0][0];
  expect(msg).toContain('latency_alert');
  spy.mockRestore();
  fs.unlinkSync(tmp);
});

test('uses Slack webhook when configured', async () => {
  const { checkLogsOnce } = getNotifier();
  const entry = { timestamp: '2024-01-01T00:00:00Z', agent_name: 'bot', alert: 'cost_alert' };
  const tmp = writeTempLog([entry]);
  process.env.SLACK_WEBHOOK_URL = 'http://example.com/webhook';
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  await checkLogsOnce(tmp);
  expect(fetch).toHaveBeenCalled();
  delete process.env.SLACK_WEBHOOK_URL;
  global.fetch.mockRestore();
  fs.unlinkSync(tmp);
});

test('debounces repeated alerts for 60 seconds', async () => {
  const { handleEntry } = getNotifier();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1);
  const entry = { agent_name: 'bot', alert: 'cost_alert' };
  await handleEntry(entry);
  expect(spy).toHaveBeenCalledTimes(1);
  nowSpy.mockReturnValue(1001);
  await handleEntry(entry);
  expect(spy).toHaveBeenCalledTimes(1);
  nowSpy.mockReturnValue(61002);
  await handleEntry(entry);
  expect(spy).toHaveBeenCalledTimes(2);
  spy.mockRestore();
  nowSpy.mockRestore();
});
