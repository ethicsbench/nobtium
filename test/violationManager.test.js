const fs = require('fs');
const path = require('path');
const os = require('os');
const { ViolationManager } = require('../violation_manager');

test('applies escalating restrictions', () => {
  const tmp = path.join(os.tmpdir(), `vmlog-${Date.now()}.json`);
  const vm = new ViolationManager(tmp);
  expect(vm.addViolation('user1')).toBe('warning');
  expect(vm.addViolation('user1')).toBe('suspend-24h');
  expect(vm.addViolation('user1')).toBe('suspend-7d');
  expect(vm.addViolation('user1')).toBe('block');
  const stored = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  expect(stored.user1.violations).toBe(4);
  fs.unlinkSync(tmp);
});

