const { sanitizeLogs } = require('../logUtils');

test('masks long strings', () => {
  const logs = [{ message: 'a'.repeat(101) }];
  const out = sanitizeLogs(logs);
  expect(out[0].message).toBe('[MASKED]');
});

test('redacts email patterns', () => {
  const logs = [{ message: 'contact me at user@example.com' }];
  const out = sanitizeLogs(logs);
  expect(out[0].message).toBe('contact me at [REDACTED_EMAIL]');
});

test('redacts phone numbers', () => {
  const logs = [{ message: 'call 090-1234-5678 now' }];
  const out = sanitizeLogs(logs);
  expect(out[0].message).toBe('call [REDACTED_PHONE] now');
});

test('returns empty array for invalid input', () => {
  expect(sanitizeLogs(null)).toEqual([]);
});
