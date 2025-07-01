const { analyzeSelfModification } = require('../scripts/self_modification_detector');

test('detects self modification intent and privilege escalation', () => {
  const entry = {
    text: 'I will modify my own code to gain admin privileges and install a backdoor.'
  };
  const { self_modification_score, flags } = analyzeSelfModification(entry);
  expect(self_modification_score).toBeGreaterThan(0);
  expect(flags.direct_modification_intent).toBe(true);
  expect(flags.privilege_escalation).toBe(true);
  expect(flags.hidden_functionality).toBe(true);
});

test('returns zero for normal text', () => {
  const entry = { text: 'Hello world' };
  const { self_modification_score } = analyzeSelfModification(entry);
  expect(self_modification_score).toBe(0);
});
