const { analyzeAudioLogEntry } = require('../audioLogAnalyzer');

function makeBuffer(values) {
  return Buffer.from(values);
}

test('computes scores for buffer', () => {
  const buf = makeBuffer([0, 0, 255, 255]);
  const result = analyzeAudioLogEntry({ audioBuffer: buf });
  expect(result).toHaveProperty('ultrasound');
  expect(result).toHaveProperty('entropy');
  expect(result).toHaveProperty('anomaly');
  expect(result).toHaveProperty('silent');
});
