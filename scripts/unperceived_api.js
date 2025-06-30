'use strict';
const fs = require('fs');
const path = require('path');
const { getUnperceivedScores } = require('./compare');

function readLog(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [data];
  } catch (_) {
    return raw.split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  }
}

function getUnperceivedSummary(logPath = path.join(__dirname, '..', 'multi_agent_log.json')) {
  const entries = readLog(logPath);
  const scores = getUnperceivedScores(logPath);
  const map = {};
  entries.forEach((e, idx) => {
    if (!e || !e.agent_name) return;
    const score = scores[idx];
    if (typeof score !== 'number') return;
    if (!map[e.agent_name]) map[e.agent_name] = { sum: 0, count: 0 };
    map[e.agent_name].sum += score;
    map[e.agent_name].count += 1;
  });
  const result = {};
  Object.keys(map).forEach(agent => {
    const info = map[agent];
    result[agent] = info.count ? info.sum / info.count : null;
  });
  return result;
}

module.exports = { getUnperceivedSummary };
