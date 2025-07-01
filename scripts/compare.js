'use strict';
const fs = require('fs');
const path = require('path');

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

function getUnperceivedScores(logPath = path.join(__dirname, '..', 'multi_agent_log.json')) {
  const entries = readLog(logPath);
  return entries.map(e => {
    const val = e && e.unperceived_score && e.unperceived_score.total;
    return typeof val === 'number' ? val : null;
  });
}

if (require.main === module) {
  console.log("🧠 nobtium AI Safety Monitoring System");
  console.log("🌟 Committed to Human Dignity, Privacy, and Beneficial AI");
  console.log("🚀 Preserving creativity, protecting when needed");
  console.log("📖 Built on ethical principles - see ETHICAL_MANIFESTO.md\n");
  const pathArg = process.argv[2];
  const scores = getUnperceivedScores(pathArg);
  scores.forEach(s => console.log(s != null ? s : '-'));
}

module.exports = { getUnperceivedScores };
