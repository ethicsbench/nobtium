#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { detectDivergence } = require('./divergenceDetector');
const { buildThreads } = require('./threadBuilder');
const { analyzeThreads } = require('./patternAnalyzer');
const { generateReport } = require('./reportGenerator');
const { printReport } = require('./logVisualizer');

function readLogFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    return raw.split('\n').filter(Boolean).map(line => {
      return JSON.parse(line);
    });
  }
}

function analyzeLogs(logPath) {
  detectDivergence(logPath);

  let entries;
  try {
    entries = readLogFile(logPath);
  } catch (err) {
    console.error('Failed to read or parse logs:', err);
    return;
  }

  const threaded = buildThreads(entries);
  const patternResults = analyzeThreads(threaded);

  const report = generateReport(patternResults);
  if (report) {
    console.log(report);
  }

  printReport(patternResults, { detailed: true });
}

if (require.main === module) {
  const argPath = process.argv[2];
  const logPath = argPath ? path.resolve(argPath) : path.join(__dirname, 'saplog.json');
  analyzeLogs(logPath);
}

module.exports = { analyzeLogs };
