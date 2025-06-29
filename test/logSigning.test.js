const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const yaml = require('js-yaml');
const { wrap, verifySignatures } = require('../sapWrapper');

test('log entries are signed and verifiable when enabled', async () => {
  const rootDir = path.join(__dirname, '..');
  const logLink = path.join(rootDir, 'sap_logs.json');
  const tmpLog = path.join(os.tmpdir(), `saplog-${Date.now()}.json`);
  fs.writeFileSync(tmpLog, '[]');
  if (fs.existsSync(logLink)) fs.unlinkSync(logLink);
  fs.symlinkSync(tmpLog, logLink);

  const rulesPath = path.join(rootDir, 'sap_rules.yaml');
  const original = fs.readFileSync(rulesPath, 'utf8');
  const cfg = yaml.load(original);

  cfg.rules.log_signing.enabled = true;
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const keyPath = path.join(os.tmpdir(), `priv-${Date.now()}.pem`);
  const pubPath = path.join(os.tmpdir(), `pub-${Date.now()}.pem`);
  fs.writeFileSync(keyPath, privateKey.export({ type: 'pkcs1', format: 'pem' }));
  fs.writeFileSync(pubPath, publicKey.export({ type: 'pkcs1', format: 'pem' }));
  cfg.rules.log_signing.private_key_path = keyPath;
  cfg.rules.log_signing.public_key_path = pubPath;
  fs.writeFileSync(rulesPath, yaml.dump(cfg));

  const dummy = async function dummy() { return 'ok'; };
  const wrapped = wrap(dummy);
  await wrapped();
  await wrapped();

  const logs = JSON.parse(fs.readFileSync(tmpLog, 'utf8'));
  expect(logs.length).toBe(2);
  for (const entry of logs) {
    expect(typeof entry.signature).toBe('string');
  }
  expect(verifySignatures()).toBe(true);

  fs.writeFileSync(rulesPath, original);
  fs.unlinkSync(logLink);
  fs.unlinkSync(tmpLog);
  fs.unlinkSync(keyPath);
  fs.unlinkSync(pubPath);
});
