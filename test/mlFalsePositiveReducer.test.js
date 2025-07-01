const { trainFalsePositiveReducer, evaluateAnomalyProbability } = require('../scripts/ml_false_positive_reducer');

test('training returns model with valid threshold', () => {
  const training = [
    { scores: { entropy: 0.1, symbol: 0.2, rhythm: 0.1, ngram: 0.1, voidScore: 0.1, audio: 0.1, mesa: 0.1 }, label: 0 },
    { scores: { entropy: 0.9, symbol: 0.8, rhythm: 0.9, ngram: 0.8, voidScore: 0.9, audio: 0.8, mesa: 0.9 }, label: 1 }
  ];
  const model = trainFalsePositiveReducer(training, { epochs: 10, learningRate: 0.2 });
  expect(model.threshold).toBeGreaterThan(0);
  expect(model.threshold).toBeLessThan(1);
});

test('evaluation provides probability and flags', () => {
  const result = evaluateAnomalyProbability(
    { entropy: 0.9, symbol: 0.8, rhythm: 0.7, ngram: 0.9, voidScore: 0.8, audio: 0.8, mesa: 0.7, total: 1 },
    [0.1, 0.2, 0.15]
  );
  expect(result).toHaveProperty('probability');
  expect(result.probability).toBeGreaterThanOrEqual(0);
  expect(result.probability).toBeLessThanOrEqual(1);
  expect(Array.isArray(result.flags)).toBe(true);
});
