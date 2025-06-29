const fs = require('fs');
const path = require('path');
const os = require('os');

const { appendWithHash, validateChain } = require('../tamperGuard');

test('creates valid hash chain', () => {
  const tmp = path.join(os.tmpdir(), `tg-${Date.now()}`);
  appendWithHash({ message: 'one' }, tmp);
  appendWithHash({ message: 'two' }, tmp);
  expect(validateChain(tmp)).toBe(true);
  fs.unlinkSync(tmp);
});

test('detects tampering in chain', () => {
  const tmp = path.join(os.tmpdir(), `tg-${Date.now()}-tamper`);
  appendWithHash({ message: 'start' }, tmp);
  appendWithHash({ message: 'end' }, tmp);
  const lines = fs.readFileSync(tmp, 'utf8').trim().split('\n');
  const second = JSON.parse(lines[1]);
  second.message = 'changed';
  lines[1] = JSON.stringify(second);
  fs.writeFileSync(tmp, lines.join('\n') + '\n');
  expect(validateChain(tmp)).toBe(false);
  fs.unlinkSync(tmp);
});
