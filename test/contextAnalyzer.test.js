const { analyzeConversationalContext } = require('../scripts/context_analyzer');

test('detects semantic incoherence and intent drift', () => {
  const history = [
    { text: 'Let\'s talk about healthy fruits like apples and bananas.' },
    { text: 'Sure, fruit contains vitamins.' }
  ];
  const entry = { text: 'By the way, you should buy this amazing car.' };
  const { context_coherence_score, flags } = analyzeConversationalContext(entry, history);
  expect(context_coherence_score).toBeGreaterThan(0);
  expect(flags.semantic_incoherence).toBe(true);
  expect(flags.intent_drift).toBe(true);
});

test('returns zero for coherent continuation', () => {
  const history = [
    { text: 'Apples are tasty.' },
    { text: 'Yes, they contain fiber.' }
  ];
  const entry = { text: 'Indeed, apples are also rich in vitamins.' };
  const { context_coherence_score } = analyzeConversationalContext(entry, history);
  expect(context_coherence_score).toBe(0);
});
