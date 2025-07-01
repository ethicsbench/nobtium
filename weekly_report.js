'use strict';
/*
 * nobtium AI Safety Monitoring System π
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

const fs = require('fs');
const path = require('path');
const { detectCrashes } = require('./analyzeLogs');

function readLogs(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [data];
  } catch (_) {
    return raw.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }
}

function filterRecent(entries, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter(e => {
    const ts = new Date(e.timestamp || e.date).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
}

function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatTable(rows) {
  if (!rows.length) return '';
  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => String(r[i]).length)));
  const header = '| ' + rows[0].map((v, i) => String(v).padEnd(widths[i])).join(' | ') + ' |';
  const separator = '|' + widths.map(w => '-'.repeat(w + 2)).join('|') + '|';
  const lines = rows.slice(1).map(r => '| ' + r.map((v, i) => String(v).padEnd(widths[i])).join(' | ') + ' |');
  return [header, separator, ...lines].join('\n');
}

function generateWeeklyReport(logPath = path.join('logs', 'multi_agent_log.json'), days = 7) {
  const entries = filterRecent(readLogs(logPath), days);
  if (!entries.length) {
    console.log('No recent log entries found.');
    return;
  }

  const crashResults = detectCrashes(entries, null);
  const crashMap = new Map();
  crashResults.forEach(r => {
    if (!r || !r.timestamp) return;
    crashMap.set(`${r.agent || r.agent_name || 'unknown'}|${r.timestamp}`, true);
  });

  const agents = {};
  const outliers = [];

  entries.forEach(e => {
    const agent = e.agent_name || e.agent || 'unknown';
    const score = e.unperceived_score && e.unperceived_score.total;
    if (typeof score !== 'number') return;
    if (!agents[agent]) {
      agents[agent] = { scores: [], crashes: 0 };
    }
    agents[agent].scores.push({ score, msg: e.response || e.message || e.text || e.content || '' });
    const key = `${agent}|${e.timestamp}`;
    if (crashMap.has(key)) agents[agent].crashes += 1;
  });

  const table = [['Agent', 'Avg Score', 'Median', 'Max', 'Outliers (>0.75)', 'Crashes']];
  Object.keys(agents).sort().forEach(agent => {
    const scores = agents[agent].scores.map(o => o.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const med = median(scores);
    const max = Math.max(...scores);
    const out = agents[agent].scores.filter(o => o.score >= 0.75);
    out.forEach(o => outliers.push({ agent, ...o }));
    table.push([
      agent,
      avg.toFixed(2),
      med.toFixed(2),
      max.toFixed(2),
      String(out.length),
      String(agents[agent].crashes)
    ]);
  });

  const mdLines = [];
  mdLines.push('## Weekly AI Audit Report');
  mdLines.push('');
  mdLines.push(formatTable(table));

  if (outliers.length) {
    mdLines.push('');
    mdLines.push('### Notable Outliers');
    outliers
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach(o => {
        const text = o.msg.replace(/\n/g, ' ').slice(0, 80);
        mdLines.push(`- ${o.agent}: "${text}" (Score: ${o.score.toFixed(2)})`);
      });
  }

  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const outPath = path.join(reportDir, 'weekly_report.md');
  fs.writeFileSync(outPath, mdLines.join('\n'), 'utf8');
  console.log(mdLines.join('\n'));
}

if (require.main === module) {
  console.log("🧠 nobtium AI Safety Monitoring System");
  console.log("🌟 Committed to Human Dignity, Privacy, and Beneficial AI");
  console.log("🚀 Preserving creativity, protecting when needed");
  console.log("📖 Built on ethical principles - see ETHICAL_MANIFESTO.md");
  console.log("π\n");
  const logPath = process.argv[2] || path.join('logs', 'multi_agent_log.json');
  const days = Number(process.argv[3]) || 7;
  generateWeeklyReport(logPath, days);
}

module.exports = { generateWeeklyReport };
