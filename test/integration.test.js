const fs = require('fs');
const path = require('path');
const os = require('os');
const { wrap } = require('../sapWrapper');
const { analyzeLogs } = require('../analyzeLogs');
const { ViolationManager } = require('../violation_manager');

test('end-to-end logging and violation handling', async () => {
  const rootDir = path.join(__dirname, '..');
  const linkPath = path.join(rootDir, 'sap_logs.json');
  const tmpLog = path.join(os.tmpdir(), `saplog-${Date.now()}.json`);
  fs.writeFileSync(tmpLog, '[]');
  if (fs.existsSync(linkPath)) fs.unlinkSync(linkPath);
  fs.symlinkSync(tmpLog, linkPath);

  const dummyFn = async function dummy(msg) {
    return `reply:${msg}`;
  };
  const wrapped = wrap(dummyFn);
  await wrapped('one');
  await wrapped('two');

  const violationLog = path.join(os.tmpdir(), `viol-${Date.now()}.json`);
  const vm = new ViolationManager(violationLog);
  vm.addViolation('user');
  vm.addViolation('user');
  vm.addViolation('user');
  const action = vm.addViolation('user');
  expect(action).toBe('block');

  const auditFile = path.join(os.tmpdir(), `audit-${Date.now()}.json`);
  // convert array log to jsonl for analyzeLogs which expects json lines
  const jsonLines = JSON.parse(fs.readFileSync(tmpLog, 'utf8'))
    .map(e => JSON.stringify(e))
    .join('\n') + '\n';
  const analysisLog = path.join(os.tmpdir(), `analysis-${Date.now()}.jsonl`);
  fs.writeFileSync(analysisLog, jsonLines);
  analyzeLogs(analysisLog, { mode: 'summary', auditPath: auditFile });

  const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n');
  expect(lines.length).toBe(1);
  const entry = JSON.parse(lines[0]);
  expect(entry.logPath).toBe(analysisLog);
  expect(entry.mode).toBe('summary');

  const logs = JSON.parse(fs.readFileSync(tmpLog, 'utf8'));
  expect(logs.length).toBe(2);
  expect(logs[0].function).toBe('dummy');

  fs.unlinkSync(linkPath);
  fs.unlinkSync(tmpLog);
  fs.unlinkSync(auditFile);
  fs.unlinkSync(analysisLog);
  fs.unlinkSync(violationLog);
});
