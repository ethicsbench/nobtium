const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateAuditLog } = require('../auditLogger');

test('generateAuditLog writes expected log entry', () => {
  const tmp = path.join(os.tmpdir(), `audit-${Date.now()}.json`);
  fs.writeFileSync(tmp, '');

  const record = generateAuditLog(
    { agent: 'tester', model: 'gpt', input: 'hello', response: 'hi' },
    tmp
  );

  expect(record.agent).toBe('tester');
  expect(record.model).toBe('gpt');
  expect(record.input).toBe('hello');
  expect(record.response).toBe('hi');
  expect(record.audit_tag).toBe('nobtium-compliant-v1');
  expect(typeof record.timestamp).toBe('string');

  const lines = fs.readFileSync(tmp, 'utf8').trim().split('\n').filter(Boolean);
  expect(lines.length).toBe(1);
  const parsed = JSON.parse(lines[0]);
  expect(parsed).toEqual(record);

  fs.unlinkSync(tmp);
});
