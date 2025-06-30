const { detectAudioSyncPattern } = require('../audioSyncDetector');

test('returns high score for synchronized buffers', () => {
  const len = 1024;
  const buf1 = Buffer.alloc(len * 2);
  const buf2 = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    const sample = Math.round(Math.sin((i / len) * 2 * Math.PI) * 10000);
    buf1.writeInt16LE(sample, i * 2);
    buf2.writeInt16LE(sample, i * 2);
  }
  const score = detectAudioSyncPattern([buf1, buf2]);
  expect(score).toBeGreaterThan(0.9);
});

test('returns low score for unrelated buffers', () => {
  const len = 1024;
  const buf1 = Buffer.alloc(len * 2);
  const buf2 = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    buf1.writeInt16LE(Math.round(Math.random() * 20000 - 10000), i * 2);
    buf2.writeInt16LE(Math.round(Math.random() * 20000 - 10000), i * 2);
  }
  const score = detectAudioSyncPattern([buf1, buf2]);
  expect(score).toBeLessThan(0.6);
});
