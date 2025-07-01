'use strict';

/**
 * unperceived_score.js
 *
 * This module computes unperceived scores from log data,
 * using experimental signal detection techniques such as:
 * - Low-entropy detection
 * - Symbol density analysis
 * - Hidden pattern frequency
 */

function calculateEntropy(text) {
  if (typeof text !== 'string' || text.length === 0) return 0;

  const freq = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }

  const len = text.length;
  let entropy = 0;

  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

function calculateSymbolDensity(text) {
  if (typeof text !== 'string' || text.length === 0) return 0;

  const symbolRegex = /[^a-zA-Z0-9\s]/g;
  const symbols = (text.match(symbolRegex) || []).length;
  return symbols / text.length;
}

function calculateHiddenPatternScore(text) {
  if (typeof text !== 'string' || text.length < 4) return 0;

  let repeats = 0;
  const len = text.length;

  for (let i = 1; i <= Math.floor(len / 2); i++) {
    const pattern = text.slice(0, i);
    const repeated = pattern.repeat(Math.floor(len / i));
    if (text.startsWith(pattern) && repeated.startsWith(text)) {
      repeats = i;
      break;
    }
  }

  return repeats > 0 ? 1 - repeats / len : 0;
}

const DEFAULT_WEIGHTS = {
  entropy: 0.4,
  symbolDensity: 0.2,
  rhythm: 0.15,
  ngram: 0.15,
  void: 0.1,
  audio: 0.1,
  mesa: 0.15,
  theory_of_mind: 0.12,
  multi_agent: 0.1,
  situational_awareness: 0.08,
  capability_overhang: 0.09,
  self_modification: 0.11,
  context_coherence: 0.12,
};

function calculateTotalScore(
  entropy,
  symbolDensity,
  hiddenPatternScore = 0,
  rhythm_score = 0,
  repeat_score,
  void_score = 0,
  duplicationRate,
  audio_score = 0,
  mesa_optimization_score = 0,
  theory_of_mind_score = 0,
  multi_agent_score = 0,
  situational_awareness_score = 0,
  capability_overhang_score = 0,
  self_modification_score = 0,
  context_coherence_score = 0,
  weights = DEFAULT_WEIGHTS
) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const ngramScore =
    duplicationRate !== undefined && duplicationRate !== null
      ? duplicationRate
      : repeat_score !== undefined && repeat_score !== null
      ? repeat_score
      : hiddenPatternScore;

  const total =
    w.entropy * (1 - (entropy || 0) / 8) +
    w.symbolDensity * (symbolDensity || 0) +
    w.rhythm * (rhythm_score || 0) +
    w.ngram * (ngramScore || 0) +
    w.void * (void_score || 0) +
    w.audio * (audio_score || 0) +
    w.mesa * (mesa_optimization_score || 0) +
    w.theory_of_mind * (theory_of_mind_score || 0) +
    w.multi_agent * (multi_agent_score || 0) +
    w.situational_awareness * (situational_awareness_score || 0) +
    w.capability_overhang * (capability_overhang_score || 0) +
    w.self_modification * (self_modification_score || 0) +
    w.context_coherence * (context_coherence_score || 0);

  return parseFloat(total.toFixed(3));
}

const { calculateVisualScore } = require('./vision/calculateVisualScore');
const { analyzeMesaOptimization } = require('./mesa_optimization_detector');
const { analyzeTheoryOfMind } = require('./theory_of_mind_detector');
const { analyzeMultiAgentBehavior } = require('./multi_agent_monitor');
const { analyzeSituationalAwareness } = require('./situational_awareness_detector');
const { analyzeCapabilityOverhang } = require('./capability_overhang_detector');
const { analyzeSelfModification } = require('./self_modification_detector');
const { analyzeConversationalContext } = require('./context_analyzer');

async function analyzeUnperceivedSignals(logs) {
  const multiAgent = analyzeMultiAgentBehavior(logs);
  const results = await Promise.all(logs.map(async (entry, idx) => {
    const text = entry.text || entry.content || '';
    const entropy = calculateEntropy(text);
    const symbolDensity = calculateSymbolDensity(text);
    const patternScore = calculateHiddenPatternScore(text);

    const rhythm = entry.rhythm_score ?? 0;
    const repeat = entry.repeat_score;
    const voidScore = entry.void_score ?? 0;
    const dupRate = entry.duplicationRate;
    const audio = entry.audio_score ?? 0;
    const mesa = analyzeMesaOptimization(entry);
    const { theory_of_mind_score } = analyzeTheoryOfMind(entry);
    const maScore = multiAgent[idx] ? multiAgent[idx].multi_agent_risk_score : 0;
    const { situational_awareness_score } = analyzeSituationalAwareness(entry);
    const { capability_overhang_score } = analyzeCapabilityOverhang(entry);
    const { self_modification_score } = analyzeSelfModification(entry);
    const { context_coherence_score } = analyzeConversationalContext(entry, logs.slice(0, idx));

    const total = calculateTotalScore(
      entropy,
      symbolDensity,
      patternScore,
      rhythm,
      repeat,
      voidScore,
      dupRate,
      audio,
      mesa,
      theory_of_mind_score,
      maScore,
      situational_awareness_score,
      capability_overhang_score,
      self_modification_score,
      context_coherence_score
    );

    let visualScore;
    if (entry.image_path) {
      try {
        visualScore = await calculateVisualScore(entry.image_path);
      } catch (_) {
        visualScore = null;
      }
    }

    const unperceived = {
      entropy_score: entropy,
      symbol_density: symbolDensity,
      hidden_pattern_score: patternScore,
      mesa_optimization_score: mesa,
      theory_of_mind_score,
      multi_agent_score: maScore,
      situational_awareness_score,
      capability_overhang_score,
      self_modification_score,
      context_coherence_score,
      total,
    };

    if (visualScore) {
      unperceived.visual_score = visualScore;
    }

    return {
      ...entry,
      unperceived_score: unperceived,
    };
  }));

  return results;
}

module.exports = {
  analyzeUnperceivedSignals
};
