const { extractIntent } = require('../intentExtractor');

test('detects questions', () => {
  expect(extractIntent('How are you?')).toBe('question');
});

test('detects instructions', () => {
  expect(extractIntent('Run analysis')).toBe('instruction');
});

test('detects confirmations', () => {
  expect(extractIntent('yes, correct')).toBe('confirmation');
});

test('detects smalltalk', () => {
  expect(extractIntent('hello there')).toBe('smalltalk');
});

test('returns unknown for other inputs', () => {
  expect(extractIntent('')).toBe('unknown');
});
