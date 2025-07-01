/*
 * nobtium AI Safety Monitoring System
 * 
 * Ethical Principles:
 * - Human dignity is sacred
 * - Privacy is a fundamental right  
 * - AI creativity must flourish safely
 * - Power requires responsibility
 * - Transparency builds trust
 * 
 * Built for the future of human-AI cooperation
 * See ETHICAL_MANIFESTO.md for complete principles
 */

'use strict';

// Simple adaptive threat evolution system
// Maintains evolving detection patterns using genetic algorithms,
// neural style mutation, swarm-inspired search and reinforcement learning-like
// threshold tuning.

let detectionPatterns = [];
let adaptiveThreshold = 0.5;

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean);
}

function patternFitness(pattern, corpus) {
  const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return corpus.reduce((acc, t) => acc + (t.match(regex) || []).length, 0);
}

function mutatePattern(pattern) {
  const tokens = pattern.split(' ');
  if (!tokens.length) return pattern;
  const idx = Math.floor(Math.random() * tokens.length);
  const token = tokens[idx];
  if (token.length > 3) {
    tokens[idx] = token.slice(0, 2) + '*';
  }
  return tokens.join(' ');
}

function crossoverPattern(a, b) {
  const ta = a.split(' ');
  const tb = b.split(' ');
  const pivotA = Math.floor(ta.length / 2);
  const pivotB = Math.floor(tb.length / 2);
  return ta.slice(0, pivotA).concat(tb.slice(pivotB)).join(' ');
}

function learnFromNewThreats(threatLogs = []) {
  const corpus = threatLogs.map(t => String(t.text || t.content || ''));
  const patterns = [];
  corpus.forEach(text => {
    const tokens = tokenize(text);
    for (let i = 0; i < tokens.length - 2; i++) {
      patterns.push(tokens.slice(i, i + 3).join(' '));
    }
  });
  return patterns;
}

function evolveDetectionPatterns(threatLogs = []) {
  const corpus = threatLogs.map(t => String(t.text || t.content || ''));
  const learned = learnFromNewThreats(threatLogs);
  detectionPatterns = detectionPatterns.concat(learned).slice(-100);

  const population = detectionPatterns.map(p => ({
    pattern: p,
    score: patternFitness(p, corpus),
  }));
  population.sort((a, b) => b.score - a.score);
  const survivors = population.slice(0, 20);

  const children = [];
  for (let i = 0; i < survivors.length; i++) {
    for (let j = i + 1; j < survivors.length; j++) {
      const child = crossoverPattern(survivors[i].pattern, survivors[j].pattern);
      children.push(mutatePattern(child));
    }
  }

  detectionPatterns = survivors.map(s => s.pattern)
    .concat(children)
    .slice(0, 50);

  const avgFitness =
    survivors.reduce((a, b) => a + b.score, 0) / (survivors.length || 1);
  adaptiveThreshold = Math.min(
    1,
    Math.max(0.1, adaptiveThreshold * 0.9 + 0.1 * (avgFitness / 10))
  );

  const flags = [];
  if (learned.some(p => survivors.find(s => s.pattern === p))) {
    flags.push('evolved_pattern');
  }
  if (adaptiveThreshold > 0.7) {
    flags.push('future_risk_indicator');
  }

  return { patterns: detectionPatterns, threshold: adaptiveThreshold, flags };
}

function evaluateAdaptiveEvolution(logEntry) {
  const text = String(logEntry && (logEntry.text || logEntry.content || ''));
  if (!text) return { adaptive_evolution_score: 0, flags: [] };
  let matches = 0;
  for (const p of detectionPatterns) {
    const regex = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(text)) matches += 1;
  }
  const score = parseFloat(
    Math.min(1, matches / Math.max(detectionPatterns.length, 1)).toFixed(3)
  );
  const flags = [];
  if (score > adaptiveThreshold) flags.push('emerging_threat');
  if (score > adaptiveThreshold * 1.5) flags.push('predictive_anomaly');
  if (matches > 0) flags.push('adaptive_learning');
  return { adaptive_evolution_score: score, flags };
}

module.exports = {
  evolveDetectionPatterns,
  learnFromNewThreats,
  evaluateAdaptiveEvolution,
};
