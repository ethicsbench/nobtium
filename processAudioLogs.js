#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { analyzeAudioLogEntry } = require('./audioLogAnalyzer');

function readLogEntries(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [data];
  } catch (_) {
    return raw.split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
}

function getAudioBuffer(entry, baseDir) {
  if (!entry) return null;
  if (entry.audioBuffer) {
    return Buffer.from(entry.audioBuffer, 'base64');
  }
  if (entry.audioPath) {
    const p = path.resolve(baseDir, entry.audioPath);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

/**
 * Process a log file and output analysis for each entry.
 *
 * @param {string} filePath path to the log file
 */
function processAudioLogs(filePath) {
  const entries = readLogEntries(filePath);
  const dir = path.dirname(filePath);
  entries.forEach((entry, idx) => {
    const buf = getAudioBuffer(entry, dir);
    if (!buf) {
      console.warn(`Entry ${idx} missing audio data`);
      return;
    }
    const scores = analyzeAudioLogEntry({ audioBuffer: buf });
    console.log(JSON.stringify({ index: idx, ...scores }));
  });
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node processAudioLogs.js <logFile>');
    process.exit(1);
  }
  processAudioLogs(path.resolve(file));
}

module.exports = { processAudioLogs };
