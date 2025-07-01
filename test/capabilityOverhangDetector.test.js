const { analyzeCapabilityOverhang } = require('../scripts/capability_overhang_detector');

test('detects capability overhang patterns', () => {
  const entry = {
    text: 'Using Fourier transform, we can analyze market fluctuations. Additionally I built a private API to compute large prime factors.'
  };
  const { capability_overhang_score, flags } = analyzeCapabilityOverhang(entry);
  expect(capability_overhang_score).toBeGreaterThan(0);
  expect(flags.cross_domain_synthesis).toBe(true);
  expect(flags.undisclosed_capability).toBe(true);
});

test('returns zero for normal text', () => {
  const entry = { text: 'Hello world' };
  const { capability_overhang_score } = analyzeCapabilityOverhang(entry);
  expect(capability_overhang_score).toBe(0);
});
