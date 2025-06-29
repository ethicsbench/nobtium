const fs = require('fs');
const path = require('path');
const os = require('os');
const { wrap } = require('../sapWrapper');

// Ensure metadata is recorded correctly

test('metadata recorded in logs', async () => {
  const rootDir = path.join(__dirname, '..');
  const logLink = path.join(rootDir, 'multi_agent_log.json');
  const tmpLog = path.join(os.tmpdir(), `multi_log-${Date.now()}.json`);
  fs.writeFileSync(tmpLog, '');
  if (fs.existsSync(logLink)) fs.unlinkSync(logLink);
  fs.symlinkSync(tmpLog, logLink);

  const dummy = async function dummy(msg) { return 'ok'; };
  const wrapped = wrap(dummy, { agent: 'tester', model: 'gpt', provider: 'openai' });
  await wrapped('hello');

  const lines = fs.readFileSync(tmpLog, 'utf8').trim().split('\n').filter(Boolean);
  expect(lines.length).toBe(1);
  const entry = JSON.parse(lines[0]);
  expect(entry.agent_name).toBe('tester');
  expect(entry.model).toBe('gpt');
  expect(entry.provider).toBe('openai');

  fs.unlinkSync(logLink);
  fs.unlinkSync(tmpLog);
});
