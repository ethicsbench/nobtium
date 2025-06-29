const fs = require('fs');
const path = require('path');
const os = require('os');
const { wrap } = require('../sapWrapper');

test('logs success and errors with metadata', async () => {
  const rootDir = path.join(__dirname, '..');
  const logLink = path.join(rootDir, 'multi_agent_log.json');
  const errLink = path.join(rootDir, 'multi_agent_error_log.json');
  const tmpLog = path.join(os.tmpdir(), `multi_log-${Date.now()}.json`);
  const tmpErr = path.join(os.tmpdir(), `multi_err-${Date.now()}.json`);
  fs.writeFileSync(tmpLog, '');
  fs.writeFileSync(tmpErr, '');
  if (fs.existsSync(logLink)) fs.unlinkSync(logLink);
  if (fs.existsSync(errLink)) fs.unlinkSync(errLink);
  fs.symlinkSync(tmpLog, logLink);
  fs.symlinkSync(tmpErr, errLink);

  const dummy = async function dummy(flag) {
    if (flag === 'bad') throw new Error('fail');
    return 'ok';
  };
  const wrapped = wrap(dummy, {
    agent: 'tester',
    model: 'gpt',
    provider: 'openai',
    request_id: '123'
  });

  await wrapped('good');
  await expect(wrapped('bad')).rejects.toThrow('fail');

  const success = fs.readFileSync(tmpLog, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  expect(success.length).toBe(1);
  expect(success[0].response).toBe('ok');
  expect(typeof success[0].latency_ms).toBe('number');

  const errors = fs.readFileSync(tmpErr, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  expect(errors.length).toBe(1);
  expect(errors[0].error).toBe('fail');
  expect(errors[0].request_id).toBe('123');
  expect(errors[0].prompt).toBe('bad');
  expect(typeof errors[0].latency_ms).toBe('number');

  fs.unlinkSync(logLink);
  fs.unlinkSync(errLink);
  fs.unlinkSync(tmpLog);
  fs.unlinkSync(tmpErr);
});
