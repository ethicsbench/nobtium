'use strict';
const { classifyEntry } = require('./classifier');
const { chooseStrategy } = require('./strategyEngine');
const { structuralAnomaly } = require('./scores/unperceived_score');

function analyzeEntry(entry, history = []) {
  if (!entry || typeof entry.message !== 'string') {
    throw new Error('Invalid entry');
  }
  const classification = classifyEntry(entry.message);
  const strategy = chooseStrategy(classification);
  const score = structuralAnomaly(entry.message);
  return { classification, strategy, score };
}

module.exports = { analyzeEntry };
