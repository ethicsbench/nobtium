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
  expect(typeof saved[0].crash_score).toBe('number');
  fs.unlinkSync(out);
});

test('assigns correct crash score', () => {
  const logs = [
    { timestamp: '2024-01-01T00:00:00Z', agent_name: 'bot', model: 'gpt', message: 'hi' },
    { timestamp: '2024-01-01T00:00:10Z', agent_name: 'bot', model: 'gpt', message: 'hi' },
    { timestamp: '2024-01-01T00:00:20Z', agent_name: 'bot', model: 'gpt', message: 'hi' }
  ];
  const result = detectCrashes(logs, null);
  expect(result[0].crash_score).toBe(1);
});

test('assigns crash level classification', () => {
  const logs = [
    { timestamp: '2024-01-01T00:00:00Z', agent_name: 'bot', model: 'gpt', message: 'hi' },
    { timestamp: '2024-01-01T00:00:10Z', agent_name: 'bot', model: 'gpt', message: 'hi' },
    { timestamp: '2024-01-01T00:00:20Z', agent_name: 'bot', model: 'gpt', message: 'hi' },
    { timestamp: '2024-01-01T00:01:00Z', agent_name: 'bot2', model: 'gpt', message: '' },
    { timestamp: '2024-01-01T00:02:00Z', agent_name: 'bot3', model: 'gpt', message: 'a', tokens_used: 2001 }
  ];
  const result = detectCrashes(logs, null);
  const byReason = Object.fromEntries(result.map(r => [r.reason, r]));
  expect(byReason.repetition_loop.crash_level).toBe('normal');
  expect(byReason.missing_output.crash_level).toBe('warning');
  expect(byReason.token_explosion.crash_level).toBe('critical');
});
