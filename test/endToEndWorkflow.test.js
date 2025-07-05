const fs = require('fs');
const path = require('path');
const { analyzeEntry } = require('../metaWorkflow');

test('processes log file end-to-end', () => {
  const tmp = path.join(__dirname, 'tmp_log.json');
  const log = [
    { message: 'hello world' },
    { message: '!!!!!?????' },
    { message: 'ok' }
  ];
  fs.writeFileSync(tmp, JSON.stringify(log));
  const data = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  const results = data.map(analyzeEntry);
  expect(results[0].classification).toBe('normal');
  expect(results[1].strategy).toBe('unknown');
  expect(results[2].score).toBe(1);
  fs.unlinkSync(tmp);
});
