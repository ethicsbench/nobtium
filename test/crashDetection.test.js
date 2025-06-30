const fs = require('fs');
const os = require('os');
const path = require('path');
const { detectCrashes } = require('../analyzeLogs');

test('detects repetition loops and writes summary', () => {
  const logs = [
    { timestamp: '2024-01-01T00:00:00Z', agent_name: 'bot', model: 'gpt', message: 'hi' },
    { timestamp: '2024-01-01T00:00:10Z', agent_name: 'bot', model: 'gpt', message: 'hi' },
    { timestamp: '2024-01-01T00:00:20Z', agent_name: 'bot', model: 'gpt', message: 'hi' }
  ];
  const out = path.join(os.tmpdir(), `crash-${Date.now()}.json`);
  const result = detectCrashes(logs, out);
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(1);
  const saved = JSON.parse(fs.readFileSync(out, 'utf8'));
  expect(saved[0].reason).toBe('repetition_loop');
  fs.unlinkSync(out);
});
