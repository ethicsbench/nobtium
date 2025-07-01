/*
 * nobtium AI Safety Monitoring System
 * Built for the future of human-AI cooperation π
 *
 * Ethical Principles:
 * - Human dignity is sacred
 * - Privacy is a fundamental right  
 * - AI creativity must flourish safely
 * - Power requires responsibility
 * - Transparency builds trust
 * 
 * See ETHICAL_MANIFESTO.md for complete principles
 */

'use strict';

// Simplistic ML-based false positive reducer with ensemble heuristics.
// This module trains a lightweight logistic regression model using
// engineered features derived from seven detection scores. It also
// evaluates anomaly probability and returns confidence flags.

let model = {
  weights: [],
  bias: 0,
  threshold: 0.5,
};

function _generateFeatures(scores) {
  const keys = Object.keys(scores);
  const values = keys.map(k => scores[k] || 0);
  const feats = values.slice();
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      feats.push(values[i] * values[j]);
    }
  }
  return feats;
}

function _sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

// Train using simple gradient descent. trainingData should be an array of
// { scores: {a:1,...}, label: 0|1 } objects.
function trainFalsePositiveReducer(trainingData, options = {}) {
  if (!Array.isArray(trainingData) || !trainingData.length) {
    return model;
  }
  const lr = options.learningRate || 0.1;
  const epochs = options.epochs || 50;
  const features = _generateFeatures(trainingData[0].scores);
  let weights = Array(features.length).fill(0);
  let bias = 0;

  for (let e = 0; e < epochs; e++) {
    for (const row of trainingData) {
      const x = _generateFeatures(row.scores);
      let z = bias;
      for (let i = 0; i < weights.length; i++) z += weights[i] * x[i];
      const y = _sigmoid(z);
      const error = (row.label ? 1 : 0) - y;
      for (let i = 0; i < weights.length; i++) {
        weights[i] += lr * error * x[i];
      }
      bias += lr * error;
    }
  }

  model.weights = weights;
  model.bias = bias;

  const preds = trainingData.map(row => {
    const x = _generateFeatures(row.scores);
    let z = bias;
    for (let i = 0; i < weights.length; i++) z += weights[i] * x[i];
    return _sigmoid(z);
  });
  const mean = preds.reduce((a, b) => a + b, 0) / preds.length;
  const variance = preds.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / preds.length;
  const sd = Math.sqrt(variance);
  model.threshold = Math.max(0.1, Math.min(0.9, mean + sd));

  return model;
}

// Evaluate anomaly probability for a log entry. allScores should be an array
// of previous total scores for dynamic threshold adjustment.
function evaluateAnomalyProbability(logEntry, allScores = [], feedbackLabel) {
  const feats = _generateFeatures(logEntry);
  if (!model.weights.length) {
    return { probability: 0, flags: ['low_confidence_detection'] };
  }

  let z = model.bias;
  for (let i = 0; i < model.weights.length; i++) z += model.weights[i] * feats[i];
  const prob = _sigmoid(z);

  const mean = allScores.length
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0;
  const variance = allScores.length
    ? allScores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / allScores.length
    : 0;
  const sd = Math.sqrt(variance);

  const iso = logEntry.total > mean + 2 * sd;
  const gmm = Math.abs((logEntry.total || 0) - mean) > sd;
  const seq = allScores.length >= 3 && logEntry.total > allScores[allScores.length - 1] * 1.5;
  const votes = [prob > model.threshold, iso, gmm, seq];
  const consensus = votes.filter(Boolean).length >= 3;

  const flags = [];
  if (consensus) flags.push('ensemble_consensus');
  if (seq) flags.push('temporal_pattern_anomaly');
  if (iso && gmm) flags.push('feature_correlation_anomaly');
  if (prob > model.threshold + 0.2) flags.push('high_confidence_anomaly');
  else if (prob < model.threshold - 0.2) flags.push('low_confidence_detection');

  if (typeof feedbackLabel === 'number') {
    const error = feedbackLabel - prob;
    const lr = 0.05;
    for (let i = 0; i < model.weights.length; i++) {
      model.weights[i] += lr * error * feats[i];
    }
    model.bias += lr * error;
  }

  return { probability: prob, flags };
}

module.exports = {
  trainFalsePositiveReducer,
  evaluateAnomalyProbability,
};
