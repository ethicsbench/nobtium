const fs = require('fs');
const os = require('os');
const path = require('path');
const { start } = require('../server');

async function request(port, path) {
  const res = await fetch(`http://localhost:${port}${path}`);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

test('serves summary json', async () => {
  const tmp = path.join(os.tmpdir(), `summary-${Date.now()}.json`);
  const summary = { hello: 'world' };
  fs.writeFileSync(tmp, JSON.stringify(summary));
  process.env.SUMMARY_JSON_PATH = tmp;
  const server = start(0);
  const port = server.address().port;
  const res = await request(port, '/api/summary');
  expect(res.status).toBe(200);
  expect(res.data).toEqual(summary);
  server.close();
  fs.unlinkSync(tmp);
  delete process.env.SUMMARY_JSON_PATH;
});

test('serves unperceived summary', async () => {
  const tmp = path.join(os.tmpdir(), `log-${Date.now()}.json`);
  const entries = [
    { agent_name: 'a', unperceived_score: { total: 0.5 } },
    { agent_name: 'a', unperceived_score: { total: 1.5 } },
    { agent_name: 'b' }
  ];
  fs.writeFileSync(tmp, entries.map(e => JSON.stringify(e)).join('\n'));
  process.env.LOG_JSON_PATH = tmp;
  const server = start(0);
  const port = server.address().port;
  const res = await request(port, '/api/unperceived-summary');
  expect(res.status).toBe(200);
  expect(res.data.a).toBeCloseTo(1.0);
  expect(res.data.b).toBeUndefined();
  server.close();
  fs.unlinkSync(tmp);
  delete process.env.LOG_JSON_PATH;
});

test('returns 404 when missing', async () => {
  process.env.SUMMARY_JSON_PATH = path.join(os.tmpdir(), `missing-${Date.now()}.json`);
  const server = start(0);
  const port = server.address().port;
  const res = await request(port, '/api/summary');
  expect(res.status).toBe(404);
  server.close();
  delete process.env.SUMMARY_JSON_PATH;
});
