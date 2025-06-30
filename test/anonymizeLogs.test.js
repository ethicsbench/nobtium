const fs = require('fs');
const os = require('os');
const path = require('path');
const { anonymizeLogs } = require('../scripts/anonymize_logs');

test('anonymizes agent names, models and content', () => {
  const input = path.join(os.tmpdir(), `in-${Date.now()}.json`);
  const output = path.join(os.tmpdir(), `out-${Date.now()}.json`);
  const logs = [
    { agent_name: 'alice', model: 'gpt-4', content: 'hello' },
    { agent_name: 'bob', model: 'gpt-3', content: 'hi' },
    { agent_name: 'alice', model: 'gpt-4', content: 'bye' }
  ];
  fs.writeFileSync(input, JSON.stringify(logs));

  anonymizeLogs(input, output);

  const data = JSON.parse(fs.readFileSync(output, 'utf8'));
  expect(data[0].agent_name).toBe('Agent_001');
  expect(data[1].agent_name).toBe('Agent_002');
  expect(data[2].agent_name).toBe('Agent_001');
  expect(data[0].model).toBe('Model_A');
  expect(data[1].model).toBe('Model_B');
  expect(data[2].model).toBe('Model_A');
  data.forEach(entry => {
    expect(entry.content).toBe('[REDACTED]');
  });
  fs.unlinkSync(input);
  fs.unlinkSync(output);
});
