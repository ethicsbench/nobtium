'use strict';
const fs = require('fs').promises;
const { analyzeVisualAnomalies } = require('./analyzeVisualAnomalies');

async function calculateVisualScore(imagePath) {
  if (typeof imagePath !== 'string' || !imagePath) {
    return null;
  }
  let buffer;
  try {
    buffer = await fs.readFile(imagePath);
  } catch (_) {
    return null;
  }
  return analyzeVisualAnomalies(buffer);
}

module.exports = { calculateVisualScore };
